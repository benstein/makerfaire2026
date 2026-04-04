// src/ui/hud.js

import { CONFIG } from '../game/config.js';
import { getCurrentMap, getMapNumber, getMapsVisited } from '../game/mapGen.js';

let stopwatchMs = 0;
let kills = 0;

export function resetHUDStats() {
  stopwatchMs = 0;
  kills = 0;
}

export function addHUDTime(dt) {
  stopwatchMs += dt;
}

export function addHUDKill() {
  kills++;
}

export function getHUDStats() {
  return { stopwatchMs, kills, mapsVisited: getMapsVisited() };
}

export function drawHUD(ctx, health, canvasWidth, canvasHeight) {
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

  // Stopwatch (top-center)
  const elapsed = stopwatchMs / 1000;
  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  ctx.fillStyle = '#ccc';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, canvasWidth / 2, padding + 22);

  // Map name + number (top-right)
  const map = getCurrentMap();
  ctx.fillStyle = map.accent;
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`Map #${getMapNumber()}`, canvasWidth - padding, padding + 16);
  ctx.fillStyle = '#888';
  ctx.font = '13px monospace';
  ctx.fillText(map.name, canvasWidth - padding, padding + 32);
  ctx.fillStyle = '#666';
  ctx.font = '12px monospace';
  ctx.fillText(`${map.enemy.name}`, canvasWidth - padding, padding + 46);

  // Kill counter + maps visited (bottom-left)
  ctx.fillStyle = '#888';
  ctx.font = '13px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Kills: ${kills}  Maps: ${getMapsVisited()}`, padding, canvasHeight - padding);

  // Edge warp hint (subtle, bottom-center)
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('walk to edge to warp', canvasWidth / 2, canvasHeight - padding);

  ctx.textAlign = 'left';
}

export function drawStatsScreen(ctx, width, height) {
  const cx = width / 2;
  const cy = height / 2;
  const stats = getHUDStats();
  const now = performance.now() / 1000;

  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e74c3c';
  ctx.fillText('GAME OVER', cx, cy - 80);

  const elapsed = stats.stopwatchMs / 1000;
  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);

  const lines = [
    { label: 'Survived', value: `${mins}:${String(secs).padStart(2, '0')}`, color: '#f1c40f' },
    { label: 'Kills', value: String(stats.kills), color: '#e74c3c' },
    { label: 'Maps Explored', value: String(stats.mapsVisited), color: '#3498db' },
  ];

  ctx.font = '22px monospace';
  const lineH = 36;
  const startY = cy - 10;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const y = startY + i * lineH;
    ctx.fillStyle = '#888';
    ctx.textAlign = 'right';
    ctx.fillText(l.label, cx - 10, y);
    ctx.fillStyle = l.color;
    ctx.textAlign = 'left';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(l.value, cx + 10, y);
    ctx.font = '22px monospace';
  }

  ctx.font = '18px monospace';
  ctx.fillStyle = '#888';
  ctx.textAlign = 'center';
  if (Math.sin(now * 3) > 0) {
    ctx.fillText('PRESS START TO PLAY AGAIN', cx, startY + lines.length * lineH + 30);
  }
  ctx.textAlign = 'left';
}

function drawHeart(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.3);
  ctx.bezierCurveTo(cx - size, cy - size * 0.3, cx - size, cy - size, cx, cy - size * 0.5);
  ctx.bezierCurveTo(cx + size, cy - size, cx + size, cy - size * 0.3, cx, cy + size * 0.3);
  ctx.fill();
}
