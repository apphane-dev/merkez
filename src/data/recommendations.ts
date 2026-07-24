import type { TopicId } from './topics';
import { SHOW_EXAMPLES } from '../lib/flags';

export type RecCategory =
  | 'software'
  | 'library'
  | 'book'
  | 'article'
  | 'website'
  | 'service';

export interface Recommendation {
  title: string;
  url: string;
  category: RecCategory;
  /** What it is, in one line. */
  summary: string;
  /** Why it earns a place here — the part that matters. */
  why: string;
  topics: TopicId[];
  /** When we last looked at it, so staleness is visible. */
  reviewedAt: string;
  /** How we're related to it — disclosed on the card. */
  relationship: 'none' | 'used-by-us' | 'contributor' | 'sponsor' | 'affiliate';
  /** Marks seed placeholders while the list is being furnished. */
  placeholder?: boolean;
}

export const categoryLabels: Record<RecCategory, string> = {
  software: 'Software',
  library: 'Library',
  book: 'Book',
  article: 'Article',
  website: 'Website',
  service: 'Service',
};

/**
 * A short, opinionated shelf. Every entry says WHY, not just what, and carries a
 * reviewed date so a stale pick is obvious. Relationships are disclosed on the
 * card. The entries below are clearly-marked placeholders.
 */
export const recommendations: Recommendation[] = [
  {
    title: 'exe.dev',
    url: 'https://exe.dev/i/rlZXTJTU4APKOBT',
    category: 'service',
    summary: 'Ephemeral and long-running Linux VMs with shared resource limits.',
    why: 'Best DX for remote environments and cloud agents. Using our invite link gives +6 GB extra disk to both of us after upgrading to a paid plan.',
    topics: ['developer-tools'],
    reviewedAt: '2026-07-24',
    relationship: 'affiliate',
  },
  {
    title: 'Reatom',
    url: 'https://github.com/reatom/reatom',
    category: 'library',
    summary: 'Reactive STM library for JavaScript and TypeScript with batteries included.',
    why: 'Built on composable reactive primitives that handle state, async workflows, forms, and routes in one system.',
    topics: ['frontend-architecture', 'open-source'],
    reviewedAt: '2026-07-24',
    relationship: 'used-by-us',
  },
  {
    title: 't3code',
    url: 'https://github.com/pingdotgg/t3code',
    category: 'software',
    summary: 'Cross-platform management for AI coding agents across desktop, web, and mobile.',
    why: 'Keeps agents organized and accessible anywhere; pairs exceptionally well with exe.dev VMs.',
    topics: ['developer-tools', 'open-source'],
    reviewedAt: '2026-07-24',
    relationship: 'used-by-us',
  },
  {
    title: 'CodeceptJS',
    url: 'https://codecept.io/',
    category: 'software',
    summary: 'Full-featured end-to-end test automation framework.',
    why: "Great choice for teams that enjoy Kahraman's actor-based testing model but need higher-level, multi-backend e2e automation.",
    topics: ['testing', 'developer-tools'],
    reviewedAt: '2026-07-24',
    relationship: 'used-by-us',
  },
  {
    title: 'Herdr',
    url: 'https://github.com/apphane-dev/herdr',
    category: 'software',
    summary: 'Terminal multiplexer and workspace orchestration tool.',
    why: 'Excellent for managing parallel agents, workspace panes, and long-running CLI tasks with full session control.',
    topics: ['developer-tools'],
    reviewedAt: '2026-07-24',
    relationship: 'used-by-us',
  },
  {
    title: 'Example: a build tool we reach for',
    url: 'https://example.com/build-tool',
    category: 'software',
    summary: 'Placeholder for a tool the house actually uses day to day.',
    why: 'A real entry would say what problem it removed for us and what we tried first. This is a seed placeholder.',
    topics: ['developer-tools', 'frontend-architecture'],
    reviewedAt: '2026-07-15',
    relationship: 'used-by-us',
    placeholder: true,
  },
  {
    title: 'Example: an essay worth re-reading',
    url: 'https://example.com/essay',
    category: 'article',
    summary: 'Placeholder for a piece of writing that changed how we work.',
    why: 'A real entry would name the one idea we carried away from it. This is a seed placeholder.',
    topics: ['software-design', 'open-source'],
    reviewedAt: '2026-07-02',
    relationship: 'none',
    placeholder: true,
  },
  {
    title: 'Example: a library we contribute to',
    url: 'https://example.com/library',
    category: 'library',
    summary: 'Placeholder for a dependency we both use and help maintain.',
    why: 'A real entry would disclose our involvement plainly, as this one does. This is a seed placeholder.',
    topics: ['testing', 'accessibility'],
    reviewedAt: '2026-06-28',
    relationship: 'contributor',
    placeholder: true,
  },
];

/**
 * The choke point for the recommendations page. Placeholder seed entries are
 * dropped unless the SHOW_EXAMPLES build flag is set. `showSeedNote` gates the
 * "Seed placeholders" banner so it only appears alongside visible placeholders.
 */
export const visibleRecommendations: Recommendation[] = SHOW_EXAMPLES
  ? recommendations
  : recommendations.filter((r) => !r.placeholder);

export const showSeedNote = SHOW_EXAMPLES;

export const relationshipLabels: Record<Recommendation['relationship'], string> = {
  none: '',
  'used-by-us': 'We use this',
  contributor: 'We contribute',
  sponsor: 'Sponsor',
  affiliate: 'Affiliate link',
};
