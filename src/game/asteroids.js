// src/game/asteroids.js
// Asteroids fall from the top of the screen. They hurt the Maker and can be shot down.

const SPAWN_INTERVAL = 2800; // ms between spawns
const MAX_ASTEROIDS  = 7;

let asteroids    = [];
let lastSpawnTime = 0;

export function resetAsteroids() {
  asteroids    = [];
  lastSpawnTime = 0;
}

function spawnAsteroid(arenaWidth) {
  const r = 13 + Math.random() * 17;
  return {
    x:     r * 1.5 + Math.random() * (arenaWidth - r * 3),
    y:     -r - 10,
    r,
    vx:    (Math.random() - 0.5) * 1.8,
    vy:    2.6 + Math.random() * 2.8,
    angle: Math.random() * Math.PI * 2,
    spin:  (Math.random() - 0.5) * 0.07,
    seed:  Math.random() * 200,
  };
}

export function updateAsteroids(dt, now, arenaWidth, arenaHeight) {
  if (asteroids.length < MAX_ASTEROIDS && now - lastSpawnTime > SPAWN_INTERVAL) {
    asteroids.push(spawnAsteroid(arenaWidth));
    lastSpawnTime = now;
  }

  const scale = dt / 16.67;
  for (let i = asteroids.length - 1; i >= 0; i--) {
    const a = asteroids[i];
    a.x     += a.vx * scale;
    a.y     += a.vy * scale;
    a.angle += a.spin * scale;
    if (a.y - a.r > arenaHeight + 30) asteroids.splice(i, 1);
  }
}

export function getAsteroids() { return asteroids; }

export function removeAsteroid(i) { asteroids.splice(i, 1); }

export function getAsteroidBounds(a) {
  return { x: a.x - a.r * 0.8, y: a.y - a.r * 0.8, w: a.r * 1.6, h: a.r * 1.6 };
}

// ─── Drawing ──────────────────────────────────────────────────────────────────

export function drawAsteroids(ctx, now) {
  const t = now / 1000;
  for (const a of asteroids) drawOneAsteroid(ctx, a, t);
}

function drawOneAsteroid(ctx, a, t) {
  const { x, y, r, angle, seed } = a;
  const rng = (s) => Math.abs(Math.sin(seed * 17.3 + s * 11.7));

  // Fire / heat trail (drawn before body, no save needed)
  const trailLen = r * 2.8 + Math.sin(t * 9 + seed) * r * 0.5;
  const trailGrad = ctx.createLinearGradient(x, y, x, y - trailLen);
  trailGrad.addColorStop(0,   'rgba(255,110,0,0.90)');
  trailGrad.addColorStop(0.25,'rgba(255,200,0,0.55)');
  trailGrad.addColorStop(0.6, 'rgba(255,240,80,0.20)');
  trailGrad.addColorStop(1,   'rgba(255,255,150,0)');
  ctx.fillStyle = trailGrad;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.38, y - r * 0.6);
  ctx.lineTo(x,             y - r - trailLen);
  ctx.lineTo(x + r * 0.38, y - r * 0.6);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Orange heat glow around rock
  ctx.shadowBlur  = 18;
  ctx.shadowColor = '#ff5500';

  // Irregular rock body
  const numPts = 7 + Math.floor(rng(1) * 3);
  ctx.fillStyle = '#2e1e0e';
  ctx.beginPath();
  for (let i = 0; i < numPts; i++) {
    const a2 = (i / numPts) * Math.PI * 2;
    const pr = r * (0.70 + rng(i + 2) * 0.30);
    i === 0 ? ctx.moveTo(Math.cos(a2) * pr, Math.sin(a2) * pr)
            : ctx.lineTo(Math.cos(a2) * pr, Math.sin(a2) * pr);
  }
  ctx.closePath();
  ctx.fill();

  // Lighter rock surface
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#5a3a1a';
  ctx.beginPath();
  for (let i = 0; i < numPts; i++) {
    const a2 = (i / numPts) * Math.PI * 2;
    const pr = r * (0.42 + rng(i + 8) * 0.22);
    i === 0 ? ctx.moveTo(Math.cos(a2) * pr, Math.sin(a2) * pr)
            : ctx.lineTo(Math.cos(a2) * pr, Math.sin(a2) * pr);
  }
  ctx.closePath();
  ctx.fill();

  // Craters
  ctx.fillStyle = 'rgba(0,0,0,0.40)';
  for (let i = 0; i < 3; i++) {
    const ca = rng(i + 20) * Math.PI * 2;
    const cd = rng(i + 21) * r * 0.38;
    const cr = r * (0.07 + rng(i + 22) * 0.11);
    ctx.beginPath();
    ctx.arc(Math.cos(ca) * cd, Math.sin(ca) * cd, cr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Glowing hot cracks
  const crackAlpha = 0.55 + Math.sin(t * 7 + seed) * 0.25;
  ctx.strokeStyle = `rgba(255, 100, 0, ${crackAlpha})`;
  ctx.lineWidth   = 1.4;
  ctx.lineCap     = 'round';
  for (let i = 0; i < 3; i++) {
    const a0 = rng(i + 40) * Math.PI * 2;
    const a1 = a0 + (rng(i + 41) - 0.5) * 1.8;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a0) * r * 0.12, Math.sin(a0) * r * 0.12);
    ctx.lineTo(Math.cos(a1) * r * (0.4 + rng(i + 42) * 0.25), Math.sin(a1) * r * (0.4 + rng(i + 42) * 0.25));
    ctx.stroke();
  }

  ctx.restore();
}
