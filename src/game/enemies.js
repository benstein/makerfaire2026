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
    const s = enemy.w;
    const cx = enemy.x + s / 2;
    const cy = enemy.y + s / 2;

    ctx.save();
    ctx.translate(cx, cy);

    // Spiky stem on top
    ctx.fillStyle = '#6B4A3A';
    ctx.beginPath();
    ctx.moveTo(0, -s / 2 - 6);
    ctx.lineTo(-3, -s / 2);
    ctx.lineTo(3, -s / 2);
    ctx.closePath();
    ctx.fill();
    // Thorny side leaves
    ctx.beginPath();
    ctx.moveTo(-5, -s / 2 - 3);
    ctx.lineTo(-9, -s / 2 - 9);
    ctx.lineTo(-1, -s / 2 - 1);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(5, -s / 2 - 3);
    ctx.lineTo(9, -s / 2 - 9);
    ctx.lineTo(1, -s / 2 - 1);
    ctx.closePath();
    ctx.fill();

    // Body — purplish-red artichoke
    ctx.fillStyle = '#8B3A5C';
    ctx.beginPath();
    ctx.ellipse(0, 1, s / 2, s / 2 + 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Leaf scale pattern — darker, spikier
    const leafColors = ['#9C4468', '#7A2E4E', '#9C4468', '#6B2040'];
    for (let row = 0; row < 4; row++) {
      ctx.fillStyle = leafColors[row];
      const rowY = -s / 2 + 4 + row * (s / 5);
      const leafCount = row === 0 ? 2 : 3;
      const leafW = s / leafCount;
      for (let l = 0; l < leafCount; l++) {
        const lx = -s / 2 + l * leafW + leafW / 2 + (row % 2 ? leafW / 3 : 0);
        ctx.beginPath();
        ctx.ellipse(lx, rowY, leafW / 2, s / 8, 0, Math.PI, 0, true);
        ctx.fill();
      }
    }

    // Angry face
    // Eyes (angry slant)
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-4, -1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -1, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(-4, -0.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -0.5, 1.5, 0, Math.PI * 2);
    ctx.fill();
    // Angry eyebrows
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, -4);
    ctx.lineTo(-2, -3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(6, -4);
    ctx.lineTo(2, -3);
    ctx.stroke();
    // Frown
    ctx.beginPath();
    ctx.arc(0, 5, 3.5, Math.PI + 0.3, -0.3);
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
