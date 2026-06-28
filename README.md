# Arena Survival — A Live Maker Faire Game

Hi! This is the source code for a game we're running as a live exhibit at the [Piedmont School Maker Faire](https://www.piedmontmakers.org/school-maker-faire). Here's how it works:

A kid walks up to a TV running this game. They tell us what they want to change ("make the player a dragon", "add a freeze ray", "the enemies should be dancing bananas"). We tell Claude Code, and Claude Code edits the game **right there, in front of them**. The screen goes into "BUILD MODE" with the kid's name on it while the change happens. A few seconds later, the game reloads and they get to play their idea. Then the next kid walks up.

It's the most fun thing.

## What you need to run this

You need three things on your computer:

1. **Node.js** (version 18 or newer). Download from [nodejs.org](https://nodejs.org).
2. **Git**. On a Mac, open Terminal and type `git --version`. If it asks you to install something, say yes. Otherwise grab it from [git-scm.com](https://git-scm.com).
3. **Claude Code**. This is the AI tool that actually edits the game when kids ask for changes. Get it from [claude.com/claude-code](https://claude.com/claude-code). You'll need an Anthropic account.

If you just want to **play** the game as-is, you only need Node and Git. You need Claude Code to do the live editing thing.

## Get the code

### Step 1: Fork the repo

Go to [github.com/benstein/makerfaire2026](https://github.com/benstein/makerfaire2026) and click the **Fork** button in the top right. This creates your own copy of the game on GitHub that you can push changes to.

### Step 2: Clone your fork

Open Terminal (Mac) or Git Bash (Windows). Replace `YOUR-USERNAME` with your GitHub username:

```bash
git clone https://github.com/YOUR-USERNAME/makerfaire2026.git
cd makerfaire2026
npm install
git config core.hooksPath hooks
```

What each line does:
- `git clone` downloads the code to your computer
- `npm install` downloads the libraries the game needs (takes ~10 seconds, a lot of text scrolls by — normal)
- `git config core.hooksPath hooks` wires up two automatic scripts: one that checks the game actually compiles before saving a change, and one that clears the build overlay and pushes to GitHub after a change is saved

Run these once and you're set.

## Run the game

In the terminal, inside the `makerfaire2026` folder:

```bash
npm run dev
```

You'll see something like:

```
  VITE v8.0.3  ready in 200 ms
  ➜  Local:   http://localhost:5173/
```

Open that URL in Chrome, Firefox, or Safari. You should see the game!

**Controls:**
- **Move:** WASD or arrow keys (or left stick on an Xbox controller)
- **Fire:** Spacebar (or A button)
- **Restart:** Enter (or Start button)

Plug in an Xbox controller and the game switches to it automatically. Keyboard works fine if you don't have one.

## Do the live exhibit thing with kids

This is the main event. You need Claude Code running in the same folder. Open a second terminal tab, `cd` into `makerfaire2026`, and run:

```bash
claude
```

Now you're ready. When a kid walks up and says what they want:

**Type it to Claude exactly like this, with the kid's name:**

> Gabi says "make the enemies into sharks"

> Marcus says "I want a giant boss with 100 health"

> Sofia says "add a freeze ray that slows enemies down"

The kid's name is important — Claude puts it on the build screen, adds it to the leaderboard, and saves it in the game's history. Always include it.

Claude will:
1. Put the kid's name on the screen immediately so they know their change is being built
2. Read the current game code
3. Figure out what to change
4. Make the change
5. Commit it (the browser auto-reloads)

The whole thing takes about 20–30 seconds. Kids watch the build screen tick through the steps.

### What Claude knows about the game

There's a `CLAUDE.md` file in the project that acts as Claude's rulebook. It tells Claude things like "always put the kid's name on screen first," "never break the controls," "go big and be creative." You don't need to touch this file — it's already set up. But if Claude starts doing something weird, that's the file to look at.

### Slash commands

While Claude is running, you can type:

- `/baseline` — reset everything to the original game (all kid changes stay in git history)
- `/revert` — undo just the last kid's change
- `/play 5` — switch to how the game looked at version 5

## Running it live with two laptops

At the actual Maker Faire we run two laptops at once. While one kid plays their version on Laptop A, the next kid's change is being built on Laptop B. The laptops alternate, and each change stacks on top of the last one — by end of day the game is gloriously cursed.

Both laptops share changes through your GitHub fork:

- When building starts, Claude runs `git pull --ff-only` to grab any changes the other laptop pushed. The build screen is already up so there's no visible flicker.
- When the build finishes, the post-commit hook runs `git push` so the other laptop can pull next time.

To set this up:

1. Clone your fork onto both laptops and run the `git config core.hooksPath hooks` step on each.
2. Make sure both laptops can push to GitHub without a password prompt (set up SSH keys or a credential helper — GitHub has a guide for this).
3. Start `npm run dev` on each, plug each into a TV, and alternate kids between laptops.

If a `git pull --ff-only` fails mid-event, wait about 10 seconds for any in-flight push to land and retry. Don't switch to plain `git pull` — the `--ff-only` failure is a real signal that something got out of sync, and you want to know.

If you only have one laptop, ignore all of this. Everything still works; the `git push` in the post-commit hook will fail silently if there's nothing to push to, and that's fine.

## Reset the game back to the original

After kids have been piling on changes all day, the game gets pretty wild. To get back to a clean starting point:

In Claude, type `/baseline`.

Or from a terminal:

```bash
git checkout baseline -- src/ public/changelog.json index.html vite.config.js CLAUDE.md
git add -A
git commit -m "Reset to baseline"
```

The browser reloads and you're back to the beginning. All the kid changes are still in git history. Nothing is lost.

## Project layout

```
makerfaire2026/
├── src/
│   ├── main.js              # game loop — wires everything together
│   ├── game/                # all the game logic (enemies, weapons, items, etc.)
│   │   ├── config.js        # tunable values: speeds, sizes, colors
│   │   ├── player.js        # the player character
│   │   ├── enemies.js       # enemy types and AI
│   │   ├── weapons.js       # projectiles and firing
│   │   ├── rendering.js     # backgrounds and visual effects
│   │   └── ...              # more files added by kids over time
│   └── ui/
│       ├── hud.js           # hearts and timer
│       ├── changelog.js     # the side panel listing every kid's change
│       ├── buildStatus.js   # polls building.json to know when to show the build screen
│       └── buildScreen.js   # the "BUILDING..." overlay with the kid's name
├── hooks/
│   ├── pre-commit           # checks the game compiles before saving a change
│   └── post-commit          # clears the build overlay, pushes to GitHub
├── public/
│   ├── changelog.json       # every kid's change, in order
│   └── building.json        # whether a build is in progress (Claude writes this)
├── index.html               # the page
├── CLAUDE.md                # instructions for Claude — the rulebook
└── package.json
```

The `src/game/` folder will grow as kids add features. That's the point — by the end of an event it has files for donuts, sharks, wizard spells, whatever the kids wanted.

## Troubleshooting

**`npm: command not found`** — Node isn't installed. Go to [nodejs.org](https://nodejs.org), install it, then close and reopen your terminal.

**"This site can't be reached"** — `npm run dev` probably stopped. Check your terminal; if it's not running, start it again.

**The game shows a red error** — Something in the code has a typo or broken import. The error message usually names the file and line. If Claude just made a change, ask Claude to fix it.

**`git checkout baseline` says "pathspec 'baseline' did not match"** — Your fork doesn't have the baseline tag yet. Run `git fetch --tags` to pull it from the original repo, or run `git tag baseline` to tag the current state as your baseline.

**Xbox controller isn't working** — Press a button on the controller first. Browsers require a button press before they detect a gamepad.

**Claude put the wrong kid's name on screen** — The name comes from how you phrased the prompt. Make sure you type it as `[Name] says "[request]"`.

## Other commands

```bash
npm run dev      # run the game in development mode (what you want 99% of the time)
npm run build    # build a production version into dist/
npm run preview  # test the production build locally
```

## License

MIT. See [LICENSE](LICENSE). Use it, fork it, run it at your own school's maker faire, change everything.

If you make something cool, or your school runs a version of this, I'd love to hear about it. Ping me at [Piedmont Makers](https://www.piedmontmakers.org/).
