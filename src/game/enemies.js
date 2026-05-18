// src/game/enemies.js

import { CONFIG } from './config.js';
import { getGameProgress } from './gameState.js';
import { project3D } from './rendering.js';

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

// Parse CONFIG.enemyColor (#rrggbb) once for shading
function shadeColor(hex, factor) {
  const r = Math.min(255, Math.round(parseInt(hex.slice(1,3), 16) * factor));
  const g = Math.min(255, Math.round(parseInt(hex.slice(3,5), 16) * factor));
  const b = Math.min(255, Math.round(parseInt(hex.slice(5,7), 16) * factor));
  return `rgb(${r},${g},${b})`;
}

function quad(ctx, p1, p2, p3, p4, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(p1.x, p1.y);
  ctx.lineTo(p2.x, p2.y);
  ctx.lineTo(p3.x, p3.y);
  ctx.lineTo(p4.x, p4.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

export function drawEnemies(ctx, canvasW, canvasH) {
  const sorted = [...enemies].sort((a, b) => a.y - b.y);
  const base = CONFIG.enemyColor;

  for (const enemy of sorted) {
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;
    const S  = enemy.w; // world-space cube side length

    // Project the 4 corners of the cube's base footprint
    const fl = project3D(cx - S/2, cy,     canvasW, canvasH); // front-left
    const fr = project3D(cx + S/2, cy,     canvasW, canvasH); // front-right
    const br = project3D(cx + S/2, cy - S, canvasW, canvasH); // back-right
    const bl = project3D(cx - S/2, cy - S, canvasW, canvasH); // back-left

    // Cube height on screen (based on scale at the cube's midpoint)
    const midScale = project3D(cx, cy - S/2, canvasW, canvasH).scale;
    const h = S * midScale * 1.6; // slight vertical exaggeration

    // Top corners = base corners shifted up by h
    const flt = { x: fl.x, y: fl.y - h };
    const frt = { x: fr.x, y: fr.y - h };
    const brt = { x: br.x, y: br.y - h };
    const blt = { x: bl.x, y: bl.y - h };

    // Draw faces back → front (painter's algorithm)
    quad(ctx, bl, br, brt, blt, shadeColor(base, 0.40)); // back face
    quad(ctx, bl, fl, flt, blt, shadeColor(base, 0.60)); // left side
    quad(ctx, fr, br, brt, frt, shadeColor(base, 0.50)); // right side
    quad(ctx, blt, brt, frt, flt, shadeColor(base, 1.35)); // top face (brightest)
    quad(ctx, fl, fr, frt, flt, shadeColor(base, 1.00));   // front face (base color)
  }
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
