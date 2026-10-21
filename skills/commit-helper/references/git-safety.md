# Git Safety

Load at Step 1.

## Authorization

- Summary or message-only requests are read-only. A commit request authorizes staging and committing its selected scope; do not ask again when this is already clear.
- Do not create branches, change Git configuration, discard changes, or run reset/rebase/cherry-pick/stash as a workaround in this workflow.
- Do not bypass hooks/signing or push without explicit authorization for that action. Prior explicit authorization still applies; requesting a commit alone does not authorize a push.
- A temporary index is an attempt-local staging mechanism, not a replacement for the original index. Restore any inherited `GIT_INDEX_FILE` value and verify the actual commit; it cannot prevent hooks from adding changes.

## Amend

- Default to a new commit. Hook edits, including edits left after a successful commit, do **not** authorize amend.
- Amend only when the user explicitly authorized rewriting the intended commit. Verify HEAD is that commit and whether it has been published; if publication status is unknown or published-history rewriting is not covered by the request, clarify that specific uncertainty before rewriting.
- A failed ordinary commit creates no new commit to amend. Fix/review the failure and retry the ordinary commit; never amend the older HEAD as a substitute.

## Secrets

Screen `.env`, `.env.*`, `*credentials*`, `*.pem`, `id_rsa`, user-marked sensitive paths, and the selected diff. Template names are signals to inspect, not proof of a secret; distinguish documented placeholders from credentials.

Exclude suspected secrets from the selected commit and report paths, never values. If a sensitive file is already staged, merely omitting `git add` does not exclude it: use a verified scope-isolation strategy or **STOP** before committing. Do not silently unstage, delete, or alter that file.
