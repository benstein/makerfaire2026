# Maker Faire 2026 — Arena Survival Game

**Date:** 2026-03-30
**Status:** Approved

## Overview

A browser-based, top-down arena survival game designed for a live Maker Faire exhibit. Kids play 60-second rounds with an Xbox controller on a widescreen TV. Between rounds, kids suggest changes ("make enemies into dancing bananas," "add a freeze ray") and the game evolves throughout the day via Claude Code.

The game is a continuously evolving artifact. It starts as a minimal baseline and accumulates kid-driven modifications, each logged in a visible changelog panel.

## Game Concept

- **Genre:** Top-down arena survival
- **Objective:** Survive 60 seconds of enemy waves
- **Win condition:** Timer reaches 0 — victory screen
- **Lose condition:** Player health reaches 0 — game over screen
- **Session length:** ~1 minute per play
- **Display:** Widescreen TV (exact resolution TBD)

## Controls (Sacred — Never Modify)

Xbox controller via Gamepad API:

| Input | Action |
|-------|--------|
| Left stick | Movement |
| A button | Fire in facing direction |
| Start | Restart game |

Facing direction = last movement direction. Player retains facing when standing still.

Controls are NEVER changed unless explicitly requested with "modify controls."

## Layout

```
┌─────────────────────────────────┬────────────┐
│            ARENA (~75%)         │ CHANGELOG  │
│                                 │  (~25%)    │
│  [♥ ♥ ♥]              [47s]   │            │
│                                 │ #7 Henry   │
│         ■ (player)              │ Unicorn    │
│                                 │ enemies    │
│    □ (enemy)    □ (enemy)       │            │
│              · · (projectiles)  │ #6 Mia     │
│         □ (enemy)               │ Space bg   │
│                                 │            │
│     [PRESS START TO RESTART]    │ #5 Jake    │
│                                 │ Explosions │
└─────────────────────────────────┴────────────┘
```

- **Arena:** ~75% of screen width, HTML5 Canvas
- **Changelog panel:** ~25% right side, always visible, DOM-based (not canvas)
- **HUD:** 3 red hearts top-left, countdown timer top-right, rendered on canvas
- **Bottom hint:** "PRESS START TO RESTART" (subtle, monospace)
- All UI elements sized for TV readability from several feet away

## Player

- **Appearance:** White square (baseline)
- **Health:** 3 hearts
- **Invincibility frames:** ~1 second after taking a hit, player flashes during i-frames
- **Movement:** Smooth analog movement via left stick
- **Attack:** Fires small white projectile in facing direction on A press
- **Speed:** Tunable in config

## Enemies

- **Appearance:** Red squares (baseline)
- **Behavior:** Spawn at random points along arena edges, move toward player
- **Spawn rate:** Gradual ramp — slow at start, increasingly frequent as timer progresses
- **Collision:** Contact with player removes 1 heart (respecting i-frames)
- **Death:** Destroyed by projectile hit
- **Speed:** Tunable in config, slightly slower than player by default

## Weapons

- **Default:** Small white dot projectile
- **Direction:** Fires in player's facing direction
- **Lifetime:** Projectiles despawn after crossing the arena or hitting an enemy
- **Fire rate:** Tunable cooldown in config

## Game States

```
Title Screen → Playing → Victory / Game Over
     ↑                        │
     └────── Start button ────┘
```

- **Title screen:** Game name, "PRESS START" prompt
- **Playing:** Active game loop, timer counting down, enemies spawning
- **Victory:** "YOU SURVIVED!" message, prompt to restart
- **Game Over:** "GAME OVER" message, prompt to restart
- Start button returns to Title Screen from any state, which resets all game entities

## Sacred Systems (Never Break)

These must always function regardless of modifications:

1. **Player movement** — left stick always moves the player
2. **Collision detection** — AABB collision between all entities
3. **Game loop** — requestAnimationFrame loop always runs cleanly
4. **Timer** — 60-second countdown always completes
5. **Game state machine** — game always starts, runs, and ends cleanly
6. **Input system** — Gamepad API polling always works
7. **Restart** — Start button always restarts the game

If a kid's requested change would break any of these, adapt the idea to preserve them.

## Safe Change Zones

Everything else is fair game for kid-driven modifications:

- **Player appearance** — sprites, colors, size, trails, visual effects
- **Enemy types** — new enemies with custom AI, appearance, health, behaviors (splitting, shooting back, fleeing, bosses)
- **Weapon types** — new weapons (melee, AoE, multi-directional, homing, bouncing)
- **Visual effects** — particles, explosions, screen shake, background themes
- **Spawn logic** — rates, patterns, wave designs
- **Arena** — backgrounds, obstacles, shrinking bounds, environmental hazards
- **Game rules** — score, power-ups, healing, allies, alternate win conditions (as long as the game remains playable)
- **HUD/UI** — additional displays, score counters, new indicators
- **New systems** — pickups, allies, environmental effects, anything that can be added as a new file wired into the game loop

