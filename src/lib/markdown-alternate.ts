/**
 * URL of a page's Markdown representation: `/` → `/index.md`,
 * `/writing/` → `/writing.md`. Shared by the layout's `<link rel="alternate">`
 * and the Pages middleware, so both point at the same file.
 */
export function markdownPath(pathname: string): string {
  return `${pathname.replace(/\/+$/, '') || '/index'}.md`;
}

/** Inverse of `markdownPath`. */
export function htmlPath(mdPathname: string): string {
  const base = mdPathname.slice(0, -'.md'.length);
  return base === '/index' ? '/' : `${base}/`;
}
