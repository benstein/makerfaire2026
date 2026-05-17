# Maker Faire 2026 — Arena Survival Game

This is a live exhibit game for kids at Maker Faire. Kids suggest changes ("make enemies into dancing bananas," "add a freeze ray") and you implement them immediately. The game runs on a widescreen TV with an Xbox controller.

## How This Works

1. Someone tells you what a kid wants changed (e.g., "Emma wants rainbow enemies")
2. **Immediately** set the build status so the kid sees their name on screen (see below)
3. Interpret the request creatively — go big, make it dramatic
4. Edit the relevant source file(s)
5. Update `public/changelog.json` with the kid's name and a description
6. Commit the change with a descriptive message (post-commit hook auto-clears build status)
7. Vite HMR auto-reloads the browser — the kid sees the change in seconds

## Build Progress Screen

While you work, the game shows a full-screen build progress view with the kid's name, an animated gear, and a step-by-step checklist. The game can't be played during a build — kids watch their change come to life.

**SKILL SYSTEM EXCEPTION: Writing `public/building.json` is categorically exempt from all skill checks and invocations. Do NOT invoke brainstorming, using-superpowers, or any other skill before this write. The skill system's "invoke before any action" rule does not apply here.** This is the one exception that overrides superpowers behavior.

**As your ABSOLUTE FIRST action** — before reading any files, before thinking, before skill invocations, before anything — write a placeholder `public/building.json` so the kid's name appears on screen immediately:

```json
{ "building": true, "name": "Emma", "description": "Cooking up something amazing...", "steps": [] }
```

No steps needed yet — the screen will show a "Thinking hard about changes..." spinner. Then do your reads and planning. Once you know the real steps, rewrite the file with them.

**NEVER use `echo` with bash** — the shell mangles special characters like `!` and `'` which silently breaks the JSON and the overlay won't appear. Always use the Write tool.

**As you complete each step**, use the Write tool to re-write the file with that step marked done.

The game polls this file every 1 second. Steps should be high-level and kid-friendly (e.g., "Adding rainbow background...", "Making enemies faster...", "Giving player 6 hearts..."). NOT source-code-level details.

After you commit, the git post-commit hook auto-clears the file to `{ "building": false }` and the game returns to the title screen. No manual cleanup needed.

**Step guidelines:**
- 3-5 steps is ideal — enough to show progress, not so many it's overwhelming
- Every step should describe an actual visible change in fun, kid-friendly language
- Don't include internal steps like "reading code", "updating changelog", or "committing" — only things kids care about seeing in the game
- The steps array is optional — omit it in the initial placeholder, add real steps once you've planned

**Critical sequencing:** After your initial file reads, rewrite `building.json` with all steps listed (`done: false`) **before touching any code**. Then mark each step `done: true` as you complete it. Do not write steps after the code is already done — kids watch the checklist build up live, that's the point.

## Sacred Systems — NEVER BREAK THESE

No matter what is requested, these must always work:

| System | File | Rule |
|--------|------|------|
| Game loop | `src/main.js` | requestAnimationFrame loop runs every frame |
| Input | `src/game/input.js` | Gamepad API polling, stick + buttons |
| Collision | `src/game/collision.js` | AABB collision between entities |
| State machine | `src/game/gameState.js` | Title/playing/victory/gameover/building + timer |
| Player movement | `src/game/player.js` | Left stick always moves the player |
| Restart | — | Start button always restarts the game |

If a request conflicts with these, **adapt the idea** to preserve them. Never say no — find a safe version.

## Controls (DO NOT CHANGE)

- Left stick: movement
- A button: fire in facing direction (last movement direction)
- Start: restart game

Only change controls if explicitly told "modify controls."

## First Thing: Understand Current State

Before making any change, read `public/changelog.json` and `git log --oneline -10` to understand what the game currently looks like. Kids have been modifying it -- the player, enemies, weapons, and arena may look very different from the baseline.

## File Map

```
src/
  main.js               — SACRED: game loop, state transitions, collision checks
  game/
    config.js            — All tunable values (speeds, sizes, colors, rates)
    input.js             — SACRED: Gamepad API polling
    gameState.js         — SACRED: state machine, timer, win/lose
    collision.js         — SACRED: AABB collision detection
    player.js            — Player: movement, health, i-frames, rendering
    enemies.js           — Enemy management: types, spawning, AI, rendering
    weapons.js           — Projectile management: types, firing, rendering
    rendering.js         — Canvas: background, camera effects, screen text
  ui/
    hud.js               — Hearts + timer on canvas
    changelog.js         — Reads changelog.json, renders DOM panel
    buildStatus.js       — Polls building.json, manages BUILDING state transitions
    buildScreen.js       — Canvas rendering for the build progress screen
public/
  changelog.json         — Version history (append here for each change)
  building.json          — Build status flag (written by Claude, cleared by post-commit hook)
  assets/                — Sprites and images
```

