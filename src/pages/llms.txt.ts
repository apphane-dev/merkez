import type { APIContext } from 'astro';
import { projects } from '../data/projects';
import { markdownPath } from '../lib/markdown-alternate';
import { getPublishedWriting } from '../lib/writing';

/** llmstxt.org index. Links point at the Markdown alternates. */
export async function GET(context: APIContext) {
  const site = context.site ?? new URL('https://apphane.dev');
  const md = (pathname: string) => new URL(markdownPath(pathname), site).href;
  const writing = await getPublishedWriting();

  const sections: string[][] = [
    [
      '# apphane',
      '',
      '> apphane is a house for small, open source tools by Aleksei Gurianov, each named in Turkish and built to do one thing well.',
    ],
    [
      '## Projects',
      '',
      ...projects.map((p) => {
        const home = p.home ?? new URL(`/#${p.id}`, site).href;
        const status = p.status ? ` ${p.status.label}: [status update](${p.status.href}).` : '';
        return `- [${p.name}](${home}): ${p.description} (${p.platform}, ${p.language}${p.license ? `, ${p.license}` : ''})${status}`;
      }),
    ],
    [
      '## Pages',
      '',
      `- [Home](${md('/')}): Every project with install commands and links, plus the house rules.`,
      `- [Writing](${md('/writing/')}): Project updates, articles, and notes, newest first.`,
      `- [Recommendations](${md('/recommendations/')}): Tools, libraries, and services we use, each with why and any relationship disclosed.`,
      `- [Sponsors](${md('/sponsors/')}): What sponsorship funds and how to support the work.`,
    ],
  ];
  if (writing.length > 0) {
    sections.push([
      '## Writing',
      '',
      ...writing.map((e) => `- [${e.data.title}](${md(`/writing/${e.id}/`)}): ${e.data.description}`),
    ]);
  }
  sections.push([
    '## Optional',
    '',
    '- [GitHub](https://github.com/apphane-dev): Source code for every project.',
    `- [RSS](${new URL('/rss.xml', site).href}): Feed of the writing archive.`,
  ]);

  return new Response(`${sections.map((s) => s.join('\n')).join('\n\n')}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
