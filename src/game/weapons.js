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

  const fartSize = CONFIG.projectileSize * 2.5;
  const directions = 24;
  for (let i = 0; i < directions; i++) {
    const angle = (i / directions) * Math.PI * 2;
    projectiles.push({
      x: playerPos.x - fartSize / 2,
      y: playerPos.y - fartSize / 2,
      w: fartSize,
      h: fartSize,
      vx: Math.cos(angle) * CONFIG.projectileSpeed,
      vy: Math.sin(angle) * CONFIG.projectileSpeed,
      born: performance.now(),
    });
  }
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
    const age = performance.now() - (p.born || 0);
    const wobble = Math.sin(age * 0.01) * 2;
    const s = CONFIG.projectileSize;

    ctx.save();
    ctx.translate(cx + wobble, cy);

    // Main fart cloud
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#8BC34A';
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Secondary puff
    ctx.fillStyle = '#9CCC65';
    ctx.beginPath();
    ctx.arc(-s * 0.4, -s * 0.3, s * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Small wisp
    ctx.fillStyle = '#7CB342';
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(s * 0.3, s * 0.2, s * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Stink lines
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = '#689F38';
    ctx.lineWidth = 1.5;
    const wave = Math.sin(age * 0.008) * 3;
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.8);
    ctx.quadraticCurveTo(-s * 0.1 + wave, -s * 1.2, -s * 0.3, -s * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.2, -s * 0.7);
    ctx.quadraticCurveTo(s * 0.3 + wave, -s * 1.1, s * 0.1, -s * 1.4);
    ctx.stroke();

    ctx.restore();
  }
}

export function getProjectiles() {
  return projectiles;
}

export function removeProjectile(index) {
  projectiles.splice(index, 1);
}
