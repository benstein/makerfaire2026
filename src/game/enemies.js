// src/game/enemies.js

import { CONFIG } from './config.js';
import { getGameProgress } from './gameState.js';

let enemies = [];
let lastSpawnTime = 0;

// Generation system: enemies split into smaller versions
const MAX_GENERATION = 2;
const GEN_SIZES = [CONFIG.enemySize, 14, 8];
const GEN_COLORS = ['#e74c3c', '#e67e22', '#f39c12'];
const GEN_SPEED_MULT = [1, 1.3, 1.8]; // smaller = faster

export function resetEnemies() {
  enemies = [];
  lastSpawnTime = 0;
}

export function spawnEnemy(arenaWidth, arenaHeight) {
  const edge = Math.floor(Math.random() * 4);
  let ex, ey;
  const size = GEN_SIZES[0];

  switch (edge) {
    case 0: ex = Math.random() * arenaWidth; ey = -size; break;
    case 1: ex = arenaWidth + size; ey = Math.random() * arenaHeight; break;
    case 2: ex = Math.random() * arenaWidth; ey = arenaHeight + size; break;
    case 3: ex = -size; ey = Math.random() * arenaHeight; break;
  }

  enemies.push({ x: ex, y: ey, w: size, h: size, gen: 0 });
}

export function splitEnemy(index) {
  const enemy = enemies[index];
  const nextGen = enemy.gen + 1;

  if (nextGen > MAX_GENERATION) {
    // Too small to split — actually dies
    enemies.splice(index, 1);
    return true; // returns true = enemy died
  }

  const size = GEN_SIZES[nextGen];
  const cx = enemy.x + enemy.w / 2;
  const cy = enemy.y + enemy.h / 2;

  // Remove parent
  enemies.splice(index, 1);

  // Spawn two children flying apart
  const angle = Math.random() * Math.PI * 2;
  const spread = 20;
  for (let i = 0; i < 2; i++) {
    const a = angle + Math.PI * i;
    enemies.push({
      x: cx + Math.cos(a) * spread - size / 2,
      y: cy + Math.sin(a) * spread - size / 2,
      w: size,
      h: size,
      gen: nextGen,
    });
  }

  return false; // returns false = enemy split, not dead
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

  for (const enemy of enemies) {
    const dx = playerPos.x - (enemy.x + enemy.w / 2);
    const dy = playerPos.y - (enemy.y + enemy.h / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const scale = dt / 16.67;
      const speedMult = GEN_SPEED_MULT[enemy.gen] || 1;
      enemy.x += (dx / dist) * CONFIG.enemySpeed * speedMult * scale;
      enemy.y += (dy / dist) * CONFIG.enemySpeed * speedMult * scale;
    }
  }
}

export function drawEnemies(ctx) {
  for (const enemy of enemies) {
    ctx.fillStyle = GEN_COLORS[enemy.gen] || CONFIG.enemyColor;
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
  }
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
