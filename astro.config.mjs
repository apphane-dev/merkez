// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import agentSkills from './src/integrations/agent-skills.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://apphane.dev',
  integrations: [sitemap(), agentSkills()],
  // Lossless: keeps whitespace that renders, such as a space between text and a link.
  compressHTML: true,
  server: { allowedHosts: true },
});
