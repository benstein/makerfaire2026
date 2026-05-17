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
    angle: Math.atan2(facing.y, facing.x),
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
    drawSword(ctx, p.x + p.w / 2, p.y + p.h / 2, p.angle);
  }
}

function drawSword(ctx, cx, cy, angle) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle); // point nose in direction of travel

  const BL = 22;  // blade length
  const BW = 3;   // blade half-width
  const GL = 9;   // guard half-span
  const GW = 3;   // guard thickness
  const HL = 9;   // handle length
  const HW = 2.5; // handle half-width

  // Blade (silver with gradient sheen)
  const bladeGrad = ctx.createLinearGradient(0, -BW, 0, BW);
  bladeGrad.addColorStop(0,   '#e8eaf0');
  bladeGrad.addColorStop(0.4, '#ffffff');
  bladeGrad.addColorStop(1,   '#9aa0b0');
  ctx.fillStyle = bladeGrad;
  ctx.strokeStyle = '#5a6070';
  ctx.lineWidth = 0.8;
  // Blade tapers to a point at the front
  ctx.beginPath();
  ctx.moveTo(BL, 0);               // tip
  ctx.lineTo(2,  -BW);
  ctx.lineTo(-4, -BW);
  ctx.lineTo(-4,  BW);
  ctx.lineTo(2,   BW);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Center fuller (groove down the blade)
  ctx.strokeStyle = 'rgba(100,110,130,0.5)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(BL - 4, 0);
  ctx.lineTo(-2, 0);
  ctx.stroke();

  // Crossguard (gold)
  ctx.fillStyle = '#e8b420';
  ctx.strokeStyle = '#9a7010';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.roundRect(-6, -GL, GW, GL * 2, 1.5);
  ctx.fill();
  ctx.stroke();
  // Guard gems (tiny ruby dots)
  ctx.fillStyle = '#cc2244';
  ctx.beginPath(); ctx.arc(-4.5, -GL + 2.5, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-4.5,  GL - 2.5, 1.6, 0, Math.PI * 2); ctx.fill();

  // Handle (wrapped grip — dark brown with wrap lines)
  ctx.fillStyle = '#5a3010';
  ctx.strokeStyle = '#3a1800';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.roundRect(-6 - HL, -HW, HL, HW * 2, 2);
  ctx.fill();
  ctx.stroke();
  // Wrap bands
  ctx.strokeStyle = '#8a5828';
  ctx.lineWidth = 1.2;
  for (let i = 1; i < 4; i++) {
    const hx = -6 - (HL * i / 4);
    ctx.beginPath();
    ctx.moveTo(hx, -HW);
    ctx.lineTo(hx,  HW);
    ctx.stroke();
  }

  // Pommel (round cap at end)
  ctx.fillStyle = '#e8b420';
  ctx.strokeStyle = '#9a7010';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(-6 - HL, 0, HW + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function getProjectiles() {
  return projectiles;
}

export function removeProjectile(index) {
  projectiles.splice(index, 1);
}
