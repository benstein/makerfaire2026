// src/game/wizards.js — Harry Potter (dangerous) and Voldemort (healing) fly around the arena

const HIT_HALF     = 22;   // half-size of both hitboxes
const VOLDY_HEAL_CD = 2800; // ms cooldown on Voldemort healing

let arenaW = 800, arenaH = 600;
let voldemortLastHeal = 0;

export function resetWizards(w, h) {
  arenaW = w;
  arenaH = h;
  voldemortLastHeal = 0;
}

// Parametric positions — smooth Lissajous-like flight paths
function harryPos(t) {
  return {
    x: arenaW * 0.50 + arenaW * 0.36 * Math.sin(t * 0.68),
    y: arenaH * 0.38 + arenaH * 0.28 * Math.cos(t * 0.51),
  };
}
function harryAngle(t) {
  const dx =  arenaW * 0.36 * 0.68 * Math.cos(t * 0.68);
  const dy = -arenaH * 0.28 * 0.51 * Math.sin(t * 0.51);
  return Math.atan2(dy, dx);
}

function voldemortPos(t) {
  return {
    x: arenaW * 0.50 + arenaW * 0.30 * Math.sin(t * 0.52 + Math.PI * 1.4),
    y: arenaH * 0.55 + arenaH * 0.30 * Math.cos(t * 0.43 + Math.PI * 0.9),
  };
}
function voldemortAngle(t) {
  const dx =  arenaW * 0.30 * 0.52 * Math.cos(t * 0.52 + Math.PI * 1.4);
  const dy = -arenaH * 0.30 * 0.43 * Math.sin(t * 0.43 + Math.PI * 0.9);
  return Math.atan2(dy, dx);
}

export function getHarryBounds(now) {
  const t = now / 1000;
  const p = harryPos(t);
  return { x: p.x - HIT_HALF, y: p.y - HIT_HALF, w: HIT_HALF * 2, h: HIT_HALF * 2 };
}

export function getVoldemortBounds(now) {
  const t = now / 1000;
  const p = voldemortPos(t);
  return { x: p.x - HIT_HALF, y: p.y - HIT_HALF, w: HIT_HALF * 2, h: HIT_HALF * 2 };
}

export function canVoldemortHeal(now) {
  return now - voldemortLastHeal > VOLDY_HEAL_CD;
}

export function markVoldemortHeal(now) {
  voldemortLastHeal = now;
}

export function drawWizards(ctx, now) {
  const t = now / 1000;

  // Harry first (drawn behind Voldemort)
  const hp = harryPos(t);
  const ha = harryAngle(t);
  drawHarry(ctx, hp.x, hp.y, ha, t);

  // Voldemort
  const vp = voldemortPos(t);
  const va = voldemortAngle(t);
  drawVoldemort(ctx, vp.x, vp.y, va, t);
}

