// src/game/lava.js — deadly lava strip at the bottom of the arena

export const LAVA_HEIGHT = 90;

let bubbles = [];

export function resetLava() {
  bubbles = [];
}

export function getLavaBounds(arenaWidth, arenaHeight) {
  return { x: 0, y: arenaHeight - LAVA_HEIGHT, w: arenaWidth, h: LAVA_HEIGHT };
}

function ensureBubbles(arenaWidth) {
  while (bubbles.length < 18) {
    bubbles.push({
      x: Math.random() * arenaWidth,
      y: LAVA_HEIGHT * (0.4 + Math.random() * 0.6),
      r: 5 + Math.random() * 10,
      speed: 0.18 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

export function updateLava(arenaWidth) {
  ensureBubbles(arenaWidth);
  for (const b of bubbles) {
    b.y -= b.speed;
    if (b.y + b.r < 0) {
      b.x = Math.random() * arenaWidth;
      b.y = LAVA_HEIGHT * 0.9;
      b.r = 5 + Math.random() * 10;
      b.speed = 0.18 + Math.random() * 0.35;
    }
  }
}

export function drawLava(ctx, arenaWidth, arenaHeight, now) {
  const t = now / 1000;
  const top = arenaHeight - LAVA_HEIGHT;

  ctx.save();
  ctx.translate(0, top);

  // === Wavy top edge (clip mask so lava has a molten, churning top) ===
  ctx.beginPath();
  const segments = 40;
  for (let i = 0; i <= segments; i++) {
    const px = (i / segments) * arenaWidth;
    const wave1 = Math.sin(t * 1.8 + i * 0.55) * 7;
    const wave2 = Math.sin(t * 2.9 + i * 0.9 + 1.2) * 4;
    const py = wave1 + wave2;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.lineTo(arenaWidth, LAVA_HEIGHT);
  ctx.lineTo(0, LAVA_HEIGHT);
  ctx.closePath();
  ctx.clip();

  // === Base lava gradient ===
  const grad = ctx.createLinearGradient(0, 0, 0, LAVA_HEIGHT);
  grad.addColorStop(0,   '#ff6600');
  grad.addColorStop(0.18, '#ff4400');
  grad.addColorStop(0.45, '#cc1100');
  grad.addColorStop(0.75, '#880000');
  grad.addColorStop(1,   '#3a0000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, arenaWidth, LAVA_HEIGHT);

  // === Bright flowing veins ===
  for (let v = 0; v < 5; v++) {
    const vx = (v / 5) * arenaWidth + Math.sin(t * 0.7 + v * 1.3) * 80;
    const brightness = 0.12 + Math.sin(t * 1.5 + v * 0.9) * 0.07;
    const vgrad = ctx.createRadialGradient(vx, LAVA_HEIGHT * 0.3, 0, vx, LAVA_HEIGHT * 0.3, 90);
    vgrad.addColorStop(0, `rgba(255, 200, 50, ${brightness})`);
    vgrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
    ctx.fillStyle = vgrad;
    ctx.fillRect(0, 0, arenaWidth, LAVA_HEIGHT);
  }

  // === Bubbles ===
  for (const b of bubbles) {
    const pop = Math.sin(t * 3.5 + b.phase) > 0.85; // occasional pop flash
    const alpha = pop ? 0.9 : 0.55;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, ${pop ? 220 : 140}, 30, ${alpha})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 255, 100, ${alpha * 0.6})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  ctx.restore();

  // === Danger glow above lava (heat haze) ===
  const haze = ctx.createLinearGradient(0, top - 50, 0, top);
  const flicker = 0.18 + Math.sin(t * 7.3) * 0.06;
  haze.addColorStop(0,   `rgba(255, 80, 0, 0)`);
  haze.addColorStop(1,   `rgba(255, 80, 0, ${flicker})`);
  ctx.fillStyle = haze;
  ctx.fillRect(0, top - 50, arenaWidth, 50);

  // === "LAVA — INSTANT DEATH" warning label ===
  ctx.save();
  const labelAlpha = 0.5 + Math.sin(t * 4) * 0.3;
  ctx.globalAlpha = labelAlpha;
  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffdd00';
  ctx.shadowColor = '#ff4400';
  ctx.shadowBlur = 8;
  ctx.fillText('☠  LAVA — INSTANT DEATH  ☠', arenaWidth / 2, top + 22);
  ctx.restore();
}
