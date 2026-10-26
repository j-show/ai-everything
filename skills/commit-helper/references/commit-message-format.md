# Commit Message Format

Load at Step 3.

## Structure (blank line required)

```text
{type}: {title}

- {item 1}
- {item 2}
```

| Part | Rule |
| ---- | ---- |
| First line | `{type}: {title}` — one space after colon; title **short and summary-level** |
| Body | Each line `- `; a few intent bullets, not every file path |
| One change | One `- ` line is OK |
| Minimal body | Still at least **one** summary `- ` line |

## Types (exactly one)

| Type | Use when | Judgment |
| ---- | -------- | -------- |
| `fix` | Restore an existing contract | Correct actual behavior that violates an established expectation, regardless of implementation size |
| `feat` | Change the expected capability contract | Intentionally add, extend, change or remove supported capabilities; even a small capability qualifies |
| `docs` | Documentation only | Explain usage or behavior, without changing executable behavior or agent instructions |
| `ci` | Continuous integration | Change CI orchestration, jobs or test matrices; accompanying usage notes belong to the same intent |
| `refactor` | Behavior-preserving restructuring | Change internal organization or implementation while preserving behavior and the external contract, at any size |
| `style` | Presentation/formatting only | Change style or formatting without logic changes |
| `perf` | Improve performance | Performance is the purpose; restructuring used to achieve it is supporting work |
| `test` | Tests only | Add or revise tests as the independent purpose; tests supporting a fix/feature inherit that intent |
| `build` | Build/tooling | Change build systems, packaging or tooling, rather than CI orchestration or product capabilities |
| `revert` | Undo an identified prior change | Evidence and intent establish a rollback; deleting a capability alone is not proof of a revert |
| `chore` | Other maintenance | Routine version/dependency/encoding maintenance with no more specific purpose; not an uncertainty fallback |

A contract is an established requirement, public API, documented promise, valid test or confirmed expectation. Behavior includes return values, errors, side effects and a skill's execution/delivery rules. The current implementation alone does not establish what is correct. A new test alone does not prove an old promise. File extensions, words such as "optimize", and diff size do not determine type.

For `feat` / `fix` / `refactor`: intentionally changing the expected contract is `feat`; making actual behavior satisfy the existing contract is `fix`; preserving behavior while changing internal structure is `refactor`. A fix can require substantial new code; a feature need not be a large or "complete" feature. Purely explanatory Markdown is `docs`, but a changed SKILL.md execution rule must be classified by its behavioral purpose.

## Choosing type

1. Use an explicit user-specified type for this message, including a custom type. A quoted example, incidental word or historical commit is not an override. The message must still describe the actual selected diff.
2. Inspect only the selected commit content. Identify each independent purpose, its supporting diff and contract evidence. Attach necessary tests, documentation, local restructuring and generated files to the purpose they serve. A change has an independent purpose when it has a separate outcome beyond supporting another change; do not infer independence from separate files, or assume all changes share one purpose.
3. Classify each purpose using the table. "Only" means no independent purpose of a different type, not a single file kind: CI changes plus their documentation can be `ci`; a fix plus regression tests and necessary restructuring remains `fix`. Keep genuinely independent test, documentation or architecture work separate. For staged requests, establish the old contract from the diff's baseline or traceable prior requirements/confirmations, and read the index for the selected behavior; an unstaged document alone does not establish the old contract or belong in the message. If `feat` versus `fix` remains unknown after inspecting available evidence, ask one targeted question rather than guess.
4. All independent purposes map to the same type → use it without asking which purpose should lead; cover their separate outcomes in the message. Otherwise choose the primary intent by proportion of **effective direct changes**: compare the behavior, responsibilities or implementation paths directly changed for each purpose, with evidence from the selected diff. Do not count raw files/lines as votes. Supporting notes/tests, generated output, mechanical formatting and moves do not gain separate weight through volume. Routine dependency updates can be `chore`, but dependencies serving a fix, feature or build change follow that purpose. If the evidence does not establish a reliable dominant purpose, treat the leading candidates as tied; do not invent percentages.
5. Deduplicate the types of tied leading purposes. If one type remains, use it; otherwise retain **`refactor` > `feat` > `fix` > `chore`** when every tied type is in that chain. Type deduplication does not merge independent purposes or sum their weights. This is not a global priority list: a smaller independent refactor cannot override a dominant feature, and supporting refactoring is not a competing candidate. If competing distinct types include a type outside the chain, explain the purposes and ask which should lead. Never extend the ranking, default to `chore`, prioritize `revert` unconditionally, or automatically split/re-scope the commit.
6. For mixed changes, give one short reason for the chosen type and supporting groups outside the commit message. Keep the title about the primary intent and cover the other selected independent purposes in body bullets. An unresolved question blocks final type selection and committing, but does not authorize staging changes or altering the selected scope.

