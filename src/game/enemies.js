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
      const ndx = dx / dist;
      const ndy = dy / dist;
      enemy.x += ndx * CONFIG.enemySpeed * scale;
      enemy.y += ndy * CONFIG.enemySpeed * scale;
      enemy._lastDx = ndx;
      enemy._lastDy = ndy;
    }
  }
}

export function drawEnemies(ctx, now) {
  for (const enemy of enemies) {
    const s = enemy.w;
    const ex = enemy.x + s / 2;
    const ey = enemy.y + s / 2;

    ctx.save();
    ctx.translate(ex, ey);

    // Rotate to face the direction they're moving
    const playerDx = enemy._lastDx || 0;
    const playerDy = enemy._lastDy || 0;
    const angle = Math.atan2(playerDy, playerDx);
    ctx.rotate(angle + Math.PI / 2); // point "up" of the roach toward movement

    const hw = s / 2;
    const hh = s / 2 + 3;

    // Legs — 3 pairs, twitching
    const time = now || performance.now();
    ctx.strokeStyle = '#3D1F0B';
    ctx.lineWidth = 1.5;
    for (let side = -1; side <= 1; side += 2) {
      for (let leg = 0; leg < 3; leg++) {
        const legY = -hh * 0.4 + leg * (hh * 0.45);
        const twitch = Math.sin(time / 50 + leg * 2 + side) * 3;
        ctx.beginPath();
        ctx.moveTo(side * hw * 0.5, legY);
        ctx.lineTo(side * (hw + 5 + twitch), legY + twitch * 0.5);
        ctx.stroke();
      }
    }

    // Antennae
    ctx.strokeStyle = '#3D1F0B';
    ctx.lineWidth = 1;
    const antTwitch = Math.sin(time / 80) * 4;
    ctx.beginPath();
    ctx.moveTo(-3, -hh);
    ctx.quadraticCurveTo(-5 + antTwitch, -hh - 10, -8 + antTwitch, -hh - 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(3, -hh);
    ctx.quadraticCurveTo(5 - antTwitch, -hh - 10, 8 - antTwitch, -hh - 12);
    ctx.stroke();

    // Body — dark brown oval
    ctx.fillStyle = '#4A2810';
    ctx.beginPath();
    ctx.ellipse(0, 0, hw - 1, hh, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shell/wing casings — lighter brown with line down center
    ctx.fillStyle = '#6B3A1A';
    ctx.beginPath();
    ctx.ellipse(0, 1, hw - 3, hh - 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wing line down center
    ctx.strokeStyle = '#3D1F0B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -hh + 4);
    ctx.lineTo(0, hh - 3);
    ctx.stroke();

    // Head (smaller darker circle at top)
    ctx.fillStyle = '#2E1508';
    ctx.beginPath();
    ctx.ellipse(0, -hh + 3, hw * 0.55, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Beady eyes
    ctx.fillStyle = '#FF3300';
    ctx.beginPath();
    ctx.arc(-3, -hh + 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(3, -hh + 2, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Shiny shell highlight
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.ellipse(-2, -3, hw * 0.35, hh * 0.4, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
