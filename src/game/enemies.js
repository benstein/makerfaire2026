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
    drawYeti(ctx, enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.w / 2);
  }
}

function drawYeti(ctx, cx, cy, r) {
  // Fluffy body — layered circles for fur effect
  for (let i = 3; i >= 0; i--) {
    ctx.fillStyle = i % 2 === 0 ? '#ddeeff' : '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.15, r * (0.85 + i * 0.05), 0, Math.PI * 2);
    ctx.fill();
  }

  // Shaggy fur bumps around the body
  ctx.fillStyle = '#cce4ff';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.88, cy + r * 0.15 + Math.sin(a) * r * 0.88, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head
  ctx.fillStyle = '#eef6ff';
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.55, r * 0.52, 0, Math.PI * 2);
  ctx.fill();

  // Fur on head top
  ctx.fillStyle = '#cce4ff';
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + (i / 4) * Math.PI;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.46, cy - r * 0.55 + Math.sin(a) * r * 0.46, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes — big googly whites
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(cx - r * 0.18, cy - r * 0.62, r * 0.17, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.18, cy - r * 0.62, r * 0.17, 0, Math.PI * 2); ctx.fill();
  // Pupils
  ctx.fillStyle = '#cc0000';
  ctx.beginPath(); ctx.arc(cx - r * 0.16, cy - r * 0.60, r * 0.09, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.20, cy - r * 0.60, r * 0.09, 0, Math.PI * 2); ctx.fill();
  // Eye shine
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(cx - r * 0.13, cy - r * 0.63, r * 0.04, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.23, cy - r * 0.63, r * 0.04, 0, Math.PI * 2); ctx.fill();

  // Snarling mouth
  ctx.strokeStyle = '#336699';
  ctx.lineWidth = r * 0.08;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.2, cy - r * 0.42);
  ctx.quadraticCurveTo(cx, cy - r * 0.52, cx + r * 0.2, cy - r * 0.42);
  ctx.stroke();
  // Fangs
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.1, cy - r * 0.44);
  ctx.lineTo(cx - r * 0.06, cy - r * 0.35);
  ctx.lineTo(cx - r * 0.02, cy - r * 0.44);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.02, cy - r * 0.44);
  ctx.lineTo(cx + r * 0.06, cy - r * 0.35);
  ctx.lineTo(cx + r * 0.10, cy - r * 0.44);
  ctx.fill();

  // Arms reaching out
  ctx.strokeStyle = '#cce4ff';
  ctx.lineWidth = r * 0.28;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.7, cy + r * 0.1);
  ctx.lineTo(cx - r * 1.2, cy - r * 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + r * 0.7, cy + r * 0.1);
  ctx.lineTo(cx + r * 1.2, cy - r * 0.2);
  ctx.stroke();
  // Claws
  ctx.strokeStyle = '#336699';
  ctx.lineWidth = r * 0.07;
  for (let s = -1; s <= 1; s++) {
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.2 + s * r * 0.08, cy - r * 0.2);
    ctx.lineTo(cx - r * 1.35 + s * r * 0.12, cy - r * 0.38);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + r * 1.2 + s * r * 0.08, cy - r * 0.2);
    ctx.lineTo(cx + r * 1.35 + s * r * 0.12, cy - r * 0.38);
    ctx.stroke();
  }
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