// ─────────────────────────────────────────────────────────────
// Harry Potter
// ─────────────────────────────────────────────────────────────
function drawHarry(ctx, cx, cy, angle, t) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Broomstick (along flight direction)
  const broomLen = 36, broomY = 10;
  ctx.strokeStyle = '#8B5E2A'; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-broomLen, broomY); ctx.lineTo(18, broomY); ctx.stroke();
  // Twig bundle at the back
  ctx.strokeStyle = '#a07040'; ctx.lineWidth = 1.4;
  for (let i = 0; i < 5; i++) {
    const ty = broomY + (i - 2) * 3.5;
    ctx.beginPath(); ctx.moveTo(-broomLen, broomY); ctx.lineTo(-broomLen - 12, ty); ctx.stroke();
  }

  // Robes — billowing black cloak
  const capeWave = Math.sin(t * 4.5) * 3;
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.moveTo(-8, -2);
  ctx.quadraticCurveTo(-14 + capeWave, 14, -18, 22);
  ctx.lineTo(18, 22);
  ctx.quadraticCurveTo(14 - capeWave, 14, 8, -2);
  ctx.closePath(); ctx.fill();

  // Gryffindor scarf stripe (red/gold)
  ctx.fillStyle = '#990000';
  ctx.fillRect(-5, -4, 10, 5);
  ctx.fillStyle = '#d4a800';
  ctx.fillRect(-5, -1, 10, 2);

  // Arms gripping broom
  ctx.fillStyle = '#f5d5b8';
  ctx.beginPath(); ctx.ellipse(-4, broomY, 5, 3.5, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 4, broomY, 5, 3.5, -0.3, 0, Math.PI * 2); ctx.fill();

  // Head
  ctx.fillStyle = '#f5d5b8';
  ctx.beginPath(); ctx.arc(0, -12, 10, 0, Math.PI * 2); ctx.fill();

  // Messy dark hair
  ctx.fillStyle = '#2a1a0a';
  ctx.beginPath(); ctx.arc(0, -19, 8, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
  // Messy tufts
  ctx.beginPath(); ctx.arc(-5, -20, 5, Math.PI * 1.2, Math.PI * 1.7); ctx.fill();
  ctx.beginPath(); ctx.arc( 5, -20, 4, Math.PI * 1.3, Math.PI * 1.8); ctx.fill();
  ctx.beginPath(); ctx.arc( 9, -17, 3.5, Math.PI * 0.9, Math.PI * 1.5); ctx.fill();

  // Glasses — round, wire-frame
  ctx.strokeStyle = '#555'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(-4.5, -11, 3.5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc( 4.5, -11, 3.5, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-1, -11); ctx.lineTo(1, -11); ctx.stroke(); // bridge

  // Eyes (behind glasses)
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath(); ctx.arc(-4.5, -11, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( 4.5, -11, 1.6, 0, Math.PI * 2); ctx.fill();

  // Lightning bolt scar — gold/yellow on forehead
  ctx.strokeStyle = '#e8b800'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-1, -20); ctx.lineTo(1, -17); ctx.lineTo(-1, -15); ctx.lineTo(1.5, -13);
  ctx.stroke();

  // Name label
  ctx.fillStyle = '#ffd700';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.shadowBlur = 4; ctx.shadowColor = '#000';
  ctx.fillText('HARRY', 0, 34);
  ctx.shadowBlur = 0;

  ctx.restore();
}

// ─────────────────────────────────────────────────────────────
// Voldemort
// ─────────────────────────────────────────────────────────────
function drawVoldemort(ctx, cx, cy, angle, t) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);

  // Dark billowing robes
  const wave = Math.sin(t * 3.2) * 4;
  ctx.fillStyle = '#0d0d1a';
  ctx.beginPath();
  ctx.moveTo(-10, -4);
  ctx.quadraticCurveTo(-20 + wave, 10, -24, 28);
  ctx.lineTo(24, 28);
  ctx.quadraticCurveTo(20 - wave, 10, 10, -4);
  ctx.closePath(); ctx.fill();

  // Robe highlight — very dark purple edge
  ctx.strokeStyle = '#2a0040'; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-10, -4);
  ctx.quadraticCurveTo(-20 + wave, 10, -24, 28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(10, -4);
  ctx.quadraticCurveTo(20 - wave, 10, 24, 28);
  ctx.stroke();

  // Wand — long thin stick, slightly glowing
  const wandAngle = Math.sin(t * 2.1) * 0.3;
  ctx.save();
  ctx.rotate(wandAngle);
  ctx.strokeStyle = '#4a3020'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(10, -4); ctx.lineTo(30, -12); ctx.stroke();
  // Wand tip glow
  ctx.fillStyle = `rgba(180, 0, 255, ${0.5 + 0.5 * Math.sin(t * 5)})`;
  ctx.shadowBlur = 10; ctx.shadowColor = '#8800ff';
  ctx.beginPath(); ctx.arc(30, -12, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.restore();

  // Pale head / skull-like face
  const headGrad = ctx.createRadialGradient(-2, -14, 0, 0, -14, 11);
  headGrad.addColorStop(0, '#e8e8e0');
  headGrad.addColorStop(1, '#b0b0a0');
  ctx.fillStyle = headGrad;
  ctx.beginPath(); ctx.ellipse(0, -14, 10, 12, 0, 0, Math.PI * 2); ctx.fill();

  // No nose — just two slits
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-2.5, -13); ctx.lineTo(-1.5, -11); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( 2.5, -13); ctx.lineTo( 1.5, -11); ctx.stroke();

  // Glowing red eyes
  ctx.fillStyle = '#cc0000';
  ctx.shadowBlur = 8; ctx.shadowColor = '#ff0000';
  ctx.beginPath(); ctx.ellipse(-4, -16, 2.8, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 4, -16, 2.8, 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  // Pupils
  ctx.fillStyle = '#600';
  ctx.beginPath(); ctx.ellipse(-4, -16, 1.2, 1.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( 4, -16, 1.2, 1.6, 0, 0, Math.PI * 2); ctx.fill();

  // Tight thin scowling mouth
  ctx.strokeStyle = '#666'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-4, -8.5); ctx.lineTo(4, -8.5); ctx.stroke();

  // Bald head highlight
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.ellipse(-2, -20, 4, 2.5, -0.4, 0, Math.PI * 2); ctx.fill();

  // Long fingers / hands peeping from robes
  ctx.strokeStyle = '#c8c8b8'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
  for (let f = 0; f < 4; f++) {
    const fx = -9 + f * 3, fy = 10 + Math.sin(t * 2.5 + f) * 1.5;
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx - 1, fy + 8); ctx.stroke();
  }

  // Name label
  ctx.fillStyle = '#aa44ff';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.shadowBlur = 4; ctx.shadowColor = '#000';
  ctx.fillText('VOLDEMORT', 0, 40);
  ctx.shadowBlur = 0;

  ctx.restore();
}
