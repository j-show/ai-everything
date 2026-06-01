# Usage Examples

Load in Step 1 to calibrate expected inputs and outputs.

## Example 1 — Greenfield Node app

**User:** “用 init-helper 给这个仓库生成 AGENTS.md”

**Actions:** Discover `package.json` scripts → plan ≤200 lines → confirm → write root `AGENTS.md` with `pnpm run dev`, `pnpm test`, Always/Never git rules → no domain split.

**Output:** New `AGENTS.md` ~40 lines; README linked in Document map.

## Example 2 — Monorepo with frontend + API

**User:** “Refresh AGENTS.md; we have separate web and server commands”

**Actions:** Discover workspaces → plan splits `docs/agents/frontend.md`, `docs/agents/backend.md` → confirm merge (keep existing Never do rules) → root keeps shared verify loop; domain files hold stack commands.

**Output:** Root ~120 lines + two domain files; Document map updated.

## Example 3 — Plugin pack (ai-everything style)

**User:** “init-helper — align AGENTS.md with package.json and skills/”

**Actions:** Read `npm run build`, deploy scripts, `skills/*/SKILL.md` names → plan `docs/agents/skills.md` → merge existing AGENTS.md tables → Known fixes for `npm run build` after `package.json` edits.

**Output:** Refreshed root AGENTS.md; optional `docs/agents/skills.md` for skill-forge/quick_validate pointers.
