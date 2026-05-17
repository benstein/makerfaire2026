// src/ui/hud.js

import { CONFIG } from '../game/config.js';

export function drawHUD(ctx, health, timeRemaining, canvasWidth) {
  const padding = 20;

  // Hearts (top-left)
  const heartSize = 28;
  const heartGap = 8;
  for (let i = 0; i < CONFIG.playerMaxHealth; i++) {
    const hx = padding + i * (heartSize + heartGap);
    const hy = padding;

    if (i < health) {
      ctx.fillStyle = CONFIG.heartColor;
    } else {
      ctx.fillStyle = '#333';
    }
    drawHeart(ctx, hx + heartSize / 2, hy + heartSize / 2, heartSize * 0.5);
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
  ctx.fill();
}
