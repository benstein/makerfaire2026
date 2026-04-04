// src/game/player.js

import { CONFIG } from './config.js';
import { isSpeedBoosted, isInvisible } from './powers.js';

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
  const speedMult = isSpeedBoosted() ? 2 : 1;
  const dx = mx * CONFIG.playerSpeed * speedMult * scale;
  const dy = my * CONFIG.playerSpeed * speedMult * scale;

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

  const half = CONFIG.playerSize / 2;

  // Invisibility: ghost effect
  if (isInvisible()) {
    ctx.globalAlpha = 0.15 + Math.sin(now / 200) * 0.1;
  }

  // Speed boost: trail + tint
  if (isSpeedBoosted()) {
    ctx.fillStyle = '#ffd700';
    // Speed lines behind player
    ctx.globalAlpha = 0.3;
    ctx.fillRect(x - half - 8, y - half + 4, 6, 3);
    ctx.fillRect(x - half - 12, y - half + 12, 8, 2);
    ctx.fillRect(x - half - 6, y - half + 20, 5, 3);
    ctx.globalAlpha = isInvisible() ? 0.15 : 1;
  }

  ctx.fillStyle = isSpeedBoosted() ? '#ffd700' : CONFIG.playerColor;
  ctx.fillRect(x - half, y - half, CONFIG.playerSize, CONFIG.playerSize);
  ctx.globalAlpha = 1;
}

// Reposition without resetting health (for level transitions)
export function repositionPlayer(arenaWidth, arenaHeight) {
  x = arenaWidth / 2;
  y = arenaHeight / 2;
}

export function healPlayer(amount) {
  health = Math.min(health + amount, CONFIG.playerMaxHealth);
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
