import { SHOW_EXAMPLES } from '../lib/flags';

export interface Sponsor {
  name: string;
  url: string;
  /** Hand-written only; GitHub sponsorships carry no blurb. */
  blurb?: string;
  /** Shown by hand-written entries only; the public API needs `read:user` to
   * serve sponsorship dates, and the wall does not render it anyway. */
  since?: string;
}

/** The GitHub Sponsors destination for the maintainer behind apphane. */
export const sponsorLink = 'https://github.com/sponsors/Guria';

/** Whose public GitHub sponsorships populate the wall. */
const MAINTAINER_LOGIN = 'Guria';

/** Sponsors not on GitHub (in-kind and other platforms), kept by hand. */
export const manualSponsors: Sponsor[] = [];

/** Hand-written blurbs for fetched sponsors, keyed by GitHub login. */
const blurbOverrides: Partial<Record<string, string>> = {};

/**
 * Placeholder showing how a sponsor renders; appears only in SHOW_EXAMPLES
 * builds when no real names are around.
 */
const placeholderSponsor: Sponsor = {
  name: 'Example Supporter',
  url: 'https://example.com',
  since: '2026-07',
  blurb: 'A placeholder sponsor. Real names appear here once support arrives.',
};

/**
 * Public sponsorships of the maintainer, resolved at build time. Private
 * sponsors stay off the wall — public visibility is the consent signal.
 * Dates need the `read:user` scope, so only names and links are fetched.
 */
const SPONSORS_QUERY = /* GraphQL */ `
  query ($login: String!) {
    user(login: $login) {
      sponsorshipsAsMaintainer(first: 100, includePrivate: false) {
        nodes {
          sponsorEntity {
            __typename
            ... on User {
              login
              name
              url
              websiteUrl
            }
            ... on Organization {
              login
              name
              url
              websiteUrl
            }
          }
        }
      }
    }
  }
`;

interface SponsorEntity {
  login: string;
  name: string | null;
  url: string;
  websiteUrl: string | null;
}

interface SponsorsResponse {
  data?: {
    user: {
      sponsorshipsAsMaintainer: {
        nodes: { sponsorEntity: SponsorEntity }[];
      };
    } | null;
  };
  errors?: { message: string }[];
}

async function fetchGitHubSponsors(): Promise<Sponsor[]> {
  const token =
    process.env.SPONSORS_TOKEN || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  // No token (plain local build): nothing to fetch, the wall falls back to
  // manual entries. With a token, failures throw — a sponsor paid, so a build
  // that would silently blank the wall must fail instead.
  if (!token) return [];

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: SPONSORS_QUERY,
      variables: { login: MAINTAINER_LOGIN },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Sponsors fetch failed: GitHub GraphQL ${res.status}`);

  const json = (await res.json()) as SponsorsResponse;
  if (json.errors?.length) {
    throw new Error(`Sponsors fetch failed: ${json.errors.map((e) => e.message).join('; ')}`);
  }
  const nodes = json.data?.user?.sponsorshipsAsMaintainer.nodes ?? [];
  return nodes.map(({ sponsorEntity: e }) => ({
    name: e.name || e.login,
    url: e.websiteUrl || e.url,
    blurb: blurbOverrides[e.login],
  }));
}

/**
 * The sponsors wall: manual entries plus fetched GitHub sponsorships, sorted
 * by name so the order is stable across API responses. Placeholder shows only
 * in SHOW_EXAMPLES builds.
 */
export async function getSponsors(): Promise<Sponsor[]> {
  const fetched = await fetchGitHubSponsors();
  const all = [...manualSponsors, ...fetched].sort((a, b) => a.name.localeCompare(b.name));
  return SHOW_EXAMPLES && all.length === 0 ? [placeholderSponsor] : all;
}

export const showSeedNote = SHOW_EXAMPLES;
