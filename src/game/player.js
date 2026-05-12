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

  const s = CONFIG.playerSize;
  const cx = x;
  const cy = y;

  ctx.save();

  // Left arm
  ctx.fillStyle = '#3a1a00';
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.75, cy + s * 0.1, s * 0.22, s * 0.38, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Right arm
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.75, cy + s * 0.1, s * 0.22, s * 0.38, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#2a0f00';
  ctx.beginPath();
  ctx.ellipse(cx, cy + s * 0.2, s * 0.48, s * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#2a0f00';
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.18, s * 0.42, 0, Math.PI * 2);
  ctx.fill();

  // Gorilla brow ridge
  ctx.fillStyle = '#1a0800';
  ctx.beginPath();
  ctx.ellipse(cx, cy - s * 0.38, s * 0.38, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  // Face (lighter muzzle area)
  ctx.fillStyle = '#8b5e3c';
  ctx.beginPath();
  ctx.ellipse(cx, cy - s * 0.08, s * 0.28, s * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(cx - s * 0.13, cy - s * 0.24, s * 0.07, 0, Math.PI * 2);
  ctx.arc(cx + s * 0.13, cy - s * 0.24, s * 0.07, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(cx - s * 0.13, cy - s * 0.24, s * 0.04, 0, Math.PI * 2);
  ctx.arc(cx + s * 0.13, cy - s * 0.24, s * 0.04, 0, Math.PI * 2);
  ctx.fill();

  // Nostrils
  ctx.fillStyle = '#1a0800';
  ctx.beginPath();
  ctx.arc(cx - s * 0.08, cy - s * 0.04, s * 0.05, 0, Math.PI * 2);
  ctx.arc(cx + s * 0.08, cy - s * 0.04, s * 0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
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
