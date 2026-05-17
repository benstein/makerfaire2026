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
  const t = performance.now() / 1000;
  for (let i = 0; i < projectiles.length; i++) {
    const p   = projectiles[i];
    const cx2 = p.x + p.w / 2;
    const cy2 = p.y + p.h / 2;
    const r   = p.w / 2;
    const hue = (t * 120 + i * 47) % 360;

    ctx.save();
    ctx.shadowBlur  = 10;
    ctx.shadowColor = `hsl(${hue}, 100%, 65%)`;
    // Glowing orb
    const grad = ctx.createRadialGradient(cx2 - r * 0.3, cy2 - r * 0.3, 0, cx2, cy2, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, `hsl(${hue}, 100%, 75%)`);
    grad.addColorStop(1,   `hsl(${(hue + 60) % 360}, 100%, 55%)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx2, cy2, r, 0, Math.PI * 2);
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
