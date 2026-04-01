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

export function drawProjectiles(ctx, now) {
  for (const p of projectiles) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const r = p.w * 0.7;
    const time = now || performance.now();

    ctx.save();
    ctx.translate(cx, cy);
    // Spin the fireball
    ctx.rotate((time / 80) % (Math.PI * 2));

    // Outer glow (orange)
    ctx.fillStyle = '#FF6600';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Inner core (yellow/white)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Flame trails (4 little flames)
    ctx.fillStyle = '#FF4500';
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const fx = Math.cos(angle) * r * 0.8;
      const fy = Math.sin(angle) * r * 0.8;
      ctx.beginPath();
      ctx.arc(fx, fy, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function getProjectiles() {
  return projectiles;
}

export function removeProjectile(index) {
  projectiles.splice(index, 1);
}
