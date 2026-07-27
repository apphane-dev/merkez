import { SHOW_EXAMPLES } from '../lib/flags';

export interface Sponsor {
  name: string;
  url: string;
  since: string;
  blurb?: string;
  placeholder?: boolean;
}

/** The GitHub Sponsors destination for the maintainer behind apphane. */
export const sponsorLink = 'https://github.com/sponsors/Guria';

/**
 * Current supporters. Empty is the honest default; the seed entry below is a
 * clearly-marked placeholder showing how a sponsor renders.
 */
export const sponsors: Sponsor[] = [
  {
    name: 'Example Supporter',
    url: 'https://example.com',
    since: '2026-07',
    blurb: 'A placeholder sponsor. Real names appear here once support arrives.',
    placeholder: true,
  },
];

/**
 * The choke point for the sponsors wall. Placeholder seed entries are dropped
 * unless the SHOW_EXAMPLES build flag is set. `showSeedNote` gates the "Seed
 * placeholder" banner so it only appears alongside a visible placeholder.
 */
export const visibleSponsors: Sponsor[] = SHOW_EXAMPLES
  ? sponsors
  : sponsors.filter((s) => !s.placeholder);

export const showSeedNote = SHOW_EXAMPLES;
