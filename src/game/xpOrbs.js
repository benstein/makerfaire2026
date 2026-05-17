// src/game/xpOrbs.js
// XP orbs dropped by defeated enemies

import { aabb } from './collision.js';

let orbs = [];

export function resetXPOrbs() {
  orbs = [];
}

export function spawnXPOrb(x, y) {
  const angle = Math.random() * Math.PI * 2;
  const dist = 5 + Math.random() * 10;
  orbs.push({
    x: x + Math.cos(angle) * dist - 6,
    y: y + Math.sin(angle) * dist - 6,
    w: 12, h: 12,
    spawnTime: performance.now(),
    lifetime: 12000,
  });
}

export function updateXPOrbs(playerBounds, now) {
  let collected = 0;
  for (let i = orbs.length - 1; i >= 0; i--) {
    const orb = orbs[i];
    if (now - orb.spawnTime > orb.lifetime) { orbs.splice(i, 1); continue; }

    // Magnetic pull when close
    const ocx = orb.x + 6, ocy = orb.y + 6;
    const pcx = playerBounds.x + playerBounds.w / 2;
    const pcy = playerBounds.y + playerBounds.h / 2;
    const dx = pcx - ocx, dy = pcy - ocy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 60 && dist > 0) {
      const pull = 2.5 * (1 - dist / 60);
      orb.x += (dx / dist) * pull;
      orb.y += (dy / dist) * pull;
    }

    if (aabb(playerBounds, orb)) { orbs.splice(i, 1); collected++; }
  }
  return collected;
}

export function drawXPOrbs(ctx, now) {
  for (const orb of orbs) {
    const age = now - orb.spawnTime;
    const cx = orb.x + 6, cy = orb.y + 6;
    if (orb.lifetime - age < 3000 && Math.floor(age / 150) % 2 === 0) continue;

    const bob = Math.sin(age / 250) * 2;
    ctx.save();
    ctx.translate(cx, cy + bob);

    const glow = 0.3 + Math.sin(age / 200) * 0.15;
    ctx.fillStyle = `rgba(100, 200, 255, ${glow})`;
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#4AF';
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#AEF';
    ctx.beginPath(); ctx.arc(-1, -1, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-2, -2, 1, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }
}
