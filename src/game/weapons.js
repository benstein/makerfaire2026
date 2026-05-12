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

    // Frosty mist trail (drawn in world space, not rotated)
    ctx.fillStyle = 'rgba(220, 240, 255, 0.35)';
    for (let t = 1; t <= 3; t++) {
      const tx = cx - p.vx * t * 1.4;
      const ty = cy - p.vy * t * 1.4;
      ctx.beginPath();
      ctx.arc(tx, ty, thick * (0.9 - t * 0.2), 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // Frosty halo around the banana — pale ice glow
    ctx.fillStyle = 'rgba(180, 220, 240, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 0, len * 0.75, thick * 1.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Banana body: muted icy yellow (frozen, not vivid)
    ctx.fillStyle = '#cfd8c8';
    ctx.beginPath();
    ctx.ellipse(0, 0, len * 0.55, thick * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pale blue ice tint over the surface
    ctx.fillStyle = 'rgba(150, 200, 230, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 0, len * 0.55, thick * 0.9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Crisp ice highlight along the top edge
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.ellipse(0, -thick * 0.35, len * 0.45, thick * 0.20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Frost dots / ice crystals scattered on top
    ctx.fillStyle = '#ffffff';
    const dots = [
      [-len * 0.30,  thick * 0.10, thick * 0.12],
      [ len * 0.10, -thick * 0.05, thick * 0.10],
      [ len * 0.30,  thick * 0.20, thick * 0.09],
      [-len * 0.05,  thick * 0.30, thick * 0.08],
    ];
    for (const [dx, dy, r] of dots) {
      ctx.beginPath();
      ctx.arc(dx, dy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tiny six-point ice crystal
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    const crystalR = thick * 0.32;
    ctx.save();
    ctx.translate(-len * 0.15, -thick * 0.20);
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -crystalR);
      ctx.stroke();
    }
    ctx.restore();

    // Frozen tips — pale, frosted instead of brown
    ctx.fillStyle = '#a8c0d0';
    ctx.beginPath();
    ctx.arc(len * 0.55, 0, thick * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8aa6b8';
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
