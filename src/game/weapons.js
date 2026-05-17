// src/game/weapons.js

import { CONFIG } from './config.js';

let projectiles = [];
let lastFireTime = 0;

const TRAIL_LEN = 10;

export function resetWeapons() {
  projectiles = [];
  lastFireTime = 0;
}

export function tryFire(playerPos, facing, now) {
  if (now - lastFireTime < CONFIG.fireRateCooldown) return;
  lastFireTime = now;

  const speed = CONFIG.projectileSpeed;
  projectiles.push({
    x:     playerPos.x - CONFIG.projectileSize / 2,
    y:     playerPos.y - CONFIG.projectileSize / 2,
    w:     CONFIG.projectileSize,
    h:     CONFIG.projectileSize,
    vx:    facing.x * speed,
    vy:    facing.y * speed,
    trail: [],         // [{x,y}] ring buffer
    spawnTime: now,
  });
}

export function updateProjectiles(dt, arenaWidth, arenaHeight) {
  const scale = dt / 16.67;
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
    p.trail.push({ x: cx, y: cy });
    if (p.trail.length > TRAIL_LEN) p.trail.shift();
    p.x += p.vx * scale;
    p.y += p.vy * scale;
    if (p.x < -80 || p.x > arenaWidth + 80 || p.y < -80 || p.y > arenaHeight + 80) {
      projectiles.splice(i, 1);
    }
  }
}

export function drawProjectiles(ctx) {
  const now = performance.now();
  for (const p of projectiles) {
    const cx = Math.round(p.x + p.w / 2);
    const cy = Math.round(p.y + p.h / 2);
    const r  = p.w / 2;
    const angle = Math.atan2(p.vy, p.vx);

    // --- Exhaust trail ---
    for (let t = 0; t < p.trail.length; t++) {
      const frac  = (t + 1) / p.trail.length;
      const tr    = r * 0.55 * frac;
      const alpha = frac * 0.45;
      ctx.fillStyle = `rgba(255, ${Math.round(140 + 80 * frac)}, 0, ${alpha})`;
      ctx.beginPath();
      ctx.arc(p.trail[t].x, p.trail[t].y, tr, 0, Math.PI * 2);
      ctx.fill();
    }

    // --- Torpedo body ---
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Body — dark grey cylinder
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.8, r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose cone — bright orange
    ctx.fillStyle = '#ff6a00';
    ctx.beginPath();
    ctx.moveTo(r * 1.8, 0);
    ctx.lineTo(r * 0.8, -r * 0.55);
    ctx.lineTo(r * 0.8,  r * 0.55);
    ctx.closePath();
    ctx.fill();

    // Fin — rear fins
    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.moveTo(-r * 1.8,  0);
    ctx.lineTo(-r * 0.9, -r * 1.0);
    ctx.lineTo(-r * 0.6,  0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 1.8,  0);
    ctx.lineTo(-r * 0.9,  r * 1.0);
    ctx.lineTo(-r * 0.6,  0);
    ctx.closePath();
    ctx.fill();

    // Engine glow
    const glow = 0.6 + 0.4 * Math.sin(now / 60);
    ctx.fillStyle = `rgba(255, 200, 50, ${glow})`;
    ctx.beginPath();
    ctx.arc(-r * 1.7, 0, r * 0.35, 0, Math.PI * 2);
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
