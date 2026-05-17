// src/game/portals.js
// 5 Nether portals (Minecraft style). Enter one → warp to a random other.

import { aabb } from './collision.js';

const NUM_PORTALS   = 5;
const PORTAL_W      = 52;
const PORTAL_H      = 90;   // tall like Minecraft portals
const FRAME         = 7;    // obsidian frame thickness
const WARP_COOLDOWN = 1600; // ms before you can warp again
const MARGIN        = 80;   // min distance from arena edges

let portals      = [];  // { x, y, w, h }
let lastWarpTime = -WARP_COOLDOWN;
let flashUntil   = 0;   // timestamp — white flash duration

export function resetPortals(arenaWidth, arenaHeight) {
  portals      = [];
  lastWarpTime = -WARP_COOLDOWN;
  flashUntil   = 0;
  placePortals(arenaWidth, arenaHeight);
}

function placePortals(aw, ah) {
  const minGap = PORTAL_W * 2.8;
  for (let i = 0; i < NUM_PORTALS; i++) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const x = MARGIN + Math.random() * (aw - MARGIN * 2 - PORTAL_W);
      const y = MARGIN + Math.random() * (ah - MARGIN * 2 - PORTAL_H);
      // Keep clear of center (player spawn) and other portals
      const cx = x + PORTAL_W / 2, cy = y + PORTAL_H / 2;
      const nearCenter = Math.hypot(cx - aw / 2, cy - ah / 2) < 100;
      const tooClose = portals.some(p =>
        Math.abs(p.x + PORTAL_W / 2 - cx) < minGap &&
        Math.abs(p.y + PORTAL_H / 2 - cy) < minGap
      );
      if (!nearCenter && !tooClose) {
        portals.push({ x, y, w: PORTAL_W, h: PORTAL_H });
        break;
      }
    }
  }
}

// Returns { x, y } to teleport the player to, or null.
export function updatePortals(playerBounds, now) {
  if (now - lastWarpTime < WARP_COOLDOWN) return null;
  for (let i = 0; i < portals.length; i++) {
    if (aabb(playerBounds, portals[i])) {
      const others = portals.filter((_, j) => j !== i);
      if (!others.length) return null;
      const dest = others[Math.floor(Math.random() * others.length)];
      lastWarpTime = now;
      flashUntil   = now + 280;
      return { x: dest.x + PORTAL_W / 2, y: dest.y + PORTAL_H / 2 };
    }
  }
  return null;
}

// ─── Drawing ──────────────────────────────────────────────────────────────────

export function drawPortals(ctx, width, height, now) {
  const t = now / 1000;
  for (const p of portals) drawOnePortal(ctx, p, t);

  // Warp flash overlay
  if (now < flashUntil) {
    const alpha = ((flashUntil - now) / 280) * 0.9;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#cc88ff';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

function drawOnePortal(ctx, p, t) {
  const ix = p.x + FRAME;
  const iy = p.y + FRAME;
  const iw = p.w - FRAME * 2;
  const ih = p.h - FRAME * 2;

  ctx.save();

  // ── Outer purple glow ──────────────────────────────────────
  ctx.shadowBlur  = 22;
  ctx.shadowColor = '#aa00ff';

  // ── Obsidian frame ─────────────────────────────────────────
  // Dark base
  ctx.fillStyle = '#0e0a14';
  ctx.fillRect(p.x, p.y, p.w, p.h);

  // Block texture on frame — rows of slightly lighter squares
  const bsz = FRAME * 1.3;
  ctx.fillStyle = '#1a1228';
  // Top strip
  for (let bx = p.x; bx < p.x + p.w; bx += bsz)
    ctx.fillRect(bx + 1, p.y + 1, bsz - 2, FRAME - 1);
  // Bottom strip
  for (let bx = p.x; bx < p.x + p.w; bx += bsz)
    ctx.fillRect(bx + 1, p.y + p.h - FRAME, bsz - 2, FRAME - 1);
  // Left strip
  for (let by = p.y + FRAME; by < p.y + p.h - FRAME; by += bsz)
    ctx.fillRect(p.x + 1, by + 1, FRAME - 1, bsz - 2);
  // Right strip
  for (let by = p.y + FRAME; by < p.y + p.h - FRAME; by += bsz)
    ctx.fillRect(p.x + p.w - FRAME, by + 1, FRAME - 1, bsz - 2);

  ctx.shadowBlur = 0;

  // ── Inner void ─────────────────────────────────────────────
  ctx.save();
  ctx.beginPath();
  ctx.rect(ix, iy, iw, ih);
  ctx.clip();

  // Dark base
  ctx.fillStyle = '#0d0018';
  ctx.fillRect(ix, iy, iw, ih);

  // Animated horizontal swirl bands
  for (let row = 0; row < ih; row += 2) {
    const phase  = row * 0.07 + t * 2.8;
    const wave   = Math.sin(phase) * iw * 0.28;
    const bright = (Math.sin(row * 0.04 + t * 1.6) + 1) / 2;
    const hue    = 275 + bright * 45;           // purple → pink
    const lit    = 12 + bright * 38;
    ctx.fillStyle = `hsla(${hue}, 90%, ${lit}%, 0.65)`;
    ctx.fillRect(ix + wave, iy + row, iw * 0.85, 2);
  }

  // Soft radial center highlight
  const cg = ctx.createRadialGradient(
    ix + iw / 2, iy + ih / 2, 0,
    ix + iw / 2, iy + ih / 2, Math.min(iw, ih) * 0.65
  );
  const pulse = 0.25 + Math.sin(t * 3.5) * 0.08;
  cg.addColorStop(0,   `rgba(190, 80, 255, ${pulse})`);
  cg.addColorStop(0.6, `rgba(120, 0,  200, ${pulse * 0.4})`);
  cg.addColorStop(1,   'rgba(60, 0, 140, 0)');
  ctx.fillStyle = cg;
  ctx.fillRect(ix, iy, iw, ih);

  ctx.restore(); // end clip

  // ── Portal frame glowing edge ──────────────────────────────
  ctx.strokeStyle = `hsla(280, 100%, ${50 + Math.sin(t * 2.5) * 10}%, 0.85)`;
  ctx.lineWidth   = 1.5;
  ctx.strokeRect(p.x, p.y, p.w, p.h);

  ctx.restore();
}
