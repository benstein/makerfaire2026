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

  const LEGO_COLORS = ['#cc2200','#0055bf','#f5c400','#237a22','#ff7000','#ffffff','#9c0093'];
  const color = LEGO_COLORS[Math.floor(Math.random() * LEGO_COLORS.length)];
  const dark  = color === '#ffffff' ? '#aaaaaa' : blendDark(color);
  enemies.push({ x: ex, y: ey, w: CONFIG.enemySize, h: CONFIG.enemySize, color, dark });
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
    drawBrick(ctx, enemy);
  }
}

function blendDark(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgb(${Math.round(r*0.6)},${Math.round(g*0.6)},${Math.round(b*0.6)})`;
}

function drawBrick(ctx, e) {
  const { x, y, w, h, color, dark } = e;
  const bx = Math.round(x), by = Math.round(y);

  // Brick body
  ctx.fillStyle = color;
  ctx.fillRect(bx, by, w, h);
  // Top highlight
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(bx + 2, by + 2, w - 4, h * 0.35);
  // Right + bottom shadow
  ctx.fillStyle = dark;
  ctx.fillRect(bx + w - 3, by + 2, 3, h - 2);
  ctx.fillRect(bx + 2, by + h - 3, w - 2, 3);

  // Two studs
  const sr = w * 0.17;
  const sy = by + h * 0.38;
  for (let i = 0; i < 2; i++) {
    const sx = bx + w * (0.29 + i * 0.42);
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.arc(sx + 1, sy + 1, sr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.arc(sx - sr * 0.3, sy - sr * 0.3, sr * 0.42, 0, Math.PI * 2); ctx.fill();
  }
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