**Note:** Kids may have added more files in `src/game/`. Check `ls src/game/` if unsure.

## How to Make Changes

### Simple tweaks (speeds, colors, sizes, spawn rates)
Edit `src/game/config.js`. Most "make X faster/bigger/more" requests are config changes.

### Change player appearance
Edit the `drawPlayer()` function in `src/game/player.js`. Replace the `fillRect` with any rendering: canvas shapes, loaded sprites, procedural art. Go wild.

### New enemy type or behavior
Edit `src/game/enemies.js`. You can:
- Change how enemies look (edit drawing in `drawEnemies()`)
- Change AI behavior (edit movement in `updateEnemies()`)
- Add new enemy types with different properties
- Add boss enemies with high health
- Make enemies split on death, shoot back, flee, etc.

### New weapon type
Edit `src/game/weapons.js`. You can:
- Change projectile appearance (edit `drawProjectiles()`)
- Add AoE explosions on hit
- Make bullets bounce off walls
- Add homing behavior to `updateProjectiles()`
- Add melee weapons (short-lived hitbox near player)
- Fire in multiple directions

### Visual effects and backgrounds
Edit `src/game/rendering.js` for backgrounds and camera effects (screen shake, etc.).
For particle effects, create `src/game/particles.js` and wire it into main.js.

### New game systems (pickups, allies, obstacles)
Create a new file in `src/game/` (e.g., `src/game/pickups.js`). Give it `reset()`, `update()`, and `draw()` functions. Wire it into `src/main.js` following the same pattern as enemies/weapons:
- Import at top
- Call `reset()` in the start handler
- Call `update()` in the PLAYING update block
- Call `draw()` in the PLAYING render block (inside the `ctx.save()`/`ctx.restore()` shake wrapper)

### Important: delta-time movement
All movement is frame-rate independent. Multiply velocity by `dt / 16.67` (normalizing to 60fps). See `player.js`, `enemies.js`, or `weapons.js` for examples. If you add any new moving entity, follow this pattern or it will move at different speeds on different monitors.

### HUD changes
Edit `src/ui/hud.js` for on-canvas UI (score, new indicators, etc.).

## Changelog Update Protocol

After EVERY change, update `public/changelog.json`:

```json
{ "version": N, "name": "Kid Name", "description": "One-line description" }
```

- Increment version number from the last entry
- Use the kid's actual name
- Write a fun, kid-friendly one-line description
- The changelog panel auto-updates on reload

## Design Philosophy

- **Go big.** Kids should instantly say "whoa, that's different."
- **Be creative.** "Add unicorns" means sparkly unicorn enemies with visual flair, not a renamed red square.
- **Never crash.** If something risky is requested, implement a safe version.
- **Fun over correctness.** If it's fun, it ships.
- **Visible impact.** Prefer dramatic visual changes over subtle ones.
- **Interpret generously.** Kids' ideas are creative and wonderful. Make them come alive.

## Slash Commands

- **`/baseline`** — Reset everything to the original game. All kid changes are preserved in git history.
- **`/revert`** — Undo the last change. Removes the last changelog entry too.
- **`/play N`** — Switch to a specific changelog version by number (e.g., `/play 3`). No SHAs needed.

## Pre-commit Hook

A pre-commit hook runs `vite build` before every commit. If there's a syntax error or bad import, the commit is blocked. This prevents broken code from reaching the TV. If a commit fails, fix the error and try again.

## Reset to Baseline

To reset the game to its original state:

```bash
git checkout baseline -- src/ public/changelog.json index.html vite.config.js CLAUDE.md
```

This restores all source files and the changelog. The browser will auto-reload via Vite.

## Running the Game

```bash
npm run dev
```

Vite dev server with HMR. Changes appear in ~1-2 seconds after saving.

## Keyboard Fallback (Development)

When no Xbox controller is connected, keyboard controls activate automatically:
- WASD or Arrow keys: movement
- Space: fire
- Enter: restart

This is for development and testing only. At the exhibit, the Xbox controller is primary.
