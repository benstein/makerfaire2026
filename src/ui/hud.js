// src/ui/hud.js

import { CONFIG } from '../game/config.js';

export function drawHUD(ctx, health, timeRemaining, canvasWidth) {
  const padding = 20;
  const now = performance.now();

  // Hearts (top-left) — bouncy pink hearts
  const heartSize = 28;
  const heartGap = 8;
  for (let i = 0; i < CONFIG.playerMaxHealth; i++) {
    const hx = padding + i * (heartSize + heartGap);
    const hy = padding;
    const bounce = i < health ? Math.sin(now / 300 + i * 0.8) * 2 : 0;

    if (i < health) {
      ctx.fillStyle = CONFIG.heartColor;
    } else {
      ctx.fillStyle = 'rgba(255,105,180,0.2)';
    }
    drawHeart(ctx, hx + heartSize / 2, hy + heartSize / 2 + bounce, heartSize * 0.5);

    // Glow on filled hearts
    if (i < health) {
      ctx.fillStyle = 'rgba(255,180,220,0.4)';
      drawHeart(ctx, hx + heartSize / 2, hy + heartSize / 2 + bounce, heartSize * 0.3);
    }
  }

  // Timer (top-right) — with cute styling
  // Background pill
  const timerText = `${Math.ceil(timeRemaining)}s`;
  ctx.font = `bold ${CONFIG.hudFontSize}px monospace`;
  const textWidth = ctx.measureText(timerText).width;
  ctx.fillStyle = 'rgba(255,105,180,0.15)';
  const pillX = canvasWidth - padding - textWidth - 16;
  const pillY = padding - 2;
  const pillW = textWidth + 24;
  const pillH = CONFIG.hudFontSize + 12;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();

  ctx.fillStyle = CONFIG.timerColor;
  ctx.textAlign = 'right';
  ctx.fillText(timerText, canvasWidth - padding, padding + CONFIG.hudFontSize);
  ctx.textAlign = 'left';
}

function drawHeart(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.3);
  ctx.bezierCurveTo(cx - size, cy - size * 0.3, cx - size, cy - size, cx, cy - size * 0.5);
  ctx.bezierCurveTo(cx + size, cy - size, cx + size, cy - size * 0.3, cx, cy + size * 0.3);
  ctx.fill();
}
