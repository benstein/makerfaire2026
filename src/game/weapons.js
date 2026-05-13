// src/game/weapons.js
// Ring of fire — the Cat in the Hat is surrounded by a swirling flame burst when he "fires".
// Enemies that touch the ring are burned to a crisp and leave a singed scorch mark.

import { CONFIG } from './config.js';

let rings = [];   // active ring-of-fire bursts
let singes = [];  // lingering scorch marks where enemies were burned
let lastFireTime = 0;

const RING_RADIUS = 95;       // pixels — how far the flames reach from the player
const RING_LIFETIME = 600;    // ms — how long each burst lasts
const SINGE_LIFETIME = 900;   // ms — how long the charred patch sticks around

export function resetWeapons() {
  rings = [];
  singes = [];
  lastFireTime = 0;
}

export function tryFire(playerPos, facing, now) {
  if (now - lastFireTime < CONFIG.fireRateCooldown) return;
  lastFireTime = now;

  rings.push({
    cx: playerPos.x,
    cy: playerPos.y,
    radius: RING_RADIUS,
    bornAt: now,
    lifetime: RING_LIFETIME,
    hit: new Set(), // enemies already burned by this ring (so we don't double-singe)
    seed: Math.random() * 1000,
  });
}

export function updateProjectiles(dt, arenaWidth, arenaHeight, playerPos) {
  const now = performance.now();
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i];
    if (now - r.bornAt > r.lifetime) { rings.splice(i, 1); continue; }
    // Ring follows the Cat as he moves
    r.cx = playerPos.x;
    r.cy = playerPos.y;
  }
  for (let i = singes.length - 1; i >= 0; i--) {
    if (now - singes[i].bornAt > SINGE_LIFETIME) singes.splice(i, 1);
  }
}

// Circle-vs-AABB hit test: closest point on the enemy's box to the ring center.
function ringHitsEnemy(ring, e, currentRadius) {
  const clx = Math.max(e.x, Math.min(ring.cx, e.x + e.w));
  const cly = Math.max(e.y, Math.min(ring.cy, e.y + e.h));
  const dx = ring.cx - clx;
  const dy = ring.cy - cly;
  return dx * dx + dy * dy < currentRadius * currentRadius;
}

// Burns all enemies inside any active ring. Replaces the old projectile-vs-enemy loop.
export function processRingHits(enemies, removeEnemyFn, now) {
  for (const ring of rings) {
    const age = now - ring.bornAt;
    const grow = 1 + (age / ring.lifetime) * 0.15;
    const currentRadius = ring.radius * grow;
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      if (ring.hit.has(e)) continue;
      if (ringHitsEnemy(ring, e, currentRadius)) {
        ring.hit.add(e);
        singes.push({
          x: e.x + e.w / 2,
          y: e.y + e.h / 2,
          r: 22 + Math.random() * 6,
          bornAt: now,
          seed: Math.random() * 1000,
        });
        removeEnemyFn(j);
      }
    }
  }
}

export function drawProjectiles(ctx) {
  const now = performance.now();

  // --- Singe marks first (drawn underneath the active flames) ---
  for (const s of singes) {
    const age = now - s.bornAt;
    const t = Math.min(1, age / SINGE_LIFETIME);
    const alpha = 1 - t;

    // Charred ground patch
    ctx.fillStyle = `rgba(15,8,4,${0.75 * alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * (1 + t * 0.25), 0, Math.PI * 2);
    ctx.fill();

    // Dark ash speckles around the rim
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + s.seed;
      const dr = s.r * (0.7 + 0.25 * Math.sin(s.seed + i));
      ctx.fillStyle = `rgba(35,20,15,${0.6 * alpha})`;
      ctx.beginPath();
      ctx.arc(s.x + Math.cos(a) * dr, s.y + Math.sin(a) * dr, 2 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }

    // Flickering orange embers — fade out faster than the char
    const emberAlpha = Math.max(0, 1 - t * 1.6);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + s.seed * 0.7;
      const flicker = 0.45 + 0.55 * Math.sin(now / 70 + i + s.seed);
      const ex = s.x + Math.cos(a) * s.r * 0.4;
      const ey = s.y + Math.sin(a) * s.r * 0.4;
      ctx.fillStyle = `rgba(255,${110 + flicker * 90},30,${0.7 * emberAlpha * flicker})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 2.5 + flicker * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Thin smoke wisp drifting upward
    ctx.fillStyle = `rgba(110,100,100,${0.30 * alpha})`;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y - t * 22, s.r * 0.55, s.r * 0.28 * (1 + t * 0.8), 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Rings of fire ---
  for (const ring of rings) {
    const age = now - ring.bornAt;
    const t = age / ring.lifetime;
    const fade = t < 0.15 ? t / 0.15 : t > 0.75 ? (1 - t) / 0.25 : 1;
    const grow = 1 + t * 0.15;
    const r = ring.radius * grow;

    // Outer heat-haze glow
    const grad = ctx.createRadialGradient(ring.cx, ring.cy, r * 0.55, ring.cx, ring.cy, r * 1.15);
    grad.addColorStop(0, 'rgba(255,200,80,0)');
    grad.addColorStop(0.7, `rgba(255,130,30,${0.22 * fade})`);
    grad.addColorStop(1, 'rgba(255,80,10,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ring.cx, ring.cy, r * 1.15, 0, Math.PI * 2);
    ctx.fill();

    // Flickering flame tongues around the perimeter
    const tongues = 24;
    for (let i = 0; i < tongues; i++) {
      const a = (i / tongues) * Math.PI * 2 + now / 220 + ring.seed * 0.01;
      const flick = 0.55 + 0.45 * Math.sin(now / 65 + i * 1.7 + ring.seed);
      const innerR = r * 0.72;
      const outerR = r * (1.05 + 0.22 * flick);
      const flameW = r * 0.16;
      const ix = ring.cx + Math.cos(a) * innerR;
      const iy = ring.cy + Math.sin(a) * innerR;
      const ox = ring.cx + Math.cos(a) * outerR;
      const oy = ring.cy + Math.sin(a) * outerR;
      const px = -Math.sin(a) * flameW;
      const py =  Math.cos(a) * flameW;

      // Outer flame body — red/orange
      ctx.fillStyle = `rgba(255,${70 + flick * 90},20,${0.85 * fade})`;
      ctx.beginPath();
      ctx.moveTo(ix - px, iy - py);
      ctx.lineTo(ix + px, iy + py);
      ctx.lineTo(ox, oy);
      ctx.closePath();
      ctx.fill();

      // Inner flame — bright yellow core
      const midR = innerR + (outerR - innerR) * 0.65;
      ctx.fillStyle = `rgba(255,${210 + flick * 40},90,${0.9 * fade})`;
      ctx.beginPath();
      ctx.moveTo(ix - px * 0.5, iy - py * 0.5);
      ctx.lineTo(ix + px * 0.5, iy + py * 0.5);
      ctx.lineTo(ring.cx + Math.cos(a) * midR, ring.cy + Math.sin(a) * midR);
      ctx.closePath();
      ctx.fill();
    }

    // Hot inner ring outline (pure white-yellow)
    ctx.strokeStyle = `rgba(255,240,170,${0.55 * fade})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ring.cx, ring.cy, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function getProjectiles() {
  return rings;
}

export function removeProjectile(index) {
  rings.splice(index, 1);
}
