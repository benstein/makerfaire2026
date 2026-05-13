# Arena Survival — A Live Maker Faire Game

Hi! This is the source code for a game we're running as a live exhibit at the [Piedmont School Maker Faire](https://www.piedmontmakers.org/school-maker-faire). Here's how it works:

A kid walks up to a TV running this game. They tell us what they want to change ("make the player a dragon", "add a freeze ray", "the enemies should be dancing bananas"). We tell Claude Code, and Claude Code edits the game **right there**, in front of them. The screen goes into "BUILD MODE" with the kid's name on it while the change happens. A few seconds later, the game reloads and they get to play their idea. Then the next kid walks up.

It's the most fun thing.

## What you need to run this

You need three things on your computer:

1. **Node.js** (version 18 or newer is fine — I'm using v24, anything modern works). Download it from [nodejs.org](https://nodejs.org).
2. **Git**. If you have a Mac, open Terminal and type `git --version`. If it asks you to install something, say yes. Otherwise grab it from [git-scm.com](https://git-scm.com).
3. **Claude Code**. This is the magic part. It's the AI tool that actually edits the game when kids ask for changes. Get it from [claude.com/claude-code](https://claude.com/claude-code). You'll need an Anthropic account.

If you just want to **play** the game, you only need Node and Git. You only need Claude Code if you want to do the live editing thing.

## Get the code

Open a terminal (on Mac that's the Terminal app, on Windows use Git Bash or PowerShell). Type these commands one at a time. Don't worry, you can't break anything yet.

```bash
git clone https://github.com/YOUR-FORK-HERE/makerfaire2026.git
cd makerfaire2026
npm install
git config core.hooksPath hooks
```

The `npm install` command downloads all the libraries the game needs. It takes about 10 seconds. You'll see a bunch of stuff scroll by. That's normal. If it finishes without saying "ERROR" in red, you're good.

The `git config core.hooksPath hooks` command points Git at the project's tracked hook scripts (in the `hooks/` folder). These do two things: the **pre-commit** hook runs `vite build` to make sure your changes actually compile (no broken commits reach the TV), and the **post-commit** hook clears the build-status overlay and pushes to the remote. You only have to run this once per clone.

## Run the game

Still in the terminal, in the `makerfaire2026` folder:

```bash
npm run dev
```

You should see something like:

```
  VITE v8.0.3  ready in 200 ms
  ➜  Local:   http://localhost:5173/
```

Open that URL in a web browser (Chrome, Firefox, Safari, whatever). You should see the game!

**Controls:**
- **Move:** WASD or arrow keys (or left stick on an Xbox controller)
- **Fire:** Spacebar (or A button)
- **Restart:** Enter (or Start button)

If you plug in an Xbox controller, the game uses that automatically. If you don't have one, the keyboard works fine.

## Change the game

Two ways to do this.

### Way 1: Edit the code yourself

Open the `src/` folder in any code editor (VS Code is free and great). The game lives in:

- `src/main.js` — the main loop. The brain of everything.
- `src/game/config.js` — easy stuff to change. Player speed, enemy color, sizes. Start here!
- `src/game/player.js` — how the player works.
- `src/game/enemies.js` — how the enemies work.
- `src/game/weapons.js` — bullets and firing.

Try opening `src/game/config.js` and changing `enemySpeed: 1.5` to `enemySpeed: 5`. Save the file. Look at the browser. The enemies are now zooming. The browser auto-reloads when you save. It's that fast.

You don't have to be a JavaScript expert. Try things. If you break it, the browser will show you a red error message and you can undo your change.

### Way 2: Ask Claude Code (this is the live exhibit version)

If you have Claude Code installed, open a terminal in this folder and run:

```bash
claude
```

Then just tell it what you want. Like, in plain English:

> "Make the player rainbow colored and twice as big"

> "Add a boss enemy that takes 10 hits to kill"

> "Make the bullets bounce off the walls"

Claude Code will read the game files, figure out what to change, and edit them for you. The game reloads automatically. This is what we're doing live at the Maker Faire — kids tell us their idea, we type it into Claude, and a few seconds later their change is on the TV.

There's a `CLAUDE.md` file in the project that tells Claude Code the rules of the game (don't break the controls, always commit changes, use the build screen, etc). If Claude does something weird, that file is where you'd tweak its behavior.

## Running it live (two laptops)

At the actual Maker Faire we run two laptops in parallel. While one kid plays the version that was just built for them on Laptop A, the next kid in line is having their idea built on Laptop B. The two laptops alternate, and each kid's change stacks on top of the previous kid's so the game gets gloriously cursed over the day.

This works because both laptops share their commits through a normal git remote:

- The Claude Code workflow on the **building** laptop runs `git pull --ff-only` right after writing the build-status overlay. The build screen hides the screen flicker while the other laptop's recent work arrives.
- The post-commit hook on the **building** laptop runs `git push` after the build finishes, so the other laptop will pull this kid's change on its next turn.

To set this up:

1. Clone the repo onto both laptops (the `git config core.hooksPath hooks` step gives both the right pre-commit and post-commit behavior).
2. Make sure both can push and pull from the same remote without needing a password prompt mid-event (set up SSH keys or a credential helper).
3. Start `npm run dev` on each, plug each into its TV, and you're ready.

If a `git pull --ff-only` fails during the event, that means the two laptops have somehow diverged — wait ~10 seconds for any in-flight push to land and retry. Don't reach for `git pull --rebase` or a regular `git pull`: the `--ff-only` failure is the signal that the alternation broke, and you want to know rather than have git silently merge a tangle.

If you only have one laptop, none of this is necessary; the workflow still works, and `git push` in the post-commit hook is harmless (it'll fail if there's no remote, but the commit itself succeeded).

## Reset the game back to normal

After kids have been mashing changes into the game for a while, it gets pretty wild. To get back to the boring original version (a white square shooting red squares), there's a `baseline` git tag. From a terminal in the project folder:

```bash
git checkout baseline -- src/ public/changelog.json index.html vite.config.js CLAUDE.md
git add -A
git commit -m "Reset to baseline"
```

The browser reloads automatically and you're back to square one (literally). All the kid changes are still in git history, just not active. Nothing is lost.

If you're using Claude Code, you can also just say `/baseline` and it'll do all of that for you.

## Other useful commands

```bash
npm run dev      # run the game in development mode (what you usually want)
npm run build    # build a production version into dist/
npm run preview  # serve the production build locally to test it
```

## Project layout

```
makerfaire2026/
├── src/
│   ├── main.js              # game loop
│   ├── game/
│   │   ├── config.js        # all the tunable values
│   │   ├── input.js         # gamepad + keyboard
│   │   ├── gameState.js     # title/playing/victory/gameover
│   │   ├── collision.js     # AABB hit detection
│   │   ├── player.js        # the player square
│   │   ├── enemies.js       # the enemy squares
│   │   ├── weapons.js       # bullets
│   │   └── rendering.js     # background + screens
│   └── ui/
│       ├── hud.js           # hearts + timer
│       ├── changelog.js     # the side panel of changes
│       ├── buildStatus.js   # build mode polling
│       ├── buildScreen.js   # the "BUILDING..." overlay
│       └── errorBadge.js    # "glitchy" warning if the game throws at runtime
├── hooks/
│   ├── pre-commit           # runs `vite build` before every commit
│   └── post-commit          # clears the build overlay, pushes to remote
├── public/
│   ├── changelog.json       # list of every kid's change
│   ├── building.json        # whether we're currently building
│   └── favicon.ico
├── index.html               # the page itself
├── CLAUDE.md                # instructions for Claude Code
└── package.json
```

## Troubleshooting

**`npm: command not found`** — Node isn't installed. Go to [nodejs.org](https://nodejs.org) and install it. Close and reopen your terminal afterwards.

**The browser says "This site can't be reached"** — Make sure `npm run dev` is still running in your terminal. If you closed the terminal, the game stopped. Run it again.

**The game is showing an error message** — You probably have a typo in a file you edited. Look at the error in the browser, it usually tells you which file and which line. Undo your last change (Ctrl+Z / Cmd+Z) and try again.

**`git checkout baseline` says "error: pathspec 'baseline' did not match"** — There's no baseline tag in your fork. You can make one from the current state with `git tag baseline`.

**The Xbox controller isn't working** — Some browsers need you to press a button on the controller first before they detect it. Hit the A button a few times.

## License

MIT. See [LICENSE](LICENSE). Use it, fork it, run it at your own school's maker faire, change everything. The whole point is for kids to mess with it.

## Have fun

If you make something cool, or your school runs a version of this, I'd love to hear about it. Ping me on the [Piedmont Makers](https://www.piedmontmakers.org/) site.

Now go change something.
