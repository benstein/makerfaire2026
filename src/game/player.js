// src/game/player.js

import { CONFIG } from './config.js';
import { getMarioTier } from './powerup.js';

let x, y;
let facingX = 0;
let facingY = -1; // default facing up
let health;
let maxHealth;
let sizeBonus = 0;
let muscleMode = false;
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
  muscleMode = false;
  invincibleUntil = 0;
}

export function growPlayer() { sizeBonus += 8; }

export function activateMuscleMode() {
  muscleMode = true;
  sizeBonus  = Math.max(sizeBonus, 36); // ensure big hitbox
  maxHealth += 5;
  health    += 5;
}

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

  // Screen wrap — exit one edge, re-enter the opposite
  if (x < 0)            x += arenaWidth;
  if (x > arenaWidth)   x -= arenaWidth;
  if (y < 0)            y += arenaHeight;
  if (y > arenaHeight)  y -= arenaHeight;
}

export function drawPlayer(ctx, now) {
  if (now < invincibleUntil) {
    if (Math.floor(now / 80) % 2 === 0) return;
  }
  if (muscleMode) {
    drawMuscleMeanie(ctx, effectiveSize(), now);
    return;
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

function drawMuscleMeanie(ctx, s, now) {
  const t   = now / 1000;
  const ang = Math.atan2(facingX, -facingY);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(3, s * 0.45, s * 0.55, s * 0.13, 0, 0, Math.PI * 2); ctx.fill();

  // Legs — thick and stubby
  ctx.fillStyle = '#2244aa';
  ctx.beginPath(); ctx.roundRect(-s * 0.30, s * 0.18, s * 0.24, s * 0.40, s * 0.06); ctx.fill();
  ctx.beginPath(); ctx.roundRect( s * 0.06, s * 0.18, s * 0.24, s * 0.40, s * 0.06); ctx.fill();
  // Shoes
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.ellipse(-s * 0.18, s * 0.55, s * 0.18, s * 0.09, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s * 0.18, s * 0.55, s * 0.18, s * 0.09, 0, 0, Math.PI * 2); ctx.fill();

  // Torso — wide trapezoid, angry gray tank top
  ctx.fillStyle = '#e0e0e0';
  ctx.beginPath();
  ctx.moveTo(-s * 0.50, s * 0.20);
  ctx.lineTo( s * 0.50, s * 0.20);
  ctx.lineTo( s * 0.36, s * 0.52);
  ctx.lineTo(-s * 0.36, s * 0.52);
  ctx.closePath(); ctx.fill();
  // Tank top neck stripe
  ctx.fillStyle = '#bbbbbb';
  ctx.beginPath();
  ctx.moveTo(-s * 0.12, s * 0.20);
  ctx.lineTo( s * 0.12, s * 0.20);
  ctx.lineTo( s * 0.08, s * 0.36);
  ctx.lineTo(-s * 0.08, s * 0.36);
  ctx.closePath(); ctx.fill();
  // "MEAN" text on chest
  ctx.fillStyle = '#c0392b';
  ctx.font = `bold ${Math.round(s * 0.14)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText('MEAN', 0, s * 0.42);

  // LEFT arm — giant bicep flex
  ctx.fillStyle = '#d4a27a';
  // Upper arm
  ctx.beginPath(); ctx.ellipse(-s * 0.56, s * 0.08, s * 0.20, s * 0.16, -0.5, 0, Math.PI * 2); ctx.fill();
  // Bicep BULGE
  const flex = 0.5 + 0.5 * Math.abs(Math.sin(t * 1.8));
  ctx.beginPath(); ctx.ellipse(-s * 0.58, -s * 0.02, s * 0.18 + flex * s * 0.04, s * 0.18, -0.7, 0, Math.PI * 2); ctx.fill();
  // Forearm
  ctx.beginPath(); ctx.ellipse(-s * 0.54, s * 0.22, s * 0.14, s * 0.11, 0.3, 0, Math.PI * 2); ctx.fill();
  // Fist
  ctx.fillStyle = '#c0906a';
  ctx.beginPath(); ctx.ellipse(-s * 0.52, s * 0.34, s * 0.13, s * 0.11, 0, 0, Math.PI * 2); ctx.fill();
  // Knuckles
  ctx.fillStyle = '#b07858';
  for (let k = 0; k < 3; k++) {
    ctx.beginPath(); ctx.arc(-s * 0.58 + k * s * 0.06, s * 0.32, s * 0.03, 0, Math.PI * 2); ctx.fill();
  }

  // RIGHT arm — mirror
  ctx.fillStyle = '#d4a27a';
  ctx.beginPath(); ctx.ellipse( s * 0.56, s * 0.08, s * 0.20, s * 0.16,  0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s * 0.58, -s * 0.02, s * 0.18 + flex * s * 0.04, s * 0.18,  0.7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s * 0.54, s * 0.22, s * 0.14, s * 0.11, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c0906a';
  ctx.beginPath(); ctx.ellipse( s * 0.52, s * 0.34, s * 0.13, s * 0.11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b07858';
  for (let k = 0; k < 3; k++) {
    ctx.beginPath(); ctx.arc( s * 0.52 + k * s * 0.06, s * 0.32, s * 0.03, 0, Math.PI * 2); ctx.fill();
  }

  // Neck
  ctx.fillStyle = '#d4a27a';
  ctx.beginPath(); ctx.roundRect(-s * 0.10, -s * 0.22, s * 0.20, s * 0.24, s * 0.04); ctx.fill();

  // Head — round, red-faced, angry
  const headGrad = ctx.createRadialGradient(-s * 0.05, -s * 0.38, 0, 0, -s * 0.34, s * 0.24);
  headGrad.addColorStop(0, '#e88060');
  headGrad.addColorStop(1, '#c06040');
  ctx.fillStyle = headGrad;
  ctx.beginPath(); ctx.arc(0, -s * 0.34, s * 0.23, 0, Math.PI * 2); ctx.fill();

  // Stubble / jaw shadow
  ctx.fillStyle = 'rgba(80,40,20,0.22)';
  ctx.beginPath(); ctx.ellipse(0, -s * 0.22, s * 0.18, s * 0.09, 0, 0, Math.PI * 2); ctx.fill();

  // Angry eyebrows — angled inward
  ctx.strokeStyle = '#1a0800'; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-s * 0.20, -s * 0.44); ctx.lineTo(-s * 0.06, -s * 0.38); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( s * 0.20, -s * 0.44); ctx.lineTo( s * 0.06, -s * 0.38); ctx.stroke();

  // Eyes — squinting scowl
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.ellipse(-s * 0.10, -s * 0.34, s * 0.055, s * 0.038, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( s * 0.10, -s * 0.34, s * 0.055, s * 0.038, 0, 0, Math.PI * 2); ctx.fill();

  // Scowling mouth (downturned)
  ctx.strokeStyle = '#1a0800'; ctx.lineWidth = s * 0.045;
  ctx.beginPath();
  ctx.moveTo(-s * 0.10, -s * 0.22);
  ctx.quadraticCurveTo(0, -s * 0.18, s * 0.10, -s * 0.22);
  ctx.stroke();

  // Teeth (gritted)
  ctx.fillStyle = '#fff';
  ctx.fillRect(-s * 0.08, -s * 0.225, s * 0.16, s * 0.035);

  // Short spiky hair
  ctx.fillStyle = '#3a1800';
  for (let sp = 0; sp < 5; sp++) {
    const sx = -s * 0.18 + sp * s * 0.09;
    ctx.beginPath();
    ctx.moveTo(sx - s * 0.04, -s * 0.53);
    ctx.lineTo(sx, -s * 0.62);
    ctx.lineTo(sx + s * 0.04, -s * 0.53);
    ctx.closePath(); ctx.fill();
  }

  ctx.textAlign = 'left';
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
