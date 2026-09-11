export interface Project {
  /** Slug, also used as the section anchor. */
  id: string;
  name: string;
  /** Turkish word the project is named after and its meaning. */
  turkish: { word: string; meaning: string };
  tagline: string;
  description: string;
  features: string[];
  install?: { label: string; command: string };
  license?: string;
  platform: string;
  language: string;
  /** The project's own subdomain, when it has a home of its own. */
  home?: string;
  links: { label: string; href: string }[];
}

/** Every project id, published or not, that writing and recommendations may point at. */
export const PROJECT_IDS = ['nehir', 'kahraman', 'karkas', 'eczane', 'ses'] as const;
export type ProjectId = (typeof PROJECT_IDS)[number];

/** Human labels for project ids, including rooms not yet listed as cards. */
export const projectLabels: Record<ProjectId, string> = {
  nehir: 'nehir',
  kahraman: 'kahraman',
  karkas: 'karkas',
  eczane: 'eczane',
  ses: 'ses',
};

/** The home address for any project id — used to link mentions back to the room. */
export const projectHomes: Record<ProjectId, string> = {
  nehir: 'https://nehir.apphane.dev',
  kahraman: 'https://kahraman.apphane.dev',
  karkas: 'https://karkas.apphane.dev',
  eczane: 'https://eczane.apphane.dev',
  ses: 'https://ses.apphane.dev',
};

/**
 * Projects currently living in the house. Planned projects get a dark
 * window in the strip but are not listed here until they exist publicly.
 */
export const projects: Project[] = [
  {
    id: 'nehir',
    name: 'nehir',
    turkish: { word: 'nehir', meaning: 'river' },
    tagline: 'Windows flow in columns, scrolling across your screen.',
    description:
      'A scrolling tiling window manager for macOS, built on the Niri column paradigm. Columns scroll horizontally instead of shrinking to fit — your windows keep their size, and you move the river.',
    features: [
      'Scrolling columns in the Niri paradigm',
      'Workspaces with hotkey switching',
      'Multiple monitor support',
      'Overview mode',
      'Command palette',
      'IPC control via nehirctl',
      'Split TOML configuration',
    ],
    install: {
      label: 'Install with Homebrew',
      command: 'brew install --cask guria/tap/nehir',
    },
    license: 'GPL-2.0-only',
    platform: 'macOS',
    language: 'Swift',
    home: 'https://nehir.apphane.dev',
    links: [
      { label: 'GitHub', href: 'https://github.com/apphane-dev/nehir' },
      { label: 'Discussions', href: 'https://github.com/apphane-dev/nehir/discussions' },
      { label: 'Releases', href: 'https://github.com/apphane-dev/nehir/releases' },
    ],
  },
  {
    id: 'kahraman',
    name: 'kahraman',
    turkish: { word: 'kahraman', meaning: 'hero' },
    tagline: 'Accessibility first tests that read like a user’s story.',
    description:
      'A codecept style test actor and fluent locator DSL for Storybook portable stories and Vitest browser mode. Kahraman steers tests toward roles, accessible names, and visible text so the easiest tests to write are also the ones that reflect what users perceive.',
    features: [
      'Declarative I.see / I.click actor',
      'Accessibility first locator DSL',
      'Storybook portable stories',
      'Vitest browser mode',
      'Readable failure diagnostics',
      'Extensible page actors',
      'React, Vue, and Svelte ready',
    ],
    install: {
      label: 'Install from npm',
      command: 'npm install --save-dev kahraman',
    },
    license: 'MIT',
    platform: 'Storybook / Vitest',
    language: 'TypeScript',
    home: 'https://kahraman.apphane.dev',
    links: [
      { label: 'GitHub', href: 'https://github.com/apphane-dev/kahraman' },
      { label: 'npm', href: 'https://www.npmjs.com/package/kahraman' },
      { label: 'Releases', href: 'https://github.com/apphane-dev/kahraman/releases' },
    ],
  },
  {
    id: 'karkas',
    name: 'karkas',
    turkish: { word: 'karkas', meaning: 'framework / skeleton' },
    tagline: 'An opinionated modern React stack, wired end to end.',
    description:
      'A reference application and template for a modern React stack — Nub for packaging, React 19, Reatom state, Panda CSS with Park UI components, ParaglideJS i18n, and Storybook portable stories tested with Vitest browser mode through kahraman. Organized by Feature-Sliced Design so the skeleton stays legible as it grows.',
    features: [
      'Nub + mise + hk toolchain',
      'React 19 with Reatom state',
      'Panda CSS and Park UI components',
      'ParaglideJS internationalization',
      'Storybook portable stories',
      'kahraman driven Vitest tests',
      'Feature-Sliced Design layout',
    ],
    install: {
      label: 'Clone the template',
      command: 'git clone https://github.com/apphane-dev/karkas.git',
    },
    license: 'MIT',
    platform: 'Web',
    language: 'TypeScript',
    home: 'https://karkas.apphane.dev',
    links: [
      { label: 'GitHub', href: 'https://github.com/apphane-dev/karkas' },
      { label: 'Demo', href: 'https://karkas.apphane.dev' },
      { label: 'Storybook', href: 'https://karkas.apphane.dev/storybook/' },
    ],
  },
  {
    id: 'eczane',
    name: 'eczane',
    turkish: { word: 'eczane', meaning: 'pharmacy' },
    tagline: 'The on duty pharmacy in Antalya, found fast.',
    description:
      'A static, multilingual, installable web app for finding on duty (nöbetçi) pharmacies in Antalya. A scraper commits a static city snapshot and the browser does the rest — grouped listings, maps, calling, directions, and nearest first geolocation — with no backend to run.',
    features: [
      'On duty pharmacies in Antalya',
      'District grouped listings',
      'Nearest first geolocation sort',
      'MapLibre GL maps',
      'Phone, WhatsApp, and directions',
      'Turkish, English, and Russian',
      'Installable offline app shell',
    ],
    platform: 'Web',
    language: 'Astro',
    home: 'https://eczane.apphane.dev',
    links: [{ label: 'GitHub', href: 'https://github.com/apphane-dev/eczane' }],
  },
  {
    id: 'ses',
    name: 'ses',
    turkish: { word: 'ses', meaning: 'voice / sound' },
    tagline: 'Clone a voice, then narrate a whole script in it.',
    description:
      'A local voice cloning voiceover pipeline: give it a voice sample, a Markdown script, and settings, and it returns narration in that voice — one WAV per section plus a concatenated full.wav. Everything runs on your own machine through a staged synthesis pipeline, with quality gates that reroll garbled or overly paused takes.',
    features: [
      'Qwen3-TTS voice cloning',
      'ICL and x-vector clone modes',
      'Staged synthesis pipeline',
      'Garble and pause quality gates',
      'Safe LavaSR enhancement',
      'Markdown script format',
      'Runs locally on MPS or CPU',
    ],
    install: {
      label: 'Clone the repo',
      command: 'git clone https://github.com/apphane-dev/ses.git',
    },
    license: 'MIT',
    platform: 'macOS',
    language: 'Python',
    home: 'https://ses.apphane.dev',
    links: [{ label: 'GitHub', href: 'https://github.com/apphane-dev/ses' }],
  },
];

/** Total windows in the strip: lit ones are shipped projects, dark ones are rooms being furnished. */
export const HOUSE_WINDOWS = 6;
