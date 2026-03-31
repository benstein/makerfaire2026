Revert the most recent game change.

Steps:
1. Read `public/changelog.json` to see the current version list
2. If there's only the baseline entry, tell the user there's nothing to revert
3. Otherwise:
   a. Run `git revert HEAD --no-edit` to undo the last commit
   b. Remove the last entry from `public/changelog.json` (keep all earlier entries)
   c. Amend the revert commit to include the changelog fix: `git add public/changelog.json && git commit --amend --no-edit`
4. Tell the user what was reverted (show the removed changelog entry). Vite will auto-reload the browser.

This is non-destructive — the reverted change is still in git history and can be recovered.
