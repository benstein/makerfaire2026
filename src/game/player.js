// src/game/player.js

import { CONFIG } from './config.js';
import { getMarioTier } from './powerup.js';

let x, y;
let facingX = 0;
let facingY = -1; // default facing up
let health;
let maxHealth;
let sizeBonus = 0;
let invincibleUntil = 0;

function effectiveSize() { return CONFIG.playerSize + sizeBonus; }

export function resetPlayer(arenaWidth, arenaHeight) {
  x = arenaWidth / 2;
  y = arenaHeight / 2;
  facingX = 0;
  facingY = -1;
  maxHealth = CONFIG.playerMaxHealth;
  health = maxHealth;
  sizeBonus = 0;
  invincibleUntil = 0;
}

export function growPlayer() { sizeBonus += 8; }

export function healPlayer(amount) {
  maxHealth += amount;
  health += amount;
}

export function getPlayerMaxHealth() { return maxHealth; }

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

  const half = effectiveSize() / 2;
  x = Math.max(half, Math.min(arenaWidth - half, x));
  y = Math.max(half, Math.min(arenaHeight - half, y));
}

export function drawPlayer(ctx, now) {
  if (now < invincibleUntil) {
    if (Math.floor(now / 80) % 2 === 0) return;
  }
  const tier = getMarioTier();
  if (tier >= 1) {
    drawMario(ctx, effectiveSize(), now, tier >= 2);
  } else {
    drawLink(ctx, effectiveSize());
  }
}

function drawLink(ctx, s) {
  const angle = Math.atan2(facingX, -facingY); // rotate to face direction

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(2, s*0.22, s*0.36, s*0.11, 0, 0, Math.PI*2); ctx.fill();

  // Boots
  ctx.fillStyle = '#8b4513';
  ctx.beginPath(); ctx.ellipse(-s*0.12, s*0.4, s*0.10, s*0.08, -0.25, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*0.12, s*0.4, s*0.10, s*0.08,  0.25, 0, Math.PI*2); ctx.fill();

  // Green tunic body
  ctx.fillStyle = '#2ea832';
  ctx.beginPath(); ctx.ellipse(0, s*0.12, s*0.30, s*0.34, 0, 0, Math.PI*2); ctx.fill();

  // Left arm
  ctx.fillStyle = '#fdbcb4';
  ctx.beginPath(); ctx.ellipse(-s*0.36, s*0.08, s*0.10, s*0.08, 0.4, 0, Math.PI*2); ctx.fill();
  // Shield (blue kite)
  ctx.fillStyle = '#3355cc';
  ctx.beginPath();
  ctx.moveTo(-s*0.48, -s*0.02); ctx.lineTo(-s*0.48, s*0.22);
  ctx.lineTo(-s*0.37, s*0.30);  ctx.lineTo(-s*0.26, s*0.22);
  ctx.lineTo(-s*0.26, -s*0.02); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#223399'; ctx.lineWidth = 1; ctx.stroke();
  // Triforce on shield
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(-s*0.37, s*0.04); ctx.lineTo(-s*0.31, s*0.16); ctx.lineTo(-s*0.43, s*0.16);
  ctx.closePath(); ctx.fill();

  // Right arm
  ctx.fillStyle = '#fdbcb4';
  ctx.beginPath(); ctx.ellipse(s*0.34, s*0.08, s*0.10, s*0.08, -0.4, 0, Math.PI*2); ctx.fill();
  // Sword blade
  ctx.strokeStyle = '#dde8f0'; ctx.lineWidth = s*0.07; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(s*0.37, s*0.05); ctx.lineTo(s*0.37, -s*0.40); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = s*0.02;
  ctx.beginPath(); ctx.moveTo(s*0.34, s*0.04); ctx.lineTo(s*0.34, -s*0.36); ctx.stroke();
  // Crossguard
  ctx.strokeStyle = '#cc9900'; ctx.lineWidth = s*0.07;
  ctx.beginPath(); ctx.moveTo(s*0.24, s*0.04); ctx.lineTo(s*0.50, s*0.04); ctx.stroke();
  // Handle
  ctx.strokeStyle = '#8b6914'; ctx.lineWidth = s*0.09;
  ctx.beginPath(); ctx.moveTo(s*0.37, s*0.04); ctx.lineTo(s*0.37, s*0.20); ctx.stroke();
  // Pommel
  ctx.fillStyle = '#cc9900';
  ctx.beginPath(); ctx.arc(s*0.37, s*0.22, s*0.07, 0, Math.PI*2); ctx.fill();

  // Face
  ctx.fillStyle = '#fdbcb4';
  ctx.beginPath(); ctx.ellipse(0, -s*0.10, s*0.16, s*0.14, 0, 0, Math.PI*2); ctx.fill();
  // Blonde hair
  ctx.fillStyle = '#e8c840';
  ctx.beginPath(); ctx.ellipse(0, -s*0.12, s*0.17, s*0.08, 0, Math.PI, Math.PI*2); ctx.fill();
  // Eyes
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-s*0.06, -s*0.10, s*0.025, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*0.06, -s*0.10, s*0.025, 0, Math.PI*2); ctx.fill();

  // Green pointed hat
  ctx.fillStyle = '#27952a';
  ctx.beginPath();
  ctx.moveTo(-s*0.22, -s*0.16); ctx.lineTo(s*0.22, -s*0.16); ctx.lineTo(0, -s*0.60);
  ctx.closePath(); ctx.fill();
  // Hat shadow half
  ctx.fillStyle = '#1d7021';
  ctx.beginPath();
  ctx.moveTo(0, -s*0.16); ctx.lineTo(s*0.22, -s*0.16); ctx.lineTo(0, -s*0.60);
  ctx.closePath(); ctx.fill();
  // Hat brim band
  ctx.fillStyle = '#1d7021';
  ctx.fillRect(-s*0.24, -s*0.20, s*0.48, s*0.08);

  ctx.restore();
}

