// src/game/lakes.js
// Deadly lakes scattered across the arena. Touch one and it's game over!

let lakes = [];

const LAKE_COUNT = 4;
const LAKE_MIN_RADIUS = 35;
const LAKE_MAX_RADIUS = 60;
const PLAYER_SAFE_ZONE = 150; // lakes won't spawn near center

export function resetLakes(arenaWidth, arenaHeight) {
  lakes = [];
  for (let i = 0; i < LAKE_COUNT; i++) {
    let lx, ly, r;
    // Keep trying until we find a spot away from center and other lakes
    for (let attempt = 0; attempt < 50; attempt++) {
      r = LAKE_MIN_RADIUS + Math.random() * (LAKE_MAX_RADIUS - LAKE_MIN_RADIUS);
      lx = r + Math.random() * (arenaWidth - r * 2);
      ly = r + Math.random() * (arenaHeight - r * 2);
      const cx = arenaWidth / 2;
      const cy = arenaHeight / 2;
      const distFromCenter = Math.sqrt((lx - cx) ** 2 + (ly - cy) ** 2);
      if (distFromCenter > PLAYER_SAFE_ZONE) break;
    }
    lakes.push({ x: lx, y: ly, r, phase: Math.random() * Math.PI * 2 });
  }
}

export function checkLakeCollision(playerPos, playerSize) {
  const pr = playerSize / 2 * 0.6; // slightly forgiving hitbox
  for (const lake of lakes) {
    const dx = playerPos.x - lake.x;
    const dy = playerPos.y - lake.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < lake.r - pr * 0.3) {
      return true; // player is in the lake!
    }
  }
  return false;
}

export function drawLakes(ctx, now) {
  for (const lake of lakes) {
    const { x, y, r, phase } = lake;

    // Water body — shimmering blue-pink gradient
    const wobble = Math.sin(now / 800 + phase) * 2;
    const grad = ctx.createRadialGradient(x, y + wobble, 0, x, y + wobble, r);
    grad.addColorStop(0, 'rgba(100, 180, 255, 0.7)');
    grad.addColorStop(0.5, 'rgba(150, 200, 255, 0.55)');
    grad.addColorStop(0.8, 'rgba(180, 140, 255, 0.4)');
    grad.addColorStop(1, 'rgba(200, 160, 255, 0.1)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    // Wobbly ellipse for organic lake shape
    ctx.ellipse(x, y + wobble, r, r * 0.75, Math.sin(now / 2000 + phase) * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Rim glow
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.3)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y + wobble, r, r * 0.75, Math.sin(now / 2000 + phase) * 0.15, 0, Math.PI * 2);
    ctx.stroke();

    // Surface sparkles
    for (let s = 0; s < 5; s++) {
      const sparkleAngle = now / 1000 + phase + s * 1.3;
      const sr = r * (0.2 + (s * 0.15));
      const sx = x + Math.cos(sparkleAngle) * sr;
      const sy = y + wobble + Math.sin(sparkleAngle * 0.7) * sr * 0.6;
      const sparkleAlpha = 0.3 + Math.sin(now / 200 + s * 2 + phase) * 0.3;

      ctx.globalAlpha = sparkleAlpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5 + Math.sin(now / 300 + s) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Skull warning icon in center
    ctx.globalAlpha = 0.25 + Math.sin(now / 500 + phase) * 0.1;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('x_x', x, y + wobble + 5);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

export function getLakes() {
  return lakes;
}
