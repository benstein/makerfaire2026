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

export function drawEnemies(ctx) {
  for (const enemy of enemies) {
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;
    const s = enemy.w;

    ctx.save();
    ctx.translate(cx, cy);

    // Tail
    ctx.strokeStyle = '#ff9eb5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.quadraticCurveTo(s * 0.4, s * 0.6, s * 0.15, s * 0.75);
    ctx.stroke();

    // Body (gray oval)
    ctx.fillStyle = '#8e8e8e';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.4, s * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Left ear
    ctx.fillStyle = '#6e6e6e';
    ctx.beginPath();
    ctx.arc(-s * 0.25, -s * 0.32, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb0c4';
    ctx.beginPath();
    ctx.arc(-s * 0.25, -s * 0.32, s * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // Right ear
    ctx.fillStyle = '#6e6e6e';
    ctx.beginPath();
    ctx.arc(s * 0.25, -s * 0.32, s * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb0c4';
    ctx.beginPath();
    ctx.arc(s * 0.25, -s * 0.32, s * 0.09, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-s * 0.12, -s * 0.08, s * 0.055, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.12, -s * 0.08, s * 0.055, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-s * 0.1, -s * 0.1, s * 0.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.14, -s * 0.1, s * 0.02, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#ff6b8a';
    ctx.beginPath();
    ctx.arc(0, s * 0.05, s * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-s * 0.15, s * 0.03);
    ctx.lineTo(-s * 0.45, -s * 0.05);
    ctx.moveTo(-s * 0.15, s * 0.08);
    ctx.lineTo(-s * 0.45, s * 0.12);
    ctx.moveTo(s * 0.15, s * 0.03);
    ctx.lineTo(s * 0.45, -s * 0.05);
    ctx.moveTo(s * 0.15, s * 0.08);
    ctx.lineTo(s * 0.45, s * 0.12);
    ctx.stroke();

    ctx.restore();
  }
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
