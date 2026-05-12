// src/game/weapons.js

import { CONFIG } from './config.js';

let projectiles = [];
let lastFireTime = 0;

export function resetWeapons() {
  projectiles = [];
  lastFireTime = 0;
}

export function tryFire(playerPos, facing, now) {
  if (now - lastFireTime < CONFIG.fireRateCooldown) return;
  lastFireTime = now;

  projectiles.push({
    x: playerPos.x - CONFIG.projectileSize / 2,
    y: playerPos.y - CONFIG.projectileSize / 2,
    w: CONFIG.projectileSize,
    h: CONFIG.projectileSize,
    vx: facing.x * CONFIG.projectileSpeed,
    vy: facing.y * CONFIG.projectileSpeed,
  });
}

export function updateProjectiles(dt, arenaWidth, arenaHeight) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    const scale = dt / 16.67;
    p.x += p.vx * scale;
    p.y += p.vy * scale;

    if (p.x < -50 || p.x > arenaWidth + 50 || p.y < -50 || p.y > arenaHeight + 50) {
      projectiles.splice(i, 1);
    }
  }
}

export function drawProjectiles(ctx) {
  for (const p of projectiles) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const angle = Math.atan2(p.vy, p.vx);
    const r = p.w * 1.4;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + Math.PI / 2);

    // Banana body (curved crescent)
    ctx.fillStyle = '#ffe135';
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI * 0.1, Math.PI * 0.9);
    ctx.arc(0, r * 0.3, r * 0.65, Math.PI * 0.85, Math.PI * 0.15, true);
    ctx.closePath();
    ctx.fill();

    // Banana tip highlights
    ctx.fillStyle = '#c8a800';
    ctx.beginPath();
    ctx.arc(-r * Math.sin(0.1), -r * Math.cos(0.1) + r * 0.05, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * Math.sin(0.1), -r * Math.cos(0.1) + r * 0.05, r * 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export function getProjectiles() {
  return projectiles;
}

export function removeProjectile(index) {
  projectiles.splice(index, 1);
}
