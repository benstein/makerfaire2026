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

// Cartoon BOOM! starburst — thick black outline, flat yellow/orange fill
function drawBoomStar(ctx, x, y, r, points, seed) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const jitter = i % 2 === 0 ? 1 + 0.12 * Math.sin(seed + i * 1.7) : 1;
    const px = x + Math.cos(a) * rad * jitter;
    const py = y + Math.sin(a) * rad * jitter;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

const BOOM_WORDS = ['BOOM!', 'POW!', 'ZAP!', 'BAM!', 'WHAM!'];

export function drawProjectiles(ctx) {
  const now = performance.now();

  // --- Smoke puffs where enemies were zapped ---
  for (const s of singes) {
    const age = now - s.bornAt;
    const t = Math.min(1, age / SINGE_LIFETIME);
    const alpha = (1 - t) * 0.7;
    const puffs = 3;
    for (let i = 0; i < puffs; i++) {
      const px = s.x + Math.cos(s.seed + i * 2.1) * s.r * 0.4;
      const py = s.y - t * 28 + Math.sin(s.seed + i * 1.8) * s.r * 0.3;
      ctx.fillStyle = `rgba(200,200,200,${alpha * (1 - i * 0.25)})`;
      ctx.strokeStyle = `rgba(80,80,80,${alpha * 0.6})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, s.r * (0.35 + i * 0.15) * (1 + t * 0.4), 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
  }

  // --- BOOM! cartoon explosion rings ---
  for (const ring of rings) {
    const age = now - ring.bornAt;
    const t = age / ring.lifetime;
    const fade = t < 0.12 ? t / 0.12 : t > 0.70 ? (1 - t) / 0.30 : 1;
    const r = ring.radius * (1 + t * 0.18);

    // Outer starburst — black outline
    ctx.globalAlpha = fade;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(2, r * 0.06);
    ctx.fillStyle = '#ffdd00';
    drawBoomStar(ctx, ring.cx, ring.cy, r, 12, ring.seed);
    ctx.fill(); ctx.stroke();

    // Inner starburst — orange
    ctx.fillStyle = '#ff8800';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(1.5, r * 0.04);
    drawBoomStar(ctx, ring.cx, ring.cy, r * 0.72, 10, ring.seed + 0.5);
    ctx.fill(); ctx.stroke();

    // White hot core
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ring.cx, ring.cy, r * 0.30, 0, Math.PI * 2);
    ctx.fill();

    // BOOM! text — flat, thick black outline, yellow fill
    const word = BOOM_WORDS[Math.floor(ring.seed * BOOM_WORDS.length) % BOOM_WORDS.length];
    const fontSize = Math.max(12, Math.round(r * 0.38));
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(3, fontSize * 0.18);
    ctx.strokeText(word, ring.cx, ring.cy + fontSize * 0.36);
    ctx.fillStyle = '#ffff00';
    ctx.fillText(word, ring.cx, ring.cy + fontSize * 0.36);
    ctx.textAlign = 'left';

    ctx.globalAlpha = 1;
  }
}

export function getProjectiles() {
  return rings;
}

export function removeProjectile(index) {
  rings.splice(index, 1);
}
