// src/game/lightning.js — decorative rainbow lightning; purely visual, never hurts the player

const INTERVAL_MIN  = 1100;  // ms between strikes
const INTERVAL_MAX  = 2800;
const BOLT_LIFE     = 260;   // ms bolt stays bright
const GLOW_LIFE     = 550;   // ms total (includes fade)
const FLASH_LIFE    = 110;   // ms screen-flash at moment of strike

let bolts = [];
let nextStrikeAt = 0;

export function resetLightning(now) {
  bolts = [];
  nextStrikeAt = now + 900;
}

// Recursive midpoint displacement — builds a jagged zigzag branch
function branch(x1, y1, x2, y2, depth) {
  if (depth === 0 || Math.abs(y2 - y1) < 8) return [{ x1, y1, x2, y2 }];
  const spread = Math.abs(y2 - y1) * 0.55;
  const mx = (x1 + x2) / 2 + (Math.random() - 0.5) * spread;
  const my = (y1 + y2) / 2;
  return [...branch(x1, y1, mx, my, depth - 1), ...branch(mx, my, x2, y2, depth - 1)];
}

export function updateLightning(now, arenaWidth, arenaHeight) {
  if (now >= nextStrikeAt) {
    const x   = 30 + Math.random() * (arenaWidth - 60);
    const endY = arenaHeight * (0.25 + Math.random() * 0.55);
    bolts.push({
      segs: branch(x, 0, x + (Math.random() - 0.5) * 120, endY, 5),
      hue:  Math.random() * 360,
      born: now,
      x,
    });
    nextStrikeAt = now + INTERVAL_MIN + Math.random() * (INTERVAL_MAX - INTERVAL_MIN);
  }
  for (let i = bolts.length - 1; i >= 0; i--) {
    if (now - bolts[i].born > GLOW_LIFE) bolts.splice(i, 1);
  }
}

export function drawLightning(ctx, canvasW, canvasH, now) {
  for (const bolt of bolts) {
    const age  = now - bolt.born;
    const hue  = bolt.hue;
    const hue2 = (hue + 50) % 360;

    // Whole-screen tint flash at the instant of strike
    if (age < FLASH_LIFE) {
      const fa = (1 - age / FLASH_LIFE) * 0.20;
      ctx.fillStyle = `hsla(${hue}, 100%, 88%, ${fa})`;
      ctx.fillRect(0, 0, canvasW, canvasH);
    }

    // Alpha: full during BOLT_LIFE, then fade out
    const alpha = age < BOLT_LIFE
      ? 1
      : 1 - (age - BOLT_LIFE) / (GLOW_LIFE - BOLT_LIFE);
    if (alpha <= 0) continue;

    // Draw the bolt three times: fat glow → medium → bright white core
    const passes = [
      { width: 14, color: `hsla(${hue},  100%, 70%, ${0.28 * alpha})`, blur: 28 },
      { width: 5,  color: `hsla(${hue2}, 100%, 82%, ${0.70 * alpha})`, blur: 14 },
      { width: 1.6, color: `rgba(255,255,255,${alpha})`,                blur: 6  },
    ];

    for (const pass of passes) {
      ctx.save();
      ctx.strokeStyle  = pass.color;
      ctx.lineWidth    = pass.width;
      ctx.lineCap      = 'round';
      ctx.lineJoin     = 'round';
      ctx.shadowBlur   = pass.blur;
      ctx.shadowColor  = `hsl(${hue}, 100%, 75%)`;
      ctx.beginPath();
      for (let i = 0; i < bolt.segs.length; i++) {
        const s = bolt.segs[i];
        if (i === 0) ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Bright flare dot at the origin (top)
    if (age < FLASH_LIFE * 2) {
      const fa2 = alpha * (1 - age / (FLASH_LIFE * 2));
      ctx.save();
      ctx.fillStyle   = '#ffffff';
      ctx.shadowBlur  = 22;
      ctx.shadowColor = `hsl(${hue}, 100%, 90%)`;
      ctx.globalAlpha = fa2;
      ctx.beginPath();
      ctx.arc(bolt.segs[0].x1, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
