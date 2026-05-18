// src/game/player.js

import { CONFIG } from './config.js';
import { project3D } from './rendering.js';

let x, y;
let facingX = 0;
let facingY = -1;
let health;
let invincibleUntil = 0;
let jumpZ  = 0;   // height above ground (world units)
let jumpVZ = 0;   // vertical velocity (negative = rising)

const JUMP_POWER = 16;  // initial upward speed
const GRAVITY    = 0.9; // downward acceleration per frame

export function resetPlayer(arenaWidth, arenaHeight) {
  x = arenaWidth / 2;
  y = arenaHeight / 2;
  facingX = 0;
  facingY = -1;
  health = CONFIG.playerMaxHealth;
  invincibleUntil = 0;
  jumpZ  = 0;
  jumpVZ = 0;
}

export function getPlayerJumpZ() { return jumpZ; }

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

  // Jump
  if (input.jump && jumpZ <= 0) jumpVZ = -JUMP_POWER;
  jumpVZ += GRAVITY * scale;
  jumpZ   = Math.max(0, jumpZ + jumpVZ * scale);
  if (jumpZ <= 0 && jumpVZ > 0) jumpVZ = 0; // landed
}

export function drawPlayer(ctx, now, canvasW, canvasH) {
  if (now < invincibleUntil) {
    if (Math.floor(now / 80) % 2 === 0) return;
  }
  const { x: sx, y: sy, scale } = project3D(x, y, canvasW, canvasH);
  const size      = CONFIG.playerSize * scale;
  const liftPx    = jumpZ * scale * 2.2; // screen pixels to lift when jumping
  const shadowFade = Math.max(0.05, 1 - jumpZ / 120);

  // Ground shadow (shrinks and fades as player rises)
  const shadowScale = shadowFade * 0.42;
  ctx.fillStyle = `rgba(0,0,0,${shadowFade * 0.35})`;
  ctx.beginPath();
  ctx.ellipse(sx, sy + size * 0.15, size * shadowScale, size * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  // Player body — lifted by jump
  const drawY = sy - liftPx;
  ctx.fillStyle = CONFIG.playerColor;
  ctx.fillRect(sx - size / 2, drawY - size / 2, size, size);
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
