import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import type { Element, Root } from 'hast';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';

/**
 * Writes a Markdown copy of every built page that advertises one with
 * `<link rel="alternate" type="text/markdown" href>`, converted from the
 * page's `<main>`. The HTML stays the single source of the content.
 *
 * Dropped from the Markdown: `aria-hidden` decoration, anything marked
 * `data-md-skip`, and interactive or non-text elements (see DROPPED_TAGS).
 */
export default function markdownAlternates(): AstroIntegration {
  return {
    name: 'markdown-alternates',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const files = await readdir(outDir, { recursive: true });
        let written = 0;
        for (const file of files.filter((f) => f.endsWith('.html'))) {
          const page = await toMarkdown(await readFile(join(outDir, file), 'utf8'));
          if (!page) continue;
          const target = join(outDir, page.pathname);
          await mkdir(dirname(target), { recursive: true });
          await writeFile(target, page.markdown);
          written++;
        }
        logger.info(`${written} Markdown alternates written`);
      },
    },
  };
}

const DROPPED_TAGS = new Set(['script', 'style', 'svg', 'button', 'dialog', 'template', 'noscript']);

const parser = unified().use(rehypeParse);
const converter = unified()
  .use(rehypeRemark)
  .use(remarkGfm)
  .use(remarkStringify, { bullet: '-', rule: '-' });

async function toMarkdown(html: string): Promise<{ pathname: string; markdown: string } | null> {
  const tree = parser.parse(html);
  const alternate = findElement(
    tree,
    (el) => el.tagName === 'link' && hasToken(el, 'rel', 'alternate') && el.properties.type === 'text/markdown',
  );
  const href = alternate && stringProp(alternate, 'href');
  const main = findElement(tree, (el) => el.tagName === 'main');
  if (!href || !main) return null;

  const canonicalLink = findElement(tree, (el) => el.tagName === 'link' && hasToken(el, 'rel', 'canonical'));
  const canonical = canonicalLink && stringProp(canonicalLink, 'href');
  if (!canonical) throw new Error(`Page with Markdown alternate ${href} has no canonical URL`);
  const base = new URL(canonical);

  const titleEl = findElement(tree, (el) => el.tagName === 'title');
  const descriptionEl = findElement(
    tree,
    (el) => el.tagName === 'meta' && el.properties.name === 'description',
  );
  const frontMatter = [
    '---',
    `title: ${JSON.stringify(titleEl ? textOf(titleEl) : '')}`,
    `description: ${JSON.stringify((descriptionEl && stringProp(descriptionEl, 'content')) ?? '')}`,
    `url: ${base.href}`,
    '---',
  ].join('\n');

  prune(main, base);
  const mdast = await converter.run({ type: 'root', children: main.children });
  const body = converter.stringify(mdast);
  return { pathname: new URL(href, base).pathname, markdown: `${frontMatter}\n\n${body}` };
}

/** Strips decoration, absolutizes links, and tags code blocks with their language. */
function prune(el: Element, base: URL): void {
  el.children = el.children.filter(
    (child) => child.type !== 'comment' && !(child.type === 'element' && isDecorative(child)),
  );
  for (const child of el.children) {
    if (child.type !== 'element') continue;
    for (const attr of ['href', 'src']) {
      const value = stringProp(child, attr);
      if (value !== undefined) child.properties[attr] = new URL(value, base).href;
    }
    // Shiki puts the language on <pre>; Markdown conversion reads it from <code>.
    const language = child.tagName === 'pre' ? stringProp(child, 'dataLanguage') : undefined;
    const code = language && findElement(child, (c) => c.tagName === 'code');
    if (code) code.properties.className = [`language-${language}`];
    // A <br> in a heading would force a multi-line setext heading.
    if (/^h[1-6]$/.test(child.tagName)) breaksToSpaces(child);
    prune(child, base);
  }
}

function breaksToSpaces(el: Element): void {
  el.children = el.children.map((child) =>
    child.type === 'element' && child.tagName === 'br' ? { type: 'text', value: ' ' } : child,
  );
  for (const child of el.children) if (child.type === 'element') breaksToSpaces(child);
}

function isDecorative(el: Element): boolean {
  return (
    DROPPED_TAGS.has(el.tagName) ||
    el.properties.ariaHidden === 'true' ||
    'dataMdSkip' in el.properties
  );
}

function findElement(node: Root | Element, test: (el: Element) => boolean): Element | undefined {
  for (const child of node.children) {
    if (child.type !== 'element') continue;
    if (test(child)) return child;
    const found = findElement(child, test);
    if (found) return found;
  }
  return undefined;
}

function stringProp(el: Element, name: string): string | undefined {
  const value = el.properties[name];
  return typeof value === 'string' ? value : undefined;
}

function hasToken(el: Element, name: string, token: string): boolean {
  const value = el.properties[name];
  return Array.isArray(value) && value.includes(token);
}

function textOf(el: Element): string {
  return el.children.map((c) => (c.type === 'text' ? c.value : c.type === 'element' ? textOf(c) : '')).join('');
}
