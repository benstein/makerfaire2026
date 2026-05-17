// src/game/enemies.js

import { CONFIG } from './config.js';
import { getGameProgress } from './gameState.js';

// Three generations: big → medium → small → gone
const SIZES  = [52, 30, 16];
const SPEEDS = [1.0, 1.4, 1.9]; // smaller pieces move faster

let enemies = [];
let lastSpawnTime = 0;

export function resetEnemies() {
  enemies = [];
  lastSpawnTime = 0;
}

export function spawnEnemy(arenaWidth, arenaHeight) {
  const edge = Math.floor(Math.random() * 4);
  const s = SIZES[0];
  let ex, ey;

  switch (edge) {
    case 0: ex = Math.random() * arenaWidth; ey = -s; break;
    case 1: ex = arenaWidth + s;             ey = Math.random() * arenaHeight; break;
    case 2: ex = Math.random() * arenaWidth; ey = arenaHeight + s; break;
    case 3: ex = -s;                         ey = Math.random() * arenaHeight; break;
  }

  enemies.push({ x: ex, y: ey, w: s, h: s, hue: Math.random() * 360, generation: 0 });
}

function getCurrentSpawnInterval() {
  const progress = getGameProgress();
  const start = CONFIG.enemySpawnIntervalStart;
  const end = CONFIG.enemySpawnIntervalEnd;
  return start + (end - start) * progress;
}

export function updateEnemies(dt, playerPos, now, arenaWidth, arenaHeight) {
  const interval = getCurrentSpawnInterval();
  if (now - lastSpawnTime > interval) {
    spawnEnemy(arenaWidth, arenaHeight);
    lastSpawnTime = now;
  }

  for (const enemy of enemies) {
    const dx = playerPos.x - (enemy.x + enemy.w / 2);
    const dy = playerPos.y - (enemy.y + enemy.h / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const scale = dt / 16.67;
      const spd = CONFIG.enemySpeed * SPEEDS[enemy.generation ?? 0];
      enemy.x += (dx / dist) * spd * scale;
      enemy.y += (dy / dist) * spd * scale;
    }
  }
}

export function drawEnemies(ctx) {
  const t = performance.now() / 1000;
  for (const enemy of enemies) {
    drawPoofyGoogly(ctx, enemy, t);
  }
}

