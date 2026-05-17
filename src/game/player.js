// src/game/player.js

import { CONFIG } from './config.js';
import { isMarioMode } from './portal.js';

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

// Shield dimensions (oversized!)
const SHIELD_W        = 54;
const SHIELD_H        = 76;
const SHIELD_LEFT     = 32;  // distance to left of facing
const SHIELD_FORWARD  = 8;   // distance forward

function shieldCenter() {
  // Left direction = rotate facing 90° clockwise: (facingY, -facingX)
  return {
    cx: x + facingY * SHIELD_LEFT  + facingX * SHIELD_FORWARD,
    cy: y - facingX * SHIELD_LEFT  + facingY * SHIELD_FORWARD,
  };
}

export function getShieldBounds() {
  const { cx, cy } = shieldCenter();
  const r = Math.max(SHIELD_W, SHIELD_H) / 2;
  return { x: cx - r, y: cy - r, w: r * 2, h: r * 2 };
}

export function drawPlayer(ctx, now) {
  if (now < invincibleUntil) {
    if (Math.floor(now / 80) % 2 === 0) return;
  }

  // Draw shield behind player (always, even in Mario mode — knights are universal)
  drawShield(ctx, now);

  if (isMarioMode()) {
    drawMario(ctx);
    return;
  }

  const half = CONFIG.playerSize / 2;
  ctx.fillStyle = CONFIG.playerColor;
  ctx.fillRect(x - half, y - half, CONFIG.playerSize, CONFIG.playerSize);
}

function drawShield(ctx, now) {
  const { cx, cy } = shieldCenter();
  const angle = Math.atan2(facingY, facingX) + Math.PI / 2;
  const sw = SHIELD_W / 2, sh = SHIELD_H / 2;

  ctx.save();
  ctx.translate(Math.round(cx), Math.round(cy));
  ctx.rotate(angle);

  // Helper: heater shield path
  function heaterPath(inset = 0) {
    const w = sw - inset, h = sh - inset;
    ctx.beginPath();
    ctx.moveTo(-w, -h);
    ctx.lineTo( w, -h);
    ctx.lineTo( w,  h * 0.15);
    ctx.bezierCurveTo( w, h * 0.65,  w * 0.25, h, 0, h);
    ctx.bezierCurveTo(-w * 0.25, h, -w, h * 0.65, -w, h * 0.15);
    ctx.closePath();
  }

  // Drop shadow
  ctx.save();
  ctx.translate(4, 5);
  ctx.globalAlpha = 0.28;
  ctx.fillStyle = '#000';
  heaterPath();
  ctx.fill();
  ctx.restore();

  // Red field
  ctx.fillStyle = '#b71c1c';
  heaterPath();
  ctx.fill();

  // Clip heraldry to shield shape
  ctx.save();
  heaterPath();
  ctx.clip();

  // Gold cross
  ctx.fillStyle = '#ffc107';
  ctx.fillRect(-sw, -sh * 0.14, sw * 2, sh * 0.28); // horizontal bar
  ctx.fillRect(-sw * 0.22, -sh, sw * 0.44, sh * 2); // vertical bar

  // Quarter highlights (alternating lighter red/gold tones)
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#fff';
  ctx.fillRect(-sw, -sh, sw, sh * 0.15);
  ctx.fillRect(0,   -sh, sw, sh * 0.15);
  ctx.globalAlpha = 1;

  ctx.restore(); // end clip

  // Gold border
  ctx.strokeStyle = '#ffc107';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  heaterPath(2);
  ctx.stroke();

  // Outer dark edge
  ctx.strokeStyle = '#5a3000';
  ctx.lineWidth = 1.5;
  heaterPath();
  ctx.stroke();

  // Center boss (metal knob)
  ctx.fillStyle = '#ffc107';
  ctx.beginPath(); ctx.arc(0, sh * 0.05, sw * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a6000'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(0, sh * 0.05, sw * 0.18, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#ffe082';
  ctx.beginPath(); ctx.arc(-sw * 0.05, sh * 0.02, sw * 0.08, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawMario(ctx) {
  const s = CONFIG.playerSize; // 28
  // Hat brim
  ctx.fillStyle = '#cc0000';
  ctx.fillRect(x - s * 0.44, y - s * 0.62, s * 0.88, s * 0.18);
  // Hat top
  ctx.fillRect(x - s * 0.3, y - s * 0.82, s * 0.68, s * 0.22);
  // Hat brim highlight
  ctx.fillStyle = '#ff2020';
  ctx.fillRect(x - s * 0.44, y - s * 0.62, s * 0.88, s * 0.05);

  // Face
  ctx.fillStyle = '#ffa060';
  ctx.fillRect(x - s * 0.3, y - s * 0.48, s * 0.6, s * 0.3);

  // Eyes
  ctx.fillStyle = '#222';
  ctx.fillRect(x - s * 0.2, y - s * 0.4, s * 0.1, s * 0.1);
  ctx.fillRect(x + s * 0.1, y - s * 0.4, s * 0.1, s * 0.1);

  // Mustache
  ctx.fillStyle = '#5a2d00';
  ctx.fillRect(x - s * 0.28, y - s * 0.22, s * 0.56, s * 0.1);

  // Red shirt sleeves
  ctx.fillStyle = '#cc0000';
  ctx.fillRect(x - s * 0.46, y - s * 0.12, s * 0.16, s * 0.32);
  ctx.fillRect(x + s * 0.3,  y - s * 0.12, s * 0.16, s * 0.32);

  // Blue overalls
  ctx.fillStyle = '#1a50d0';
  ctx.fillRect(x - s * 0.28, y - s * 0.1, s * 0.56, s * 0.4);

  // Overalls straps / buckles
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(x - s * 0.12, y - s * 0.1, s * 0.09, s * 0.1);
  ctx.fillRect(x + s * 0.03, y - s * 0.1, s * 0.09, s * 0.1);

  // Skin legs
  ctx.fillStyle = '#ffa060';
  ctx.fillRect(x - s * 0.26, y + s * 0.28, s * 0.2, s * 0.18);
  ctx.fillRect(x + s * 0.06, y + s * 0.28, s * 0.2, s * 0.18);

  // Brown boots
  ctx.fillStyle = '#5a2d00';
  ctx.fillRect(x - s * 0.3,  y + s * 0.42, s * 0.28, s * 0.12);
  ctx.fillRect(x + s * 0.02, y + s * 0.42, s * 0.28, s * 0.12);
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

export function teleportPlayer(nx, ny) {
  x = nx;
  y = ny;
}

export function damagePlayer(now) {
  if (now < invincibleUntil) return false;
  health -= 1;
  invincibleUntil = now + CONFIG.invincibilityDuration;
  return true;
}
