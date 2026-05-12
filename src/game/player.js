// src/game/player.js

import { CONFIG } from './config.js';

let x, y;
let facingX = 0;
let facingY = -1; // default facing up
let health;
let invincibleUntil = 0;

export function resetPlayer(arenaWidth, arenaHeight) {
  x = arenaWidth / 2;
  y = arenaHeight / 2;
  facingX = 0;
  facingY = -1;
  health = CONFIG.playerMaxHealth;
  invincibleUntil = 0;
}

export function updatePlayer(dt, input, arenaWidth, arenaHeight, now) {
  const scale = dt / 16.67;
  let mx = input.stickX;
  let my = input.stickY;
  // Normalize diagonal movement
  const mag = Math.sqrt(mx * mx + my * my);
  if (mag > 1) { mx /= mag; my /= mag; }
  const dx = mx * CONFIG.playerSpeed * scale;
  const dy = my * CONFIG.playerSpeed * scale;

  x += dx;
  y += dy;

  if (Math.abs(input.stickX) > 0 || Math.abs(input.stickY) > 0) {
    const mag = Math.sqrt(input.stickX * input.stickX + input.stickY * input.stickY);
    facingX = input.stickX / mag;
    facingY = input.stickY / mag;
  }

  const half = CONFIG.playerSize / 2;
  x = Math.max(half, Math.min(arenaWidth - half, x));
  y = Math.max(half, Math.min(arenaHeight - half, y));
}

export function drawPlayer(ctx, now) {
  if (now < invincibleUntil) {
    if (Math.floor(now / 80) % 2 === 0) return;
  }

  const size = CONFIG.playerSize;
  const half = size / 2;
  const cx = x;
  const cy = y;

  // Subtle arm swing while moving (based on time)
  const swing = Math.sin(now / 120) * (size * 0.08);

  // --- BIG ARMS (drawn first so body overlaps them) ---
  ctx.fillStyle = '#2b1a10'; // darker arm fur
  // Left arm — long oval reaching down-left
  ctx.save();
  ctx.translate(cx - half * 0.85, cy + size * 0.05 + swing);
  ctx.rotate(-0.25);
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.22, size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Right arm — long oval reaching down-right
  ctx.save();
  ctx.translate(cx + half * 0.85, cy + size * 0.05 - swing);
  ctx.rotate(0.25);
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.22, size * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Knuckle fists
  ctx.fillStyle = '#1a0e07';
  ctx.beginPath();
  ctx.arc(cx - half * 1.05, cy + size * 0.55 + swing, size * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + half * 1.05, cy + size * 0.55 - swing, size * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // --- BODY (barrel chest) ---
  ctx.fillStyle = '#3a2418';
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.1, size * 0.42, size * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();

  // Lighter chest patch
  ctx.fillStyle = '#7a5a3e';
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.15, size * 0.22, size * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- HEAD ---
  ctx.fillStyle = '#2b1a10';
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.32, size * 0.32, 0, Math.PI * 2);
  ctx.fill();

  // Face (lighter muzzle area)
  ctx.fillStyle = '#c9a47a';
  ctx.beginPath();
  ctx.ellipse(cx, cy - size * 0.22, size * 0.20, size * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();

  // Brow ridge
  ctx.fillStyle = '#1a0e07';
  ctx.beginPath();
  ctx.ellipse(cx, cy - size * 0.36, size * 0.22, size * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx - size * 0.10, cy - size * 0.30, size * 0.05, 0, Math.PI * 2);
  ctx.arc(cx + size * 0.10, cy - size * 0.30, size * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(cx - size * 0.10, cy - size * 0.30, size * 0.025, 0, Math.PI * 2);
  ctx.arc(cx + size * 0.10, cy - size * 0.30, size * 0.025, 0, Math.PI * 2);
  ctx.fill();

  // Nostrils
  ctx.fillStyle = '#3a1f10';
  ctx.beginPath();
  ctx.arc(cx - size * 0.04, cy - size * 0.18, size * 0.018, 0, Math.PI * 2);
  ctx.arc(cx + size * 0.04, cy - size * 0.18, size * 0.018, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  ctx.strokeStyle = '#3a1f10';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.12, size * 0.07, 0, Math.PI);
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
