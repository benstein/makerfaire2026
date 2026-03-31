// src/ui/hud.js

import { CONFIG } from '../game/config.js';

export function drawHUD(ctx, health, timeRemaining, canvasWidth, currentFloor) {
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

  // Floor indicator (below hearts)
  if (currentFloor !== undefined) {
    ctx.fillStyle = '#6bc5ff';
    ctx.font = `bold ${CONFIG.hudFontSize}px monospace`;
    ctx.textAlign = 'left';
    ctx.fillText(`Floor ${currentFloor}`, padding, padding + heartSize + 24);
  }

  // Timer (top-right)
  ctx.fillStyle = CONFIG.timerColor;
  ctx.font = `bold ${CONFIG.hudFontSize}px monospace`;
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.ceil(timeRemaining)}s`, canvasWidth - padding, padding + CONFIG.hudFontSize);
  ctx.textAlign = 'left'; // reset
}

function drawHeart(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.3);
  ctx.bezierCurveTo(cx - size, cy - size * 0.3, cx - size, cy - size, cx, cy - size * 0.5);
  ctx.bezierCurveTo(cx + size, cy - size, cx + size, cy - size * 0.3, cx, cy + size * 0.3);
  ctx.fill();
}
