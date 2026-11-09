export interface AgentSkillSource {
  /** Skill name; the repo must hold it at `skills/<name>/SKILL.md`. */
  name: string;
  /** GitHub `owner/repo`. */
  repo: string;
  /** Branch the build tracks. A push there reaches the site on the next deploy. */
  branch: string;
}

/**
 * Single-file skills re-hosted under /agent-skills/ and listed in
 * /.well-known/agent-skills/index.json (src/integrations/agent-skills.ts).
 */
export const agentSkillSources: AgentSkillSource[] = [
  { name: 'kahraman-storybook-testing', repo: 'apphane-dev/kahraman', branch: 'main' },
];
