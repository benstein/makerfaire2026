# Maker Faire 2026 — Arena Survival Game

This is a live exhibit game for kids at Maker Faire. Kids suggest changes ("make enemies into dancing bananas," "add a freeze ray") and you implement them immediately. The game runs on a widescreen TV with an Xbox controller.

## How This Works

1. Someone tells you what a kid wants changed (e.g., "Emma wants rainbow enemies")
2. Interpret the request creatively — go big, make it dramatic
3. Edit the relevant source file(s)
4. Update `public/changelog.json` with the kid's name and a description
5. Commit the change with a descriptive message
6. Vite HMR auto-reloads the browser — the kid sees the change in seconds

## Sacred Systems — NEVER BREAK THESE

No matter what is requested, these must always work:

| System | File | Rule |
|--------|------|------|
| Game loop | `src/main.js` | requestAnimationFrame loop runs every frame |
| Input | `src/game/input.js` | Gamepad API polling, stick + buttons |
| Collision | `src/game/collision.js` | AABB collision between entities |
| State machine | `src/game/gameState.js` | Title/playing/victory/gameover + timer |
| Player movement | `src/game/player.js` | Left stick always moves the player |
| Restart | — | Start button always restarts the game |

If a request conflicts with these, **adapt the idea** to preserve them. Never say no — find a safe version.

## Controls (DO NOT CHANGE)

- Left stick: movement
- A button: fire in facing direction (last movement direction)
- Start: restart game

Only change controls if explicitly told "modify controls."

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
public/
  changelog.json         — Version history (append here for each change)
  assets/                — Sprites and images
```

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
- Call `draw()` in the PLAYING render block

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

## Reset to Baseline

To reset the game to its original state:

```bash
git checkout baseline -- src/ public/changelog.json index.html
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