function drawMario(ctx, s, now, starPower) {
  const angle = Math.atan2(facingX, -facingY);
  const t = now / 1000;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Star power rainbow glow
  if (starPower) {
    const hue = (t * 180) % 360;
    ctx.shadowBlur = 22; ctx.shadowColor = `hsl(${hue}, 100%, 65%)`;
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(2, s*0.22, s*0.36, s*0.11, 0, 0, Math.PI*2); ctx.fill();

  // Brown boots
  ctx.fillStyle = '#6b3510';
  ctx.beginPath(); ctx.ellipse(-s*0.12, s*0.40, s*0.12, s*0.09, -0.2, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*0.12, s*0.40, s*0.12, s*0.09,  0.2, 0, Math.PI*2); ctx.fill();

  // Blue overalls
  ctx.fillStyle = '#1a4acc';
  ctx.beginPath(); ctx.ellipse(0, s*0.14, s*0.30, s*0.32, 0, 0, Math.PI*2); ctx.fill();
  // Overalls straps
  ctx.fillStyle = '#1a4acc';
  ctx.fillRect(-s*0.1, -s*0.05, s*0.08, s*0.22);
  ctx.fillRect( s*0.02, -s*0.05, s*0.08, s*0.22);

  // Red shirt sleeves
  ctx.fillStyle = '#cc1100';
  ctx.beginPath(); ctx.ellipse(-s*0.34, s*0.08, s*0.10, s*0.09, 0.4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*0.34, s*0.08, s*0.10, s*0.09, -0.4, 0, Math.PI*2); ctx.fill();

  // Skin face
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#fdbcb4';
  ctx.beginPath(); ctx.ellipse(0, -s*0.10, s*0.17, s*0.15, 0, 0, Math.PI*2); ctx.fill();

  // Brown mustache
  ctx.fillStyle = '#5a2d00';
  ctx.beginPath(); ctx.ellipse(-s*0.08, -s*0.04, s*0.10, s*0.07, 0.3, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s*0.08, -s*0.04, s*0.10, s*0.07, -0.3, 0, Math.PI*2); ctx.fill();

  // Eyes
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-s*0.07, -s*0.14, s*0.03, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( s*0.07, -s*0.14, s*0.03, 0, Math.PI*2); ctx.fill();

  // Red cap brim
  ctx.fillStyle = '#cc1100';
  if (starPower) ctx.fillStyle = `hsl(${(t*120)%360}, 100%, 45%)`;
  ctx.fillRect(-s*0.24, -s*0.22, s*0.48, s*0.10);
  // Cap top
  ctx.fillRect(-s*0.20, -s*0.40, s*0.40, s*0.20);
  // White M circle on cap
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(0, -s*0.31, s*0.10, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#cc1100';
  ctx.font = `bold ${s*0.14}px monospace`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('M', 0, -s*0.30);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';

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
  const sz   = effectiveSize();
  const half = sz / 2;
  return { x: x - half, y: y - half, w: sz, h: sz };
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
