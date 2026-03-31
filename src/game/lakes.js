// src/game/lakes.js
// Deadly LAVA POOLS scattered across the arena. Touch one and it's game over!

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

    // Lava body — pulsing red-orange-yellow gradient
    const wobble = Math.sin(now / 600 + phase) * 3;
    const pulseR = r + Math.sin(now / 400 + phase) * 3;
    const grad = ctx.createRadialGradient(x, y + wobble, 0, x, y + wobble, pulseR);
    grad.addColorStop(0, 'rgba(255, 255, 80, 0.9)');
    grad.addColorStop(0.3, 'rgba(255, 160, 20, 0.8)');
    grad.addColorStop(0.6, 'rgba(220, 60, 10, 0.7)');
    grad.addColorStop(0.85, 'rgba(160, 20, 0, 0.5)');
    grad.addColorStop(1, 'rgba(80, 0, 0, 0.15)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y + wobble, pulseR, pulseR * 0.75, Math.sin(now / 1500 + phase) * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Hot rim glow
    ctx.strokeStyle = 'rgba(255, 100, 0, 0.5)';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff4400';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.ellipse(x, y + wobble, pulseR, pulseR * 0.75, Math.sin(now / 1500 + phase) * 0.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Lava bubbles
    for (let b = 0; b < 6; b++) {
      const bubblePhase = phase + b * 1.1;
      const bubbleLife = ((now / 800 + bubblePhase) % 1);
      const br = r * (0.15 + (b * 0.12));
      const bx = x + Math.cos(bubblePhase * 3) * br;
      const by = y + wobble + Math.sin(bubblePhase * 2.3) * br * 0.5;
      const bubbleSize = (2 + Math.sin(bubblePhase) * 1.5) * (1 - bubbleLife * 0.5);

      ctx.globalAlpha = 0.4 + Math.sin(now / 150 + bubblePhase) * 0.3;
      ctx.fillStyle = bubbleLife > 0.7 ? '#ffee88' : '#ffaa33';
      ctx.beginPath();
      ctx.arc(bx, by - bubbleLife * 8, bubbleSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Bright cracks/veins in the lava
    ctx.strokeStyle = 'rgba(255, 255, 100, 0.3)';
    ctx.lineWidth = 1.5;
    for (let v = 0; v < 3; v++) {
      const va = phase + v * 2.1;
      const vx1 = x + Math.cos(va) * r * 0.15;
      const vy1 = y + wobble + Math.sin(va) * r * 0.1;
      const vx2 = x + Math.cos(va + 1) * r * 0.5;
      const vy2 = y + wobble + Math.sin(va + 0.8) * r * 0.35;
      ctx.globalAlpha = 0.2 + Math.sin(now / 250 + va) * 0.2;
      ctx.beginPath();
      ctx.moveTo(vx1, vy1);
      ctx.quadraticCurveTo(
        x + Math.cos(va + 0.5) * r * 0.35,
        y + wobble + Math.sin(va + 0.4) * r * 0.25,
        vx2, vy2
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Heat shimmer glow above lava
    const shimmerGrad = ctx.createRadialGradient(x, y + wobble - r * 0.3, 0, x, y + wobble - r * 0.3, r * 0.8);
    shimmerGrad.addColorStop(0, 'rgba(255, 80, 0, 0.08)');
    shimmerGrad.addColorStop(1, 'rgba(255, 80, 0, 0)');
    ctx.fillStyle = shimmerGrad;
    ctx.fillRect(x - r, y + wobble - r * 1.2, r * 2, r * 0.9);
  }
}

export function getLakes() {
  return lakes;
}
