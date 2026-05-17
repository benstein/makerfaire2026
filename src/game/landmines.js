// src/game/landmines.js

export const MAX_MINES = 3;
const MINE_SIZE = 24;
const EXPLOSION_DURATION = 450;

let mines = [];
let explosions = [];

export function resetLandmines() {
  mines = [];
  explosions = [];
}

export function tryLayMine(playerPos, now) {
  if (mines.length >= MAX_MINES) return false;
  mines.push({
    x: playerPos.x - MINE_SIZE / 2,
    y: playerPos.y - MINE_SIZE / 2,
    w: MINE_SIZE,
    h: MINE_SIZE,
    spawnTime: now,
  });
  return true;
}

export function getMines() {
  return mines;
}

export function getMineCount() {
  return mines.length;
}

export function explodeMine(index, now) {
  const m = mines[index];
  explosions.push({ x: m.x + m.w / 2, y: m.y + m.h / 2, startTime: now });
  mines.splice(index, 1);
}

export function updateLandmines(now) {
  explosions = explosions.filter(e => now - e.startTime < EXPLOSION_DURATION);
}

export function drawLandmines(ctx, now) {
  // Explosions
  for (const ex of explosions) {
    const t = (now - ex.startTime) / EXPLOSION_DURATION;
    const r = 70 * Math.pow(t, 0.4);
    ctx.save();
    ctx.globalAlpha = 1 - t;
    // Outer fireball
    ctx.fillStyle = '#ff6a00';
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, r, 0, Math.PI * 2);
    ctx.fill();
    // Inner bright core
    ctx.fillStyle = '#fff7a0';
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Mines
  for (const mine of mines) {
    const cx = mine.x + mine.w / 2;
    const cy = mine.y + mine.h / 2;
    const r = mine.w / 2;
    const pulse = (Math.sin((now - mine.spawnTime) / 180) + 1) / 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, cy + r + 2, r * 0.9, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Warning stripes (X)
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - r * 0.55, cy - r * 0.55);
    ctx.lineTo(cx + r * 0.55, cy + r * 0.55);
    ctx.moveTo(cx + r * 0.55, cy - r * 0.55);
    ctx.lineTo(cx - r * 0.55, cy + r * 0.55);
    ctx.stroke();

    // Pulsing red LED
    ctx.fillStyle = `rgba(255, ${Math.round(pulse * 40)}, 0, ${0.7 + pulse * 0.3})`;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Detonator spike on top
    ctx.fillStyle = '#555';
    ctx.fillRect(cx - 2, cy - r - 5, 4, 6);
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(cx, cy - r - 5, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}
