Reset the game to its original baseline state.

Steps:
1. Run `git fetch --tags --force` to make sure the local baseline tag is up to date with the remote (stale local tags cause bad resets — this is the most common failure mode).
2. Get the list of files in the baseline tag's src/ directory:
   `git ls-tree -r --name-only baseline -- src/ | sort`
3. Get the list of files currently in src/:
   `find src/ -type f | sort`
4. Delete any src/ files that exist now but are NOT in the baseline tag (kid-added files like airstrike.js, boss.js, etc.):
   For each extra file: `git rm --cached <file> && rm <file>`
5. Restore all baseline files: `git checkout baseline -- src/ public/changelog.json index.html vite.config.js CLAUDE.md`
6. Verify the reset worked by checking that `public/changelog.json` only has the version 1 baseline entry
7. Commit the reset: `git add -A && git commit -m "Reset to baseline"`
8. Push to remote: `git push`. If it fails because the remote has newer commits, run `git pull --ff-only` then `git push` again. If `--ff-only` also fails (branches diverged):
   - Run `git merge origin/main -m "Merge remote baseline reset"`
   - **Immediately re-run step 4** (`git checkout baseline -- src/ public/changelog.json index.html vite.config.js CLAUDE.md`) — the merge may have reintroduced kid changes from the other laptop
   - `git add -A && git commit -m "Re-apply baseline after merge"` then `git push`
9. Confirm to the user that the game has been reset. Vite will auto-reload the browser.

Do NOT move or delete the baseline tag. Do NOT use `git reset`. This is a safe, non-destructive operation — all previous changes remain in git history.
