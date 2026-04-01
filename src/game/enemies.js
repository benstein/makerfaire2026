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

  // Randomly assign a Mario enemy type: goomba or koopa
  const type = Math.random() < 0.6 ? 'goomba' : 'koopa';
  enemies.push({ x: ex, y: ey, w: CONFIG.enemySize, h: CONFIG.enemySize, type });
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

export function drawEnemies(ctx, now) {
  for (const enemy of enemies) {
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    const s = enemy.w; // size
    const px = s / 14;

    if (enemy.type === 'koopa') {
      drawKoopa(ctx, s, px);
    } else {
      drawGoomba(ctx, s, px);
    }
    ctx.restore();
  }
}

function drawGoomba(ctx, s, px) {
  // Goomba — brown mushroom enemy
  // Head (dark brown dome)
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.arc(s/2, s*0.35, s*0.42, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(s*0.08, s*0.35, s*0.84, s*0.15);

  // Face (tan)
  ctx.fillStyle = '#FDDCAA';
  ctx.fillRect(s*0.2, s*0.4, s*0.6, s*0.25);

  // Angry eyes (white with black pupil)
  ctx.fillStyle = '#fff';
  ctx.fillRect(s*0.22, s*0.4, s*0.18, s*0.14);
  ctx.fillRect(s*0.58, s*0.4, s*0.18, s*0.14);
  ctx.fillStyle = '#000';
  // Pupils looking inward (angry)
  ctx.fillRect(s*0.34, s*0.42, s*0.06, s*0.1);
  ctx.fillRect(s*0.58, s*0.42, s*0.06, s*0.1);

  // Frown
  ctx.fillStyle = '#000';
  ctx.fillRect(s*0.35, s*0.58, s*0.3, s*0.04);

  // Fangs
  ctx.fillStyle = '#fff';
  ctx.fillRect(s*0.38, s*0.55, s*0.06, s*0.06);
  ctx.fillRect(s*0.55, s*0.55, s*0.06, s*0.06);

  // Body (tan)
  ctx.fillStyle = '#FDDCAA';
  ctx.fillRect(s*0.3, s*0.65, s*0.4, s*0.12);

  // Feet (dark brown)
  ctx.fillStyle = '#5C2D00';
  ctx.fillRect(s*0.08, s*0.77, s*0.35, s*0.2);
  ctx.fillRect(s*0.57, s*0.77, s*0.35, s*0.2);
}

function drawKoopa(ctx, s, px) {
  // Koopa Troopa — green turtle
  // Shell (green)
  ctx.fillStyle = '#2E8B32';
  ctx.beginPath();
  ctx.ellipse(s/2, s*0.55, s*0.42, s*0.35, 0, 0, Math.PI*2);
  ctx.fill();

  // Shell pattern (darker green lines)
  ctx.strokeStyle = '#1A5C1F';
  ctx.lineWidth = s*0.04;
  ctx.beginPath();
  ctx.moveTo(s*0.3, s*0.35);
  ctx.lineTo(s*0.3, s*0.75);
  ctx.moveTo(s*0.5, s*0.25);
  ctx.lineTo(s*0.5, s*0.8);
  ctx.moveTo(s*0.7, s*0.35);
  ctx.lineTo(s*0.7, s*0.75);
  ctx.stroke();

  // Shell rim (white/cream)
  ctx.fillStyle = '#FFFDE0';
  ctx.fillRect(s*0.15, s*0.48, s*0.7, s*0.06);

  // Head (yellow-green)
  ctx.fillStyle = '#A4D65E';
  ctx.beginPath();
  ctx.arc(s*0.5, s*0.18, s*0.18, 0, Math.PI*2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(s*0.42, s*0.15, s*0.07, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s*0.58, s*0.15, s*0.07, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(s*0.44, s*0.15, s*0.035, 0, Math.PI*2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s*0.6, s*0.15, s*0.035, 0, Math.PI*2);
  ctx.fill();

  // Feet (orange/yellow)
  ctx.fillStyle = '#E89020';
  ctx.fillRect(s*0.1, s*0.82, s*0.25, s*0.15);
  ctx.fillRect(s*0.65, s*0.82, s*0.25, s*0.15);
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
