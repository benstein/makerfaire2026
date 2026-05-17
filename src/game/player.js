// src/game/player.js

import { CONFIG } from './config.js';

let x, y;
let facingX = 0;
let facingY = -1; // default facing up
let health;
let maxHealth;
let sizeBonus = 0;
let invincibleUntil = 0;

function effectiveSize() { return CONFIG.playerSize + sizeBonus; }

export function resetPlayer(arenaWidth, arenaHeight) {
  x = arenaWidth / 2;
  y = arenaHeight / 2;
  facingX = 0;
  facingY = -1;
  maxHealth = CONFIG.playerMaxHealth;
  health = maxHealth;
  sizeBonus = 0;
  invincibleUntil = 0;
}

export function growPlayer() { sizeBonus += 8; }

export function healPlayer(amount) {
  maxHealth += amount;
  health += amount;
}

export function getPlayerMaxHealth() { return maxHealth; }

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

  const half = effectiveSize() / 2;
  x = Math.max(half, Math.min(arenaWidth - half, x));
  y = Math.max(half, Math.min(arenaHeight - half, y));
}

export function drawPlayer(ctx, now) {
  if (now < invincibleUntil) {
    if (Math.floor(now / 80) % 2 === 0) return;
  }

  const sz   = effectiveSize();
  const half = sz / 2;
  ctx.fillStyle = CONFIG.playerColor;
  ctx.fillRect(x - half, y - half, sz, sz);
}

export function getPlayerPos() {
  return { x, y };
}

export function setPlayerPos(nx, ny) {
  x = nx;
  y = ny;
}

export function getPlayerFacing() {
  return { x: facingX, y: facingY };
}

export function getPlayerHealth() {
  return health;
}

export function getPlayerBounds() {
  const sz   = effectiveSize();
  const half = sz / 2;
  return { x: x - half, y: y - half, w: sz, h: sz };
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