### Boundary examples

| Selected changes and evidence | Type / next step |
| --- | --- |
| Empty-input bug fix + much larger regression tests/docs + necessary helper extraction | `fix`; all serve restoration of the existing promise |
| New batch export + substantial code moves required to reuse single-item export | `feat`; supporting moves are not an independent refactor |
| Two-line addition of a previously unsupported public option | `feat`; size is irrelevant |
| Large export rewrite to stop dropping records promised by the existing API | `fix`; size is irrelevant |
| Equivalent module split with all public behavior and error paths preserved | `refactor` |
| Reject null inputs | Existing promise to reject → `fix`; intentionally replace an allowed-input contract → `feat`; unknown promise after inspection → ask |
| Independent refactor and feature with equal effective coverage | `refactor`, by the existing tie-break |
| Independent performance work and bug fix with no reliable primary intent | Ask which should lead; no ranking is defined for this tie |
| Independent installation and export documentation updates, both `docs` | `docs`; cover both topics without a type-selection question |
| Remove a supported API by product decision / undo an identified previous change | `feat` / `revert`, respectively |
| CI matrix update + corresponding README / only explanatory README / only regression tests | `ci` / `docs` / `test`, respectively |
| Cache restructuring to reduce measured latency | `perf`; the purpose is performance |

Do not label a large repair `refactor`, a small new capability `fix`, or every Markdown change `docs`. Do not let generated lockfile size outweigh the direct changes it supports.

## Literal message transport

After staging and reviewing the intended changes, write the draft to a temporary UTF-8 file **outside the repository** and pass its path with `git commit --cleanup=verbatim -F`. Use the current shell; switching to Git Bash is unnecessary.

The examples below commit the reviewed index. For the whole-file strategy in `staging-and-hooks.md`, add `--only -- <quoted paths…>` to the Git invocation inside the selected recipe. For named staged paths, run that invocation with the reviewed temporary `GIT_INDEX_FILE` environment and restore the original environment afterward; do not add paths or `--only`. Execute one commit using the selected strategy.

Replace the sample message with the actual draft and execute only the recipe for the current shell. A quoted here-string/heredoc preserves `"`, backticks, `$()` and backslashes: **do not add escaping to its body**. If the draft contains the closing delimiter on its own line, use a file-writing tool to write the exact text instead; in Bash, a unique quoted delimiter also works.

### PowerShell

```powershell
$commitMessage = @'
fix: trim configuration values

- Preserve the literal example "`code` $(literal)"
'@
$commitMessagePath = [System.IO.Path]::GetTempFileName()
try {
    [System.IO.File]::WriteAllText(
        $commitMessagePath,
        $commitMessage.Replace("`r`n", "`n") + "`n",
        [System.Text.UTF8Encoding]::new($false)
    )
    git commit --cleanup=verbatim -F $commitMessagePath
    if ($LASTEXITCODE -ne 0) {
        throw "Commit failed; inspect the error before retrying."
    }
} finally {
    Remove-Item -LiteralPath $commitMessagePath -ErrorAction SilentlyContinue
}
```

### Bash

```bash
(
  commit_message_path=$(mktemp) || exit 1
  trap 'rm -f -- "$commit_message_path"' EXIT
  cat > "$commit_message_path" <<'COMMIT_MESSAGE_EOF' || exit 1
fix: trim configuration values

- Preserve the literal example "`code` $(literal)"
COMMIT_MESSAGE_EOF
  git commit --cleanup=verbatim -F "$commit_message_path"
)
```

If file creation or writing fails, stop before committing. If Git fails, follow `staging-and-hooks.md`; recreate the message file for a retry after checking any hook changes. After success, compare `git log -1 --format=%B` with the draft (ignore only its final newline). If they differ, report the mismatch; do not silently amend.

## Map from Step 2 summary

- Summary headline → `{title}`
- Each intent bullet → one `- ` line in the commit body
