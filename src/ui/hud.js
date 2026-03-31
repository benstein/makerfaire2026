// src/ui/hud.js

import { CONFIG } from '../game/config.js';

export function drawHUD(ctx, health, timeRemaining, canvasWidth, coinsCollected = 0, fireBoost = false) {
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

  // Coin counter (below hearts)
  const coinY = padding + heartSize + 16;
  drawCoinIcon(ctx, padding + 10, coinY, fireBoost);
  ctx.fillStyle = fireBoost ? '#2ecc71' : '#f1c40f';
  ctx.font = `bold ${CONFIG.hudFontSize}px monospace`;
  ctx.textAlign = 'left';
  ctx.fillText(`x${coinsCollected}`, padding + 24, coinY + 7);

  // Fire boost indicator
  if (fireBoost) {
    ctx.fillStyle = '#2ecc71';
    ctx.font = `bold ${Math.floor(CONFIG.hudFontSize * 0.7)}px monospace`;
    ctx.fillText('RAPID FIRE!', padding + 70, coinY + 6);
  }

  // Timer (top-right)
  ctx.fillStyle = CONFIG.timerColor;
  ctx.font = `bold ${CONFIG.hudFontSize}px monospace`;
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.ceil(timeRemaining)}s`, canvasWidth - padding, padding + CONFIG.hudFontSize);
  ctx.textAlign = 'left'; // reset
}

function drawCoinIcon(ctx, cx, cy, boosted) {
  ctx.fillStyle = boosted ? '#2ecc71' : '#f1c40f';
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = boosted ? '#27ae60' : '#f39c12';
  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeart(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.3);
  ctx.bezierCurveTo(cx - size, cy - size * 0.3, cx - size, cy - size, cx, cy - size * 0.5);
  ctx.bezierCurveTo(cx + size, cy - size, cx + size, cy - size * 0.3, cx, cy + size * 0.3);
  ctx.fill();
}
