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

export function drawPlayer(ctx, now, drawScale) {
  if (now < invincibleUntil) {
    if (Math.floor(now / 80) % 2 === 0) return;
  }

  const size = CONFIG.playerSize;
  const half = size / 2;
  const px = size / 14; // pixel unit for 14x16 sprite grid
  const s = drawScale != null ? drawScale : 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.translate(-half, -half);

  // Mario pixel art (facing camera)
  // Hat (red)
  ctx.fillStyle = '#E52521';
  ctx.fillRect(3*px, 0, 8*px, px);       // hat brim top
  ctx.fillRect(2*px, px, 11*px, px);      // hat brim wide
  ctx.fillRect(2*px, 2*px, 12*px, px);    // hat body

  // Hair/skin base
  ctx.fillStyle = '#FEB982';
  ctx.fillRect(2*px, 3*px, 3*px, px);     // left face
  ctx.fillRect(7*px, 3*px, 3*px, px);     // right face
  ctx.fillStyle = '#6B3A23';
  ctx.fillRect(5*px, 3*px, 2*px, px);     // hair center

  // Face row 1
  ctx.fillStyle = '#6B3A23';
  ctx.fillRect(1*px, 4*px, px, px);       // left hair
  ctx.fillStyle = '#FEB982';
  ctx.fillRect(2*px, 4*px, 2*px, px);     // left face
  ctx.fillStyle = '#6B3A23';
  ctx.fillRect(4*px, 4*px, px, px);       // left eye
  ctx.fillStyle = '#FEB982';
  ctx.fillRect(5*px, 4*px, 2*px, px);     // nose bridge
  ctx.fillStyle = '#6B3A23';
  ctx.fillRect(7*px, 4*px, px, px);       // right eye
  ctx.fillStyle = '#FEB982';
  ctx.fillRect(8*px, 4*px, 2*px, px);     // right face
  ctx.fillStyle = '#6B3A23';
  ctx.fillRect(10*px, 4*px, px, px);      // right hair

  // Face row 2 — mustache & mouth
  ctx.fillStyle = '#FEB982';
  ctx.fillRect(2*px, 5*px, px, px);       // left cheek
  ctx.fillStyle = '#6B3A23';
  ctx.fillRect(3*px, 5*px, 3*px, px);     // mustache left
  ctx.fillStyle = '#FEB982';
  ctx.fillRect(6*px, 5*px, px, px);       // mouth gap
  ctx.fillStyle = '#6B3A23';
  ctx.fillRect(7*px, 5*px, 3*px, px);     // mustache right
  ctx.fillStyle = '#FEB982';
  ctx.fillRect(10*px, 5*px, px, px);      // right cheek

  // Chin
  ctx.fillStyle = '#FEB982';
  ctx.fillRect(3*px, 6*px, 7*px, px);

  // Shirt / overalls top
  ctx.fillStyle = '#049CD8';
  ctx.fillRect(2*px, 7*px, px, px);       // left strap
  ctx.fillStyle = '#E52521';
  ctx.fillRect(3*px, 7*px, 3*px, px);     // shirt left
  ctx.fillStyle = '#049CD8';
  ctx.fillRect(6*px, 7*px, px, px);       // middle
  ctx.fillStyle = '#E52521';
  ctx.fillRect(7*px, 7*px, 3*px, px);     // shirt right
  ctx.fillStyle = '#049CD8';
  ctx.fillRect(10*px, 7*px, px, px);      // right strap

  // Overalls body
  ctx.fillStyle = '#049CD8';
  ctx.fillRect(1*px, 8*px, 11*px, px);    // full overalls row
  ctx.fillRect(1*px, 9*px, 5*px, px);     // left overalls
  ctx.fillStyle = '#FBD000';
  ctx.fillRect(6*px, 9*px, px, px);       // belt buckle
  ctx.fillStyle = '#049CD8';
  ctx.fillRect(7*px, 9*px, 5*px, px);     // right overalls

  // Overalls lower
  ctx.fillStyle = '#049CD8';
  ctx.fillRect(1*px, 10*px, 4*px, px);
  ctx.fillStyle = '#E52521';
  ctx.fillRect(5*px, 10*px, 3*px, px);    // shirt peek
  ctx.fillStyle = '#049CD8';
  ctx.fillRect(8*px, 10*px, 4*px, px);

  // Legs / boots
  ctx.fillStyle = '#049CD8';
  ctx.fillRect(1*px, 11*px, 4*px, px);
  ctx.fillRect(8*px, 11*px, 4*px, px);
  ctx.fillStyle = '#6B3A23';
  ctx.fillRect(0, 12*px, 5*px, 2*px);     // left boot
  ctx.fillRect(8*px, 12*px, 5*px, 2*px);  // right boot

  ctx.restore();
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
