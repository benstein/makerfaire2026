// src/game/enemies.js

import { CONFIG } from './config.js';
import { getGameProgress } from './gameState.js';

let enemies = [];
let lastSpawnTime = 0;
let fireballs = [];

const FIREBALL_SPEED    = 1.5;   // slow drift
const FIREBALL_INTERVAL = 2200;  // ms between shots per enemy
const FIREBALL_R        = 13;    // hitbox half-size

export function resetEnemies() {
  enemies = [];
  lastSpawnTime = 0;
  fireballs = [];
}

export function spawnEnemy(arenaWidth, arenaHeight) {
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

export function updateEnemies(dt, playerPos, now, arenaWidth, arenaHeight) {
  const interval = getCurrentSpawnInterval();
  if (now - lastSpawnTime > interval) {
    spawnEnemy(arenaWidth, arenaHeight);
    lastSpawnTime = now;
  }

  const scale = dt / 16.67;

  for (const enemy of enemies) {
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;
    const dx = playerPos.x - cx;
    const dy = playerPos.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      enemy.x += (dx / dist) * CONFIG.enemySpeed * scale;
      enemy.y += (dy / dist) * CONFIG.enemySpeed * scale;
    }

    // Shoot a fireball toward the player
    if (!enemy.lastFireTime || now - enemy.lastFireTime > FIREBALL_INTERVAL) {
      if (dist > 0) {
        fireballs.push({
          x: cx - FIREBALL_R, y: cy - FIREBALL_R,
          w: FIREBALL_R * 2,  h: FIREBALL_R * 2,
          vx: (dx / dist) * FIREBALL_SPEED,
          vy: (dy / dist) * FIREBALL_SPEED,
          hue: Math.random() * 60,  // 0–60: red through orange-yellow
          born: now,
        });
        enemy.lastFireTime = now + Math.random() * 600; // stagger so all don't fire at once
      }
    }
  }

  // Move fireballs
  for (let i = fireballs.length - 1; i >= 0; i--) {
    const f = fireballs[i];
    f.x += f.vx * scale;
    f.y += f.vy * scale;
    if (now - f.born > 8000) fireballs.splice(i, 1);
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

export function getFireballs() { return fireballs; }
export function removeFireball(i) { fireballs.splice(i, 1); }

export function drawFireballs(ctx, now) {
  const t = now / 1000;
  for (const f of fireballs) {
    const cx = f.x + FIREBALL_R;
    const cy = f.y + FIREBALL_R;
    const spin = t * 3.5 + f.born * 0.001;
    const hue2 = (f.hue + 25) % 360;

    ctx.save();
    ctx.translate(cx, cy);

    // Outer soft glow
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, FIREBALL_R * 2.4);
    glow.addColorStop(0,   `hsla(${f.hue}, 100%, 65%, 0.45)`);
    glow.addColorStop(1,   `hsla(${f.hue}, 100%, 50%, 0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, FIREBALL_R * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Rotating flame petals
    ctx.rotate(spin);
    const numPetals = 6;
    for (let p = 0; p < numPetals; p++) {
      const angle = (p / numPetals) * Math.PI * 2;
      const px = Math.cos(angle) * FIREBALL_R * 0.75;
      const py = Math.sin(angle) * FIREBALL_R * 0.75;
      const petalGrad = ctx.createRadialGradient(px, py, 0, px, py, FIREBALL_R * 0.7);
      petalGrad.addColorStop(0,   `hsla(${hue2}, 100%, 72%, 0.9)`);
      petalGrad.addColorStop(1,   `hsla(${f.hue}, 100%, 50%, 0)`);
      ctx.fillStyle = petalGrad;
      ctx.beginPath();
      ctx.arc(px, py, FIREBALL_R * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.rotate(-spin); // undo petal rotation before core

    // Hot core (doesn't rotate)
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, FIREBALL_R * 0.62);
    core.addColorStop(0,   '#ffffff');
    core.addColorStop(0.3, `hsl(${f.hue}, 100%, 82%)`);
    core.addColorStop(1,   `hsl(${f.hue}, 100%, 52%)`);
    ctx.fillStyle = core;
    ctx.shadowBlur  = 14;
    ctx.shadowColor = `hsl(${f.hue}, 100%, 60%)`;
    ctx.beginPath();
    ctx.arc(0, 0, FIREBALL_R * 0.62, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
