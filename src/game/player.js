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
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(Math.atan2(facingY, facingX) + Math.PI / 2);

  // Legs
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(-s * 0.38, s * 0.06, s * 0.33, s * 0.44);
  ctx.fillRect(s * 0.05,  s * 0.06, s * 0.33, s * 0.44);
  ctx.fillStyle = '#152d6e';
  ctx.fillRect(-s * 0.05, s * 0.06, s * 0.1, s * 0.44); // leg gap

  // Torso
  ctx.fillStyle = '#e63322';
  ctx.fillRect(-s * 0.44, -s * 0.2, s * 0.88, s * 0.28);
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(-s * 0.44, -s * 0.2, s * 0.88, s * 0.09); // highlight

  // Arms
  ctx.fillStyle = '#e63322';
  ctx.fillRect(-s * 0.58, -s * 0.2, s * 0.15, s * 0.26);
  ctx.fillRect( s * 0.43, -s * 0.2, s * 0.15, s * 0.26);
  // Hands
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(-s * 0.58, s * 0.06, s * 0.15, s * 0.1);
  ctx.fillRect( s * 0.43, s * 0.06, s * 0.15, s * 0.1);

  // Head
  const hr = s * 0.3;
  ctx.fillStyle = '#ffd700';
  ctx.beginPath(); ctx.arc(0, -s * 0.34, hr, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ccaa00'; ctx.lineWidth = 1.5; ctx.stroke();

  // Eyes
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(-s * 0.1, -s * 0.36, s * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( s * 0.1, -s * 0.36, s * 0.05, 0, Math.PI * 2); ctx.fill();

  // Smile
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, -s * 0.3, s * 0.1, 0.25, Math.PI - 0.25); ctx.stroke();

  // Stud on top of head
  ctx.fillStyle = '#ffc500';
  ctx.beginPath(); ctx.arc(0, -s * 0.34 - hr + s * 0.04, s * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ccaa00'; ctx.lineWidth = 1; ctx.stroke();

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
