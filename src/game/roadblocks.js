// src/game/roadblocks.js
// A roadblock drops where you got hit. Touch one later and lose a heart.

const W = 36;
const H = 36;

let roadblocks = [];

export function resetRoadblocks() {
  roadblocks = [];
}

export function spawnRoadblock(playerX, playerY, arenaWidth, arenaHeight) {
  const margin = 30;
  const x = Math.max(margin, Math.min(arenaWidth - margin - W, playerX - W / 2));
  const y = Math.max(margin, Math.min(arenaHeight - margin - H, playerY - H / 2));
  roadblocks.push({ x, y, w: W, h: H, spawnedAt: performance.now() });
}

export function getRoadblocks() {
  return roadblocks;
}

export function drawRoadblocks(ctx, now) {
  for (const rb of roadblocks) {
    const age = now - rb.spawnedAt;
    // Fade in quickly
    const alpha = Math.min(1, age / 300);
    ctx.globalAlpha = alpha;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(rb.x + 4, rb.y + 4, rb.w, rb.h);

    // White base
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(rb.x, rb.y, rb.w, rb.h);

    // Orange diagonal stripes
    ctx.save();
    ctx.beginPath();
    ctx.rect(rb.x, rb.y, rb.w, rb.h);
    ctx.clip();
    ctx.fillStyle = '#e67e22';
    const stripeW = 10;
    for (let s = -rb.h; s < rb.w + rb.h; s += stripeW * 2) {
      ctx.beginPath();
      ctx.moveTo(rb.x + s, rb.y);
      ctx.lineTo(rb.x + s + rb.h, rb.y + rb.h);
      ctx.lineTo(rb.x + s + rb.h + stripeW, rb.y + rb.h);
      ctx.lineTo(rb.x + s + stripeW, rb.y);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Border
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 2;
    ctx.strokeRect(rb.x, rb.y, rb.w, rb.h);

    // Flashing warning light on top
    const blink = Math.sin(now / 250) > 0;
    ctx.fillStyle = blink ? '#e74c3c' : '#7f1d1d';
    ctx.beginPath();
    ctx.arc(rb.x + rb.w / 2, rb.y - 5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
  }
}
