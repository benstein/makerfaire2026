// src/ui/hud.js

import { CONFIG } from '../game/config.js';

export function drawHUD(ctx, health, level, xp, xpNeeded, maxLevel, canvasWidth) {
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

  // Level indicator (top-right)
  ctx.fillStyle = '#4AF';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`LVL ${level}/${maxLevel}`, canvasWidth - padding, padding + 22);

  // XP bar (below level text)
  const barWidth = 120;
  const barHeight = 10;
  const barX = canvasWidth - padding - barWidth;
  const barY = padding + 32;

  // Background
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // Fill
  const fill = xp / xpNeeded;
  if (fill > 0) {
    const grad = ctx.createLinearGradient(barX, 0, barX + barWidth * fill, 0);
    grad.addColorStop(0, '#4AF');
    grad.addColorStop(1, '#AEF');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, barWidth * fill, barHeight);
  }

  // Border
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // XP count
  ctx.fillStyle = '#888';
  ctx.font = '12px monospace';
  ctx.fillText(`${xp}/${xpNeeded} XP`, canvasWidth - padding, barY + barHeight + 14);

  ctx.textAlign = 'left';
}

function drawHeart(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.3);
  ctx.bezierCurveTo(cx - size, cy - size * 0.3, cx - size, cy - size, cx, cy - size * 0.5);
  ctx.bezierCurveTo(cx + size, cy - size, cx + size, cy - size * 0.3, cx, cy + size * 0.3);
  ctx.fill();
}
