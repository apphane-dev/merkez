import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import type { AstroIntegration } from 'astro';
import { z } from 'astro/zod';
import { parse as parseYaml } from 'yaml';
import { agentSkillSources, type AgentSkillSource } from '../data/agent-skills';

const SCHEMA_URL = 'https://schemas.agentskills.io/discovery/0.2.0/schema.json';
const INDEX_PATH = '.well-known/agent-skills/index.json';

/** agentskills.io name rule: lowercase alphanumeric runs joined by single dashes, at most 64 chars. */
const skillName = z
  .string()
  .max(64)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase letters, digits, and single dashes only');

const frontMatterSchema = z.object({
  name: skillName,
  /** `npx skills` drops index entries whose description is over 1024 chars. */
  description: z.string().trim().min(1).max(1024),
});

interface IndexEntry {
  name: string;
  description: string;
  type: 'skill-md';
  url: string;
  digest: `sha256:${string}`;
}

/**
 * Re-hosts each source's SKILL.md under /agent-skills/<name>/ and writes the
 * discovery index, with digests hashed from the files written into the build.
 */
export default function agentSkills(): AstroIntegration {
  let site: URL | undefined;
  return {
    name: 'apphane:agent-skills',
    hooks: {
      'astro:config:done': ({ config }) => {
        if (config.site) site = new URL(config.site);
      },
      'astro:build:done': async ({ dir, logger }) => {
        if (!site) throw new Error('agent-skills: `site` must be set in astro.config');
        assertNames(agentSkillSources);
        const origin = site;
        const skills = await Promise.all(
          agentSkillSources.map((source) => publishSkill({ source, outDir: dir, site: origin })),
        );
        const indexFile = new URL(INDEX_PATH, dir);
        await mkdir(new URL('.', indexFile), { recursive: true });
        await writeFile(indexFile, `${JSON.stringify({ $schema: SCHEMA_URL, skills }, null, 2)}\n`);
        logger.info(`${INDEX_PATH}: ${skills.map((skill) => skill.name).join(', ')}`);
      },
    },
  };
}

function assertNames(sources: AgentSkillSource[]): void {
  const seen = new Set<string>();
  for (const { name } of sources) {
    const result = skillName.safeParse(name);
    if (!result.success) {
      throw new Error(`agent-skills: invalid name "${name}": ${z.prettifyError(result.error)}`);
    }
    if (seen.has(name)) throw new Error(`agent-skills: duplicate name "${name}"`);
    seen.add(name);
  }
}

async function publishSkill({
  source,
  outDir,
  site,
}: {
  source: AgentSkillSource;
  outDir: URL;
  site: URL;
}): Promise<IndexEntry> {
  const upstream = `https://raw.githubusercontent.com/${source.repo}/${source.branch}/skills/${source.name}/SKILL.md`;
  const response = await fetch(upstream, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) {
    throw new Error(`agent-skills: GET ${upstream} failed: ${response.status} ${response.statusText}`);
  }
  const body = Buffer.from(await response.arrayBuffer());

  const frontMatter = frontMatterSchema.safeParse(readFrontMatter(body.toString('utf8'), upstream));
  if (!frontMatter.success) {
    throw new Error(`agent-skills: ${upstream} front matter: ${z.prettifyError(frontMatter.error)}`);
  }
  if (frontMatter.data.name !== source.name) {
    throw new Error(
      `agent-skills: ${upstream} declares name "${frontMatter.data.name}", expected "${source.name}"`,
    );
  }

  const path = `agent-skills/${source.name}/SKILL.md`;
  const file = new URL(path, outDir);
  await mkdir(new URL('.', file), { recursive: true });
  await writeFile(file, body);
  const hex = createHash('sha256').update(await readFile(file)).digest('hex');

  return {
    name: source.name,
    description: frontMatter.data.description,
    type: 'skill-md',
    url: new URL(path, site).href,
    digest: `sha256:${hex}`,
  };
}

function readFrontMatter(text: string, origin: string): unknown {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match) throw new Error(`agent-skills: ${origin} has no YAML front matter`);
  return parseYaml(match[1]);
}
