// src/game/xpOrbs.js
// XP orbs dropped by defeated enemies

import { aabb } from './collision.js';

let orbs = [];

export function resetXPOrbs() {
  orbs = [];
}

export function spawnXPOrb(x, y) {
  // Scatter slightly from death position
  const angle = Math.random() * Math.PI * 2;
  const dist = 5 + Math.random() * 10;
  orbs.push({
    x: x + Math.cos(angle) * dist - 6,
    y: y + Math.sin(angle) * dist - 6,
    w: 12,
    h: 12,
    spawnTime: performance.now(),
    lifetime: 12000, // 12 seconds to pick up
  });
}

export function updateXPOrbs(playerBounds, now) {
  let collected = 0;
  for (let i = orbs.length - 1; i >= 0; i--) {
    const orb = orbs[i];

    // Expire old orbs
    if (now - orb.spawnTime > orb.lifetime) {
      orbs.splice(i, 1);
      continue;
    }

    // Magnetic pull — orbs drift toward player when close
    const orbCx = orb.x + orb.w / 2;
    const orbCy = orb.y + orb.h / 2;
    const playerCx = playerBounds.x + playerBounds.w / 2;
    const playerCy = playerBounds.y + playerBounds.h / 2;
    const dx = playerCx - orbCx;
    const dy = playerCy - orbCy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 60) {
      const pull = 2 * (1 - dist / 60);
      orb.x += (dx / dist) * pull;
      orb.y += (dy / dist) * pull;
    }

    // Collect on touch
    if (aabb(playerBounds, orb)) {
      orbs.splice(i, 1);
      collected++;
    }
  }
  return collected;
}

export function drawXPOrbs(ctx, now) {
  for (const orb of orbs) {
    const age = now - orb.spawnTime;
    const cx = orb.x + orb.w / 2;
    const cy = orb.y + orb.h / 2;

    // Blink when about to expire
    if (orb.lifetime - age < 3000) {
      if (Math.floor(age / 150) % 2 === 0) continue;
    }

    // Bob up and down
    const bob = Math.sin(age / 250) * 2;

    ctx.save();
    ctx.translate(cx, cy + bob);

    // Outer glow
    const glowPulse = 0.3 + Math.sin(age / 200) * 0.15;
    ctx.fillStyle = `rgba(100, 200, 255, ${glowPulse})`;
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Core orb — bright cyan/blue
    ctx.fillStyle = '#4AF';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright spot
    ctx.fillStyle = '#AEF';
    ctx.beginPath();
    ctx.arc(-1, -1, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-2, -2, 1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
