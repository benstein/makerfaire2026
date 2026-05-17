// src/game/portals.js
// 5 Nether portals. Enter one → warp to a random other + TNT appears.
// Enter all 5 → they ALL explode → GAME OVER.

import { aabb } from './collision.js';

const NUM_PORTALS   = 5;
const PORTAL_W      = 52;
const PORTAL_H      = 90;
const FRAME         = 7;
const WARP_COOLDOWN = 1600;
const MARGIN        = 80;
const EXPLODE_DELAY = 700;   // ms of explosion animation before game over

let portals      = [];   // { x, y, w, h, hasTNT }
let lastWarpTime = -WARP_COOLDOWN;
let flashUntil   = 0;
let explodeStart = -1;   // -1 = not exploding

export function resetPortals(arenaWidth, arenaHeight) {
  portals      = [];
  lastWarpTime = -WARP_COOLDOWN;
  flashUntil   = 0;
  explodeStart = -1;
  placePortals(arenaWidth, arenaHeight);
}

function placePortals(aw, ah) {
  const minGap = PORTAL_W * 2.8;
  for (let i = 0; i < NUM_PORTALS; i++) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const x = MARGIN + Math.random() * (aw - MARGIN * 2 - PORTAL_W);
      const y = MARGIN + Math.random() * (ah - MARGIN * 2 - PORTAL_H);
      const cx = x + PORTAL_W / 2, cy = y + PORTAL_H / 2;
      const nearCenter = Math.hypot(cx - aw / 2, cy - ah / 2) < 100;
      const tooClose   = portals.some(p =>
        Math.abs(p.x + PORTAL_W / 2 - cx) < minGap &&
        Math.abs(p.y + PORTAL_H / 2 - cy) < minGap
      );
      if (!nearCenter && !tooClose) {
        portals.push({ x, y, w: PORTAL_W, h: PORTAL_H, hasTNT: false });
        break;
      }
    }
  }
}

// Returns { dest: {x,y}|null, explode: bool }
// dest non-null → teleport player; explode true → call endGame(false)
export function updatePortals(playerBounds, now) {
  // If already counting down to explosion
  if (explodeStart !== -1) {
    if (now - explodeStart >= EXPLODE_DELAY) return { dest: null, explode: true };
    return { dest: null, explode: false };
  }

  if (now - lastWarpTime < WARP_COOLDOWN) return { dest: null, explode: false };

  for (let i = 0; i < portals.length; i++) {
    if (!aabb(playerBounds, portals[i])) continue;

    // Mark this portal as armed with TNT
    portals[i].hasTNT = true;

    // Check if ALL portals are now armed
    if (portals.every(p => p.hasTNT)) {
      explodeStart = now;
      return { dest: null, explode: false }; // explosion animation plays first
    }

    // Normal warp to a random OTHER portal
    const others = portals.filter((_, j) => j !== i);
    const dest   = others[Math.floor(Math.random() * others.length)];
    lastWarpTime = now;
    flashUntil   = now + 280;
    return { dest: { x: dest.x + PORTAL_W / 2, y: dest.y + PORTAL_H / 2 }, explode: false };
  }

  return { dest: null, explode: false };
}

// ─── Drawing ──────────────────────────────────────────────────────────────────

