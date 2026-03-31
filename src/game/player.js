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
  const half = s / 2;
  ctx.save();
  ctx.translate(x, y);

  // Cute bouncing
  const bounce = Math.sin(now / 150) * 2;
  ctx.translate(0, bounce);

  // Ears
  ctx.fillStyle = '#c8956c';
  ctx.beginPath();
  ctx.arc(-half * 0.6, -half * 0.85, s * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(half * 0.6, -half * 0.85, s * 0.25, 0, Math.PI * 2);
  ctx.fill();
  // Inner ears
  ctx.fillStyle = '#ffb6c1';
  ctx.beginPath();
  ctx.arc(-half * 0.6, -half * 0.85, s * 0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(half * 0.6, -half * 0.85, s * 0.14, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#c8956c';
  ctx.beginPath();
  ctx.ellipse(0, half * 0.3, half * 0.7, half * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly patch
  ctx.fillStyle = '#deb887';
  ctx.beginPath();
  ctx.ellipse(0, half * 0.35, half * 0.4, half * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#c8956c';
  ctx.beginPath();
  ctx.arc(0, -half * 0.15, half * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // Muzzle
  ctx.fillStyle = '#deb887';
  ctx.beginPath();
  ctx.ellipse(0, -half * 0.02, half * 0.3, half * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes — sparkly!
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(-half * 0.22, -half * 0.28, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(half * 0.22, -half * 0.28, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Eye sparkles
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-half * 0.2, -half * 0.31, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(half * 0.24, -half * 0.31, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#ff69b4';
  ctx.beginPath();
  ctx.ellipse(0, -half * 0.1, 3, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.strokeStyle = '#a0704f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, -half * 0.04, half * 0.15, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // Blush cheeks
  ctx.fillStyle = 'rgba(255,150,180,0.4)';
  ctx.beginPath();
  ctx.ellipse(-half * 0.42, -half * 0.12, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(half * 0.42, -half * 0.12, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Love heart floating above head
  const heartBob = Math.sin(now / 400) * 4;
  const heartAlpha = 0.5 + Math.sin(now / 300) * 0.3;
  ctx.globalAlpha = heartAlpha;
  ctx.fillStyle = '#ff69b4';
  drawMiniHeart(ctx, 0, -half * 1.4 + heartBob, 5);
  ctx.globalAlpha = 1;

  ctx.restore();
}

function drawMiniHeart(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.3);
  ctx.bezierCurveTo(cx - size, cy - size * 0.3, cx - size, cy - size, cx, cy - size * 0.5);
  ctx.bezierCurveTo(cx + size, cy - size, cx + size, cy - size * 0.3, cx, cy + size * 0.3);
  ctx.fill();
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
