// src/game/pasture.js
// Pen (upper right) and danger zone (lower left) for Rebecca's pasture mode.

import { drawBear } from './enemies.js';

export const BEARS_NEEDED = 8;

// Proportional bounds
const PEN_FX = 0.72, PEN_FY = 0.0, PEN_FW = 0.28, PEN_FH = 0.30;
const DZ_FX  = 0.0,  DZ_FY  = 0.70, DZ_FW  = 0.28, DZ_FH  = 0.30;

let capturedBears = [];

export function resetPasture() {
  capturedBears = [];
}

export function getCapturedCount() {
  return capturedBears.length;
}

export function getPenBounds(w, h) {
  return { x: w * PEN_FX, y: h * PEN_FY, w: w * PEN_FW, h: h * PEN_FH };
}

export function getDangerBounds(w, h) {
  return { x: w * DZ_FX, y: h * DZ_FY, w: w * DZ_FW, h: h * DZ_FH };
}

export function isInPen(enemy, arenaW, arenaH) {
  const pen = getPenBounds(arenaW, arenaH);
  const cx = enemy.x + enemy.w / 2;
  const cy = enemy.y + enemy.h / 2;
  return cx > pen.x && cx < pen.x + pen.w && cy > pen.y && cy < pen.y + pen.h;
}

export function isPlayerInDangerZone(playerBounds, arenaW, arenaH) {
  const dz = getDangerBounds(arenaW, arenaH);
  const cx = playerBounds.x + playerBounds.w / 2;
  const cy = playerBounds.y + playerBounds.h / 2;
  return cx > dz.x && cx < dz.x + dz.w && cy > dz.y && cy < dz.y + dz.h;
}

export function captureBear(enemy, arenaW, arenaH) {
  const pen = getPenBounds(arenaW, arenaH);
  // Place captured bear in a grid inside the pen
  const count = capturedBears.length;
  const cols = 4;
  const col = count % cols;
  const row = Math.floor(count / cols);
  const bearSize = 18;
  const padX = pen.w * 0.12;
  const padY = pen.h * 0.22;
  const spacingX = (pen.w - padX * 2) / (cols - 1);
  const spacingY = bearSize * 2;
  capturedBears.push({
    x: pen.x + padX + col * spacingX,
    y: pen.y + padY + row * spacingY,
    size: bearSize,
  });
}

export function drawPasture(ctx, width, height, now) {
  // --- Grass background ---
  ctx.fillStyle = '#5a9e3a';
  ctx.fillRect(0, 0, width, height);

  // Subtle grass texture — lighter patches
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let gx = 0; gx < width; gx += 60) {
    for (let gy = 0; gy < height; gy += 60) {
      if ((gx / 60 + gy / 60) % 2 === 0) ctx.fillRect(gx, gy, 60, 60);
    }
  }

  // --- Danger zone (lower left) ---
  const dz = getDangerBounds(width, height);
  ctx.fillStyle = '#8B0000';
  ctx.fillRect(dz.x, dz.y, dz.w, dz.h);

  // Warning stripes
  ctx.save();
  ctx.beginPath();
  ctx.rect(dz.x, dz.y, dz.w, dz.h);
  ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  const stripeW = 28;
  for (let s = -dz.h; s < dz.w + dz.h; s += stripeW * 2) {
    ctx.beginPath();
    ctx.moveTo(dz.x + s, dz.y);
    ctx.lineTo(dz.x + s + dz.h, dz.y + dz.h);
    ctx.lineTo(dz.x + s + dz.h + stripeW, dz.y + dz.h);
    ctx.lineTo(dz.x + s + stripeW, dz.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Danger zone border
  ctx.strokeStyle = '#ff0000';
  ctx.lineWidth = 3;
  ctx.strokeRect(dz.x, dz.y, dz.w, dz.h);

  // Danger label
  const dzCX = dz.x + dz.w / 2;
  const dzCY = dz.y + dz.h / 2;
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DANGER', dzCX, dzCY - 8);
  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#ffcccc';
  ctx.fillText('KEEP OUT', dzCX, dzCY + 14);

  // Blinking border
  if (Math.floor(now / 400) % 2 === 0) {
    ctx.strokeStyle = 'rgba(255,80,80,0.7)';
    ctx.lineWidth = 6;
    ctx.strokeRect(dz.x - 3, dz.y - 3, dz.w + 6, dz.h + 6);
  }

  // --- Pen (upper right) ---
  const pen = getPenBounds(width, height);

  // Pen interior (lighter grass)
  ctx.fillStyle = '#a8d878';
  ctx.fillRect(pen.x, pen.y, pen.w, pen.h);

  // Pen label
  ctx.fillStyle = '#4a6e2a';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`BEAR ZONE (${capturedBears.length}/${BEARS_NEEDED})`, pen.x + pen.w / 2, pen.y + 18);
  ctx.font = '11px monospace';
  ctx.fillStyle = '#c0392b';
  ctx.fillText('2 SEC LIMIT!', pen.x + pen.w / 2, pen.y + 34);

  // Fence posts + rails
  drawFence(ctx, pen);

  // Captured bears inside pen
  for (const b of capturedBears) {
    ctx.globalAlpha = 0.75;
    drawBear(ctx, b.x, b.y, b.size);
    ctx.globalAlpha = 1;
  }

  ctx.textAlign = 'left';
}

function drawFence(ctx, pen) {
  const postW = 8, postH = 20;
  const railH = 4;
  const postColor = '#8B5E3C';
  const railColor = '#A0785A';

  const sides = [
    // top
    { x1: pen.x, y1: pen.y, x2: pen.x + pen.w, y2: pen.y, axis: 'h' },
    // right
    { x1: pen.x + pen.w, y1: pen.y, x2: pen.x + pen.w, y2: pen.y + pen.h, axis: 'v' },
    // bottom — leave a gate gap on left third for bears to enter
    { x1: pen.x + pen.w * 0.4, y1: pen.y + pen.h, x2: pen.x + pen.w, y2: pen.y + pen.h, axis: 'h' },
    // left — only bottom portion (top is open corner)
    { x1: pen.x, y1: pen.y + pen.h * 0.3, x2: pen.x, y2: pen.y + pen.h, axis: 'v' },
  ];

  for (const side of sides) {
    const len = side.axis === 'h'
      ? Math.abs(side.x2 - side.x1)
      : Math.abs(side.y2 - side.y1);
    const postCount = Math.max(2, Math.round(len / 48));

    // Rails (two horizontal/vertical bars)
    ctx.fillStyle = railColor;
    if (side.axis === 'h') {
      ctx.fillRect(Math.min(side.x1, side.x2), side.y1 - railH / 2, len, railH);
      ctx.fillRect(Math.min(side.x1, side.x2), side.y1 + 8, len, railH);
    } else {
      ctx.fillRect(side.x1 - railH / 2, Math.min(side.y1, side.y2), railH, len);
      ctx.fillRect(side.x1 + 8, Math.min(side.y1, side.y2), railH, len);
    }

    // Posts
    ctx.fillStyle = postColor;
    for (let i = 0; i <= postCount; i++) {
      const t = i / postCount;
      const px = side.axis === 'h'
        ? side.x1 + (side.x2 - side.x1) * t
        : side.x1;
      const py = side.axis === 'v'
        ? side.y1 + (side.y2 - side.y1) * t
        : side.y1;
      ctx.fillRect(px - postW / 2, py - postH / 2, postW, postH);
    }
  }
}
