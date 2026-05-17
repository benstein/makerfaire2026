// src/game/enemies.js

import { CONFIG } from './config.js';
import { getGameProgress, getTimeRemaining } from './gameState.js';

let enemies = [];
let lastSpawnTime = 0;
let mobWaveTriggered = false;

export function resetEnemies() {
  enemies = [];
  lastSpawnTime = 0;
  mobWaveTriggered = false;
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

function spawnTriangleWave(arenaWidth, arenaHeight) {
  const size = 80;
  const count = 100;
  const perEdge = count / 4;
  for (let edge = 0; edge < 4; edge++) {
    for (let i = 0; i < perEdge; i++) {
      const t = (i + 0.5) / perEdge;
      let ex, ey;
      switch (edge) {
        case 0: ex = t * arenaWidth; ey = -size; break;
        case 1: ex = arenaWidth + size; ey = t * arenaHeight; break;
        case 2: ex = t * arenaWidth; ey = arenaHeight + size; break;
        case 3: ex = -size; ey = t * arenaHeight; break;
      }
      enemies.push({ x: ex, y: ey, w: size, h: size, type: 'triangle' });
    }
  }
}

export function updateEnemies(dt, playerPos, now, arenaWidth, arenaHeight) {
  if (!mobWaveTriggered && getTimeRemaining() <= 40) {
    mobWaveTriggered = true;
    enemies = [];
    spawnTriangleWave(arenaWidth, arenaHeight);
  }

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

export function drawEnemies(ctx) {
  for (const enemy of enemies) {
    if (enemy.type === 'triangle') {
      ctx.fillStyle = '#ff6600';
      ctx.beginPath();
      ctx.moveTo(enemy.x + enemy.w / 2, enemy.y);
      ctx.lineTo(enemy.x + enemy.w, enemy.y + enemy.h);
      ctx.lineTo(enemy.x, enemy.y + enemy.h);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = CONFIG.enemyColor;
      ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    }
  }
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
