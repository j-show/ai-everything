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
| `fix` | Bug fix | Small business-code change |
| `feat` | New/changed feature | Business code forming a complete feature |
| `docs` | Docs only | README, JSDoc only — no business code |
| `ci` | CI only | CI scripts only — no business code |
| `refactor` | Refactor | Large business-code restructure, not a full new feature |
| `style` | Style | Style only — no business logic |
| `perf` | Performance | Perf/structure, not a new feature |
| `test` | Tests | Test changes only |
| `build` | Build/tooling | Build system or tools, no business code |
| `revert` | Revert | Reverts a commit or feature |
| `chore` | Misc | Encoding, versions, deps, other |

## Choosing type

1. User specified type in input → use it
2. Else primary **intent** of the diff
3. Multiple intents → by proportion of change
4. Tie-break weight: **`refactor` > `feat` > `fix` > `chore`**

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
