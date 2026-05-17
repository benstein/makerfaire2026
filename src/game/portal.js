// src/game/portal.js
// One portal per map in a random spot — player-only warp

import { aabb } from './collision.js';

const PORTAL_SIZE = 30;

let px, py;

export function resetPortal(arenaWidth, arenaHeight) {
  // Place randomly, avoiding edges and center (where player spawns)
  const margin = 60;
  for (let tries = 0; tries < 20; tries++) {
    px = margin + Math.random() * (arenaWidth - margin * 2);
    py = margin + Math.random() * (arenaHeight - margin * 2);
    // Avoid center where player spawns
    const dx = px - arenaWidth / 2;
    const dy = py - arenaHeight / 2;
    if (Math.sqrt(dx * dx + dy * dy) > 100) break;
  }
}

export function getPortalBounds() {
  return { x: px - PORTAL_SIZE / 2, y: py - PORTAL_SIZE / 2, w: PORTAL_SIZE, h: PORTAL_SIZE };
}

export function checkPortalCollision(playerBounds) {
  return aabb(playerBounds, getPortalBounds());
}

export function drawPortal(ctx, now) {
  const time = now / 1000;
  const cx = px;
  const cy = py;
  const r = PORTAL_SIZE / 2;

  // Outer glow ring — pulsing
  const glowPulse = 0.15 + Math.sin(time * 3) * 0.08;
  ctx.fillStyle = `rgba(150, 50, 255, ${glowPulse})`;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 12, 0, Math.PI * 2);
  ctx.fill();

  // Spinning outer ring
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 2);
  ctx.strokeStyle = '#9b59b6';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, r + 4, 0, Math.PI * 1.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r + 4, Math.PI * 1.4, Math.PI * 2.6);
  ctx.stroke();
  ctx.restore();

  // Inner swirling void
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-time * 3);

  // Dark center
  ctx.fillStyle = '#1a0a2e';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Swirl arms
  for (let arm = 0; arm < 3; arm++) {
    const angle = (arm / 3) * Math.PI * 2;
    ctx.strokeStyle = `rgba(180, 100, 255, 0.5)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let t = 0; t < 1; t += 0.05) {
      const spiralR = t * r * 0.9;
      const spiralAngle = angle + t * Math.PI * 2;
      const sx = Math.cos(spiralAngle) * spiralR;
      const sy = Math.sin(spiralAngle) * spiralR;
      if (t === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Sparkles orbiting
  for (let i = 0; i < 5; i++) {
    const sparkAngle = time * 4 + (i / 5) * Math.PI * 2;
    const sparkR = r + 6 + Math.sin(time * 5 + i * 3) * 4;
    const sx = cx + Math.cos(sparkAngle) * sparkR;
    const sy = cy + Math.sin(sparkAngle) * sparkR;
    const sparkAlpha = 0.4 + Math.sin(time * 8 + i) * 0.3;
    ctx.fillStyle = `rgba(200, 150, 255, ${sparkAlpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Center bright dot
  const centerPulse = 0.5 + Math.sin(time * 5) * 0.3;
  ctx.fillStyle = `rgba(220, 180, 255, ${centerPulse})`;
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();
}
