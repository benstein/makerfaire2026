// src/game/enemies.js

import { CONFIG } from './config.js';
import { getGameProgress } from './gameState.js';

let enemies = [];
let lastSpawnTime = 0;

const LEGO_COLORS = ['#cc2200','#0055bf','#f5c400','#237a22','#ff7000','#ffffff','#9c0093'];

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

  // Each enemy is a 2x2 cluster of mini LEGO bricks, each with its own color
  const colors = Array.from({ length: 4 }, () => LEGO_COLORS[Math.floor(Math.random() * LEGO_COLORS.length)]);
  enemies.push({ x: ex, y: ey, w: CONFIG.enemySize, h: CONFIG.enemySize, colors });
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

function blendDark(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgb(${Math.round(r*0.6)},${Math.round(g*0.6)},${Math.round(b*0.6)})`;
}

function drawMiniBrick(ctx, x, y, w, h, color) {
  const dark = color === '#ffffff' ? '#aaaaaa' : blendDark(color);
  const bx = Math.round(x), by = Math.round(y);

  ctx.fillStyle = color;
  ctx.fillRect(bx, by, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(bx + 1, by + 1, w - 2, h * 0.35);
  ctx.fillStyle = dark;
  ctx.fillRect(bx + w - 2, by + 1, 2, h - 1);
  ctx.fillRect(bx + 1, by + h - 2, w - 1, 2);

  // One stud per mini-brick
  const sr = w * 0.18;
  const sx = bx + w / 2;
  const sy = by + h * 0.38;
  ctx.fillStyle = dark;
  ctx.beginPath(); ctx.arc(sx + 1, sy + 1, sr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath(); ctx.arc(sx - sr * 0.3, sy - sr * 0.3, sr * 0.42, 0, Math.PI * 2); ctx.fill();
}

export function drawEnemies(ctx) {
  const gap = 1;
  const half = CONFIG.enemySize / 2 - gap / 2;

  for (const enemy of enemies) {
    const { x, y, colors } = enemy;
    drawMiniBrick(ctx, x,              y,              half, half, colors[0]);
    drawMiniBrick(ctx, x + half + gap, y,              half, half, colors[1]);
    drawMiniBrick(ctx, x,              y + half + gap, half, half, colors[2]);
    drawMiniBrick(ctx, x + half + gap, y + half + gap, half, half, colors[3]);
  }
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
