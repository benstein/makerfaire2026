// src/game/donuts.js — donuts appear in the arena; eat for size+health, eat 5 and EXPLODE

const SPAWN_INTERVAL = 5000;
const MAX_DONUTS     = 3;
const DONUT_R        = 22;
const EXPLODE_DUR    = 1600; // ms of explosion animation before game over

let donuts       = [];
let lastSpawn    = 0;
let donutsEaten  = 0;
let explodeStart = 0; // 0 = not exploding

export function resetDonuts(now) {
  donuts      = [];
  donutsEaten = 0;
  explodeStart = 0;
  lastSpawn   = now - SPAWN_INTERVAL + 2000; // first donut after 2s
}

export function updateDonuts(now, arenaWidth, arenaHeight) {
  if (donuts.length < MAX_DONUTS && now - lastSpawn > SPAWN_INTERVAL) {
    donuts.push(spawnDonut(arenaWidth, arenaHeight, now));
    lastSpawn = now;
  }
}

function spawnDonut(w, h, now) {
  const margin = DONUT_R + 50;
  return {
    x: margin + Math.random() * (w - margin * 2),
    y: margin + Math.random() * (h - margin * 2),
    r: DONUT_R,
    frostingHue: Math.floor(Math.random() * 360),
    sprinkles: Array.from({ length: 10 }, () => ({
      a: Math.random() * Math.PI * 2,
      d: DONUT_R * (0.38 + Math.random() * 0.45),
      hue: Math.floor(Math.random() * 360),
      len: 4 + Math.random() * 5,
      tilt: Math.random() * Math.PI,
    })),
    born: now,
  };
}

export function getDonuts() { return donuts; }

// Returns number of donuts eaten so far (including this one)
export function eatDonut(index, now) {
  donuts.splice(index, 1);
  donutsEaten++;
  if (donutsEaten >= 5) explodeStart = now;
  return donutsEaten;
}

export function isExploding()      { return explodeStart > 0; }
export function getDonutsEaten()   { return donutsEaten; }
export function explodeDone(now)   { return explodeStart > 0 && now - explodeStart > EXPLODE_DUR; }

export function drawDonuts(ctx, now) {
  for (const d of donuts) drawDonut(ctx, d, now);
}

function drawDonut(ctx, d, now) {
  const t   = now / 1000;
  const bob = Math.sin(t * 1.9 + d.born * 0.001) * 3;
  const cx  = d.x;
  const cy  = d.y + bob;
  const r   = d.r;

  ctx.save();
  ctx.translate(cx, cy);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(3, r * 0.8, r * 0.75, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Dough ring ──
  ctx.fillStyle = '#c8730a';
  ctx.beginPath();
  ctx.arc(0, 0, r,        0, Math.PI * 2, false); // outer
  ctx.arc(0, 0, r * 0.40, 0, Math.PI * 2, true);  // hole
  ctx.fill('evenodd');

  // Dough shading band
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r,        0, Math.PI * 2, false);
  ctx.arc(0, 0, r * 0.40, 0, Math.PI * 2, true);
  ctx.clip('evenodd');
  ctx.strokeStyle = 'rgba(0,0,0,0.14)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.70, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // ── Frosting (top half drape) ──
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r,        0, Math.PI * 2, false);
  ctx.arc(0, 0, r * 0.40, 0, Math.PI * 2, true);
  ctx.clip('evenodd');
  ctx.fillStyle = `hsl(${d.frostingHue}, 92%, 72%)`;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.05, r * 1.05, r * 0.65, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // Frosting edge drip
  ctx.fillStyle = `hsl(${d.frostingHue}, 85%, 60%)`;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.22, r * 0.95, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Sprinkles ──
  for (const s of d.sprinkles) {
    const sx = Math.cos(s.a) * s.d;
    const sy = Math.sin(s.a) * s.d;
    if (sy > r * 0.25) continue; // only on frosting side
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(s.tilt);
    ctx.fillStyle = `hsl(${s.hue}, 100%, 68%)`;
    ctx.beginPath();
    ctx.roundRect(-s.len / 2, -2, s.len, 4, 2);
    ctx.fill();
    ctx.restore();
  }

  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.22, -r * 0.32, r * 0.24, r * 0.13, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // Donut counter label (how many eaten so far)
  if (donutsEaten > 0) {
    // no label needed per donut — shown in explosion
  }

  ctx.restore();
}

export function drawDonutExplosion(ctx, px, py, canvasW, canvasH, now) {
  if (!explodeStart) return;
  const age  = now - explodeStart;
  const prog = Math.min(age / EXPLODE_DUR, 1);

  // Full-screen orange flash
  const flashAlpha = Math.max(0, 1 - prog * 2.5) * 0.85;
  ctx.fillStyle = `rgba(255, 180, 20, ${flashAlpha})`;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Expanding shockwave rings
  for (let ring = 0; ring < 5; ring++) {
    const rProg = Math.max(0, prog - ring * 0.10);
    if (rProg <= 0) continue;
    const radius = rProg * Math.max(canvasW, canvasH) * 0.9;
    const alpha  = (1 - rProg) * 0.7;
    ctx.strokeStyle = `hsla(${ring * 28}, 100%, 62%, ${alpha})`;
    ctx.lineWidth   = 9 - ring;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Flying donut chunks
  ctx.save();
  for (let i = 0; i < 16; i++) {
    const angle   = (i / 16) * Math.PI * 2;
    const speed   = 280 + i * 20;
    const chunkX  = px + Math.cos(angle) * speed * prog;
    const chunkY  = py + Math.sin(angle) * speed * prog + 160 * prog * prog;
    const alpha   = Math.max(0, 1 - prog * 1.4);
    const chunkR  = Math.max(0.5, 10 - prog * 8);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = i % 3 === 0 ? '#c8730a'
                  : i % 3 === 1 ? `hsl(${i * 22}, 92%, 72%)`
                  : '#ffffff';
    ctx.beginPath();
    ctx.arc(chunkX, chunkY, chunkR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // "DONUT OVERDOSE!" text
  const textProg = Math.min(prog * 3, 1);
  const textAlpha = prog < 0.65 ? textProg : Math.max(0, 1 - (prog - 0.65) / 0.35);
  if (textAlpha > 0) {
    ctx.save();
    ctx.globalAlpha = textAlpha;
    ctx.font        = 'bold 58px monospace';
    ctx.textAlign   = 'center';
    ctx.strokeStyle = '#7a3000';
    ctx.lineWidth   = 8;
    ctx.lineJoin    = 'round';
    ctx.strokeText('DONUT OVERDOSE!', canvasW / 2, canvasH / 2);
    ctx.fillStyle   = '#ffdd00';
    ctx.shadowBlur  = 24;
    ctx.shadowColor = '#ff6600';
    ctx.fillText('DONUT OVERDOSE!', canvasW / 2, canvasH / 2);
    ctx.restore();
  }
}
