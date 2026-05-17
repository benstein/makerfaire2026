// src/game/dilly.js — Dilly the pill bug. Step on her and become JACKED.

const DILLY_W = 38;
const DILLY_H = 22;
const SPEED   = 0.38;

let dilly = null;

export function resetDilly(arenaWidth, arenaHeight) {
  const m = 80;
  dilly = {
    x:        m + Math.random() * (arenaWidth  - m * 2),
    y:        m + Math.random() * (arenaHeight - m * 2),
    angle:    Math.random() * Math.PI * 2,
    nextTurn: performance.now() + 1200 + Math.random() * 2500,
    alive:    true,
  };
}

export function updateDilly(dt, now, arenaWidth, arenaHeight) {
  if (!dilly?.alive) return;
  const scale = dt / 16.67;
  dilly.x += Math.cos(dilly.angle) * SPEED * scale;
  dilly.y += Math.sin(dilly.angle) * SPEED * scale;

  const m = 40;
  if (dilly.x < m || dilly.x > arenaWidth  - m) { dilly.angle = Math.PI - dilly.angle; dilly.x = Math.max(m, Math.min(arenaWidth  - m, dilly.x)); }
  if (dilly.y < m || dilly.y > arenaHeight - m) { dilly.angle = -dilly.angle;           dilly.y = Math.max(m, Math.min(arenaHeight - m, dilly.y)); }

  if (now > dilly.nextTurn) {
    dilly.angle   += (Math.random() - 0.5) * Math.PI * 0.9;
    dilly.nextTurn = now + 1800 + Math.random() * 2800;
  }
}

export function getDillyBounds() {
  if (!dilly?.alive) return null;
  return { x: dilly.x - DILLY_W / 2, y: dilly.y - DILLY_H / 2, w: DILLY_W, h: DILLY_H };
}

export function isDillyAlive() { return dilly?.alive === true; }

export function squishDilly() { if (dilly) dilly.alive = false; }

export function drawDilly(ctx, now) {
  if (!dilly?.alive) return;
  const t = now / 1000;
  ctx.save();
  ctx.translate(dilly.x, dilly.y);
  ctx.rotate(dilly.angle);
  _drawBug(ctx, t);
  _drawSign(ctx, t);
  ctx.restore();
}

function _drawBug(ctx, t) {
  const segs = 6;
  // Legs first (behind body)
  for (let i = 0; i < segs - 1; i++) {
    const sx = -14 + i * 7;
    const wiggle = Math.sin(t * 9 + i * 1.4) * 3.5;
    ctx.strokeStyle = '#2a3040'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, -5); ctx.lineTo(sx - 4, -10 - wiggle); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx,  5); ctx.lineTo(sx - 4,  10 + wiggle); ctx.stroke();
  }

  // Segments back→front
  for (let i = 0; i < segs; i++) {
    const p  = i / (segs - 1);       // 0=tail 1=head
    const sx = -14 + i * 7;
    const rw = 4.5 + p * 4;
    const rh = 6   + p * 4;
    const grad = ctx.createRadialGradient(sx - rw * 0.2, -rh * 0.3, 0, sx, 0, rw * 1.4);
    grad.addColorStop(0, '#7a8898');
    grad.addColorStop(1, i % 2 ? '#3a4858' : '#4a5868');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.ellipse(sx, 0, rw, rh, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  // Head details — eyes + antennae
  const hx = -14 + (segs - 1) * 7;
  const antW = Math.sin(t * 2.8) * 0.2;
  ctx.strokeStyle = '#2a3040'; ctx.lineWidth = 1.3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(hx + 4, -3); ctx.quadraticCurveTo(hx + 9, -9 + antW * 4, hx + 14, -13 + antW * 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx + 4,  3); ctx.quadraticCurveTo(hx + 9,  9 - antW * 4, hx + 14,  13 - antW * 7); ctx.stroke();
  // Antenna tips
  ctx.fillStyle = '#2a3040';
  ctx.beginPath(); ctx.arc(hx + 14, -13 + antW * 7, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + 14,  13 - antW * 7, 1.5, 0, Math.PI * 2); ctx.fill();

  // Eyes
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(hx + 4, -3, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + 4,  3, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(hx + 4.8, -3, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + 4.8,  3, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(hx + 5.2, -3.5, 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + 5.2,  2.5, 0.5, 0, Math.PI * 2); ctx.fill();
}

function _drawSign(ctx, t) {
  // Gentle sway
  const sway = Math.sin(t * 2.1) * 0.08;
  ctx.rotate(sway);

  // Pole
  ctx.strokeStyle = '#a0784a'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, -26); ctx.stroke();

  // Board
  const sw = 32, sh = 14;
  ctx.fillStyle = '#fffde7';
  ctx.strokeStyle = '#a0784a'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(-sw / 2, -26 - sh, sw, sh, 3); ctx.fill(); ctx.stroke();

  // DILLY text
  ctx.fillStyle = '#c0392b';
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DILLY', 0, -26 - sh + 9.5);
  ctx.textAlign = 'left';
}
