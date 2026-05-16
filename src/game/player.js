// src/game/player.js

import { CONFIG } from './config.js';

let x, y;
let facingX = 0;
let facingY = -1;
let health;
let invincibleUntil = 0;
let cartwheelUntil = 0;

const CARTWHEEL_DURATION = 600;

export function resetPlayer(arenaWidth, arenaHeight) {
  x = arenaWidth / 2;
  y = arenaHeight / 2;
  facingX = 0;
  facingY = -1;
  health = CONFIG.playerMaxHealth;
  invincibleUntil = 0;
  cartwheelUntil = 0;
}

export function triggerCartwheel(now) {
  if (now < cartwheelUntil) return;
  cartwheelUntil = now + CARTWHEEL_DURATION;
}

export function isCartwheeling(now) {
  return now < cartwheelUntil;
}

export function healPlayer(amount) {
  health = Math.min(CONFIG.playerMaxHealth, health + amount);
}

export function setPlayerPosition(nx, ny) {
  x = nx;
  y = ny;
}

export function updatePlayer(dt, input, arenaWidth, arenaHeight, now, speedMultiplier = 1) {
  const scale = dt / 16.67;
  let mx = input.stickX;
  let my = input.stickY;
  // Normalize diagonal movement
  const mag = Math.sqrt(mx * mx + my * my);
  if (mag > 1) { mx /= mag; my /= mag; }
  const dx = mx * CONFIG.playerSpeed * speedMultiplier * scale;
  const dy = my * CONFIG.playerSpeed * speedMultiplier * scale;

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
  const r = s / 2;
  const spinning = now < cartwheelUntil;
  const angle = spinning ? ((now - (cartwheelUntil - CARTWHEEL_DURATION)) / CARTWHEEL_DURATION) * Math.PI * 2 : 0;

  ctx.save();
  ctx.translate(x, y);
  if (spinning) ctx.rotate(angle);

  // Legs
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = r * 0.38;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-r * 0.18, r * 0.12); ctx.lineTo(-r * 0.32, r * 0.85); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(r * 0.18, r * 0.12); ctx.lineTo(r * 0.32, r * 0.85); ctx.stroke();

  // Shirt (body)
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(-r * 0.42, -r * 0.28, r * 0.84, r * 0.48);

  // Arms
  ctx.strokeStyle = '#F0A070';
  ctx.lineWidth = r * 0.28;
  ctx.beginPath(); ctx.moveTo(-r * 0.42, -r * 0.18); ctx.lineTo(-r * 0.82, r * 0.12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(r * 0.42, -r * 0.18); ctx.lineTo(r * 0.82, r * 0.12); ctx.stroke();

  // Head
  ctx.fillStyle = '#F0A070';
  ctx.beginPath(); ctx.arc(0, -r * 0.62, r * 0.36, 0, Math.PI * 2); ctx.fill();

  // Hair
  ctx.fillStyle = '#5C3317';
  ctx.beginPath(); ctx.arc(0, -r * 0.82, r * 0.3, Math.PI, 0); ctx.fill();
  ctx.fillRect(-r * 0.3, -r * 0.88, r * 0.14, r * 0.28);
  ctx.fillRect(r * 0.16, -r * 0.88, r * 0.14, r * 0.28);

  // Eyes
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-r * 0.13, -r * 0.63, r * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(r * 0.13, -r * 0.63, r * 0.07, 0, Math.PI * 2); ctx.fill();

  // Smile
  ctx.strokeStyle = '#7a3a10';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, -r * 0.55, r * 0.13, 0.3, Math.PI - 0.3); ctx.stroke();

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
