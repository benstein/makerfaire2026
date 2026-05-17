// src/game/disco.js
// Periodic dance break — disco ball always visible, full party every 15 seconds.

const DISCO_INTERVAL = 15000; // ms between parties
const DISCO_DURATION = 5000;  // ms of dancing

let discoActive    = false;
let discoStart     = 0;
let nextDisco      = 0;

export function resetDisco(now) {
  discoActive = false;
  discoStart  = 0;
  nextDisco   = now + DISCO_INTERVAL;
}

export function updateDisco(now) {
  if (!discoActive && now >= nextDisco) {
    discoActive = true;
    discoStart  = now;
  }
  if (discoActive && now - discoStart > DISCO_DURATION) {
    discoActive = false;
    nextDisco   = now + DISCO_INTERVAL;
  }
}

export function isDiscoActive() { return discoActive; }

export function getDiscoProgress(now) {
  if (!discoActive) return 0;
  return Math.min(1, (now - discoStart) / DISCO_DURATION);
}

// ─── Drawing ──────────────────────────────────────────────────────────────────

export function drawDisco(ctx, width, height, now) {
  const t = now / 1000;

  if (discoActive) {
    drawDiscoLights(ctx, width, height, t);
  }

  drawDiscoBall(ctx, width / 2, 28, 22, t);

  if (discoActive) {
    const p = getDiscoProgress(now);
    const alpha = p < 0.15 ? p / 0.15 : p > 0.78 ? (1 - p) / 0.22 : 1;
    drawDiscoText(ctx, width, height, t, alpha);
  }
}

function drawDiscoBall(ctx, cx, cy, r, t) {
  // String from top
  ctx.save();
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, cy - r); ctx.stroke();
  ctx.setLineDash([]);

  // Outer glow when active
  if (discoActive) {
    ctx.shadowBlur = 22;
    ctx.shadowColor = 'rgba(255,255,255,0.7)';
  }

  // Dark sphere base
  ctx.fillStyle = '#181828';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Clip tiles to sphere
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();

  const spinRate = discoActive ? 2.2 : 0.5;
  const rot = t * spinRate;
  const rows = 7;
  const tileH = (2 * r) / rows;

  for (let row = 0; row < rows; row++) {
    const bandCenterY = -r + (row + 0.5) * tileH;
    const bandR = Math.sqrt(Math.max(0, r * r - bandCenterY * bandCenterY));
    if (bandR < 2) continue;
    const numCols = Math.max(3, Math.round((bandR * Math.PI * 2) / (r * 0.3)));

    for (let col = 0; col < numCols; col++) {
      const angle = rot + (col / numCols) * Math.PI * 2;
      if (Math.cos(angle) < -0.05) continue; // only front-facing tiles
      const tx = cx + Math.cos(angle) * bandR;
      const ty = cy + bandCenterY;
      const bright = 30 + Math.max(0, Math.cos(angle - t * 0.8)) * 65;
      const isColor = (col + row) % 4 === 0;
      const hue = (col * 43 + row * 67 + t * 80) % 360;
      ctx.fillStyle = isColor
        ? `hsl(${hue}, 90%, ${bright * 0.75}%)`
        : `hsl(0, 0%, ${bright}%)`;
      const tw = (bandR * Math.PI * 2 / numCols) * 0.78;
      ctx.fillRect(tx - tw / 2, ty - tileH * 0.4, tw, tileH * 0.78);
    }
  }

  ctx.restore();

  // Sphere highlight
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx - r * 0.25, cy - r * 0.28, r * 0.3, r * 0.2, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawDiscoLights(ctx, width, height, t) {
  const bx = width / 2, by = 28;
  const hues = [0, 40, 80, 140, 200, 260, 310, 345];

  for (let i = 0; i < 8; i++) {
    const angle = t * (0.7 + i * 0.13) + (i / 8) * Math.PI * 2;
    const dist  = Math.min(width, height) * (0.22 + (i % 3) * 0.16);
    const lx    = bx + Math.cos(angle) * dist;
    const ly    = by + height * 0.38 + Math.sin(angle * 0.7) * height * 0.22;
    const lr    = 38 + Math.sin(t * 2.5 + i * 1.3) * 18;
    const hue   = (hues[i] + t * 25) % 360;
    const alpha = 0.22 + Math.sin(t * 3.2 + i * 1.1) * 0.10;

    ctx.save();
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr * 2.2);
    grad.addColorStop(0,   `hsl(${hue}, 100%, 72%)`);
    grad.addColorStop(0.5, `hsla(${hue}, 100%, 60%, 0.4)`);
    grad.addColorStop(1,   `hsla(${hue}, 100%, 50%, 0)`);
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(lx, ly, lr * 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Thin beam from ball to spot
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = `hsl(${hue}, 100%, 75%)`;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(lx, ly); ctx.stroke();
    ctx.restore();
  }
}

function drawDiscoText(ctx, width, height, t, alpha) {
  const text = '🕺 DISCO INFERNO! 🔥';
  const plainText = 'DISCO  INFERNO!';
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = 'bold 58px monospace';
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';

  const baseY = height * 0.42;
  for (let i = 0; i < plainText.length; i++) {
    const charWidth = ctx.measureText('M').width;
    const totalW = plainText.length * charWidth;
    const cx = width / 2 - totalW / 2 + i * charWidth + charWidth / 2;
    const cy = baseY + Math.sin(t * 7 + i * 0.6) * 9;
    const hue = (i / plainText.length * 360 + t * 140) % 360;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.sin(t * 5 + i * 0.4) * 0.08);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeText(plainText[i], 0, 0);
    ctx.fillStyle = `hsl(${hue}, 100%, 65%)`;
    ctx.fillText(plainText[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();
}
