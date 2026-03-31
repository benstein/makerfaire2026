# Arena Survival Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully playable browser-based arena survival game with Xbox controller support, changelog panel, and modular architecture for live kid-driven modifications at Maker Faire 2026.

**Architecture:** Vanilla JS with ES modules, HTML5 Canvas for the game arena, DOM for the changelog panel. Vite dev server for HMR. Flat modular file structure where each file owns one concern. Entities define their own `update()` and `draw()` methods; the game loop iterates generically.

**Tech Stack:** Vanilla JavaScript (ES modules), HTML5 Canvas, Vite, Gamepad API

**Spec:** `docs/superpowers/specs/2026-03-30-arena-game-design.md`

---

## File Structure

```
makerfaire2026/
  index.html                  # Entry point: canvas element + changelog panel container
  vite.config.js              # Minimal Vite config
  package.json                # Dependencies (vite only) and scripts
  src/
    main.js                   # Game loop (requestAnimationFrame), boot, state transitions
    game/
      config.js               # All tunable constants (speeds, sizes, colors, timings)
      input.js                # Gamepad API polling, button/stick state
      gameState.js            # State machine (title/playing/victory/gameover), timer
      collision.js            # AABB collision detection
      player.js               # Player entity: position, movement, health, i-frames, draw
      enemies.js              # Enemy list management, spawning, AI, types, draw
      weapons.js              # Projectile list management, firing, movement, draw
      rendering.js            # Canvas setup, background, camera effects (shake)
    ui/
      hud.js                  # Hearts + timer drawn on canvas
      changelog.js            # Reads changelog.json, renders DOM panel
  public/
    changelog.json            # Version history array
    assets/                   # (empty initially, sprites go here later)
  CLAUDE.md                   # Live operation guide for future Claude sessions
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `index.html`
- Create: `src/main.js` (stub)
- Create: `src/game/config.js`
- Create: `public/changelog.json`

- [ ] **Step 1: Initialize package.json**

```json
{
  "name": "makerfaire2026",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

- [ ] **Step 2: Install Vite**

Run: `npm install --save-dev vite`
Expected: `node_modules/` created, `vite` added to devDependencies

- [ ] **Step 3: Create vite.config.js**

```js
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    open: true
  }
});
```

- [ ] **Step 4: Create index.html**

The entry point. Canvas on the left (~75%), changelog panel on the right (~25%). Flexbox layout, no scrolling, fills viewport.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Maker Faire 2026</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0a0a1a; }
    #game-container {
      display: flex;
      width: 100vw;
      height: 100vh;
    }
    #game-canvas {
      flex: 3;
      display: block;
      background: #1a1a2e;
    }
    #changelog-panel {
      flex: 1;
      background: #0f0f23;
      padding: 20px;
      overflow-y: auto;
      font-family: 'Courier New', monospace;
      color: #ccc;
    }
    #changelog-panel h2 {
      color: #f1c40f;
      font-size: 18px;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 16px;
    }
    .changelog-entry {
      border-left: 3px solid #555;
      padding-left: 10px;
      margin-bottom: 12px;
      font-size: 14px;
      line-height: 1.5;
    }
    .changelog-entry .version { color: #f1c40f; font-weight: bold; }
    .changelog-entry .name { color: #888; }
    .changelog-entry .desc { color: #ccc; }
  </style>
</head>
<body>
  <div id="game-container">
    <canvas id="game-canvas"></canvas>
    <div id="changelog-panel">
      <h2>Changelog</h2>
      <div id="changelog-entries"></div>
    </div>
  </div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create config.js with all tunable values**

```js
// src/game/config.js
// All tunable game values live here.
// Many kid requests ("make enemies faster") are just config changes.

export const CONFIG = {
  // Player
  playerSpeed: 4,
  playerSize: 28,
  playerColor: '#ffffff',
  playerMaxHealth: 3,
  invincibilityDuration: 1000, // ms

  // Enemies
  enemySpeed: 2,
  enemySize: 22,
  enemyColor: '#e74c3c',
  enemySpawnIntervalStart: 2000, // ms at game start
  enemySpawnIntervalEnd: 400,    // ms at game end (ramps down)

  // Weapons
  projectileSpeed: 7,
  projectileSize: 6,
  projectileColor: '#ffffff',
  fireRateCooldown: 250, // ms between shots

  // Game
  gameDuration: 60, // seconds
  arenaBackground: '#1a1a2e',

  // HUD
  heartColor: '#e74c3c',
  timerColor: '#f1c40f',
  hudFontSize: 24,
};
```

- [ ] **Step 6: Create stub main.js**

```js
// src/main.js
import { CONFIG } from './game/config.js';

console.log('Maker Faire 2026 Arena Game loaded', CONFIG);
```

- [ ] **Step 7: Create initial changelog.json**

```json
[
  { "version": 1, "name": "Baseline", "description": "Initial game" }
]
```

- [ ] **Step 8: Add node_modules to .gitignore and verify dev server starts**

Append `node_modules/` to `.gitignore`.

Run: `npm run dev`
Expected: Vite starts, opens browser, shows dark page with "Changelog" panel on right, console logs "Maker Faire 2026 Arena Game loaded"

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vite.config.js index.html src/main.js src/game/config.js public/changelog.json .gitignore
git commit -m "Scaffold project with Vite, index.html layout, config, and changelog.json"
```

---

### Task 2: Input System (Sacred)

**Files:**
- Create: `src/game/input.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create input.js — Gamepad API polling**

This module polls the Gamepad API each frame and exposes clean state. It does NOT handle keyboard input — Xbox controller only.

```js
// src/game/input.js
// SACRED — do not modify unless explicitly told "modify controls"

const state = {
  // Left stick (-1 to 1 on each axis)
  stickX: 0,
  stickY: 0,

  // Buttons (true = pressed this frame)
  fire: false,
  start: false,

  // Raw held state (for continuous input)
  fireHeld: false,
  startHeld: false,
};

// Track previous frame's button state for edge detection
let prevFire = false;
let prevStart = false;

const DEADZONE = 0.2;

export function pollInput() {
  const gamepads = navigator.getGamepads();
  const gp = gamepads[0];

  if (!gp) {
    state.stickX = 0;
    state.stickY = 0;
    state.fire = false;
    state.start = false;
    state.fireHeld = false;
    state.startHeld = false;
    return state;
  }

  // Left stick (axes 0 and 1)
  const rawX = gp.axes[0];
  const rawY = gp.axes[1];
  state.stickX = Math.abs(rawX) > DEADZONE ? rawX : 0;
  state.stickY = Math.abs(rawY) > DEADZONE ? rawY : 0;

  // A button (index 0) — fire
  const fireNow = gp.buttons[0]?.pressed ?? false;
  state.fire = fireNow && !prevFire; // rising edge
  state.fireHeld = fireNow;
  prevFire = fireNow;

  // Start button (index 9) — restart
  const startNow = gp.buttons[9]?.pressed ?? false;
  state.start = startNow && !prevStart; // rising edge
  state.startHeld = startNow;
  prevStart = startNow;

  return state;
}

export function getInput() {
  return state;
}
```

- [ ] **Step 2: Wire input polling into main.js for verification**

```js
// src/main.js
import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function gameLoop() {
  pollInput();
  const input = getInput();

  // Debug: draw input state
  ctx.fillStyle = CONFIG.arenaBackground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText(`Stick: ${input.stickX.toFixed(2)}, ${input.stickY.toFixed(2)}`, 20, 30);
  ctx.fillText(`Fire: ${input.fire} | Start: ${input.start}`, 20, 55);

  requestAnimationFrame(gameLoop);
}

gameLoop();
```

- [ ] **Step 3: Test with controller**

Run: `npm run dev`
Connect Xbox controller. Move left stick — values should update on screen. Press A and Start — should flash true on press.

- [ ] **Step 4: Commit**

```bash
git add src/game/input.js src/main.js
git commit -m "Add Gamepad API input system with stick and button polling"
```

---

### Task 3: Game State Machine (Sacred)

**Files:**
- Create: `src/game/gameState.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create gameState.js — state machine and timer**

```js
// src/game/gameState.js
// SACRED — state machine and timer must always work

import { CONFIG } from './config.js';

export const STATES = {
  TITLE: 'title',
  PLAYING: 'playing',
  VICTORY: 'victory',
  GAMEOVER: 'gameover',
};

let currentState = STATES.TITLE;
let timeRemaining = CONFIG.gameDuration;
let elapsedMs = 0;

export function getState() {
  return currentState;
}

export function getTimeRemaining() {
  return Math.ceil(timeRemaining);
}

export function getElapsedMs() {
  return elapsedMs;
}

export function getGameProgress() {
  // 0 at start, 1 at end — used for spawn rate ramping
  return Math.min(1, elapsedMs / (CONFIG.gameDuration * 1000));
}

export function startGame() {
  currentState = STATES.PLAYING;
  timeRemaining = CONFIG.gameDuration;
  elapsedMs = 0;
}

export function endGame(won) {
  currentState = won ? STATES.VICTORY : STATES.GAMEOVER;
}

export function goToTitle() {
  currentState = STATES.TITLE;
  timeRemaining = CONFIG.gameDuration;
  elapsedMs = 0;
}

export function updateTimer(dt) {
  if (currentState !== STATES.PLAYING) return;

  elapsedMs += dt;
  timeRemaining -= dt / 1000;

  if (timeRemaining <= 0) {
    timeRemaining = 0;
    endGame(true);
  }
}
```

- [ ] **Step 2: Update main.js to use state machine**

Replace the debug rendering with a state-aware loop:

```js
// src/main.js
import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';
import { STATES, getState, getTimeRemaining, startGame, goToTitle, updateTimer } from './game/gameState.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let lastTime = performance.now();

function gameLoop(now) {
  const dt = now - lastTime;
  lastTime = now;

  pollInput();
  const input = getInput();

  const state = getState();

  // Handle Start button from any state
  if (input.start) {
    if (state === STATES.TITLE) {
      startGame();
    } else {
      goToTitle();
    }
  }

  // Update
  if (state === STATES.PLAYING) {
    updateTimer(dt);
  }

  // Render
  ctx.fillStyle = CONFIG.arenaBackground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#fff';
  ctx.font = '32px monospace';
  ctx.textAlign = 'center';

  if (state === STATES.TITLE) {
    ctx.fillText('ARENA SURVIVAL', canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = '18px monospace';
    ctx.fillText('PRESS START', canvas.width / 2, canvas.height / 2 + 20);
  } else if (state === STATES.PLAYING) {
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`TIME: ${getTimeRemaining()}s`, 20, 30);
  } else if (state === STATES.VICTORY) {
    ctx.fillStyle = '#2ecc71';
    ctx.fillText('YOU SURVIVED!', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText('PRESS START TO PLAY AGAIN', canvas.width / 2, canvas.height / 2 + 20);
  } else if (state === STATES.GAMEOVER) {
    ctx.fillStyle = '#e74c3c';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText('PRESS START TO TRY AGAIN', canvas.width / 2, canvas.height / 2 + 20);
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

- [ ] **Step 3: Test state transitions**

Run: `npm run dev`
Expected: Title screen shows "ARENA SURVIVAL" + "PRESS START". Press Start → timer counts down from 60. When it hits 0 → "YOU SURVIVED!" Press Start again → back to title.

- [ ] **Step 4: Commit**

```bash
git add src/game/gameState.js src/main.js
git commit -m "Add game state machine with title, playing, victory, and gameover states"
```

---

### Task 4: Player Movement and Rendering

**Files:**
- Create: `src/game/player.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create player.js**

```js
// src/game/player.js

import { CONFIG } from './config.js';

let x, y;
let facingX = 0;
let facingY = -1; // default facing up
let health;
let invincibleUntil = 0;

export function resetPlayer(arenaWidth, arenaHeight) {
  x = arenaWidth / 2;
  y = arenaHeight / 2;
  facingX = 0;
  facingY = -1;
  health = CONFIG.playerMaxHealth;
  invincibleUntil = 0;
}

export function updatePlayer(input, arenaWidth, arenaHeight, now) {
  // Movement
  const dx = input.stickX * CONFIG.playerSpeed;
  const dy = input.stickY * CONFIG.playerSpeed;

  x += dx;
  y += dy;

  // Update facing if moving
  if (Math.abs(input.stickX) > 0 || Math.abs(input.stickY) > 0) {
    const mag = Math.sqrt(input.stickX * input.stickX + input.stickY * input.stickY);
    facingX = input.stickX / mag;
    facingY = input.stickY / mag;
  }

  // Clamp to arena bounds
  const half = CONFIG.playerSize / 2;
  x = Math.max(half, Math.min(arenaWidth - half, x));
  y = Math.max(half, Math.min(arenaHeight - half, y));
}

export function drawPlayer(ctx, now) {
  // Flash during invincibility
  if (now < invincibleUntil) {
    if (Math.floor(now / 80) % 2 === 0) return; // skip draw = flash
  }

  const half = CONFIG.playerSize / 2;
  ctx.fillStyle = CONFIG.playerColor;
  ctx.fillRect(x - half, y - half, CONFIG.playerSize, CONFIG.playerSize);
}

export function getPlayerPos() {
  return { x, y };
}

export function getPlayerFacing() {
  return { x: facingX, y: facingY };
}

export function getPlayerHealth() {
  return health;
}

export function getPlayerBounds() {
  const half = CONFIG.playerSize / 2;
  return { x: x - half, y: y - half, w: CONFIG.playerSize, h: CONFIG.playerSize };
}

export function isPlayerInvincible(now) {
  return now < invincibleUntil;
}

export function damagePlayer(now) {
  if (now < invincibleUntil) return false;
  health -= 1;
  invincibleUntil = now + CONFIG.invincibilityDuration;
  return true; // damage was applied
}
```

- [ ] **Step 2: Wire player into main.js**

Add player imports and calls. In `startGame`, reset the player. In the `PLAYING` update, update the player. In `PLAYING` render, draw the player.

Update the relevant sections in `src/main.js`:

Add imports at top:
```js
import { resetPlayer, updatePlayer, drawPlayer, getPlayerHealth } from './game/player.js';
```

In the Start button handler, reset player when starting a game:
```js
if (input.start) {
  if (state === STATES.TITLE) {
    startGame();
    resetPlayer(canvas.width, canvas.height);
  } else {
    goToTitle();
  }
}
```

In the PLAYING update section, add:
```js
if (state === STATES.PLAYING) {
  updateTimer(dt);
  updatePlayer(input, canvas.width, canvas.height, performance.now());
}
```

After clearing the canvas in the PLAYING render branch, add:
```js
} else if (state === STATES.PLAYING) {
  drawPlayer(ctx, performance.now());
  ctx.fillStyle = '#fff';
  ctx.font = '18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`TIME: ${getTimeRemaining()}s`, 20, 30);
```

- [ ] **Step 3: Test player movement**

Run: `npm run dev`
Press Start → white square appears center of arena. Move left stick → player moves. Player stays within canvas bounds. Player stops at edges.

- [ ] **Step 4: Commit**

```bash
git add src/game/player.js src/main.js
git commit -m "Add player with movement, facing direction, health, and i-frames"
```

---

### Task 5: Collision Detection (Sacred)

**Files:**
- Create: `src/game/collision.js`

- [ ] **Step 1: Create collision.js**

```js
// src/game/collision.js
// SACRED — collision detection must always function

// Axis-Aligned Bounding Box collision
// Each rect: { x, y, w, h } where x,y is top-left
export function aabb(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/game/collision.js
git commit -m "Add AABB collision detection"
```

---

### Task 6: Enemies — Spawning, AI, and Rendering

**Files:**
- Create: `src/game/enemies.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create enemies.js**

```js
// src/game/enemies.js

import { CONFIG } from './config.js';
import { getGameProgress } from './gameState.js';

let enemies = [];
let lastSpawnTime = 0;

export function resetEnemies() {
  enemies = [];
  lastSpawnTime = 0;
}

export function spawnEnemy(arenaWidth, arenaHeight) {
  // Pick a random edge: 0=top, 1=right, 2=bottom, 3=left
  const edge = Math.floor(Math.random() * 4);
  let ex, ey;

  switch (edge) {
    case 0: ex = Math.random() * arenaWidth; ey = -CONFIG.enemySize; break;
    case 1: ex = arenaWidth + CONFIG.enemySize; ey = Math.random() * arenaHeight; break;
    case 2: ex = Math.random() * arenaWidth; ey = arenaHeight + CONFIG.enemySize; break;
    case 3: ex = -CONFIG.enemySize; ey = Math.random() * arenaHeight; break;
  }

  enemies.push({ x: ex, y: ey, w: CONFIG.enemySize, h: CONFIG.enemySize });
}

function getCurrentSpawnInterval() {
  const progress = getGameProgress();
  const start = CONFIG.enemySpawnIntervalStart;
  const end = CONFIG.enemySpawnIntervalEnd;
  return start + (end - start) * progress;
}

export function updateEnemies(playerPos, now, arenaWidth, arenaHeight) {
  // Spawn logic
  const interval = getCurrentSpawnInterval();
  if (now - lastSpawnTime > interval) {
    spawnEnemy(arenaWidth, arenaHeight);
    lastSpawnTime = now;
  }

  // Move each enemy toward the player
  for (const enemy of enemies) {
    const dx = playerPos.x - (enemy.x + enemy.w / 2);
    const dy = playerPos.y - (enemy.y + enemy.h / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      enemy.x += (dx / dist) * CONFIG.enemySpeed;
      enemy.y += (dy / dist) * CONFIG.enemySpeed;
    }
  }
}

export function drawEnemies(ctx) {
  ctx.fillStyle = CONFIG.enemyColor;
  for (const enemy of enemies) {
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
  }
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
```

- [ ] **Step 2: Wire enemies into main.js**

Add imports at top:
```js
import { resetEnemies, updateEnemies, drawEnemies, getEnemies, removeEnemy } from './game/enemies.js';
import { aabb } from './game/collision.js';
import { getPlayerPos, getPlayerBounds, isPlayerInvincible, damagePlayer } from './game/player.js';
```

Update the start handler to reset enemies:
```js
if (state === STATES.TITLE) {
  startGame();
  resetPlayer(canvas.width, canvas.height);
  resetEnemies();
}
```

In the PLAYING update, after `updatePlayer`:
```js
const now = performance.now();
updateEnemies(getPlayerPos(), now, canvas.width, canvas.height);

// Enemy-player collisions
const playerBounds = getPlayerBounds();
const enemyList = getEnemies();
for (let i = enemyList.length - 1; i >= 0; i--) {
  if (aabb(playerBounds, enemyList[i])) {
    if (damagePlayer(now)) {
      removeEnemy(i);
      if (getPlayerHealth() <= 0) {
        endGame(false);
      }
    }
  }
}
```

In the PLAYING render, after `drawPlayer`:
```js
drawEnemies(ctx);
```

(Also import `endGame` from gameState.js)

- [ ] **Step 3: Test enemy behavior**

Run: `npm run dev`
Press Start → enemies spawn at edges, move toward player. Touching an enemy causes a flash (i-frames). After 3 hits → "GAME OVER". Enemies spawn faster as time progresses.

- [ ] **Step 4: Commit**

```bash
git add src/game/enemies.js src/main.js
git commit -m "Add enemies with edge spawning, chase AI, ramping spawn rate, and player collision"
```

---

### Task 7: Weapons — Shooting Projectiles

**Files:**
- Create: `src/game/weapons.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create weapons.js**

```js
// src/game/weapons.js

import { CONFIG } from './config.js';

let projectiles = [];
let lastFireTime = 0;

export function resetWeapons() {
  projectiles = [];
  lastFireTime = 0;
}

export function tryFire(playerPos, facing, now) {
  if (now - lastFireTime < CONFIG.fireRateCooldown) return;
  lastFireTime = now;

  const half = CONFIG.playerSize / 2;
  projectiles.push({
    x: playerPos.x - CONFIG.projectileSize / 2,
    y: playerPos.y - CONFIG.projectileSize / 2,
    w: CONFIG.projectileSize,
    h: CONFIG.projectileSize,
    vx: facing.x * CONFIG.projectileSpeed,
    vy: facing.y * CONFIG.projectileSpeed,
  });
}

export function updateProjectiles(arenaWidth, arenaHeight) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.vx;
    p.y += p.vy;

    // Remove if out of arena
    if (p.x < -50 || p.x > arenaWidth + 50 || p.y < -50 || p.y > arenaHeight + 50) {
      projectiles.splice(i, 1);
    }
  }
}

export function drawProjectiles(ctx) {
  ctx.fillStyle = CONFIG.projectileColor;
  for (const p of projectiles) {
    ctx.beginPath();
    ctx.arc(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function getProjectiles() {
  return projectiles;
}

export function removeProjectile(index) {
  projectiles.splice(index, 1);
}
```

- [ ] **Step 2: Wire weapons into main.js**

Add imports:
```js
import { resetWeapons, tryFire, updateProjectiles, drawProjectiles, getProjectiles, removeProjectile } from './game/weapons.js';
import { getPlayerFacing } from './game/player.js';
```

Reset weapons on game start:
```js
resetWeapons();
```

In the PLAYING update, after enemy collision checks:
```js
// Firing
if (input.fire || input.fireHeld) {
  tryFire(getPlayerPos(), getPlayerFacing(), now);
}

updateProjectiles(canvas.width, canvas.height);

// Projectile-enemy collisions
const projList = getProjectiles();
const enemyList2 = getEnemies();
for (let i = projList.length - 1; i >= 0; i--) {
  for (let j = enemyList2.length - 1; j >= 0; j--) {
    if (aabb(projList[i], enemyList2[j])) {
      removeProjectile(i);
      removeEnemy(j);
      break;
    }
  }
}
```

In the PLAYING render, after drawEnemies:
```js
drawProjectiles(ctx);
```

- [ ] **Step 3: Test shooting**

Run: `npm run dev`
Press Start → press A → white dot fires in facing direction. Hitting an enemy destroys both the projectile and the enemy. Holding A fires at the cooldown rate.

- [ ] **Step 4: Commit**

```bash
git add src/game/weapons.js src/main.js
git commit -m "Add projectile weapon system with firing, movement, and enemy hit detection"
```

---

### Task 8: HUD — Hearts and Timer

**Files:**
- Create: `src/ui/hud.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create hud.js**

```js
// src/ui/hud.js

import { CONFIG } from '../game/config.js';

export function drawHUD(ctx, health, timeRemaining, canvasWidth) {
  const padding = 20;

  // Hearts (top-left)
  const heartSize = 28;
  const heartGap = 8;
  for (let i = 0; i < CONFIG.playerMaxHealth; i++) {
    const hx = padding + i * (heartSize + heartGap);
    const hy = padding;

    if (i < health) {
      ctx.fillStyle = CONFIG.heartColor;
    } else {
      ctx.fillStyle = '#333';
    }
    drawHeart(ctx, hx + heartSize / 2, hy + heartSize / 2, heartSize * 0.5);
  }

  // Timer (top-right)
  ctx.fillStyle = CONFIG.timerColor;
  ctx.font = `bold ${CONFIG.hudFontSize}px monospace`;
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.ceil(timeRemaining)}s`, canvasWidth - padding, padding + CONFIG.hudFontSize);
  ctx.textAlign = 'left'; // reset
}

function drawHeart(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.3);
  // Left curve
  ctx.bezierCurveTo(cx - size, cy - size * 0.3, cx - size, cy - size, cx, cy - size * 0.5);
  // Right curve
  ctx.bezierCurveTo(cx + size, cy - size, cx + size, cy - size * 0.3, cx, cy + size * 0.3);
  ctx.fill();
}
```

- [ ] **Step 2: Wire HUD into main.js**

Add import:
```js
import { drawHUD } from './ui/hud.js';
```

In the PLAYING render, replace the text-based timer with:
```js
drawHUD(ctx, getPlayerHealth(), getTimeRemaining(), canvas.width);
```

Remove the old `ctx.fillText` timer line.

- [ ] **Step 3: Test HUD**

Run: `npm run dev`
Press Start → 3 red hearts top-left, yellow timer top-right. Take damage → hearts gray out. Timer counts down.

- [ ] **Step 4: Commit**

```bash
git add src/ui/hud.js src/main.js
git commit -m "Add HUD with heart health display and countdown timer"
```

---

### Task 9: Changelog Panel

**Files:**
- Create: `src/ui/changelog.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create changelog.js**

```js
// src/ui/changelog.js

const ACCENT_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#9b59b6',
  '#e67e22', '#1abc9c', '#f39c12', '#e91e63',
];

let entries = [];

export async function loadChangelog() {
  try {
    const resp = await fetch('/changelog.json');
    entries = await resp.json();
    renderChangelog();
  } catch (e) {
    console.error('Failed to load changelog:', e);
  }
}

function renderChangelog() {
  const container = document.getElementById('changelog-entries');
  if (!container) return;

  container.innerHTML = '';

  // Show newest first, limit to last 10
  const visible = entries.slice(-10).reverse();

  for (const entry of visible) {
    const color = ACCENT_COLORS[(entry.version - 1) % ACCENT_COLORS.length];
    const div = document.createElement('div');
    div.className = 'changelog-entry';
    div.style.borderLeftColor = color;
    div.innerHTML = `
      <span class="version">#${entry.version}</span>
      <span class="name"> — ${entry.name}:</span><br>
      <span class="desc">${entry.description}</span>
    `;
    container.appendChild(div);
  }
}
```

- [ ] **Step 2: Wire changelog into main.js**

Add import at top:
```js
import { loadChangelog } from './ui/changelog.js';
```

Call it once at boot, outside the game loop:
```js
loadChangelog();
```

- [ ] **Step 3: Test changelog**

Run: `npm run dev`
Expected: Right panel shows "#1 — Baseline: Initial game" with a colored accent bar.

- [ ] **Step 4: Commit**

```bash
git add src/ui/changelog.js src/main.js
git commit -m "Add changelog panel that reads from changelog.json"
```

---

### Task 10: Rendering — Background and Screen Text

**Files:**
- Create: `src/game/rendering.js`
- Modify: `src/main.js`

- [ ] **Step 1: Create rendering.js**

Centralize canvas setup and background rendering. Also handle screen text for title/victory/gameover states so main.js stays clean.

```js
// src/game/rendering.js

import { CONFIG } from './config.js';

let canvas, ctx;

export function initRendering(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  return ctx;
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

export function getCanvasSize() {
  return { width: canvas.width, height: canvas.height };
}

export function clearCanvas() {
  ctx.fillStyle = CONFIG.arenaBackground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawTitleScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ARENA SURVIVAL', cx, cy - 30);

  ctx.font = '20px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('PRESS START', cx, cy + 30);

  ctx.textAlign = 'left';
}

export function drawVictoryScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.fillStyle = '#2ecc71';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('YOU SURVIVED!', cx, cy - 30);

  ctx.font = '20px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('PRESS START TO PLAY AGAIN', cx, cy + 30);

  ctx.textAlign = 'left';
}

export function drawGameOverScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', cx, cy - 30);

  ctx.font = '20px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('PRESS START TO TRY AGAIN', cx, cy + 30);

  ctx.textAlign = 'left';
}
```

- [ ] **Step 2: Refactor main.js to use rendering.js**

Remove the inline canvas/ctx setup and resize handler from main.js. Replace with:

```js
import { initRendering, getCanvasSize, clearCanvas, drawTitleScreen, drawVictoryScreen, drawGameOverScreen } from './game/rendering.js';
```

At boot:
```js
const canvas = document.getElementById('game-canvas');
const ctx = initRendering(canvas);
```

Remove the old `resizeCanvas` function and event listener.

In the game loop, replace `ctx.fillStyle = CONFIG.arenaBackground; ctx.fillRect(...)` with `clearCanvas()`.

Replace the inline title/victory/gameover text drawing with:
```js
if (state === STATES.TITLE) {
  drawTitleScreen();
} else if (state === STATES.PLAYING) {
  // ... entity drawing + HUD
} else if (state === STATES.VICTORY) {
  drawVictoryScreen();
} else if (state === STATES.GAMEOVER) {
  drawGameOverScreen();
}
```

Use `getCanvasSize()` wherever `canvas.width`/`canvas.height` are needed (resetPlayer, updateEnemies, updateProjectiles, etc.).

- [ ] **Step 3: Test that everything still works**

Run: `npm run dev`
All screens display correctly. Title → Start → gameplay with enemies, shooting, HUD → victory/gameover → restart. No regressions.

- [ ] **Step 4: Commit**

```bash
git add src/game/rendering.js src/main.js
git commit -m "Extract rendering module for canvas setup, background, and screen text"
```

---

### Task 11: Polish main.js — Clean Game Loop

**Files:**
- Modify: `src/main.js`

- [ ] **Step 1: Write the final clean version of main.js**

After all the incremental wiring, main.js should be cleaned up to its final form. This is the complete file:

```js
// src/main.js
// SACRED — the game loop must always run cleanly

import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';
import { STATES, getState, getTimeRemaining, startGame, endGame, goToTitle, updateTimer } from './game/gameState.js';
import { resetPlayer, updatePlayer, drawPlayer, getPlayerPos, getPlayerFacing, getPlayerHealth, getPlayerBounds, damagePlayer } from './game/player.js';
import { resetEnemies, updateEnemies, drawEnemies, getEnemies, removeEnemy } from './game/enemies.js';
import { resetWeapons, tryFire, updateProjectiles, drawProjectiles, getProjectiles, removeProjectile } from './game/weapons.js';
import { aabb } from './game/collision.js';
import { initRendering, getCanvasSize, clearCanvas, drawTitleScreen, drawVictoryScreen, drawGameOverScreen } from './game/rendering.js';
import { drawHUD } from './ui/hud.js';
import { loadChangelog } from './ui/changelog.js';

// Boot
const canvas = document.getElementById('game-canvas');
const ctx = initRendering(canvas);
loadChangelog();

let lastTime = performance.now();

function gameLoop(now) {
  const dt = now - lastTime;
  lastTime = now;

  pollInput();
  const input = getInput();
  const state = getState();
  const { width, height } = getCanvasSize();

  // --- State transitions ---
  if (input.start) {
    if (state === STATES.TITLE) {
      startGame();
      resetPlayer(width, height);
      resetEnemies();
      resetWeapons();
    } else {
      goToTitle();
    }
  }

  // --- Update ---
  if (state === STATES.PLAYING) {
    updateTimer(dt);
    updatePlayer(input, width, height, now);
    updateEnemies(getPlayerPos(), now, width, height);

    // Firing
    if (input.fire || input.fireHeld) {
      tryFire(getPlayerPos(), getPlayerFacing(), now);
    }
    updateProjectiles(width, height);

    // Projectile-enemy collisions
    const projList = getProjectiles();
    const enemyList = getEnemies();
    for (let i = projList.length - 1; i >= 0; i--) {
      for (let j = enemyList.length - 1; j >= 0; j--) {
        if (aabb(projList[i], enemyList[j])) {
          removeProjectile(i);
          removeEnemy(j);
          break;
        }
      }
    }

    // Enemy-player collisions
    const playerBounds = getPlayerBounds();
    const enemies = getEnemies();
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (aabb(playerBounds, enemies[i])) {
        if (damagePlayer(now)) {
          removeEnemy(i);
          if (getPlayerHealth() <= 0) {
            endGame(false);
          }
        }
      }
    }
  }

  // --- Render ---
  clearCanvas();

  if (state === STATES.TITLE) {
    drawTitleScreen();
  } else if (state === STATES.PLAYING) {
    drawPlayer(ctx, now);
    drawEnemies(ctx);
    drawProjectiles(ctx);
    drawHUD(ctx, getPlayerHealth(), getTimeRemaining(), width);
  } else if (state === STATES.VICTORY) {
    drawVictoryScreen();
  } else if (state === STATES.GAMEOVER) {
    drawGameOverScreen();
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
```

- [ ] **Step 2: Full playthrough test**

Run: `npm run dev`
Complete test:
1. Title screen shows → press Start
2. Player moves with left stick, fires with A
3. Enemies spawn at edges, chase player, spawn faster over time
4. Projectiles destroy enemies on hit
5. Enemy contact removes a heart, player flashes
6. 3 hits → game over screen
7. Survive 60s → victory screen
8. Start restarts from any screen
9. Changelog panel shows baseline entry on the right
10. HUD hearts and timer display correctly

- [ ] **Step 3: Commit**

```bash
git add src/main.js
git commit -m "Clean up main.js into final game loop structure"
```

---

### Task 12: CLAUDE.md — Live Operation Guide

**Files:**
- Create: `CLAUDE.md`

- [ ] **Step 1: Write CLAUDE.md**

```markdown
# Maker Faire 2026 — Arena Survival Game

This is a live exhibit game for kids at Maker Faire. Kids suggest changes ("make enemies into dancing bananas," "add a freeze ray") and you implement them immediately. The game runs on a widescreen TV with an Xbox controller.

## How This Works

1. Someone tells you what a kid wants changed (e.g., "Emma wants rainbow enemies")
2. You interpret the request creatively and implement it
3. You update changelog.json with the kid's name and a description
4. You commit the change
5. Vite HMR auto-reloads the browser — the kid sees the change in seconds

## Sacred Systems — NEVER BREAK THESE

No matter what is requested, these must always work:

| System | File | What it does |
|--------|------|--------------|
| Game loop | `src/main.js` | requestAnimationFrame loop runs every frame |
| Input | `src/game/input.js` | Gamepad API polling, stick + buttons |
| Collision | `src/game/collision.js` | AABB collision between entities |
| State machine | `src/game/gameState.js` | Title/playing/victory/gameover + timer |
| Player movement | `src/game/player.js` | Left stick always moves the player |
| Restart | Start button always restarts the game |

If a request conflicts with these, **adapt the idea** to preserve them. Never say no — find a safe version.

## Controls (DO NOT CHANGE)

- Left stick: movement
- A button: fire in facing direction
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

### New enemy type or behavior
Edit `src/game/enemies.js`. Add a new enemy type with its own movement AI, appearance, and behavior. The spawn logic in `updateEnemies()` controls when/where they appear.

### New weapon type
Edit `src/game/weapons.js`. Add new projectile behavior (homing, bouncing, AoE) or replace the default weapon entirely. For melee weapons (swords), create a short-lived hitbox near the player instead of a moving projectile.

### Visual changes (background, effects, themes)
Edit `src/game/rendering.js` for backgrounds and camera effects. Edit individual entity files for their appearance (player.js, enemies.js, weapons.js).

### New game systems (pickups, allies, obstacles, particles)
Create a new file in `src/game/` (e.g., `pickups.js`). Give it `reset()`, `update()`, and `draw()` functions. Wire it into `main.js` following the same pattern as enemies/weapons.

### Player appearance
Edit `src/game/player.js`, specifically the `drawPlayer()` function.

### HUD changes
Edit `src/ui/hud.js` for on-canvas UI. Edit `index.html` and `src/ui/changelog.js` for the DOM panel.

## Changelog Update Protocol

After EVERY change, update `public/changelog.json`:

```json
{ "version": N, "name": "Kid Name", "description": "One-line description" }
```

- Increment version number from the last entry
- Use the kid's actual name
- Write a kid-friendly one-line description
- The changelog panel auto-updates on reload

## Design Philosophy

- **Go big.** Kids should instantly say "whoa, that's different."
- **Be creative.** "Add unicorns" means sparkly unicorn enemies with visual flair, not a renamed red square.
- **Never crash.** If something risky is requested, implement a safe version.
- **Fun over correctness.** If it's fun, it ships.
- **Visible impact.** Prefer dramatic visual changes over subtle ones.

## Reset to Baseline

To reset the game to its original state:

```bash
git checkout baseline -- src/ public/changelog.json index.html
```

This restores all source files and the changelog to the initial version. The browser will auto-reload.

## Running the Game

```bash
npm run dev
```

Opens in browser with Vite HMR. Changes appear in ~1-2 seconds after saving.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "Add CLAUDE.md live operation guide for Maker Faire sessions"
```

---

### Task 13: Baseline Tag and Final Verification

**Files:** None — git operations only

- [ ] **Step 1: Full end-to-end playtest**

Run: `npm run dev`

Complete checklist:
- Title screen displays, changelog panel visible on right
- Start button begins game
- Player moves smoothly with left stick
- Player fires in facing direction with A button
- Enemies spawn at edges, chase player, spawn faster over time
- Projectiles destroy enemies
- Enemy contact damages player (heart disappears, player flashes)
- 3 hits → game over
- 60 seconds survived → victory
- Start restarts from any screen
- Changelog shows "#1 — Baseline: Initial game"

- [ ] **Step 2: Tag baseline**

```bash
git tag baseline
```

This is the reset point. `git checkout baseline -- src/ public/changelog.json index.html` restores everything.

- [ ] **Step 3: Verify reset works**

Make a trivial change to `config.js` (e.g., change `playerColor` to `'#ff0000'`). Save, see it update in the browser. Then:

```bash
git checkout baseline -- src/game/config.js
```

Verify the player is white again in the browser.

Then discard the test change:
```bash
git checkout baseline -- .
```

- [ ] **Step 4: Final commit (if any cleanup needed)**

Ensure working tree is clean:
```bash
git status
```

Expected: `nothing to commit, working tree clean`
