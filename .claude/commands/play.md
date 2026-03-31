Switch the game to a specific changelog version. The user specifies a version number (e.g., `/play 3`).

Arguments: $ARGUMENTS (the version number to switch to)

Steps:
1. Read `public/changelog.json` to get the full version list
2. Parse the requested version number from the arguments
3. If no version specified or invalid, show the available versions from changelog.json and ask which one
4. Use `git log --oneline --all` to see the commit history
5. Find the commit that introduced the requested version. Strategy:
   - Search git log for commits. Each kid change is one commit. The baseline tag is version 1.
   - Use `git log --all -p -- public/changelog.json` to find the commit where the requested version number first appeared in changelog.json
6. Once you find the right commit SHA:
   a. Run `git checkout <SHA> -- src/ public/changelog.json index.html` to restore files from that point
   b. Commit: `git add -A && git commit -m "Switch to version #N: <description from changelog>"`
7. Tell the user which version is now active and what it includes. Vite will auto-reload.

This is non-destructive — no code is lost, you're just checking out files from a specific commit. All history is preserved.