function drawPoofyGoogly(ctx, enemy, t) {
  const cx   = enemy.x + enemy.w / 2;
  const cy   = enemy.y + enemy.h / 2;
  const r    = enemy.w / 2 + 5;
  const hue  = ((enemy.hue || 0) + t * 35) % 360;
  const hue2 = (hue + 140) % 360;
  const bob  = Math.sin(t * 2.2 + (enemy.hue || 0) * 0.05) * 2.5;
  const seed = enemy.hue || 0;
  // Stable deterministic randomness per enemy
  const rng  = (s) => Math.abs(Math.sin(seed * 13.7 + s * 7.31));

  // === FLAILING WIGGLY ARMS ===
  const numArms = 3 + Math.floor(rng(1) * 3);
  for (let i = 0; i < numArms; i++) {
    const base = (i / numArms) * Math.PI * 2 + rng(i + 10) * 1.2;
    const wag  = Math.sin(t * (2.8 + i * 0.5) + i * 2.1) * 0.55;
    const len  = r * (1.1 + rng(i + 20) * 0.7);
    const ax   = cx + Math.cos(base + wag) * len;
    const ay   = cy + bob + Math.sin(base + wag) * len;
    const mx   = cx + Math.cos(base + wag * 1.6) * len * 0.55;
    const my   = cy + bob + Math.sin(base + wag * 1.6) * len * 0.55;
    ctx.strokeStyle = `hsl(${hue2}, 88%, 52%)`;
    ctx.lineWidth   = r * 0.26;
    ctx.lineCap     = 'round';
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(base) * r * 0.68, cy + bob + Math.sin(base) * r * 0.68);
    ctx.quadraticCurveTo(mx, my, ax, ay);
    ctx.stroke();
    // Tiny grabby claw hand
    ctx.fillStyle = `hsl(${hue2}, 88%, 52%)`;
    for (let f = 0; f < 3; f++) {
      const fa = base + wag + (f - 1) * 0.5;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + Math.cos(fa) * r * 0.22, ay + Math.sin(fa) * r * 0.22);
      ctx.stroke();
    }
  }

  // === IRREGULAR POOFY BUMPS ===
  const numBumps = 9 + Math.floor(rng(2) * 4);
  for (let i = 0; i < numBumps; i++) {
    const a   = (i / numBumps) * Math.PI * 2 + rng(i) * 0.35;
    const br  = r * (0.30 + rng(i + 5) * 0.28);
    const bx  = cx + Math.cos(a) * r * (0.80 + rng(i + 6) * 0.12);
    const by  = cy + bob + Math.sin(a) * r * (0.80 + rng(i + 6) * 0.12);
    ctx.fillStyle = `hsl(${(hue + rng(i) * 100) % 360}, 88%, ${46 + rng(i + 3) * 16}%)`;
    ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
  }

  // === MAIN BODY ===
  const bodyGrad = ctx.createRadialGradient(cx - r * 0.22, cy + bob - r * 0.22, 0, cx, cy + bob, r * 0.88);
  bodyGrad.addColorStop(0, `hsl(${hue}, 100%, 84%)`);
  bodyGrad.addColorStop(1, `hsl(${hue}, 90%, 46%)`);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath(); ctx.arc(cx, cy + bob, r * 0.88, 0, Math.PI * 2); ctx.fill();

  // === MULTIPLE GOOGLY EYES (2–4) ===
  const allEyeSlots = [
    { ox: -r * 0.28, oy: -r * 0.16, er: r * 0.28 },
    { ox:  r * 0.28, oy: -r * 0.16, er: r * 0.28 },
    { ox:  0,        oy: -r * 0.50, er: r * 0.17 },
    { ox: -r * 0.50, oy:  r * 0.08, er: r * 0.15 },
    { ox:  r * 0.50, oy:  r * 0.08, er: r * 0.15 },
  ];
  const numEyes = 2 + Math.floor(rng(3) * 3);
  for (let ei = 0; ei < Math.min(numEyes, allEyeSlots.length); ei++) {
    const ep    = allEyeSlots[ei];
    const ex2   = cx + ep.ox;
    const ey2   = cy + bob + ep.oy;
    const eyeR  = ep.er;
    const pupR  = eyeR * 0.50;
    const drift = eyeR - pupR;

    // White
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(ex2, ey2, eyeR, 0, Math.PI * 2); ctx.fill();
    // Bloodshot on big eyes
    if (eyeR > r * 0.2 && rng(ei + 8) > 0.45) {
      ctx.strokeStyle = 'rgba(220,60,60,0.5)'; ctx.lineWidth = 0.8;
      for (let bl = 0; bl < 3; bl++) {
        const ba = rng(ei * 7 + bl + 50) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(ex2, ey2);
        ctx.lineTo(ex2 + Math.cos(ba) * eyeR * 0.85, ey2 + Math.sin(ba) * eyeR * 0.85);
        ctx.stroke();
      }
    }
    // Drifting pupil (each eye moves at its own speed)
    const spd = 1 + ei * 0.4;
    const px2 = ex2 + Math.cos(t * 1.1 * spd + ep.ox) * drift * 0.75;
    const py2 = ey2 + Math.sin(t * 1.6 * spd + ep.oy) * drift * 0.75;
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(px2, py2, pupR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(px2 - pupR * 0.3, py2 - pupR * 0.3, pupR * 0.30, 0, Math.PI * 2); ctx.fill();

    // Absurd eyebrow (3 styles)
    const brow = Math.floor(rng(ei + 15) * 3);
    ctx.strokeStyle = '#222'; ctx.lineWidth = eyeR * 0.24; ctx.lineCap = 'round';
    ctx.beginPath();
    if (brow === 0) {
      ctx.moveTo(ex2 - eyeR * 0.7, ey2 - eyeR * 1.05); ctx.lineTo(ex2, ey2 - eyeR * 0.8);
    } else if (brow === 1) {
      ctx.arc(ex2, ey2 - eyeR * 0.95, eyeR * 0.5, Math.PI * 1.2, Math.PI * 1.8);
    } else {
      ctx.moveTo(ex2 - eyeR * 0.6, ey2 - eyeR * 0.88);
      ctx.lineTo(ex2 - eyeR * 0.15, ey2 - eyeR * 1.18);
      ctx.lineTo(ex2 + eyeR * 0.25, ey2 - eyeR * 0.88);
      ctx.lineTo(ex2 + eyeR * 0.6,  ey2 - eyeR * 1.18);
    }
    ctx.stroke();
  }

  // === RIDICULOUS MOUTH ===
  // Huge dark gape
  ctx.fillStyle = '#140010';
  ctx.beginPath();
  ctx.arc(cx, cy + bob + r * 0.30, r * 0.42, 0.05, Math.PI - 0.05);
  ctx.lineTo(cx - r * 0.40, cy + bob + r * 0.30);
  ctx.closePath();
  ctx.fill();
  // Many uneven teeth
  const numTeeth = 5 + Math.floor(rng(9) * 5);
  const mW = r * 0.78;
  const mX = cx - mW / 2;
  const mY = cy + bob + r * 0.30;
  ctx.fillStyle = '#fffce0';
  for (let ti = 0; ti < numTeeth; ti++) {
    const tx  = mX + (ti / numTeeth) * mW;
    const tw2 = mW / numTeeth * 0.82;
    const th  = r * (0.08 + rng(ti + 30) * 0.18);
    ctx.fillRect(tx, mY, tw2, th);
  }
  // Tongue (wiggly, sticking out)
  if (rng(11) > 0.30) {
    const wag = Math.sin(t * 4.5) * 0.15;
    ctx.fillStyle = '#ff5599';
    ctx.beginPath();
    ctx.ellipse(cx + wag * r, cy + bob + r * 0.52, r * 0.22, r * 0.28, wag, 0, Math.PI * 2);
    ctx.fill();
    // Forked tip
    ctx.beginPath(); ctx.arc(cx + wag * r - r * 0.1, cy + bob + r * 0.76, r * 0.09, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + wag * r + r * 0.1, cy + bob + r * 0.76, r * 0.09, 0, Math.PI * 2); ctx.fill();
  }
  // Drool drop
  if (rng(13) > 0.52) {
    const droolX = cx - r * 0.28;
    const droolY = cy + bob + r * 0.40;
    const drop   = r * (0.18 + Math.sin(t * 1.3) * 0.06);
    ctx.strokeStyle = 'rgba(120,220,255,0.7)'; ctx.lineWidth = r * 0.09; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(droolX, droolY); ctx.lineTo(droolX, droolY + drop); ctx.stroke();
    ctx.fillStyle = 'rgba(120,220,255,0.75)';
    ctx.beginPath(); ctx.arc(droolX, droolY + drop, r * 0.08, 0, Math.PI * 2); ctx.fill();
  }

  // === ACCESSORY (hat / horns / antenna / halo) ===
  const acc = Math.floor(rng(12) * 4);
  const topY = cy + bob - r * 0.86;
  if (acc === 0) {
    // Top hat
    const hw = r * 0.68, hh = r * 0.64, bw = r * 0.96;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(cx - hw / 2, topY - hh, hw, hh);
    ctx.fillRect(cx - bw / 2, topY - r * 0.08, bw, r * 0.17);
    ctx.fillStyle = `hsl(${hue}, 90%, 55%)`;
    ctx.fillRect(cx - hw / 2, topY - r * 0.22, hw, r * 0.13);
    // flower
    ctx.fillStyle = `hsl(${(hue + 120) % 360}, 100%, 65%)`;
    ctx.beginPath(); ctx.arc(cx + hw * 0.28, topY - hh * 0.18, r * 0.11, 0, Math.PI * 2); ctx.fill();

  } else if (acc === 1) {
    // Party hat
    ctx.fillStyle = `hsl(${(hue + 180) % 360}, 100%, 60%)`;
    ctx.beginPath();
    ctx.moveTo(cx, topY - r * 0.82);
    ctx.lineTo(cx - r * 0.52, topY);
    ctx.lineTo(cx + r * 0.52, topY);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = `hsl(${hue}, 100%, 80%)`;
    for (let d = 0; d < 4; d++) {
      ctx.beginPath();
      ctx.arc(cx + (rng(d + 40) - 0.5) * r * 0.65, topY - r * (0.15 + rng(d + 41) * 0.55), r * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx, topY - r * 0.82, r * 0.13, 0, Math.PI * 2); ctx.fill();

  } else if (acc === 2) {
    // Bouncy antenna with spinning star
    const aX = cx + r * 0.28;
    const aBaseY = topY;
    const bounce = Math.sin(t * 5.5 + seed) * r * 0.28;
    const tipX   = aX + Math.sin(t * 4.2) * r * 0.22;
    const tipY   = aBaseY - r * 0.85 + bounce;
    ctx.strokeStyle = '#666'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(aX, aBaseY);
    ctx.quadraticCurveTo(aX + r * 0.12, aBaseY - r * 0.5, tipX, tipY);
    ctx.stroke();
    ctx.fillStyle = `hsl(${(hue + 60) % 360}, 100%, 70%)`;
    const sr = r * 0.17;
    ctx.save(); ctx.translate(tipX, tipY); ctx.rotate(t * 4);
    ctx.beginPath();
    for (let si = 0; si < 10; si++) {
      const a = (si / 10) * Math.PI * 2 - Math.PI / 2;
      const sr2 = si % 2 === 0 ? sr : sr * 0.42;
      si === 0 ? ctx.moveTo(Math.cos(a) * sr2, Math.sin(a) * sr2) : ctx.lineTo(Math.cos(a) * sr2, Math.sin(a) * sr2);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();

  } else {
    // Devil horns
    ctx.fillStyle = '#cc0000';
    for (const side of [-1, 1]) {
      const hx = cx + side * r * 0.42;
      ctx.beginPath();
      ctx.moveTo(hx - r * 0.16, topY);
      ctx.quadraticCurveTo(hx + side * r * 0.06, topY - r * 0.72, hx + side * r * 0.08, topY - r * 0.60);
      ctx.lineTo(hx + r * 0.16, topY);
      ctx.closePath(); ctx.fill();
    }
  }
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}

// Splits the enemy into two smaller ones, or kills it if already smallest.
export function hitEnemy(index) {
  const e = enemies[index];
  if (!e) return;

  const gen = e.generation ?? 0;
  if (gen >= 2) {
    enemies.splice(index, 1);
    return;
  }

  const nextGen  = gen + 1;
  const nextSize = SIZES[nextGen];
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  const angle = Math.random() * Math.PI * 2;
  const spread = nextSize * 0.9;

  enemies.splice(index, 1);

  for (const dir of [angle, angle + Math.PI]) {
    enemies.push({
      x: cx + Math.cos(dir) * spread - nextSize / 2,
      y: cy + Math.sin(dir) * spread - nextSize / 2,
      w: nextSize, h: nextSize,
      hue: ((e.hue ?? 0) + 130) % 360,
      generation: nextGen,
    });
  }
}
