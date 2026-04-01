// src/game/pickups.js
// Heart pickups dropped by defeated Goombas

import { CONFIG } from './config.js';
import { aabb } from './collision.js';

let pickups = [];

export function resetPickups() {
  pickups = [];
}

export function spawnHeart(x, y) {
  pickups.push({
    x: x - 8,
    y: y - 8,
    w: 16,
    h: 16,
    type: 'heart',
    spawnTime: performance.now(),
    lifetime: 8000, // disappears after 8 seconds
  });
}

export function updatePickups(playerBounds, healFn, now) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];

    // Remove expired pickups
    if (now - p.spawnTime > p.lifetime) {
      pickups.splice(i, 1);
      continue;
    }

    // Check player pickup
    if (aabb(playerBounds, p)) {
      if (p.type === 'heart') {
        healFn(1);
      }
      pickups.splice(i, 1);
    }
  }
}

export function drawPickups(ctx, now) {
  for (const p of pickups) {
    if (p.type === 'heart') {
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      const age = now - p.spawnTime;

      // Blink when about to expire (last 2 seconds)
      if (p.lifetime - age < 2000) {
        if (Math.floor(age / 150) % 2 === 0) continue;
      }

      // Gentle bob up and down
      const bob = Math.sin(age / 300) * 3;

      ctx.save();
      ctx.translate(cx, cy + bob);

      // Draw a heart shape
      const s = 7;
      ctx.fillStyle = '#E52521';
      ctx.beginPath();
      ctx.moveTo(0, s * 0.4);
      ctx.bezierCurveTo(-s, -s * 0.3, -s * 0.6, -s, 0, -s * 0.4);
      ctx.bezierCurveTo(s * 0.6, -s, s, -s * 0.3, 0, s * 0.4);
      ctx.fill();

      // Shiny highlight
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.beginPath();
      ctx.arc(-s * 0.3, -s * 0.3, s * 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}
