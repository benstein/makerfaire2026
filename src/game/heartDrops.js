// src/game/heartDrops.js
// Heart pickups from fire posts

import { aabb } from './collision.js';

let hearts = [];

export function resetHeartDrops() {
  hearts = [];
}

export function spawnHeartDrop(x, y) {
  hearts.push({
    x: x - 8, y: y - 8, w: 16, h: 16,
    spawnTime: performance.now(),
    lifetime: 10000,
  });
}

export function updateHeartDrops(playerBounds, healFn, now) {
  for (let i = hearts.length - 1; i >= 0; i--) {
    const h = hearts[i];
    if (now - h.spawnTime > h.lifetime) { hearts.splice(i, 1); continue; }
    if (aabb(playerBounds, h)) { healFn(1); hearts.splice(i, 1); }
  }
}

export function drawHeartDrops(ctx, now) {
  for (const h of hearts) {
    const cx = h.x + h.w / 2, cy = h.y + h.h / 2;
    const age = now - h.spawnTime;
    if (h.lifetime - age < 2500 && Math.floor(age / 150) % 2 === 0) continue;

    const bob = Math.sin(age / 300) * 3;
    ctx.save();
    ctx.translate(cx, cy + bob);
    const s = 7;
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(0, s * 0.4);
    ctx.bezierCurveTo(-s, -s * 0.3, -s * 0.6, -s, 0, -s * 0.4);
    ctx.bezierCurveTo(s * 0.6, -s, s, -s * 0.3, 0, s * 0.4);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(-s * 0.3, -s * 0.3, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
