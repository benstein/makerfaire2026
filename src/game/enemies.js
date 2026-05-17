// src/game/enemies.js

import { CONFIG } from './config.js';
import { getGameProgress } from './gameState.js';
import { isMarioMode } from './portal.js';

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
    if (isMarioMode()) {
      drawGoomba(ctx, enemy);
    } else {
      ctx.fillStyle = enemy.hitFlash > 0
        ? `rgba(255,255,255,${enemy.hitFlash})`
        : CONFIG.enemyColor;
      ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
      drawHpPips(ctx, enemy);
    }
  }
}

function drawHpPips(ctx, enemy) {
  const pipSize = 5, pipGap = 3;
  const totalW = enemy.maxHp * pipSize + (enemy.maxHp - 1) * pipGap;
  const sx = enemy.x + (enemy.w - totalW) / 2;
  const py = enemy.y - 8;
  for (let i = 0; i < enemy.maxHp; i++) {
    ctx.fillStyle = i < enemy.hp ? '#2ecc71' : '#444';
    ctx.fillRect(sx + i * (pipSize + pipGap), py, pipSize, pipSize);
  }
}

function drawGoomba(ctx, enemy) {
  const cx = enemy.x + enemy.w / 2;
  const cy = enemy.y + enemy.h / 2;
  const r  = enemy.w / 2;

  // Flash white on hit
  if (enemy.hitFlash > 0) {
    ctx.globalAlpha = enemy.hitFlash;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
    drawHpPips(ctx, enemy);
    return;
  }

  // Feet
  ctx.fillStyle = '#4a2000';
  ctx.beginPath(); ctx.ellipse(cx - r * 0.3, cy + r * 0.78, r * 0.32, r * 0.18, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + r * 0.3, cy + r * 0.78, r * 0.32, r * 0.18,  0.3, 0, Math.PI * 2); ctx.fill();

  // Body
  ctx.fillStyle = '#a05010';
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.1, r * 0.9, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();

  // Lighter top cap
  ctx.fillStyle = '#c07020';
  ctx.beginPath(); ctx.ellipse(cx, cy - r * 0.18, r * 0.82, r * 0.55, 0, Math.PI, Math.PI * 2); ctx.fill();

  // Belly patch
  ctx.fillStyle = '#e8b060';
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.3, r * 0.42, r * 0.32, 0, 0, Math.PI * 2); ctx.fill();

  // Eyes (white)
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.1, r * 0.24, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.3, cy - r * 0.1, r * 0.24, 0, Math.PI * 2); ctx.fill();
  // Pupils
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(cx - r * 0.22, cy - r * 0.08, r * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.22, cy - r * 0.08, r * 0.13, 0, Math.PI * 2); ctx.fill();

  // Angry eyebrows
  ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - r * 0.46, cy - r * 0.32); ctx.lineTo(cx - r * 0.12, cy - r * 0.24); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + r * 0.46, cy - r * 0.32); ctx.lineTo(cx + r * 0.12, cy - r * 0.24); ctx.stroke();

  // Frown
  ctx.beginPath(); ctx.arc(cx, cy + r * 0.38, r * 0.22, 0.1, Math.PI - 0.1); ctx.stroke();

  drawHpPips(ctx, enemy);
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
