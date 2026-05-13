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
  const cx = x;
  const cy = y;
  const bob = Math.sin(now / 180) * 2.5; // gentle gliding float

  // --- ROCKY THE FLYING SQUIRREL ---

  // Wing membranes (glider flaps, drawn behind body)
  ctx.fillStyle = '#c4813a';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.12, cy - size * 0.28 + bob);
  ctx.lineTo(cx - size * 0.72, cy + size * 0.22 + bob);
  ctx.lineTo(cx - size * 0.12, cy + size * 0.38 + bob);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + size * 0.12, cy - size * 0.28 + bob);
  ctx.lineTo(cx + size * 0.72, cy + size * 0.22 + bob);
  ctx.lineTo(cx + size * 0.12, cy + size * 0.38 + bob);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Fluffy tail
  ctx.fillStyle = '#8b5a28';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.54 + bob, size * 0.46, size * 0.30, -0.2, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#bb8844';
  ctx.beginPath();
  ctx.ellipse(cx - size * 0.05, cy + size * 0.42 + bob, size * 0.24, size * 0.16, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#7a5535';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.05 + bob, size * 0.26, size * 0.36, 0, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8d4a8';
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.12 + bob, size * 0.13, size * 0.20, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#7a5535';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.30 + bob, size * 0.22, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Aviator cap — red
  ctx.fillStyle = '#cc2222';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.35 + bob, size * 0.22, Math.PI, 0);
  ctx.lineTo(cx + size * 0.22, cy - size * 0.22 + bob);
  ctx.lineTo(cx - size * 0.22, cy - size * 0.22 + bob);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Cap strap
  ctx.strokeStyle = '#881111';
  ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.20, cy - size * 0.23 + bob);
  ctx.lineTo(cx - size * 0.08, cy - size * 0.14 + bob);
  ctx.moveTo(cx + size * 0.20, cy - size * 0.23 + bob);
  ctx.lineTo(cx + size * 0.08, cy - size * 0.14 + bob);
  ctx.stroke();

  // Goggles
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx - size * 0.10, cy - size * 0.28 + bob, size * 0.085, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + size * 0.10, cy - size * 0.28 + bob, size * 0.085, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(150, 220, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(cx - size * 0.10, cy - size * 0.28 + bob, size * 0.065, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + size * 0.10, cy - size * 0.28 + bob, size * 0.065, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000000'; ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.015, cy - size * 0.28 + bob);
  ctx.lineTo(cx + size * 0.015, cy - size * 0.28 + bob);
  ctx.stroke();

  // Nose + smile
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.19 + bob, size * 0.028, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000000'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy - size * 0.15 + bob, size * 0.048, 0, Math.PI);
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
