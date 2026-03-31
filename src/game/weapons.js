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

const RAINBOW = ['#ff6b6b', '#ffa500', '#ffd700', '#69ff69', '#69b4ff', '#b469ff'];

export function drawProjectiles(ctx) {
  const now = performance.now();
  for (let i = 0; i < projectiles.length; i++) {
    const p = projectiles[i];
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const size = p.w * 0.7;

    // Rainbow sparkle trail
    for (let t = 1; t <= 4; t++) {
      const tx = cx - p.vx * t * 2.5;
      const ty = cy - p.vy * t * 2.5;
      ctx.globalAlpha = 0.5 - t * 0.1;
      ctx.fillStyle = RAINBOW[(i + t) % RAINBOW.length];
      ctx.beginPath();
      ctx.arc(tx, ty, size * (1 - t * 0.18), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Heart projectile
    const pulse = 1 + Math.sin(now / 80 + i) * 0.15;
    ctx.fillStyle = '#ff69b4';
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.moveTo(0, size * 0.3);
    ctx.bezierCurveTo(-size, -size * 0.3, -size, -size, 0, -size * 0.5);
    ctx.bezierCurveTo(size, -size, size, -size * 0.3, 0, size * 0.3);
    ctx.fill();

    // Glow
    ctx.fillStyle = 'rgba(255,180,220,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, size * 0.15);
    ctx.bezierCurveTo(-size * 0.5, -size * 0.15, -size * 0.5, -size * 0.5, 0, -size * 0.25);
    ctx.bezierCurveTo(size * 0.5, -size * 0.5, size * 0.5, -size * 0.15, 0, size * 0.15);
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
