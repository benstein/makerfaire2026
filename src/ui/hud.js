// src/ui/hud.js

import { CONFIG } from '../game/config.js';

export function drawHUD(ctx, health, timeRemaining, canvasWidth, maxHealth = CONFIG.playerMaxHealth) {
  const padding = 20;

  // Hearts (top-left) — sized and styled to match the timer
  const heartSize = Math.round(CONFIG.hudFontSize * 0.85);
  const heartGap  = Math.round(heartSize * 0.2);
  for (let i = 0; i < maxHealth; i++) {
    const hx = padding + i * (heartSize + heartGap);
    const hy = padding;
    const r  = heartSize * 0.5;

    // Dark outline stroke (matches timer style)
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 5;
    ctx.lineJoin = 'round';
    drawHeart(ctx, hx + r, hy + r, r);
    ctx.stroke();

    ctx.fillStyle = i < health ? CONFIG.heartColor : '#444';
    drawHeart(ctx, hx + r, hy + r, r);
    ctx.fill();
  }

  // Timer (top-right)
  const timerText = `${Math.ceil(timeRemaining)}s`;
  const tx = canvasWidth - padding;
  const ty = padding + CONFIG.hudFontSize;
  ctx.font = `bold ${CONFIG.hudFontSize}px monospace`;
  ctx.textAlign = 'right';
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#2c3e50';
  ctx.lineJoin = 'round';
  ctx.strokeText(timerText, tx, ty);
  ctx.fillStyle = CONFIG.timerColor;
  ctx.fillText(timerText, tx, ty);
  ctx.textAlign = 'left'; // reset
}

function drawHeart(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.3);
  ctx.bezierCurveTo(cx - size, cy - size * 0.3, cx - size, cy - size, cx, cy - size * 0.5);
  ctx.bezierCurveTo(cx + size, cy - size, cx + size, cy - size * 0.3, cx, cy + size * 0.3);
  ctx.closePath();
}
