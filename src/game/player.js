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

  const t = now / 1000;
  const pulse = Math.sin(t * 5) * 0.28 + 0.72; // breathes between 0.44 and 1.0
  const r = CONFIG.playerSize / 2; // 14

  ctx.save();
  ctx.translate(x, y);

  // Soft outer halos (several concentric, cycling hues)
  for (let ring = 4; ring >= 1; ring--) {
    const hue = (t * 55 + ring * 50) % 360;
    ctx.beginPath();
    ctx.arc(0, 0, r * (1.4 + ring * 0.7) * pulse, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 100%, 65%, ${0.055 * (5 - ring)})`;
    ctx.fill();
  }

  // 8 rotating rainbow beams
  const numBeams = 8;
  for (let i = 0; i < numBeams; i++) {
    const angle = (i / numBeams) * Math.PI * 2 + t * 1.4;
    const hue   = (i / numBeams * 360 + t * 50) % 360;
    const len   = r * (3.2 + Math.sin(t * 2.5 + i) * 0.8) * pulse;
    const width = r * 0.32;

    ctx.save();
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(r * 0.4, 0, len, 0);
    grad.addColorStop(0, `hsla(${hue}, 100%, 75%, 0.95)`);
    grad.addColorStop(0.5, `hsla(${(hue + 40) % 360}, 100%, 65%, 0.5)`);
    grad.addColorStop(1,   `hsla(${(hue + 80) % 360}, 100%, 55%, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(r * 0.4, -width / 2);
    ctx.lineTo(len,     0);
    ctx.lineTo(r * 0.4,  width / 2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Pulsing core — white-hot center bleeding into rainbow
  const coreHue = (t * 90) % 360;
  ctx.shadowBlur   = 22;
  ctx.shadowColor  = `hsl(${coreHue}, 100%, 70%)`;
  const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * pulse);
  coreGrad.addColorStop(0,   '#ffffff');
  coreGrad.addColorStop(0.35, `hsl(${coreHue}, 100%, 85%)`);
  coreGrad.addColorStop(1,    `hsl(${(coreHue + 70) % 360}, 100%, 60%)`);
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r * pulse, 0, Math.PI * 2);
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
