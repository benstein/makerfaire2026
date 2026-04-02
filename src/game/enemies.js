// src/game/enemies.js

import { CONFIG } from './config.js';
import { getGameProgress, getLevel } from './gameState.js';

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
      // Enemies get faster each level
      const levelSpeedBonus = 1 + (getLevel() - 1) * 0.25;
      const speed = CONFIG.enemySpeed * levelSpeedBonus;
      enemy.x += (dx / dist) * speed * scale;
      enemy.y += (dy / dist) * speed * scale;
    }
  }
}

// Enemy colors per level — gets scarier
const LEVEL_COLORS = ['#e74c3c', '#e67e22', '#9b59b6', '#1abc9c', '#ff1744'];

export function drawEnemies(ctx) {
  const level = getLevel();
  const color = LEVEL_COLORS[(level - 1) % LEVEL_COLORS.length];
  ctx.fillStyle = color;
  for (const enemy of enemies) {
    // Bigger enemies at higher levels
    const sizeBonus = (level - 1) * 2;
    const s = enemy.w + sizeBonus;
    const offset = sizeBonus / 2;
    ctx.fillRect(enemy.x - offset, enemy.y - offset, s, s);

    // Angry eyes on higher-level enemies
    if (level >= 2) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(enemy.x + 4 - offset, enemy.y + 4 - offset, 5, 4);
      ctx.fillRect(enemy.x + s - 9 - offset, enemy.y + 4 - offset, 5, 4);
      ctx.fillStyle = '#000';
      ctx.fillRect(enemy.x + 6 - offset, enemy.y + 5 - offset, 2, 2);
      ctx.fillRect(enemy.x + s - 7 - offset, enemy.y + 5 - offset, 2, 2);
      ctx.fillStyle = color;
    }
  }
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