export function drawPortals(ctx, width, height, now) {
  const t = now / 1000;

  for (const p of portals) drawOnePortal(ctx, p, t);
  for (const p of portals) if (p.hasTNT) drawTNT(ctx, p, t);

  // Warp flash
  if (now < flashUntil) {
    const alpha = ((flashUntil - now) / 280) * 0.9;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = '#cc88ff';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // Explosion animation
  if (explodeStart !== -1) {
    const progress = Math.min(1, (now - explodeStart) / EXPLODE_DELAY);
    for (const p of portals) {
      const cx = p.x + PORTAL_W / 2;
      const cy = p.y + PORTAL_H / 2;
      const r  = 20 + progress * 180;
      ctx.save();
      ctx.globalAlpha = (1 - progress) * 0.9;
      // Outer fireball
      ctx.fillStyle = '#ff4400';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      // Inner bright core
      ctx.fillStyle = '#ffe060';
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    // Screen flash at start of explosion
    if (progress < 0.25) {
      ctx.save();
      ctx.globalAlpha = (0.25 - progress) / 0.25 * 0.75;
      ctx.fillStyle = '#ff8800';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }
}

function drawTNT(ctx, p, t) {
  const bw = 34, bh = 28;
  const bx = p.x + (PORTAL_W - bw) / 2;
  const by = p.y - bh - 4;

  // Blink faster when all but 1 are armed
  const armedCount = portals.filter(pt => pt.hasTNT).length;
  const blinkRate  = armedCount >= NUM_PORTALS - 1 ? 6 : 2.5;
  const lit        = Math.sin(t * blinkRate * Math.PI) > 0;

  // Red glow
  ctx.save();
  ctx.shadowBlur  = 14;
  ctx.shadowColor = '#ff2200';

  // Main TNT block — red body
  ctx.fillStyle = lit ? '#ff2200' : '#cc1100';
  ctx.fillRect(bx, by, bw, bh);

  // Top face darker
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(bx, by, bw, bh * 0.3);

  // "TNT" text
  ctx.shadowBlur  = 0;
  ctx.fillStyle   = '#ffffff';
  ctx.font        = `bold ${bh * 0.44}px monospace`;
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TNT', bx + bw / 2, by + bh * 0.62);
  ctx.textBaseline = 'alphabetic';

  // Border
  ctx.strokeStyle = '#880000';
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(bx, by, bw, bh);

  // Fuse (little spark at top center)
  const sparkY = by - 8 + Math.sin(t * 12) * 2;
  ctx.strokeStyle = '#888';
  ctx.lineWidth   = 1.5;
  ctx.lineCap     = 'round';
  ctx.beginPath();
  ctx.moveTo(bx + bw / 2, by);
  ctx.lineTo(bx + bw / 2 + 3, sparkY);
  ctx.stroke();
  ctx.fillStyle = lit ? '#ffff00' : '#ffaa00';
  ctx.beginPath(); ctx.arc(bx + bw / 2 + 3, sparkY, 2.5, 0, Math.PI * 2); ctx.fill();

  ctx.textAlign = 'left';
  ctx.restore();
}

function drawOnePortal(ctx, p, t) {
  const ix = p.x + FRAME;
  const iy = p.y + FRAME;
  const iw = p.w - FRAME * 2;
  const ih = p.h - FRAME * 2;

  ctx.save();

  ctx.shadowBlur  = p.hasTNT ? 28 : 22;
  ctx.shadowColor = p.hasTNT ? '#ff4400' : '#aa00ff';

  ctx.fillStyle = '#0e0a14';
  ctx.fillRect(p.x, p.y, p.w, p.h);

  const bsz = FRAME * 1.3;
  ctx.fillStyle = '#1a1228';
  for (let bx = p.x; bx < p.x + p.w; bx += bsz)
    ctx.fillRect(bx + 1, p.y + 1, bsz - 2, FRAME - 1);
  for (let bx = p.x; bx < p.x + p.w; bx += bsz)
    ctx.fillRect(bx + 1, p.y + p.h - FRAME, bsz - 2, FRAME - 1);
  for (let by = p.y + FRAME; by < p.y + p.h - FRAME; by += bsz)
    ctx.fillRect(p.x + 1, by + 1, FRAME - 1, bsz - 2);
  for (let by = p.y + FRAME; by < p.y + p.h - FRAME; by += bsz)
    ctx.fillRect(p.x + p.w - FRAME, by + 1, FRAME - 1, bsz - 2);

  ctx.shadowBlur = 0;

  ctx.save();
  ctx.beginPath(); ctx.rect(ix, iy, iw, ih); ctx.clip();

  ctx.fillStyle = '#0d0018';
  ctx.fillRect(ix, iy, iw, ih);

  for (let row = 0; row < ih; row += 2) {
    const phase  = row * 0.07 + t * 2.8;
    const wave   = Math.sin(phase) * iw * 0.28;
    const bright = (Math.sin(row * 0.04 + t * 1.6) + 1) / 2;
    // Shift hue toward red/orange if TNT is placed
    const hue = p.hasTNT ? (20 + bright * 30) : (275 + bright * 45);
    const sat = p.hasTNT ? 100 : 90;
    const lit = 12 + bright * 38;
    ctx.fillStyle = `hsla(${hue}, ${sat}%, ${lit}%, 0.65)`;
    ctx.fillRect(ix + wave, iy + row, iw * 0.85, 2);
  }

  const cg = ctx.createRadialGradient(ix+iw/2, iy+ih/2, 0, ix+iw/2, iy+ih/2, Math.min(iw,ih)*0.65);
  const pulse = 0.25 + Math.sin(t * 3.5) * 0.08;
  const c1 = p.hasTNT ? `rgba(255,100,0,${pulse})` : `rgba(190,80,255,${pulse})`;
  const c2 = p.hasTNT ? `rgba(200,50,0,${pulse*0.4})` : `rgba(120,0,200,${pulse*0.4})`;
  cg.addColorStop(0, c1); cg.addColorStop(0.6, c2); cg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cg;
  ctx.fillRect(ix, iy, iw, ih);

  ctx.restore();

  const edgeHue = p.hasTNT ? 20 : 280;
  ctx.strokeStyle = `hsla(${edgeHue}, 100%, ${50 + Math.sin(t * 2.5) * 10}%, 0.85)`;
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(p.x, p.y, p.w, p.h);

  ctx.restore();
}
