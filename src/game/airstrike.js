// src/game/airstrike.js
// Press B to call in a jet formation that drops bouncing chickens.
// Chickens damage enemies, the player, and bounce chaotically until they tire out.

const JET_SPEED        = 9;    // px per frame at 60fps
const DROP_INTERVAL    = 90;   // px of jet travel between chicken drops
const GRAVITY          = 0.5;  // px/frame² at 60fps
const BOUNCE_DAMPING   = 0.62;
const MAX_BOUNCES      = 7;
const CHICKEN_SIZE     = 24;
const COOLDOWN         = 5000; // ms between airstrikes

let jets     = [];
let chickens = [];
let lastTime = -Infinity;

export function resetAirstrike() {
  jets     = [];
  chickens = [];
  lastTime = -Infinity;
}

export function canAirstrike(now) {
  return now - lastTime >= COOLDOWN;
}

export function triggerAirstrike(width, height, now) {
  if (!canAirstrike(now)) return;
  lastTime = now;

  const dir = Math.random() > 0.5 ? 1 : -1;
  // Three jets in a loose V-formation
  const formation = [
    { dy: 0,    lag: 0   },
    { dy: -30,  lag: -60 },
    { dy: -30,  lag: 60  },
  ];
  for (const f of formation) {
    const startX = dir > 0 ? -100 + f.lag * dir : width + 100 + f.lag * dir;
    jets.push({
      x: startX,
      y: height * 0.10 + f.dy,
      vx: dir * JET_SPEED,
      dir,
      dropAccum: Math.random() * DROP_INTERVAL,
    });
  }
}

export function updateAirstrike(dt, now, width, height) {
  const scale = dt / 16.67;

  // Jets
  for (let i = jets.length - 1; i >= 0; i--) {
    const j = jets[i];
    j.x += j.vx * scale;
    j.dropAccum += Math.abs(j.vx * scale);

    // Drop a chicken
    if (j.dropAccum >= DROP_INTERVAL) {
      j.dropAccum -= DROP_INTERVAL;
      chickens.push(makeChicken(j.x, j.y + 18, j.vx * 0.25, now));
    }

    if ((j.dir > 0 && j.x > width + 120) || (j.dir < 0 && j.x < -120)) {
      jets.splice(i, 1);
    }
  }

  // Chickens
  for (let i = chickens.length - 1; i >= 0; i--) {
    const c = chickens[i];

    if (now - c.bornAt > 10000 || c.bounces > MAX_BOUNCES) {
      chickens.splice(i, 1);
      continue;
    }

    c.vy   += GRAVITY * scale;
    c.x    += c.vx * scale;
    c.y    += c.vy * scale;
    c.angle += c.spin * scale;

    // Floor bounce
    if (c.y + CHICKEN_SIZE >= height) {
      c.y  = height - CHICKEN_SIZE;
      c.vy = -Math.abs(c.vy) * BOUNCE_DAMPING;
      c.vx += (Math.random() - 0.5) * 2;
      c.bounces++;
    }
    // Wall bounce
    if (c.x < 0)              { c.x = 0;              c.vx =  Math.abs(c.vx); }
    if (c.x + CHICKEN_SIZE > width) { c.x = width - CHICKEN_SIZE; c.vx = -Math.abs(c.vx); }
  }
}

function makeChicken(x, y, vx, now) {
  return {
    x, y,
    w: CHICKEN_SIZE, h: CHICKEN_SIZE,
    vx: vx + (Math.random() - 0.5) * 2,
    vy: 0.5 + Math.random() * 1.5,
    bounces: 0,
    bornAt: now,
    angle: 0,
    spin: (Math.random() - 0.5) * 0.35,
    white: Math.random() > 0.25,
  };
}

export function getChickens() { return chickens; }

