// src/game/portal.js
// A swirling portal. Walk through it to warp into the Mario world.

import { aabb } from './collision.js';

const PORTAL_W = 54;
const PORTAL_H = 88;

let portal = null;
let _marioMode = false;

export function isMarioMode() { return _marioMode; }

export function resetPortal(arenaWidth, arenaHeight) {
  _marioMode = false;
  portal = {
    x: arenaWidth  * 0.72 - PORTAL_W / 2,
    y: arenaHeight * 0.50 - PORTAL_H / 2,
    w: PORTAL_W,
    h: PORTAL_H,
  };
}

export function updatePortal(playerBounds) {
  if (!portal) return;
  if (aabb(playerBounds, portal)) {
    _marioMode = true;
    portal = null;
  }
}

export function drawPortal(ctx, now) {
  if (!portal) return;
  const cx = portal.x + portal.w / 2;
  const cy = portal.y + portal.h / 2;
  const rx = portal.w / 2;
  const ry = portal.h / 2;
  const t  = now / 1000;

  ctx.save();

  // Pulsing outer glow
  const pulse = (Math.sin(t * 2.5) + 1) / 2;
  ctx.shadowBlur = 24;
  ctx.shadowColor = '#c040ff';

  // Gradient fill
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));
  grad.addColorStop(0,    `rgba(${Math.round(160 + pulse * 70)}, 20, 255, 0.95)`);
  grad.addColorStop(0.5,  `rgba(30, 80, 200, 0.8)`);
  grad.addColorStop(1,    `rgba(50, 0, 110, 0.4)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();

  // Swirl arms
  ctx.shadowBlur = 0;
  for (let arm = 0; arm < 6; arm++) {
    const a = t * 2.4 + (arm / 6) * Math.PI * 2;
    ctx.strokeStyle = `rgba(255,255,255,${0.25 + 0.25 * Math.sin(t * 3 + arm * 1.1)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(a) * rx * 0.88, cy + Math.sin(a) * ry * 0.88);
    ctx.stroke();
  }

  // Sparkles orbiting
  for (let i = 0; i < 6; i++) {
    const sa = t * 3.5 + (i / 6) * Math.PI * 2;
    const sr = Math.max(rx, ry) + 6 + Math.sin(t * 5 + i * 2) * 4;
    ctx.fillStyle = `rgba(210,140,255,${0.4 + Math.sin(t * 7 + i) * 0.3})`;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(sa) * sr * (rx / Math.max(rx, ry)),
            cy + Math.sin(sa) * sr * (ry / Math.max(rx, ry)), 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bright rim
  ctx.shadowBlur = 14;
  ctx.shadowColor = '#ffffff';
  ctx.strokeStyle = '#dda0ff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Blinking ENTER label
  ctx.shadowBlur = 0;
  if (Math.floor(t * 2) % 2 === 0) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ENTER', cx, portal.y + portal.h + 16);
    ctx.textAlign = 'left';
  }

  ctx.restore();
}
