// src/game/enemies.js

import { CONFIG } from './config.js';
import { getGameProgress } from './gameState.js';

let enemies = [];
let lastSpawnTime = 0;

export function resetEnemies() {
  enemies = [];
  lastSpawnTime = 0;
}

// Ice physics: low value = slippery enemies.
const ENEMY_ICE_ACCEL = 0.035;

export function spawnEnemy(arenaWidth, arenaHeight) {
  const edge = Math.floor(Math.random() * 4);
  let ex, ey;

  switch (edge) {
    case 0: ex = Math.random() * arenaWidth; ey = -CONFIG.enemySize; break;
    case 1: ex = arenaWidth + CONFIG.enemySize; ey = Math.random() * arenaHeight; break;
    case 2: ex = Math.random() * arenaWidth; ey = arenaHeight + CONFIG.enemySize; break;
    case 3: ex = -CONFIG.enemySize; ey = Math.random() * arenaHeight; break;
  }

  // R&B spy traits: Boris = dark olive/grey, Natasha (crazy) = deep purple-red
  const isCrazy = Math.random() < 0.35;
  const borisHues = [80, 100, 40, 200]; // olive, dark green, dark khaki, slate
  const hue = isCrazy ? 300 : borisHues[Math.floor(Math.random() * borisHues.length)];
  const eyeCount = isCrazy ? 2 + Math.floor(Math.random() * 4) : 2; // 2-5 eyes if crazy
  const eyes = [];
  for (let i = 0; i < eyeCount; i++) {
    eyes.push({
      // offset from center, normalized to size (-0.4..0.4)
      ox: (Math.random() - 0.5) * 0.55,
      oy: (Math.random() - 0.5) * 0.55,
      r: 0.18 + Math.random() * 0.10, // eye white radius (fraction of size)
      // googly pupil offset state — wiggles around inside the eye
      px: 0, py: 0,
      // crossed-eye bias
      crossBias: isCrazy ? (Math.random() - 0.5) * 0.6 : 0,
    });
  }

  enemies.push({
    x: ex, y: ey,
    w: CONFIG.enemySize, h: CONFIG.enemySize,
    vx: 0, vy: 0,
    hue,
    isCrazy,
    eyes,
    wobblePhase: Math.random() * Math.PI * 2,
    spin: 0,
    // crazy puffballs have shaky fur and faster wobble
    wobbleSpeed: isCrazy ? 0.015 + Math.random() * 0.010 : 0.006 + Math.random() * 0.004,
    bornAt: performance.now(),
    hasTongue: isCrazy && Math.random() < 0.5,
  });
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
      // Target velocity: toward the player
      const targetVx = (dx / dist) * CONFIG.enemySpeed;
      const targetVy = (dy / dist) * CONFIG.enemySpeed;
      // Slide on ice — velocity changes slowly
      if (enemy.vx === undefined) { enemy.vx = 0; enemy.vy = 0; }
      enemy.vx += (targetVx - enemy.vx) * ENEMY_ICE_ACCEL * scale;
      enemy.vy += (targetVy - enemy.vy) * ENEMY_ICE_ACCEL * scale;
      enemy.x += enemy.vx * scale;
      enemy.y += enemy.vy * scale;
    }

    // Wobble + spin animation state
    const scale = dt / 16.67;
    enemy.wobblePhase = (enemy.wobblePhase || 0) + (enemy.wobbleSpeed || 0.008) * dt;
    if (enemy.isCrazy) {
      enemy.spin = (enemy.spin || 0) + 0.08 * scale;
    }

    // Googly pupils swing around inside the eyes — laggy & jittery
    for (const eye of enemy.eyes) {
      const speedMag = Math.sqrt((enemy.vx || 0) ** 2 + (enemy.vy || 0) ** 2);
      const targetPx = (enemy.vx || 0) / Math.max(1, speedMag) * 0.5 + (eye.crossBias || 0);
      const targetPy = (enemy.vy || 0) / Math.max(1, speedMag) * 0.5;
      const lag = enemy.isCrazy ? 0.30 : 0.12;
      eye.px += (targetPx - eye.px) * lag;
      eye.py += (targetPy - eye.py) * lag;
      if (enemy.isCrazy) {
        eye.px += (Math.random() - 0.5) * 0.15;
        eye.py += (Math.random() - 0.5) * 0.15;
      }
    }
  }
}

export function drawEnemies(ctx) {
  for (const enemy of enemies) {
    drawPuffball(ctx, enemy);
  }
}

