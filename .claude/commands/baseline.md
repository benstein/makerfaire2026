Reset the game to its original baseline state.

Steps:
1. Run `git checkout baseline -- src/ public/changelog.json index.html` to restore all game files to the baseline tag
2. Verify the reset worked by checking that `public/changelog.json` only has the version 1 baseline entry
3. Commit the reset: `git add -A && git commit -m "Reset to baseline"`
4. Confirm to the user that the game has been reset. Vite will auto-reload the browser.

Do NOT move or delete the baseline tag. Do NOT use `git reset`. This is a safe, non-destructive operation — all previous changes remain in git history.
