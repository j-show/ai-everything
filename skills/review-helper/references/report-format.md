# Report Format

Load at Step 1. Findings and summaries are Chinese; paths are repo-relative with forward slashes. Keep suggestions short, without large code blocks.

## Evidence and priority

Report actionable defects supported by the selected diff, contract, caller or reproduction. State the triggering conditions and concrete impact. Uncertain assumptions belong in open questions, not confirmed findings.

| Priority | Meaning |
| --- | --- |
| P0 | Critical, broadly applicable failure such as severe security exposure or data loss requiring immediate action |
| P1 | High-impact defect that should be fixed before delivery |
| P2 | Material defect with a narrower impact |
| P3 | Low-impact but concrete issue worth correcting |

Do not grade every contract violation P0 or report naming preferences as defects. Priority does not override read-only mode or authorize wider edits.

Categories: `正确性` · `安全` · `性能` · `可读性` · `可维护性` · `测试`.

```markdown
### P{n} · {category} · `{path}:{start}-{end}` · {reviewed version/layer}

**问题**：{trigger, concrete impact and supporting evidence}

**建议**：{specific next step}
```

Use the smallest relevant **real** line range in the reviewed version:

- Committed or staged review: use that snapshot's lines, not shifted worktree lines.
- Deleted lines/files: use the old path and old version, labelled `删除前 <sha>`; do not invent a new-file location.
- Missing file/test: cite the changed caller or implementation that requires it, or give a path-level finding explicitly without a line number. Never invent `missing-file:1-1`.
- After fixes: label current worktree locations; retain original locations in resolved history.

## Saving and report structure

Default destination: `.review/{timestamp}.md` under the project root. An explicit destination takes precedence. Use the current audit time and a unique suffix if needed; never overwrite existing reports unintentionally.

“Only review / do not fix code” disables code repair. “Do not write files” additionally disables saving a report; provide it only in the response. Do not ask again when the user already stated the mode.

```markdown
# 代码审查报告

- 范围：{mode, paths, baseline IDs and reviewed layers}
- 时间：{actual audit time}
- 报告模式：{review-only / review-and-fix}

## 发现
{P0–P3 findings, highest first; or 范围内未发现可确认的问题}

## 修复与剩余项
{resolved findings, unresolved defects, questions; omit in review-only mode if redundant}

## 验证
{command, cwd, snapshot identity, actual exit status, coverage, failure/blocker/not-run reason; temporary-resource cleanup state when used}
```

An empty findings section means no confirmed defects were found within the stated scope. It does not mean unexecuted tests passed.

Re-review after every repair, including verification-driven repairs. Record the resulting worktree state without relabelling an unchanged staged snapshot as fixed. The final report must distinguish resolved defects, remaining defects and validation gaps. New reports are allowed on a repeat run; needless code/test rewrites are not.