function drawPuffball(ctx, e) {
  const cx = e.x + e.w / 2;
  const cy = e.y + e.h / 2;
  const size = e.w;
  const r = size * 0.55; // a bit bigger than the AABB for fluff effect
  const phase = e.wobblePhase || 0;

  ctx.save();
  ctx.translate(cx, cy);
  if (e.isCrazy) {
    // Crazy ones jitter — small random translation each frame
    ctx.translate((Math.random() - 0.5) * 2.5, (Math.random() - 0.5) * 2.5);
    ctx.rotate(Math.sin(phase * 1.5) * 0.25);
  }

  // --- FLUFFY FUR (drawn as bumpy circle made of many overlapping arcs) ---
  const bumps = 18;
  const baseColor = `hsl(${e.hue}, 85%, 65%)`;
  const rimColor = `hsl(${e.hue}, 90%, 55%)`;

  // Outer fluff rim — slightly darker
  ctx.fillStyle = rimColor;
  ctx.beginPath();
  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2;
    const bumpAmt = 1 + 0.18 * Math.sin(a * 4 + phase) + 0.10 * Math.sin(a * 7 - phase * 1.3);
    const px = Math.cos(a) * r * bumpAmt;
    const py = Math.sin(a) * r * bumpAmt;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Inner body — main color
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2;
    const bumpAmt = 0.88 + 0.10 * Math.sin(a * 4 + phase);
    const px = Math.cos(a) * r * bumpAmt;
    const py = Math.sin(a) * r * bumpAmt;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Rainbow streak — second hue patch for that "rainbow" feel
  const hue2 = (e.hue + 60 + Math.sin(phase * 0.5) * 30) % 360;
  ctx.fillStyle = `hsla(${hue2}, 90%, 70%, 0.55)`;
  ctx.beginPath();
  ctx.ellipse(-r * 0.20, -r * 0.20, r * 0.55, r * 0.30, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Cheek blush
  ctx.fillStyle = `hsla(${(e.hue + 330) % 360}, 90%, 70%, 0.7)`;
  ctx.beginPath();
  ctx.arc(-r * 0.40, r * 0.18, r * 0.13, 0, Math.PI * 2);
  ctx.arc( r * 0.40, r * 0.18, r * 0.13, 0, Math.PI * 2);
  ctx.fill();

  // --- GOOGLY EYES ---
  for (const eye of e.eyes) {
    const ex = eye.ox * size;
    const ey = eye.oy * size;
    const er = eye.r * size;

    // Eye shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.arc(ex + 1, ey + 2, er, 0, Math.PI * 2);
    ctx.fill();

    // White of the eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, Math.PI * 2);
    ctx.fill();

    // Black ring (googly-eye plastic edge)
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = Math.max(1, er * 0.12);
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, Math.PI * 2);
    ctx.stroke();

    // Pupil — swings around inside, clamped to eye radius
    const pupilR = er * 0.50;
    const maxOffset = er - pupilR - 1;
    const px = Math.max(-maxOffset, Math.min(maxOffset, eye.px * er));
    const py = Math.max(-maxOffset, Math.min(maxOffset, eye.py * er));
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(ex + px, ey + py, pupilR, 0, Math.PI * 2);
    ctx.fill();

    // Pupil highlight
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(ex + px - pupilR * 0.35, ey + py - pupilR * 0.35, pupilR * 0.30, 0, Math.PI * 2);
    ctx.fill();
  }

  // Smile — wider/wonky on crazy ones
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (e.isCrazy) {
    ctx.arc(0, r * 0.30, r * 0.30, 0.1, Math.PI - 0.1);
  } else {
    ctx.arc(0, r * 0.28, r * 0.22, 0.2, Math.PI - 0.2);
  }
  ctx.stroke();

  if (e.hasTongue) {
    ctx.fillStyle = '#ff5577';
    ctx.beginPath();
    ctx.ellipse(r * 0.08, r * 0.45, r * 0.10, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (e.isCrazy) {
    // NATASHA — glamorous spy, tall hair piled high, eyelashes, red lips
    const hairH = r * 0.9;
    ctx.fillStyle = '#220022';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = r * 0.06;
    ctx.beginPath();
    ctx.ellipse(0, -r - hairH * 0.5, r * 0.55, hairH * 0.55, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Hair highlight
    ctx.fillStyle = '#440044';
    ctx.beginPath();
    ctx.ellipse(-r * 0.15, -r - hairH * 0.55, r * 0.20, hairH * 0.28, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Eyelashes (dramatic upper lashes)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = r * 0.09;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const lx = -r * 0.28 + i * r * 0.18;
      ctx.beginPath();
      ctx.moveTo(lx, -r * 0.30);
      ctx.lineTo(lx - r * 0.04, -r * 0.52 - i * 0.04 * r);
      ctx.stroke();
    }
    // Red lips
    ctx.fillStyle = '#dd1133';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.35, r * 0.22, r * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = r * 0.04;
    ctx.stroke();
  } else {
    // BORIS BADENOV — tall spy hat, bushy eyebrows, scheming mustache
    const hatH = r * 1.05;
    const hatW = r * 0.72;
    // Hat body (tall, narrow, black)
    ctx.fillStyle = '#111111';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = r * 0.05;
    ctx.fillRect(-hatW / 2, -r - hatH, hatW, hatH);
    ctx.strokeRect(-hatW / 2, -r - hatH, hatW, hatH);
    // Hat brim
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-hatW * 0.72, -r - r * 0.06, hatW * 1.44, r * 0.2);
    ctx.strokeRect(-hatW * 0.72, -r - r * 0.06, hatW * 1.44, r * 0.2);
    // Bushy eyebrows (Boris's signature)
    ctx.fillStyle = '#111111';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = r * 0.06;
    // Left brow
    ctx.beginPath();
    ctx.ellipse(-r * 0.30, -r * 0.42, r * 0.22, r * 0.10, -0.3, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Right brow
    ctx.beginPath();
    ctx.ellipse(r * 0.30, -r * 0.42, r * 0.22, r * 0.10, 0.3, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    // Scheming mustache
    ctx.fillStyle = '#111111';
    ctx.beginPath();
    ctx.moveTo(-r * 0.05, r * 0.20);
    ctx.bezierCurveTo(-r * 0.30, r * 0.14, -r * 0.38, r * 0.36, -r * 0.20, r * 0.30);
    ctx.bezierCurveTo(-r * 0.08, r * 0.26, 0, r * 0.28, 0, r * 0.28);
    ctx.bezierCurveTo(0, r * 0.28, r * 0.08, r * 0.26, r * 0.20, r * 0.30);
    ctx.bezierCurveTo(r * 0.38, r * 0.36, r * 0.30, r * 0.14, r * 0.05, r * 0.20);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  ctx.restore();
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
