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

  enemies.push({ x: ex, y: ey, w: CONFIG.enemySize, h: CONFIG.enemySize, hp: 3, maxHp: 3, hitFlash: 0 });
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
    if (enemy.hitFlash > 0) enemy.hitFlash = Math.max(0, enemy.hitFlash - dt / 120);
  }
}

export function drawEnemies(ctx) {
  for (const enemy of enemies) {
    // Body — flash white on hit
    ctx.fillStyle = enemy.hitFlash > 0
      ? `rgba(255,255,255,${enemy.hitFlash})`
      : CONFIG.enemyColor;
    ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);

    // Health pips above enemy
    const pipSize = 5;
    const pipGap = 3;
    const totalW = enemy.maxHp * pipSize + (enemy.maxHp - 1) * pipGap;
    const startX = enemy.x + (enemy.w - totalW) / 2;
    const pipY = enemy.y - 8;
    for (let i = 0; i < enemy.maxHp; i++) {
      ctx.fillStyle = i < enemy.hp ? '#2ecc71' : '#444';
      ctx.fillRect(startX + i * (pipSize + pipGap), pipY, pipSize, pipSize);
    }
  }
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}

// Returns true if the enemy died.
export function damageEnemy(index) {
  const e = enemies[index];
  if (!e) return false;
  e.hp--;
  e.hitFlash = 1;
  if (e.hp <= 0) {
    enemies.splice(index, 1);
    return true;
  }
  return false;
}
