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

  for (const enemy of enemies) {
    const dx = playerPos.x - (enemy.x + enemy.w / 2);
    const dy = playerPos.y - (enemy.y + enemy.h / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const scale = dt / 16.67;
      enemy.x += (dx / dist) * CONFIG.enemySpeed * scale;
      enemy.y += (dy / dist) * CONFIG.enemySpeed * scale;
    }
  }
}

function drawBear(ctx, cx, cy, size) {
  const r = size / 2;

  // Ears
  ctx.fillStyle = '#6B3A2A';
  ctx.beginPath(); ctx.arc(cx - r * 0.6, cy - r * 0.75, r * 0.38, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.6, cy - r * 0.75, r * 0.38, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#C47A5A';
  ctx.beginPath(); ctx.arc(cx - r * 0.6, cy - r * 0.75, r * 0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.6, cy - r * 0.75, r * 0.2, 0, Math.PI * 2); ctx.fill();

  // Body
  ctx.fillStyle = '#8B4513';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

  // Snout
  ctx.fillStyle = '#C47A5A';
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.25, r * 0.38, r * 0.28, 0, 0, Math.PI * 2); ctx.fill();

  // Nose
  ctx.fillStyle = '#1a0a00';
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.12, r * 0.14, r * 0.1, 0, 0, Math.PI * 2); ctx.fill();

  // Eyes
  ctx.fillStyle = '#1a0a00';
  ctx.beginPath(); ctx.arc(cx - r * 0.32, cy - r * 0.12, r * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.32, cy - r * 0.12, r * 0.1, 0, Math.PI * 2); ctx.fill();
}

export function drawEnemies(ctx) {
  for (const enemy of enemies) {
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;
    drawBear(ctx, cx, cy, enemy.w);
  }
}

export { drawBear };

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