export function drawAirstrike(ctx, now) {
  // ── Jets ──────────────────────────────────────────────────────────────────
  for (const j of jets) {
    ctx.save();
    ctx.translate(j.x, j.y);

    // Exhaust trail
    ctx.globalAlpha = 0.25;
    for (let t = 1; t <= 5; t++) {
      ctx.fillStyle = t < 3 ? '#ffffff' : '#aaaaaa';
      ctx.beginPath();
      ctx.arc(-j.dir * t * 14, (Math.random() - 0.5) * 4, 5 - t * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Body — scale to face direction of travel
    ctx.scale(j.dir, 1);
    ctx.fillStyle   = '#c8c8d4';
    ctx.strokeStyle = '#606070';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo( 34,   0);   // nose
    ctx.lineTo(-16,  -7);   // wing root top
    ctx.lineTo(-38, -20);   // left wing tip
    ctx.lineTo(-26,   0);   // tail
    ctx.lineTo(-38,  20);   // right wing tip
    ctx.lineTo(-16,   7);   // wing root bottom
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Cockpit
    ctx.fillStyle = '#5599ee';
    ctx.beginPath();
    ctx.ellipse(10, 0, 9, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ── Chickens ──────────────────────────────────────────────────────────────
  for (const c of chickens) {
    const cx = c.x + CHICKEN_SIZE / 2;
    const cy = c.y + CHICKEN_SIZE / 2;
    const r  = CHICKEN_SIZE / 2;
    const fc = c.white ? '#f8f8f0' : '#f5c518'; // white or golden chicken

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(c.angle);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.95, r * 0.75, r * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = fc;
    ctx.strokeStyle = '#887740';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.82, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Wing highlight
    ctx.fillStyle = c.white ? '#e0e0d8' : '#e8b000';
    ctx.beginPath();
    ctx.ellipse(r * 0.25, r * 0.1, r * 0.52, r * 0.32, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = fc;
    ctx.strokeStyle = '#887740';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(r * 0.55, -r * 0.62, r * 0.40, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Comb
    ctx.fillStyle = '#dd2222';
    ctx.beginPath();
    ctx.moveTo(r * 0.35, -r * 0.98);
    ctx.lineTo(r * 0.50, -r * 1.18);
    ctx.lineTo(r * 0.62, -r * 0.98);
    ctx.lineTo(r * 0.74, -r * 1.10);
    ctx.lineTo(r * 0.83, -r * 0.95);
    ctx.closePath();
    ctx.fill();

    // Wattle
    ctx.fillStyle = '#dd2222';
    ctx.beginPath();
    ctx.ellipse(r * 0.75, -r * 0.50, r * 0.10, r * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Beak
    ctx.fillStyle = '#ff8800';
    ctx.beginPath();
    ctx.moveTo(r * 0.88, -r * 0.68);
    ctx.lineTo(r * 1.14, -r * 0.62);
    ctx.lineTo(r * 0.88, -r * 0.54);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(r * 0.68, -r * 0.72, r * 0.10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(r * 0.65, -r * 0.75, r * 0.04, 0, Math.PI * 2);
    ctx.fill();

    // Legs
    ctx.strokeStyle = '#ff8800';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.18, r * 0.72); ctx.lineTo(-r * 0.18, r * 1.08);
    ctx.moveTo( r * 0.18, r * 0.72); ctx.lineTo( r * 0.18, r * 1.08);
    ctx.stroke();
    // Feet
    ctx.beginPath();
    ctx.moveTo(-r * 0.18, r * 1.08); ctx.lineTo(-r * 0.38, r * 1.08);
    ctx.moveTo(-r * 0.18, r * 1.08); ctx.lineTo(-r * 0.02, r * 1.08);
    ctx.moveTo( r * 0.18, r * 1.08); ctx.lineTo( r * 0.38, r * 1.08);
    ctx.moveTo( r * 0.18, r * 1.08); ctx.lineTo( r * 0.02, r * 1.08);
    ctx.stroke();

    ctx.restore();
  }
}
