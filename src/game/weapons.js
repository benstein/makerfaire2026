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
    // Banana spins as it flies, oriented to flight direction
    const angle = Math.atan2(p.vy, p.vx) + (Date.now() / 80) % (Math.PI * 2);
    const len = p.w * 1.6;
    const thick = p.w * 0.55;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Banana body: yellow crescent
    ctx.fillStyle = '#ffe14a';
    ctx.beginPath();
    ctx.ellipse(0, 0, len * 0.55, thick * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();
    // Curve highlight (lighter top)
    ctx.fillStyle = '#fff39e';
    ctx.beginPath();
    ctx.ellipse(0, -thick * 0.25, len * 0.45, thick * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    // Brown tip (right end)
    ctx.fillStyle = '#6b3a1a';
    ctx.beginPath();
    ctx.arc(len * 0.55, 0, thick * 0.28, 0, Math.PI * 2);
    ctx.fill();
    // Brown stem (left end)
    ctx.fillStyle = '#4a2a14';
    ctx.fillRect(-len * 0.65, -thick * 0.15, thick * 0.35, thick * 0.3);

    ctx.restore();
  }
}

export function getProjectiles() {
  return projectiles;
}

export function removeProjectile(index) {
  projectiles.splice(index, 1);
}
