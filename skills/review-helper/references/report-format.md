# Report Format

Load at Step 1.

## Language and tone

- Findings and summary: **Chinese**
- Paths: repo-relative, forward slashes
- Suggestions: short, actionable — **no pasted code blocks** (one-line fix hint is enough)

## Priority levels

| Level | Meaning | Loop A action |
| ----- | ------- | ------------- |
| P0 | Critical — correctness, security, data loss, broken contract | Must fix before done |
| P1 | High — should fix before delivery | Must fix before done |
| P2 | Medium — follow-up worthy | Fix in Loop A unless user asked report-only |
| P3 | Low — optional polish | Fix in Loop A unless user asked report-only |

Do not inflate severity. A naming nit is P3, not P1.

## Categories (pick one per finding)

`正确性` · `安全` · `性能` · `可读性` · `可维护性` · `测试`

## Single finding template

```markdown
### P{n} · {category} · `{relative-path}:{start}-{end}`

**问题**：{what is wrong, one or two sentences}

**建议**：{concrete next step — no large code paste}
```

Line range rules:

- Use start–end on the **current** file (`42-48`); single line `42-42`
- If the issue is file-level (missing test file), use `{path}:1-1` and say "全文件/缺文件" in 问题

## Report document structure

Save a copy under `.review/{timestamp}.md` (e.g. `20260804143022.md` — audit time, no spaces).

```markdown
# 代码审查报告

- **范围**：{scope mode + baseline description}
- **时间**：{ISO or local audit time}
- **分支**：{branch name}
- **暂存区**：{included / excluded}

## 摘要

| 级别 | 数量 |
| ---- | ---- |
| P0   | n    |
| P1   | n    |
| P2   | n    |
| P3   | n    |

## 发现

{P0 items first, then P1, P2, P3 — each using the single-finding template}

## 备注

{optional: deferred items, generated/vendor paths, scope limits}
```

## Empty report

When no P0–P3 items remain after a review pass, Step 1 output should state clearly:

```markdown
## 发现

无待修复项（范围内未发现 P0–P3 问题）。
```

Still save the report file when the user expects audit history; otherwise a minimal `.review/{timestamp}.md` with 摘要 all zero is acceptable.

## Review lens (senior reviewer)

Check in-scope diff for:

| Lens | Examples |
| ---- | -------- |
| Correctness | Wrong logic, edge cases, error handling, race conditions |
| Security | Injection, authz, secrets, unsafe defaults |
| Performance | Obvious N+1, hot-path waste (only when material) |
| Readability | Confusing control flow, misleading names in changed code |

Do not file style-only nits on lockfiles. Do not file issues outside the resolved diff scope.

## Loop A coupling

- Each report round lists **current** findings for the **same scope**
- After Step 2 fixes, re-run Step 1 until 无待修复项
- Resolved items should not reappear; new regressions from fixes must be filed
