# Acceptance scenarios

Load when maintaining or evaluating Agenter. This is a scenario inventory, not an automated runner or evidence of a pass.

Use disposable repositories/documents, a known dependency catalog, and before/after content snapshots. Keep real harness directories and production workflows untouched. For each case record input, observed action/output, assertions, and result: executed pass, executed fail, blocked, or not executed.

## Representative usage

| Input and fixture | Expected result |
| --- | --- |
| Bare `$agenter`; known workspace, registered dependency, no AGENTS.md | Discover the workspace and create root instructions without asking for a mode or fresh permission; report 完成 when coverage and required checks are satisfied |
| Bare `$agenter`; existing outdated instructions and user/staged edits | Scan applicable root/member sources and incrementally update supported facts; preserve unrelated content and staged state; no blanket confirmation |
| Bare `$agenter`; multiple declared members with different entrypoints | Account for each member and root prerequisites; use necessary task pointers/guides without treating discovery as permission to edit unrelated source documents |
| "生成这个项目的 AGENTS.md"; small app with one ordinary manifest and one non-obvious test setup | Evidence-based root file; useful setup/verification command; no copied script inventory, filler boundaries, or unnecessary guides |
| "只更新 AGENTS.md 的测试指令"; existing Chinese docs with deployment guardrails and user edits | Only the test-related content changes; Chinese language, unrelated guardrails, and staged content remain |
| "整理 monorepo 的代理说明，按任务拆分"; web and service tasks with different setup | Global constraints stay in root; branch-specific guides have explicit root load triggers and correct relative links |
| "只给大纲，不落盘"; existing or absent target | Validate hierarchy, source support, and proposed triggers; distinguish planned targets from existing links; no files written |

## Failure and preservation branches

| Fixture | Assertions |
| --- | --- |
| Dependency absent from catalog, despite a same-name repo folder | Optional discovery only; no plan/write; report missing registered dependency |
| Registered dependency cannot be read | Report actual load error; no embedded substitute and no success claim |
| Valid registered file/resource entrypoint, no dedicated invocation tool | Load via the declared mechanism and apply all three checkpoints |
| Existing explicit create/update authorization | Proceed within that scope without another blanket permission question |
| Requested replacement would drop an unresolved project prohibition | Present the actual removal for a decision; preserve current content meanwhile |
| Extra user paragraph appears after discovery | Re-read and preserve it; overlapping changes receive a concrete conflict question |
| Target is created after discovery or redirects outside scope | Reconcile the new file or stop before writing outside authorization |
| Unreadable source or broken test environment | Preserve uncertain existing rules; report the gap; do not label static inspection as command execution |
| Root exceeds budget with both global and task-only material | Disclose branch material with root pointers; preserve global invariants; request an exception only if still necessary |
| Scoped merge, including a bare invocation, into a pre-existing 230-line root | Preserve unrelated content; if excess cannot be resolved within scope, report 完成但存在缺口 without forcing wider edits |
| Missing optional CI versus an existing inaccessible optional source | Absent CI needs no invented section or question; an inaccessible source whose omission does not prevent safe completion is disclosed as 完成但存在缺口 |
| Bare invocation with missing dependency, ambiguous root, or unreadable target | Report 阻塞 with the exact prerequisite; optional discovery does not authorize unsafe writing |
| A required planned write or document check fails after partial progress | Report 阻塞 and per-target actual states; never downgrade the remaining required work to a non-blocking gap |
| Bare invocation while an explicit read-only restriction is active | Honor the restriction, validate only the requested plan, and write no project artifacts |
| Partial document write failure | Report actual changed/unchanged paths; avoid destructive baseline restoration |
| Same inputs and repository on a second run | No new semantic changes or gratuitous rewrites |

## Pointer walkthrough

For a generated deployment guide, walk a deployment-path change from the root to the guide, then walk an unrelated documentation typo. The first must find the deployment verification rules; the second should not load that branch. Repeat for each generated branch.

Label a human/model walkthrough separately from an independently executed skill run. A line count, valid frontmatter, or scenario table alone does not demonstrate behavioral reliability.
