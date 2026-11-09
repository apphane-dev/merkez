# apphane website

Landing page for [apphane](https://apphane.dev) — a house for small, sharp tools.

Built with [Astro](https://astro.build), deployed to Cloudflare Pages (project
`merkez`) via `.github/workflows/deploy.yml` on every push to `main`.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to ./dist
npm run preview  # preview the production build
```

### Example content

Seed/example content (placeholder writing posts, recommendations, and sponsors)
is hidden by default. Set the build-time flag `SHOW_EXAMPLES=1` to include it in
a dev/preview build — e.g. `SHOW_EXAMPLES=1 npx astro build`. The flag is read
in `src/lib/flags.ts` and applied at each data query (`src/lib/writing.ts` and
the `src/data/*` modules).

## Adding a project

Projects are data-driven: add an entry to `src/data/projects.ts` and its card
and lit window appear automatically. Dark windows in the strip are placeholders
for projects not yet public — bump `HOUSE_WINDOWS` if the house runs out of
rooms.

## Sponsors

The sponsors wall is fetched at build time from the maintainer's public GitHub
Sponsors (`src/data/sponsors.ts`), so new supporters appear with no code
changes; a daily scheduled deploy rebuilds the wall. CI passes `SPONSORS_TOKEN`
(defaults to the workflow token — public sponsorships need no extra scopes). A
local build without a token skips the fetch. Sponsors not on GitHub go in
`manualSponsors` in the same file.

## Agent skills

`npx skills add https://apphane.dev` installs apphane's agent skills from the
discovery index at `/.well-known/agent-skills/index.json`. After the Astro
build, `src/integrations/agent-skills.ts` downloads `skills/<name>/SKILL.md`
for each entry in `src/data/agent-skills.ts` from GitHub, writes it to
`dist/agent-skills/<name>/SKILL.md`, and puts that file's sha256 in the index.
Installers reject a file whose hash differs from its `digest`, so each `url`
points at the site's copy, the exact bytes the build hashed, and never at GitHub.

To publish another skill, add an entry with its `name`, `repo` and `branch`.
Only single-file skills work. The build fails when a download fails, a name is
invalid or listed twice, the skill's front-matter `name` differs from its
entry, or its `description` is empty or over 1024 characters, which
`npx skills` would skip. A push to the skill's branch shows up on the next deploy of this site,
which runs on every push to `main` and daily.

## Agent-readable output

Every page also exists as Markdown at its path plus `.md` (`/writing/` →
`/writing.md`, `/` → `/index.md`). `src/integrations/markdown-alternates.ts`
writes these after the build by converting each page's `<main>`, skipping
anything `aria-hidden="true"` or marked `data-md-skip`. Pass `markdown={false}`
to `Base` to leave a page out.

`functions/_middleware.ts` runs on Cloudflare Pages in front of every non-asset
request (`public/_routes.json` lists the exclusions). A page URL returns the
Markdown when the `Accept` header names `text/markdown` at least as high as
`text/html`, and returns 406 when neither is acceptable. Both formats carry
`Vary: Accept` and a `Link` header pointing at the other one. To try it locally,
build, then run `npx wrangler pages dev`.

`/llms.txt` is generated from `src/data/projects.ts` and the writing collection.
`/llms-full.txt` redirects to `/index.md` (`public/_redirects`).

`public/robots.txt` allows every crawler and sets `Content-Signal: search=yes,
ai-input=yes, ai-train=yes`. Keep Cloudflare's managed robots.txt and its AI
crawler blocking turned off for the zone. With them on, Cloudflare prepends its
own rules and blocks GPTBot and ClaudeBot at the edge.

### AI traffic log

The middleware writes one Analytics Engine data point per request to the
`apphane_ai_traffic` dataset (binding in `wrangler.toml`): `blob1` path, `blob2`
served content type, `blob3` User-Agent, `blob4` Accept, `blob5` referrer host,
`double1` status. Classify at query time by exclusion, since new agents show up
under unfamiliar user agents. This query lists who fetched Markdown or
`llms.txt` in the last 30 days; the token needs Account Analytics Read:

```bash
curl "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/analytics_engine/sql" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --data "SELECT blob3 AS user_agent, SUM(_sample_interval) AS hits
          FROM apphane_ai_traffic
          WHERE timestamp > NOW() - INTERVAL '30' DAY
            AND (blob2 = 'text/markdown' OR blob1 = '/llms.txt')
          GROUP BY user_agent ORDER BY hits DESC"
```

Scanners borrow AI user agents, so check the paths too. A `.md` 404 is a page
an agent expected to exist.
