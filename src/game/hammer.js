// src/game/hammer.js
// A giant hammer periodically smashes down. Each impact leaves a solid white block.

const STRIKE_INTERVAL = 5000; // ms between strikes
const WARN_MS   = 1000;  // warning crosshair duration
const FALL_MS   = 220;   // hammer fall duration
const IMPACT_MS = 200;   // impact flash duration
const RISE_MS   = 480;   // hammer rise duration

const BLOCK_SIZE = 52;   // white block size (px)
const MAX_BLOCKS = 6;    // arena fills up then oldest disappears

const HEAD_W = 88, HEAD_H = 52;
const HANDLE_W = 20;

const S = { IDLE: 0, WARN: 1, FALL: 2, IMPACT: 3, RISE: 4 };

let phase      = S.IDLE;
let phaseEnd   = 0;        // timestamp when current phase ends
let targetX    = 0;        // x center of impact
let targetY    = 0;        // y center of impact
let hammerY    = -999;     // top of hammer head
let blocks     = [];       // solid white blocks { x, y, w, h }

export function resetHammer(now) {
  phase    = S.IDLE;
  phaseEnd = now + STRIKE_INTERVAL;
  blocks   = [];
  hammerY  = -999;
}

export function getHammerBlocks() { return blocks; }

export function updateHammer(now, arenaWidth, arenaHeight) {
  switch (phase) {
    case S.IDLE:
      if (now >= phaseEnd) {
        targetX = arenaWidth  * (0.12 + Math.random() * 0.76);
        targetY = arenaHeight * (0.15 + Math.random() * 0.55);
        hammerY = -HEAD_H - 10;
        phase   = S.WARN;
        phaseEnd = now + WARN_MS;
      }
      break;

    case S.WARN:
      if (now >= phaseEnd) { phase = S.FALL; phaseEnd = now + FALL_MS; }
      break;

    case S.FALL: {
      const t = 1 - Math.max(0, (phaseEnd - now) / FALL_MS);
      const landY = targetY - HEAD_H / 2;  // top of head at impact
      hammerY = -HEAD_H - 10 + (landY + HEAD_H + 10) * Math.pow(t, 0.5);
      if (now >= phaseEnd) {
        hammerY = landY;
        // Place block; remove oldest if over cap
        if (blocks.length >= MAX_BLOCKS) blocks.shift();
        blocks.push({
          x: targetX - BLOCK_SIZE / 2,
          y: targetY - BLOCK_SIZE / 2,
          w: BLOCK_SIZE,
          h: BLOCK_SIZE,
        });
        phase    = S.IMPACT;
        phaseEnd = now + IMPACT_MS;
      }
      break;
    }

    case S.IMPACT:
      if (now >= phaseEnd) { phase = S.RISE; phaseEnd = now + RISE_MS; }
      break;

    case S.RISE: {
      const t = Math.max(0, (phaseEnd - now) / RISE_MS);
      const landY = targetY - HEAD_H / 2;
      hammerY = landY * t - (HEAD_H + 10) * (1 - t);
      if (now >= phaseEnd) {
        hammerY  = -HEAD_H - 10;
        phase    = S.IDLE;
        phaseEnd = now + STRIKE_INTERVAL;
      }
      break;
    }
  }
}

// ─── Drawing ──────────────────────────────────────────────────────────────────

export function drawHammer(ctx, width, height, now) {
  drawBlocks(ctx, now);

  // Warning crosshair
  if (phase === S.WARN) {
    const flash = Math.sin((phaseEnd - now) / 80) > 0;
    if (flash) {
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = '#ff2200';
      ctx.lineWidth   = 3;
      const s = 28;
      ctx.beginPath();
      ctx.moveTo(targetX - s, targetY); ctx.lineTo(targetX + s, targetY);
      ctx.moveTo(targetX, targetY - s); ctx.lineTo(targetX, targetY + s);
      ctx.stroke();
      // Circle
      ctx.beginPath();
      ctx.arc(targetX, targetY, s * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // Hammer (visible during WARN tail, FALL, IMPACT, RISE)
  if (phase === S.IDLE) return;
  if (hammerY < -HEAD_H - 20) return;

  const hx = targetX;  // center x
  const hy = hammerY;  // top of head

  ctx.save();

  // Handle (extends upward from head center)
  const handleTop = hy - 220;
  ctx.fillStyle = '#6b3a1f';
  ctx.fillRect(hx - HANDLE_W / 2, handleTop, HANDLE_W, hy - handleTop + HEAD_H / 2);
  // Handle grain lines
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  for (let g = 0; g < 4; g++) {
    const gx = hx - HANDLE_W / 2 + (HANDLE_W / 5) * (g + 1);
    ctx.beginPath(); ctx.moveTo(gx, handleTop); ctx.lineTo(gx, hy); ctx.stroke();
  }

  // Hammer head shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(hx - HEAD_W / 2 + 5, hy + 5, HEAD_W, HEAD_H);

  // Hammer head — main body
  const headGrad = ctx.createLinearGradient(hx - HEAD_W / 2, hy, hx + HEAD_W / 2, hy + HEAD_H);
  headGrad.addColorStop(0, '#aab8c2');
  headGrad.addColorStop(0.45, '#d0dde6');
  headGrad.addColorStop(1, '#7a8e99');
  ctx.fillStyle = headGrad;
  ctx.fillRect(hx - HEAD_W / 2, hy, HEAD_W, HEAD_H);

  // Head face — bottom (impact face)
  ctx.fillStyle = '#8fa8b8';
  ctx.fillRect(hx - HEAD_W / 2, hy + HEAD_H - 8, HEAD_W, 8);

  // Head highlight
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(hx - HEAD_W / 2 + 4, hy + 4, HEAD_W - 8, 10);

  // Head border
  ctx.strokeStyle = '#445566';
  ctx.lineWidth = 2;
  ctx.strokeRect(hx - HEAD_W / 2, hy, HEAD_W, HEAD_H);

  // Impact flash when hitting
  if (phase === S.IMPACT) {
    const flashAlpha = Math.max(0, 1 - (now - (phaseEnd - IMPACT_MS)) / IMPACT_MS) * 0.85;
    ctx.fillStyle = `rgba(255,255,240,${flashAlpha})`;
    ctx.beginPath();
    ctx.arc(targetX, targetY, HEAD_W * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawBlocks(ctx, now) {
  for (const b of blocks) {
    // White block with subtle inner glow
    ctx.fillStyle = '#f0f4ff';
    ctx.fillRect(b.x, b.y, b.w, b.h);

    // Inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(b.x + 4, b.y + 4, b.w - 8, 6);
    ctx.fillRect(b.x + 4, b.y + 4, 6, b.h - 8);

    // Border shadow (gives depth)
    ctx.fillStyle = 'rgba(100,130,170,0.4)';
    ctx.fillRect(b.x + 4, b.y + b.h - 6, b.w - 4, 4);
    ctx.fillRect(b.x + b.w - 6, b.y + 4, 4, b.h - 4);

    // Outer border
    ctx.strokeStyle = 'rgba(160,200,240,0.8)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  }
}
