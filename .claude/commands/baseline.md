Reset the game to its original baseline state.

Steps:
1. Get the list of files in the baseline tag's src/ directory:
   `git ls-tree -r --name-only baseline -- src/ | sort`
2. Get the list of files currently in src/:
   `find src/ -type f | sort`
3. Delete any src/ files that exist now but are NOT in the baseline tag (kid-added files like airstrike.js, boss.js, etc.):
   For each extra file: `git rm --cached <file> && rm <file>`
4. Restore all baseline files: `git checkout baseline -- src/ public/changelog.json index.html vite.config.js CLAUDE.md`
5. Verify the reset worked by checking that `public/changelog.json` only has the version 1 baseline entry
6. Commit the reset: `git add -A && git commit -m "Reset to baseline"`
7. Push to remote: `git push`. If it fails because the remote has newer commits, run `git pull --ff-only` then `git push` again. If `--ff-only` also fails (branches diverged), run `git merge origin/main -m "Merge remote baseline reset"` then `git push`.
8. Confirm to the user that the game has been reset. Vite will auto-reload the browser.

Do NOT move or delete the baseline tag. Do NOT use `git reset`. This is a safe, non-destructive operation — all previous changes remain in git history.
