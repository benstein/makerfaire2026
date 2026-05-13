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
  const now = Date.now();
  for (const p of projectiles) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const r = p.w * 0.55;
    // Each tuft gets its own rainbow hue that cycles
    const hue = (now / 5 + p.x * 0.7 + p.y * 0.3) % 360;
    const phase = now / 90;

    // Trailing sparkle trail
    for (let t = 1; t <= 4; t++) {
      const tx = cx - p.vx * t * 1.3;
      const ty = cy - p.vy * t * 1.3;
      const alpha = 0.55 - t * 0.11;
      const trailHue = (hue + t * 25) % 360;
      ctx.fillStyle = `hsla(${trailHue}, 95%, 65%, ${alpha})`;
      ctx.beginPath();
      ctx.arc(tx, ty, r * (0.75 - t * 0.13), 0, Math.PI * 2);
      ctx.fill();
    }

    // Fluffy Truffula tuft — bumpy spinning ball
    const bumps = 11;
    ctx.fillStyle = `hsl(${hue}, 95%, 58%)`;
    ctx.beginPath();
    for (let i = 0; i < bumps; i++) {
      const a = (i / bumps) * Math.PI * 2 + phase * 0.06;
      const bump = r * (1 + 0.28 * Math.sin(a * 3 + phase * 0.12));
      const px = cx + Math.cos(a) * bump;
      const py = cy + Math.sin(a) * bump;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Bright inner layer
    ctx.fillStyle = `hsl(${(hue + 30) % 360}, 100%, 74%)`;
    ctx.beginPath();
    for (let i = 0; i < bumps; i++) {
      const a = (i / bumps) * Math.PI * 2 + phase * 0.06 + 0.15;
      const bump = r * (0.65 + 0.12 * Math.sin(a * 3 + phase));
      const px = cx + Math.cos(a) * bump;
      const py = cy + Math.sin(a) * bump;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Shiny highlight
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.32, cy - r * 0.32, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function getProjectiles() {
  return projectiles;
}

export function removeProjectile(index) {
  projectiles.splice(index, 1);
}
