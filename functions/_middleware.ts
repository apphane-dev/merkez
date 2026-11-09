import { htmlPath, markdownPath } from '../src/lib/markdown-alternate';

/**
 * Cloudflare Pages middleware. A page URL (`/writing/`) serves HTML or its
 * Markdown alternate (`/writing.md`) depending on the Accept header, and
 * every request is logged to Analytics Engine so AI clients can be counted.
 * Static assets bypass this via public/_routes.json.
 */

interface DataPoint {
  blobs?: string[];
  doubles?: number[];
}

interface Env {
  ASSETS: { fetch(input: URL, init?: RequestInit): Promise<Response> };
  /** Unbound in local dev unless configured. */
  AI_TRAFFIC?: { writeDataPoint(point: DataPoint): void };
}

interface Context {
  request: Request;
  env: Env;
  next(): Promise<Response>;
}

type Preference = 'html' | 'markdown' | 'none';

const MARKDOWN = 'text/markdown; charset=utf-8';

export async function onRequest({ request, env, next }: Context): Promise<Response> {
  const response = await route(request, env, next);
  record(env, request, response);
  return response;
}

async function route(request: Request, env: Env, next: () => Promise<Response>): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();
  const url = new URL(request.url);
  const { pathname } = url;

  // An explicit .md URL is never negotiated. Only a page's alternate links back
  // to HTML; other Markdown files, such as /agent-skills/<name>/SKILL.md, have no page.
  if (pathname.endsWith('.md')) {
    const response = await next();
    if (!response.ok) return response;
    const page = new URL(htmlPath(pathname), url);
    const html = await env.ASSETS.fetch(page, { method: 'HEAD' });
    return annotate(response, html.ok ? alternate(page.pathname, 'text/html') : null, MARKDOWN);
  }
  // Pages live at trailing-slash URLs; the host redirects the bare form there first.
  if (!pathname.endsWith('/')) return next();

  const preference = preferredType(request.headers.get('Accept'));
  const mdUrl = new URL(markdownPath(pathname), url);
  const md = await env.ASSETS.fetch(mdUrl, {
    method: preference === 'markdown' ? request.method : 'HEAD',
  });
  if (!md.ok) return next();

  switch (preference) {
    case 'markdown':
      return annotate(md, alternate(pathname, 'text/html'), MARKDOWN);
    case 'html':
      return annotate(await next(), alternate(mdUrl.pathname, 'text/markdown'));
    case 'none':
      return annotate(
        new Response('Available as text/html or text/markdown.\n', { status: 406 }),
        alternate(mdUrl.pathname, 'text/markdown'),
        'text/plain; charset=utf-8',
      );
    default: {
      const exhaustive: never = preference;
      return exhaustive;
    }
  }
}

/**
 * Markdown only when the client names text/markdown and rates it at least as
 * high as HTML: a browser's wildcard Accept stays HTML, while an agent sending
 * `text/markdown, text/html` gets Markdown.
 */
function preferredType(accept: string | null): Preference {
  const ranges = accept ? parseAccept(accept) : [];
  if (ranges.length === 0) return 'html';
  const html = quality(ranges, 'text', 'html');
  const markdown = quality(ranges, 'text', 'markdown');
  if (markdown.explicit && markdown.q > 0 && markdown.q >= html.q) return 'markdown';
  if (html.q > 0) return 'html';
  if (markdown.q > 0) return 'markdown';
  return 'none';
}

interface MediaRange {
  type: string;
  subtype: string;
  q: number;
}

function parseAccept(header: string): MediaRange[] {
  return header.split(',').flatMap((part) => {
    const [range = '', ...params] = part.split(';');
    const [type, subtype] = range.trim().toLowerCase().split('/');
    if (!type || !subtype) return [];
    const qParam = params.map((p) => p.trim().toLowerCase()).find((p) => p.startsWith('q='));
    const q = qParam === undefined ? 1 : Number(qParam.slice(2));
    return Number.isNaN(q) ? [] : [{ type, subtype, q: Math.min(Math.max(q, 0), 1) }];
  });
}

/** q-value from the most specific matching range; `explicit` when the exact type is named. */
function quality(ranges: MediaRange[], type: string, subtype: string): { q: number; explicit: boolean } {
  const exact = ranges.find((r) => r.type === type && r.subtype === subtype);
  if (exact) return { q: exact.q, explicit: true };
  const wildcard =
    ranges.find((r) => r.type === type && r.subtype === '*') ??
    ranges.find((r) => r.type === '*' && r.subtype === '*');
  return { q: wildcard?.q ?? 0, explicit: false };
}

function alternate(pathname: string, type: string): string {
  return `<${pathname}>; rel="alternate"; type="${type}"`;
}

function annotate(response: Response, link: string | null, contentType?: string): Response {
  const out = new Response(response.body, response);
  out.headers.append('Vary', 'Accept');
  // Append: Pages adds its own Link headers for Early Hints.
  if (link) out.headers.append('Link', link);
  if (contentType) out.headers.set('Content-Type', contentType);
  return out;
}

/** Each blob is capped so oversized client headers can't push a point past Analytics Engine's limits. */
const BLOB_LIMIT = 512;

/**
 * Blobs: path, served content type, User-Agent, Accept, referrer host.
 * Doubles: status. AI clients are classified at query time (see README).
 */
function record(env: Env, request: Request, response: Response): void {
  if (!env.AI_TRAFFIC) return;
  const referrer = request.headers.get('Referer') ?? '';
  env.AI_TRAFFIC.writeDataPoint({
    blobs: [
      new URL(request.url).pathname,
      response.headers.get('Content-Type')?.split(';')[0] ?? '',
      request.headers.get('User-Agent') ?? '',
      request.headers.get('Accept') ?? '',
      URL.canParse(referrer) ? new URL(referrer).hostname : '',
    ].map((blob) => blob.slice(0, BLOB_LIMIT)),
    doubles: [response.status],
  });
}
