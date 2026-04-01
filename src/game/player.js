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

  // Stem/leaves on top
  ctx.fillStyle = '#4A7C3F';
  ctx.beginPath();
  ctx.moveTo(0, -half - 10);
  ctx.lineTo(-4, -half - 2);
  ctx.lineTo(4, -half - 2);
  ctx.closePath();
  ctx.fill();
  // Side leaves
  ctx.beginPath();
  ctx.moveTo(-6, -half - 6);
  ctx.lineTo(-10, -half - 12);
  ctx.lineTo(-2, -half - 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6, -half - 6);
  ctx.lineTo(10, -half - 12);
  ctx.lineTo(2, -half - 4);
  ctx.closePath();
  ctx.fill();

  // Main body — layered artichoke leaves (rounded bottom)
  // Outer leaves (darker green)
  ctx.fillStyle = '#5B8C4A';
  ctx.beginPath();
  ctx.ellipse(0, 2, half + 2, half + 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Leaf scale pattern — rows of overlapping arcs
  const leafColors = ['#6B9C55', '#7DAE62', '#6B9C55', '#5B8C4A'];
  for (let row = 0; row < 4; row++) {
    ctx.fillStyle = leafColors[row];
    const rowY = -half + 6 + row * (s / 4.5);
    const leafCount = row === 0 ? 3 : (row === 3 ? 2 : 4);
    const leafW = s / leafCount;
    for (let l = 0; l < leafCount; l++) {
      const lx = -half + l * leafW + leafW / 2 + (row % 2 ? leafW / 3 : 0);
      ctx.beginPath();
      ctx.ellipse(lx, rowY, leafW / 2 + 1, s / 7, 0, Math.PI, 0, true);
      ctx.fill();
    }
  }

  // Highlight on top-left
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.ellipse(-4, -4, half * 0.5, half * 0.6, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Happy face
  // Eyes
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(-5, -1, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(5, -1, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Eye shine
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-4, -2, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6, -2, 1, 0, Math.PI * 2);
  ctx.fill();
  // Smile
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 2, 5, 0.15, Math.PI - 0.15);
  ctx.stroke();
  // Rosy cheeks
  ctx.fillStyle = 'rgba(220,100,100,0.3)';
  ctx.beginPath();
  ctx.arc(-8, 3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, 3, 3, 0, Math.PI * 2);
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
