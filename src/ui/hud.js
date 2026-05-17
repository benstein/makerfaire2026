// src/ui/hud.js

import { CONFIG } from '../game/config.js';

export function drawHUD(ctx, health, timeRemaining, canvasWidth, killCount = 0, killsForSmash = 10) {
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
  ctx.textAlign = 'left';

  // Final Smash meter (bottom-left)
  const meterX = padding;
  const meterY = 80;
  const meterW = 160;
  const meterH = 18;
  const fill = killCount / killsForSmash;

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.roundRect(meterX - 2, meterY - 2, meterW + 4, meterH + 4, 6);
  ctx.fill();

  ctx.fillStyle = '#1a3d00';
  ctx.beginPath();
  ctx.roundRect(meterX, meterY, meterW, meterH, 4);
  ctx.fill();

  if (fill > 0) {
    const grad = ctx.createLinearGradient(meterX, 0, meterX + meterW, 0);
    grad.addColorStop(0, '#f0c000');
    grad.addColorStop(1, '#ff6a00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(meterX, meterY, meterW * fill, meterH, 4);
    ctx.fill();
  }

  ctx.font = 'bold 12px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.fillText(`FINAL SMASH  ${killCount}/${killsForSmash}`, meterX, meterY - 5);
}

function drawHeart(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.3);
  ctx.bezierCurveTo(cx - size, cy - size * 0.3, cx - size, cy - size, cx, cy - size * 0.5);
  ctx.bezierCurveTo(cx + size, cy - size, cx + size, cy - size * 0.3, cx, cy + size * 0.3);
  ctx.fill();
}
