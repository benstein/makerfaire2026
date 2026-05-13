// src/game/player.js

import { CONFIG } from './config.js';

let x, y;
let vx = 0, vy = 0; // ice-physics velocity
let facingX = 0;
let facingY = -1; // default facing up
let health;
let invincibleUntil = 0;

// Ice physics: low value = slippery, slow to change velocity.
const ICE_ACCEL = 0.045;

export function resetPlayer(arenaWidth, arenaHeight) {
  x = arenaWidth / 2;
  y = arenaHeight / 2;
  vx = 0;
  vy = 0;
  facingX = 0;
  facingY = -1;
  health = CONFIG.playerMaxHealth;
  invincibleUntil = 0;
}

export function updatePlayer(dt, input, arenaWidth, arenaHeight, now) {
  const scale = dt / 16.67;
  // INVERTED CONTROLS — push the stick one way, the Cat goes the opposite way.
  let mx = -input.stickX;
  let my = -input.stickY;
  // Normalize diagonal movement
  const mag = Math.sqrt(mx * mx + my * my);
  if (mag > 1) { mx /= mag; my /= mag; }

  // Slide on ice — accelerate toward target velocity, current velocity persists.
  const targetVx = mx * CONFIG.playerSpeed;
  const targetVy = my * CONFIG.playerSpeed;
  vx += (targetVx - vx) * ICE_ACCEL * scale;
  vy += (targetVy - vy) * ICE_ACCEL * scale;

  x += vx * scale;
  y += vy * scale;

  if (Math.abs(input.stickX) > 0 || Math.abs(input.stickY) > 0) {
    const fmag = Math.sqrt(input.stickX * input.stickX + input.stickY * input.stickY);
    facingX = -input.stickX / fmag;
    facingY = -input.stickY / fmag;
  }

  // Bounce off walls — feels icy
  const half = CONFIG.playerSize / 2;
  if (x < half) { x = half; vx = Math.abs(vx) * 0.4; }
  if (x > arenaWidth - half) { x = arenaWidth - half; vx = -Math.abs(vx) * 0.4; }
  if (y < half) { y = half; vy = Math.abs(vy) * 0.4; }
  if (y > arenaHeight - half) { y = arenaHeight - half; vy = -Math.abs(vy) * 0.4; }
}

