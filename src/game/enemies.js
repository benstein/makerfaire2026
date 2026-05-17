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

  enemies.push({ x: ex, y: ey, w: CONFIG.enemySize, h: CONFIG.enemySize, hue: Math.random() * 360 });
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
  const t = performance.now() / 1000;
  for (const enemy of enemies) {
    drawPoofyGoogly(ctx, enemy, t);
  }
}

function drawPoofyGoogly(ctx, enemy, t) {
  const cx  = enemy.x + enemy.w / 2;
  const cy  = enemy.y + enemy.h / 2;
  const r   = enemy.w / 2 + 5; // poofy — slightly bigger than hitbox
  const hue = ((enemy.hue || 0) + t * 35) % 360;
  const hue2 = (hue + 140) % 360;
  const bob  = Math.sin(t * 2.2 + (enemy.hue || 0) * 0.05) * 2.5;

  // Poofy bumps (drawn first, behind body)
  const numBumps = 7;
  ctx.fillStyle = `hsl(${hue2}, 90%, 52%)`;
  for (let i = 0; i < numBumps; i++) {
    const a  = (i / numBumps) * Math.PI * 2;
    const bx = cx + Math.cos(a) * r * 0.84;
    const by = cy + bob + Math.sin(a) * r * 0.84;
    ctx.beginPath();
    ctx.arc(bx, by, r * 0.40, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main body (radial gradient, shiny)
  const bodyGrad = ctx.createRadialGradient(cx - r * 0.22, cy + bob - r * 0.22, 0, cx, cy + bob, r * 0.88);
  bodyGrad.addColorStop(0, `hsl(${hue}, 100%, 82%)`);
  bodyGrad.addColorStop(1, `hsl(${hue}, 90%, 48%)`);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(cx, cy + bob, r * 0.88, 0, Math.PI * 2);
  ctx.fill();

  // Googly eyes
  const eyes = [{ ox: -r * 0.29, oy: -r * 0.15 }, { ox: r * 0.29, oy: -r * 0.15 }];
  const eyeR   = r * 0.30;
  const pupilR = eyeR * 0.50;
  const drift  = eyeR - pupilR;
  for (const e of eyes) {
    const ex2 = cx + e.ox;
    const ey2 = cy + bob + e.oy;
    // White of eye
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ex2, ey2, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.8;
    ctx.stroke();
    // Drifting pupil
    const px2 = ex2 + Math.cos(t * 1.1 + e.ox * 3) * drift * 0.75;
    const py2 = ey2 + Math.sin(t * 1.5 + e.ox)    * drift * 0.75;
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(px2, py2, pupilR, 0, Math.PI * 2); ctx.fill();
    // Shine
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(px2 - pupilR * 0.32, py2 - pupilR * 0.32, pupilR * 0.32, 0, Math.PI * 2); ctx.fill();
  }

  // Goofy smile + buck teeth
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy + bob + r * 0.24, r * 0.30, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.fillStyle = '#fffef0';
  const tw = r * 0.13;
  ctx.fillRect(cx - tw - 1, cy + bob + r * 0.24, tw, r * 0.14);
  ctx.fillRect(cx + 1,       cy + bob + r * 0.24, tw, r * 0.14);
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
