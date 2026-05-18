// src/game/lightning.js
// Lightning strikes from the sky. Each strike telegraphs with a glowing
// target on the ground, then a jagged bolt cracks down. Standing in the
// strike radius when the bolt lands hurts the player.

let strikes = [];
let nextStrikeAt = 0;
let flashUntil = 0;

const STRIKE_INTERVAL_MIN = 2200;  // ms
const STRIKE_INTERVAL_MAX = 4500;  // ms
const WARNING_DURATION   = 850;    // ms — telegraph before bolt actually hits
const STRIKE_DURATION    = 180;    // ms — bolt is visible & dangerous
const FADE_DURATION      = 450;    // ms — residual scorch (no damage)
const STRIKE_RADIUS      = 52;     // pixels — inside this when bolt lands = ZAP

export function resetLightning() {
  strikes = [];
  // Small grace period before first strike so kids can orient
  nextStrikeAt = performance.now() + 1800 + Math.random() * 1500;
  flashUntil = 0;
}

function makeBoltSegments() {
  const segs = [];
  for (let i = 0; i < 14; i++) segs.push((Math.random() - 0.5) * 34);
  return segs;
}

export function updateLightning(dt, now, arenaWidth, arenaHeight, playerPos, damageFn) {
  // Schedule a new strike
  if (now >= nextStrikeAt) {
    const margin = 70;
    strikes.push({
      x: margin + Math.random() * (arenaWidth - margin * 2),
      y: margin + Math.random() * (arenaHeight - margin * 2),
      bornAt: now,
      warnedUntil: now + WARNING_DURATION,
      struckUntil: now + WARNING_DURATION + STRIKE_DURATION,
      doneAt:      now + WARNING_DURATION + STRIKE_DURATION + FADE_DURATION,
      segments: makeBoltSegments(),
      damaged: false,
      flashed: false,
    });
    nextStrikeAt = now + STRIKE_INTERVAL_MIN + Math.random() * (STRIKE_INTERVAL_MAX - STRIKE_INTERVAL_MIN);
  }

  for (let i = strikes.length - 1; i >= 0; i--) {
    const s = strikes[i];

    // Damage check happens once, the moment the bolt actually lands
    if (!s.damaged && now >= s.warnedUntil && now < s.struckUntil) {
      const dx = playerPos.x - s.x;
      const dy = playerPos.y - s.y;
      if (dx * dx + dy * dy < STRIKE_RADIUS * STRIKE_RADIUS) {
        damageFn(now);
        s.damaged = true; // mark either way — single damage event per strike
      }
    }

    // Trigger a one-shot screen flash on impact
    if (!s.flashed && now >= s.warnedUntil) {
      flashUntil = Math.max(flashUntil, s.warnedUntil + 100);
      s.flashed = true;
    }

    if (now > s.doneAt) strikes.splice(i, 1);
  }
}

export function drawLightning(ctx, canvasW, canvasH, now) {
  for (const s of strikes) {
    if (now < s.warnedUntil) {
      // --- WARNING: glowing target on the ground ---
      const pulse = 0.4 + 0.6 * Math.abs(Math.sin(now / 70));
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, STRIKE_RADIUS);
      grad.addColorStop(0, `rgba(255,250,180,${0.30 * pulse})`);
      grad.addColorStop(1, 'rgba(255,250,180,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(s.x, s.y, STRIKE_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(255,240,120,${0.65 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(s.x, s.y, STRIKE_RADIUS, 0, Math.PI * 2);
      ctx.stroke();

      // Crosshair sparks
      ctx.strokeStyle = `rgba(255,255,180,${0.45 * pulse})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(s.x - STRIKE_RADIUS * 0.6, s.y); ctx.lineTo(s.x + STRIKE_RADIUS * 0.6, s.y);
      ctx.moveTo(s.x, s.y - STRIKE_RADIUS * 0.6); ctx.lineTo(s.x, s.y + STRIKE_RADIUS * 0.6);
      ctx.stroke();
    } else if (now < s.struckUntil) {
      // --- STRIKE: jagged zigzag bolt from sky to ground ---
      const segs = s.segments;
      const stepH = s.y / (segs.length);

      // Outer glow
      ctx.strokeStyle = 'rgba(180,210,255,0.6)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x + segs[0], 0);
      for (let i = 1; i < segs.length; i++) {
        ctx.lineTo(s.x + segs[i], i * stepH);
      }
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      // Bright core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(s.x + segs[0], 0);
      for (let i = 1; i < segs.length; i++) {
        ctx.lineTo(s.x + segs[i], i * stepH);
      }
      ctx.lineTo(s.x, s.y);
      ctx.stroke();

      // Impact burst at the ground
      const burst = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, STRIKE_RADIUS * 1.5);
      burst.addColorStop(0, 'rgba(255,255,255,0.95)');
      burst.addColorStop(0.5, 'rgba(200,220,255,0.55)');
      burst.addColorStop(1, 'rgba(120,170,255,0)');
      ctx.fillStyle = burst;
      ctx.beginPath();
      ctx.arc(s.x, s.y, STRIKE_RADIUS * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Radiating sparks
      ctx.strokeStyle = 'rgba(220,230,255,0.85)';
      ctx.lineWidth = 2;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + Math.random() * 0.3;
        const len = STRIKE_RADIUS * (0.7 + Math.random() * 0.8);
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + Math.cos(a) * len, s.y + Math.sin(a) * len);
        ctx.stroke();
      }
    } else {
      // --- FADE: scorch mark on the ground ---
      const t = (now - s.struckUntil) / FADE_DURATION;
      const a = 1 - t;
      ctx.fillStyle = `rgba(35,25,18,${0.6 * a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, STRIKE_RADIUS * 0.78, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(160,200,255,${0.55 * a})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, STRIKE_RADIUS * 0.78, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Full-screen impact flash
  if (now < flashUntil) {
    const remaining = (flashUntil - now) / 100;
    ctx.fillStyle = `rgba(255,255,255,${0.32 * remaining})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
  }
}