## Code Architecture

### File Structure

```
makerfaire2026/
  index.html              # Entry point: canvas + changelog panel container
  vite.config.js          # Minimal Vite config
  package.json
  src/
    main.js               # SACRED — game loop, requestAnimationFrame, state transitions
    game/
      player.js           # Player entity — movement, rendering, health, i-frames
      enemies.js          # Enemy management — types, spawning, AI, death handling
      weapons.js          # Weapon/projectile management — types, firing, movement
      collision.js        # SACRED — AABB collision detection
      input.js            # SACRED — Gamepad API polling, button state
      gameState.js        # SACRED — state machine, timer, win/lose conditions
      rendering.js        # Canvas rendering — background, camera effects (shake, etc.)
      config.js           # All tunable values — speeds, sizes, colors, rates
    ui/
      hud.js              # Hearts, timer, on-canvas HUD
      changelog.js        # Reads changelog.json, renders DOM changelog panel
  public/
    changelog.json        # Version history, appended with each modification
    assets/               # Sprites and images when needed
  CLAUDE.md               # Instructions for Claude Code sessions (see below)
```

### Design Principles

- **Flat and readable.** No framework, no abstractions beyond ES modules. Each file manages one concern.
- **Entities own their behavior.** Player, enemies, and weapons each define their own `update()` and `draw()` logic. The game loop calls them generically.
- **New systems = new files.** Adding pickups, allies, obstacles, or effects means creating a new file (e.g., `src/game/pickups.js`) and wiring it into `main.js`'s update/draw loop. This is a simple, known pattern.
- **Config for simple tweaks.** Speeds, colors, sizes, spawn rates, and timing values live in `config.js`. Many kid requests ("make enemies faster," "spawn 100 enemies") are just config changes.
- **DOM for changelog, Canvas for game.** The changelog panel is standard HTML/CSS, independent from the game canvas. This separation means visual changes to the game never affect the changelog and vice versa.

## Changelog System

### Display

Right-side panel showing the last ~10 changes:

```
#7 — Henry: Added unicorn enemies
#6 — Mia: Made background space
#5 — Jake: Added explosions
```

Each entry has a colored accent bar for visual variety.

### Data

`public/changelog.json`:

```json
[
  { "version": 1, "name": "Baseline", "description": "Initial game" }
]
```

Each modification appends a new entry with incremented version, kid's name, and one-line description.

### Update Protocol

Every time a change is made:
1. Edit the relevant source file(s)
2. Append to `changelog.json` with kid's name and description
3. Git commit with descriptive message
4. Vite HMR auto-reloads the browser

## Dev Server

- **Vite** with hot module replacement (HMR)
- Changes appear in the browser within ~1-2 seconds of saving
- No manual refresh needed
- ES modules handled natively
- Start: `npm run dev`

## Reset System

- Git tag `baseline` marks the initial working game
- To reset: restore all source files to the baseline tag, reset `changelog.json` to the initial entry, reload
- Documented in CLAUDE.md so any Claude session can execute it on command

## CLAUDE.md (Live Operation Guide)

The project root contains a `CLAUDE.md` that gives every Claude Code session full context. It includes:

1. **What this is** — live Maker Faire game, kids suggest changes, you implement them fast
2. **Sacred systems** — explicit list of files/systems that must never break
3. **Change protocol** — step-by-step process for every modification
4. **File map** — one-liner per file explaining what it does
5. **Common recipes** — patterns for frequent change types (new enemy, new weapon, visual change, etc.)
6. **Interpretation guide** — prefer visible/dramatic changes, go big, never say no
7. **Safety rails** — if a change would break the game, implement a safe version instead
8. **Reset procedure** — exact commands to return to baseline

## Design Philosophy

- **Fun over correctness.** If it's fun, it ships.
- **Visibility over subtlety.** Kids should instantly say "whoa, that's different."
- **Big, obvious changes.** Prefer dramatic visual impact.
- **Never crash.** Adapt risky ideas rather than refusing them.
- **Immediate delight.** No waiting, no confusion, no loading screens.
- **Creative interpretation.** "Add unicorns" means sparkly unicorn enemies with visual flair, not a renamed red square.

## Rendering

- **HTML5 Canvas** for the game arena
- **DOM** for the changelog panel
- Must run smoothly in Chrome on Mac
- No heavy dependencies — vanilla JS with Vite as the only build tool
- Baseline visuals are simple shapes; sprites can be loaded dynamically when available
- Fallback: if a sprite fails to load, render a stylized shape instead

## Open Items

- **TV resolution:** Exact dimensions TBD — Ben will provide. Designing for widescreen aspect ratio.
- **Input method for requests:** TBD whether Ben types kid requests or kids interact directly.