export function drawPlayer(ctx, now) {
  if (now < invincibleUntil) {
    if (Math.floor(now / 80) % 2 === 0) return;
  }

  const size = CONFIG.playerSize;
  const half = size / 2;
  const cx = x;
  const cy = y;
  const swing = Math.sin(now / 130) * 0.28;

  // --- TALL STRIPED HAT (drawn first, behind everything) ---
  const hatH = size * 1.45;
  const hatW = size * 0.68;
  const brimH = size * 0.11;
  const brimW = size * 0.96;
  const hatTop = cy - size * 0.18 - hatH;
  const brimY = cy - size * 0.18 - brimH;

  // Hat stripes: 3 red, 3 white, alternating
  const stripes = 6;
  const stripeH = hatH / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#cc1111' : '#ffffff';
    ctx.fillRect(cx - hatW / 2, hatTop + i * stripeH, hatW, stripeH + 1);
  }
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - hatW / 2, hatTop, hatW, hatH);

  // Brim
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - brimW / 2, brimY, brimW, brimH);
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - brimW / 2, brimY, brimW, brimH);

  // --- ARMS (thin, expressive, swinging) ---
  ctx.strokeStyle = '#f0e0c0';
  ctx.lineWidth = size * 0.09;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.22, cy + size * 0.05);
  ctx.quadraticCurveTo(cx - size * 0.52, cy + size * 0.2 + swing * 18, cx - size * 0.50, cy + size * 0.48 + swing * 22);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + size * 0.22, cy + size * 0.05);
  ctx.quadraticCurveTo(cx + size * 0.52, cy + size * 0.2 - swing * 18, cx + size * 0.50, cy + size * 0.48 - swing * 22);
  ctx.stroke();
  // White gloves
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx - size * 0.50, cy + size * 0.48 + swing * 22, size * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + size * 0.50, cy + size * 0.48 - swing * 22, size * 0.11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // --- BODY ---
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cx - size * 0.22, cy - size * 0.08, size * 0.44, size * 0.56, size * 0.08);
  ctx.fill();
  ctx.stroke();

  // --- BOW TIE ---
  ctx.fillStyle = '#cc1111';
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.07);
  ctx.lineTo(cx - size * 0.17, cy - size * 0.04);
  ctx.lineTo(cx - size * 0.17, cy + size * 0.17);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.07);
  ctx.lineTo(cx + size * 0.17, cy - size * 0.04);
  ctx.lineTo(cx + size * 0.17, cy + size * 0.17);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy + size * 0.065, size * 0.045, 0, Math.PI * 2);
  ctx.fill();

  // --- HEAD ---
  ctx.fillStyle = '#f5e8d0';
  ctx.strokeStyle = '#333333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.10, size * 0.29, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cat ears (peek under the hat brim)
  const earL = [cx - size * 0.22, cy - size * 0.26, cx - size * 0.34, cy - size * 0.46, cx - size * 0.10, cy - size * 0.36];
  const earR = [cx + size * 0.22, cy - size * 0.26, cx + size * 0.34, cy - size * 0.46, cx + size * 0.10, cy - size * 0.36];
  for (const [ex1, ey1, ex2, ey2, ex3, ey3] of [earL, earR]) {
    ctx.fillStyle = '#f5e8d0';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ex1, ey1);
    ctx.lineTo(ex2, ey2);
    ctx.lineTo(ex3, ey3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Inner ear pink
    ctx.fillStyle = '#ffaabb';
    ctx.beginPath();
    ctx.moveTo((ex1 + ex2) / 2, (ey1 + ey2) / 2);
    ctx.lineTo(ex2, ey2);
    ctx.lineTo((ex2 + ex3) / 2, (ey2 + ey3) / 2);
    ctx.closePath();
    ctx.fill();
  }

  // Big eyes (slightly tilted, mischievous)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.11, cy - size * 0.13, size * 0.08, size * 0.095, -0.2, 0, Math.PI * 2);
  ctx.ellipse(cx + size * 0.11, cy - size * 0.13, size * 0.08, size * 0.095,  0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.11, cy - size * 0.13, size * 0.08, size * 0.095, -0.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx + size * 0.11, cy - size * 0.13, size * 0.08, size * 0.095,  0.2, 0, Math.PI * 2);
  ctx.stroke();
  // Slit pupils
  ctx.fillStyle = '#110800';
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.11, cy - size * 0.13, size * 0.026, size * 0.068, -0.2, 0, Math.PI * 2);
  ctx.ellipse(cx + size * 0.11, cy - size * 0.13, size * 0.026, size * 0.068,  0.2, 0, Math.PI * 2);
  ctx.fill();
  // Eye shine
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx - size * 0.125, cy - size * 0.155, size * 0.020, 0, Math.PI * 2);
  ctx.arc(cx + size * 0.095, cy - size * 0.155, size * 0.020, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#ff9966';
  ctx.beginPath();
  ctx.moveTo(cx,               cy - size * 0.04);
  ctx.lineTo(cx - size * 0.03, cy + size * 0.01);
  ctx.lineTo(cx + size * 0.03, cy + size * 0.01);
  ctx.closePath();
  ctx.fill();

  // Mischievous grin
  ctx.strokeStyle = '#443322';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.11, cy + size * 0.02);
  ctx.quadraticCurveTo(cx - size * 0.05, cy + size * 0.07, cx, cy + size * 0.04);
  ctx.quadraticCurveTo(cx + size * 0.05, cy + size * 0.07, cx + size * 0.11, cy + size * 0.02);
  ctx.stroke();

  // Whiskers
  ctx.strokeStyle = 'rgba(80,60,40,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.12, cy - size * 0.01); ctx.lineTo(cx - size * 0.33, cy - size * 0.05);
  ctx.moveTo(cx - size * 0.12, cy + size * 0.03); ctx.lineTo(cx - size * 0.33, cy + size * 0.03);
  ctx.moveTo(cx + size * 0.12, cy - size * 0.01); ctx.lineTo(cx + size * 0.33, cy - size * 0.05);
  ctx.moveTo(cx + size * 0.12, cy + size * 0.03); ctx.lineTo(cx + size * 0.33, cy + size * 0.03);
  ctx.stroke();
}

export function getPlayerPos() {
  return { x, y };
}

export function getPlayerFacing() {
  return { x: facingX, y: facingY };
}

export function getPlayerHealth() {
  return health;
}

export function getPlayerBounds() {
  const half = CONFIG.playerSize / 2;
  return { x: x - half, y: y - half, w: CONFIG.playerSize, h: CONFIG.playerSize };
}

export function isPlayerInvincible(now) {
  return now < invincibleUntil;
}

export function damagePlayer(now) {
  if (now < invincibleUntil) return false;
  health -= 1;
  invincibleUntil = now + CONFIG.invincibilityDuration;
  return true;
}
