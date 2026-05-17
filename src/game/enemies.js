// src/game/enemies.js

import { CONFIG } from './config.js';
import { getGameProgress } from './gameState.js';

let enemies = [];
let lastSpawnTime = 0;
let fireballs = [];

const FIREBALL_SPEED    = 1.5;   // slow drift
const FIREBALL_INTERVAL = 2200;  // ms between shots per enemy
const FIREBALL_R        = 13;    // hitbox half-size

export function resetEnemies() {
  enemies = [];
  lastSpawnTime = 0;
  fireballs = [];
}

const BRAINROT = [
  'Tralalero Tralala', 'Bombardino Coccodrillo', 'Cappuccino Assassino',
  'Bombombini Gusini', 'Burbaloni Lulilolli', 'Frigo Camelo',
  'Ballerina Cappuccina', 'Tung Tung Tung Sahur', 'Lirili Larila',
  'Brr Brr Patapim', 'Chimpanzini Bananini', 'Trippi Troppi',
  'Boneca Ambalabu', 'Glorbo Frutelo',
];

export function spawnEnemy(arenaWidth, arenaHeight) {
  const edge = Math.floor(Math.random() * 4);
  let ex, ey;

  switch (edge) {
    case 0: ex = Math.random() * arenaWidth; ey = -CONFIG.enemySize; break;
    case 1: ex = arenaWidth + CONFIG.enemySize; ey = Math.random() * arenaHeight; break;
    case 2: ex = Math.random() * arenaWidth; ey = arenaHeight + CONFIG.enemySize; break;
    case 3: ex = -CONFIG.enemySize; ey = Math.random() * arenaHeight; break;
  }

  enemies.push({
    x: ex, y: ey, w: CONFIG.enemySize, h: CONFIG.enemySize,
    hairHue: 310 + Math.random() * 40,   // hot pink range
    eyeOffset: Math.random() * Math.PI * 2,
    phraseText: null, phraseUntil: 0,
    nextPhraseAt: performance.now() + 1500 + Math.random() * 3000,
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

  const scale = dt / 16.67;

  for (const enemy of enemies) {
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;
    const dx = playerPos.x - cx;
    const dy = playerPos.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      enemy.x += (dx / dist) * CONFIG.enemySpeed * scale;
      enemy.y += (dy / dist) * CONFIG.enemySpeed * scale;
    }

    // Speech bubble trigger
    if (now >= enemy.nextPhraseAt) {
      enemy.phraseText = BRAINROT[Math.floor(Math.random() * BRAINROT.length)];
      enemy.phraseUntil = now + 2400;
      enemy.nextPhraseAt = now + 4000 + Math.random() * 5000;
    }

    // Shoot a fireball toward the player
    if (!enemy.lastFireTime || now - enemy.lastFireTime > FIREBALL_INTERVAL) {
      if (dist > 0) {
        fireballs.push({
          x: cx - FIREBALL_R, y: cy - FIREBALL_R,
          w: FIREBALL_R * 2,  h: FIREBALL_R * 2,
          vx: (dx / dist) * FIREBALL_SPEED,
          vy: (dy / dist) * FIREBALL_SPEED,
          hue: Math.random() * 60,  // 0–60: red through orange-yellow
          born: now,
        });
        enemy.lastFireTime = now + Math.random() * 600; // stagger so all don't fire at once
      }
    }
  }

  // Move fireballs
  for (let i = fireballs.length - 1; i >= 0; i--) {
    const f = fireballs[i];
    f.x += f.vx * scale;
    f.y += f.vy * scale;
    if (now - f.born > 8000) fireballs.splice(i, 1);
  }
}

export function drawEnemies(ctx, now) {
  const t = (now ?? performance.now()) / 1000;
  for (const enemy of enemies) {
    drawGooglyGirl(ctx, enemy, t, now ?? performance.now());
  }
}

function drawGooglyGirl(ctx, enemy, t, now) {
  const cx = enemy.x + enemy.w / 2;
  const cy = enemy.y + enemy.h / 2;
  const r  = enemy.w * 1.05;  // draw bigger than hitbox for character detail

  ctx.save();
  ctx.translate(cx, cy);

  // === BODY — round blob, light pink ===
  const bodyGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r);
  bodyGrad.addColorStop(0, `hsl(${enemy.hairHue - 10}, 100%, 88%)`);
  bodyGrad.addColorStop(1, `hsl(${enemy.hairHue},      90%, 70%)`);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, r * 0.12, r * 0.88, 0, Math.PI * 2);
  ctx.fill();

  // === PINK HAIR — spiky tufts on top ===
  const hairColor = `hsl(${enemy.hairHue}, 100%, 62%)`;
  const hairDark  = `hsl(${enemy.hairHue}, 100%, 48%)`;
  const spikes = [
    { x: -r * 0.52, angle: -0.55, len: r * 0.72 },
    { x: -r * 0.22, angle: -0.15, len: r * 0.90 },
    { x:  r * 0.10, angle:  0.05, len: r * 0.95 },
    { x:  r * 0.38, angle:  0.25, len: r * 0.80 },
    { x:  r * 0.60, angle:  0.50, len: r * 0.65 },
  ];
  const hairBaseY = -r * 0.50;
  for (const s of spikes) {
    ctx.fillStyle = hairColor;
    ctx.strokeStyle = hairDark;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(s.x - r * 0.18, hairBaseY);
    ctx.lineTo(
      s.x + Math.sin(s.angle) * s.len,
      hairBaseY - Math.cos(s.angle) * s.len
    );
    ctx.lineTo(s.x + r * 0.18, hairBaseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // Hair base strip to cover body edge
  ctx.fillStyle = hairColor;
  ctx.beginPath();
  ctx.ellipse(r * 0.04, hairBaseY + r * 0.08, r * 0.72, r * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // === BIG GOOGLY EYES ===
  const eyes = [{ ox: -r * 0.30, oy: -r * 0.08 }, { ox: r * 0.30, oy: -r * 0.08 }];
  const eyeR  = r * 0.34;
  const pupR  = eyeR * 0.52;
  const drift = eyeR - pupR;

  for (let i = 0; i < eyes.length; i++) {
    const e = eyes[i];
    const ex = e.ox, ey = e.oy;

    // White sclera with black outline
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ex, ey, eyeR, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Drifting pupil (each eye its own orbit speed)
    const speed = 1.2 + i * 0.35;
    const px = ex + Math.cos(t * speed + enemy.eyeOffset + i * 1.7) * drift * 0.7;
    const py = ey + Math.sin(t * speed * 1.3 + enemy.eyeOffset) * drift * 0.7;
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(px, py, pupR, 0, Math.PI * 2);
    ctx.fill();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(px - pupR * 0.3, py - pupR * 0.3, pupR * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }

  // === ROSY CHEEKS ===
  ctx.fillStyle = `hsla(${enemy.hairHue - 20}, 100%, 78%, 0.55)`;
  ctx.beginPath(); ctx.ellipse(-r * 0.50, r * 0.20, r * 0.22, r * 0.14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( r * 0.50, r * 0.20, r * 0.22, r * 0.14, 0, 0, Math.PI * 2); ctx.fill();

  // === SMILE ===
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, r * 0.28, r * 0.28, 0.2, Math.PI - 0.2);
  ctx.stroke();

  ctx.restore();

  // === SPEECH BUBBLE (drawn in world space, above enemy) ===
  if (enemy.phraseText && now < enemy.phraseUntil) {
    drawSpeechBubble(ctx, cx, cy - r * 1.1, enemy.phraseText, now, enemy.phraseUntil);
  }
}

function drawSpeechBubble(ctx, anchorX, anchorY, text, now, until) {
  ctx.save();
  ctx.font = 'bold 11px monospace';
  const pad = 7;
  const tw  = ctx.measureText(text).width;
  const bw  = tw + pad * 2;
  const bh  = 20;
  const bx  = anchorX - bw / 2;
  const by  = anchorY - bh - 10;

  // Fade out in last 400ms
  const remaining = until - now;
  ctx.globalAlpha = remaining < 400 ? remaining / 400 : 1;

  // Bubble fill + shadow
  ctx.fillStyle = '#ffffff';
  ctx.shadowBlur = 6;
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 6);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Bubble border
  ctx.strokeStyle = '#cc44aa';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Tail pointer
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(anchorX - 5, by + bh);
  ctx.lineTo(anchorX,     by + bh + 10);
  ctx.lineTo(anchorX + 5, by + bh);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#cc44aa';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Text
  ctx.fillStyle = '#880055';
  ctx.fillText(text, bx + pad, by + bh - 6);

  ctx.restore();
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}

export function getFireballs() { return fireballs; }
export function removeFireball(i) { fireballs.splice(i, 1); }

export function drawFireballs(ctx, now) {
  const t = now / 1000;
  for (const f of fireballs) {
    const cx = f.x + FIREBALL_R;
    const cy = f.y + FIREBALL_R;
    const spin = t * 3.5 + f.born * 0.001;
    const hue2 = (f.hue + 25) % 360;

    ctx.save();
    ctx.translate(cx, cy);

    // Outer soft glow
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, FIREBALL_R * 2.4);
    glow.addColorStop(0,   `hsla(${f.hue}, 100%, 65%, 0.45)`);
    glow.addColorStop(1,   `hsla(${f.hue}, 100%, 50%, 0)`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, FIREBALL_R * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Rotating flame petals
    ctx.rotate(spin);
    const numPetals = 6;
    for (let p = 0; p < numPetals; p++) {
      const angle = (p / numPetals) * Math.PI * 2;
      const px = Math.cos(angle) * FIREBALL_R * 0.75;
      const py = Math.sin(angle) * FIREBALL_R * 0.75;
      const petalGrad = ctx.createRadialGradient(px, py, 0, px, py, FIREBALL_R * 0.7);
      petalGrad.addColorStop(0,   `hsla(${hue2}, 100%, 72%, 0.9)`);
      petalGrad.addColorStop(1,   `hsla(${f.hue}, 100%, 50%, 0)`);
      ctx.fillStyle = petalGrad;
      ctx.beginPath();
      ctx.arc(px, py, FIREBALL_R * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.rotate(-spin); // undo petal rotation before core

    // Hot core (doesn't rotate)
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, FIREBALL_R * 0.62);
    core.addColorStop(0,   '#ffffff');
    core.addColorStop(0.3, `hsl(${f.hue}, 100%, 82%)`);
    core.addColorStop(1,   `hsl(${f.hue}, 100%, 52%)`);
    ctx.fillStyle = core;
    ctx.shadowBlur  = 14;
    ctx.shadowColor = `hsl(${f.hue}, 100%, 60%)`;
    ctx.beginPath();
    ctx.arc(0, 0, FIREBALL_R * 0.62, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
