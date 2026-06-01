# {{PROJECT_NAME}} — Agent Instructions

<!-- Remove all {{PLACEHOLDER}} lines before shipping; replace or delete unused sections. -->

For humans: see [README.md](README.md).

## Project

{{ONE_PARAGRAPH: what it is, primary stack, repo type (app / library / monorepo / plugin pack).}}

## Environment

- {{RUNTIME}}: {{VERSION}} (from {{MANIFEST_PATH}})
- {{OTHER_TOOLS}}
- Env: {{ENV_FILE_PRIORITY e.g. `~/.project_env` then `.env.example`}}

## Commands

Run from repository root unless noted:

- `{{COMMAND}}` — {{EFFECT}}
- `{{COMMAND}}` — {{EFFECT}}

## Structure

| Path | Role |
| ---- | ---- |
| `{{path}}` | {{role}} |

## Boundaries

### Always do

- {{RULE}}

### Ask first

- {{RULE}}

### Never do

- {{RULE}}

## Verification

After code changes:

1. `{{lint}}`
2. `{{build}}`
3. `{{test}}`
4. `{{run_or_health}}` (if applicable)

## Known fixes

| Symptom | Fix |
| ------- | --- |
| {{symptom}} | {{fix}} |

## Document map

| Doc | Purpose |
| --- | ------- |
| [README.md](README.md) | Human overview and install |
| {{OPTIONAL docs/agents/*.md rows}} |

## Done checklist

- [ ] {{PROJECT_SPECIFIC_GATE}}
