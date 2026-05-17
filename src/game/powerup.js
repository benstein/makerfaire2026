// src/game/powerup.js
// Two-tier Mario power-up.
//   Collect once  → Mario skin (tier 1)
//   Collect again → Star Power: wavy star beams radiate in 8 directions (tier 2)

const SPAWN_INTERVAL = 12000; // ms between power-up spawns
const BEAM_INTERVAL  =   400; // ms between star beam volleys
const BEAM_SPEED     =     5;
const BEAM_AMP       =    24; // sine-wave amplitude (px)
const BEAM_FREQ      =  0.15; // sine-wave frequency (rad per px travelled)
const ITEM_R         =    18; // power-up item radius

let tier          = 0;   // 0 = none, 1 = Mario, 2 = star power
let item          = null;// { x, y } — current pickup on the ground
let nextSpawn     = 0;
let lastBeamTime  = 0;
let starBeams     = [];  // { x, y, vx, vy, perpX, perpY, dist, hue }

export function resetPowerup(now, arenaWidth, arenaHeight) {
  tier         = 0;
  item         = null;
  starBeams    = [];
  lastBeamTime = 0;
  nextSpawn    = now + SPAWN_INTERVAL;
  _arenaW      = arenaWidth;
  _arenaH      = arenaHeight;
}

// Cache arena size for spawning
let _arenaW = 800, _arenaH = 600;

export function getMarioTier() { return tier; }
export function getStarBeams() { return starBeams; }
export function removeStarBeam(i) { starBeams.splice(i, 1); }

export function updatePowerup(playerBounds, now) {
  // Spawn item if not present and below tier 2
  if (!item && tier < 2 && now >= nextSpawn) {
    item = {
      x: 80 + Math.random() * (_arenaW - 160),
      y: 80 + Math.random() * (_arenaH - 160),
    };
  }

  // Collect item
  if (item) {
    const pb = playerBounds;
    const pcx = pb.x + pb.w / 2, pcy = pb.y + pb.h / 2;
    if (Math.hypot(pcx - item.x, pcy - item.y) < ITEM_R + pb.w / 2) {
      tier++;
      item = null;
      nextSpawn = now + SPAWN_INTERVAL;
    }
  }

  // Star power — fire 8 beams every BEAM_INTERVAL
  if (tier >= 2 && now - lastBeamTime > BEAM_INTERVAL) {
    lastBeamTime = now;
    const pcx = playerBounds.x + playerBounds.w / 2;
    const pcy = playerBounds.y + playerBounds.h / 2;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const vx = Math.cos(angle) * BEAM_SPEED;
      const vy = Math.sin(angle) * BEAM_SPEED;
      // Perpendicular direction for wave
      const perpX = -Math.sin(angle);
      const perpY =  Math.cos(angle);
      starBeams.push({
        x: pcx, y: pcy,
        vx, vy, perpX, perpY,
        dist: 0,
        hue: (i / 8) * 360,
        w: 18, h: 18,  // for AABB
      });
    }
  }

  // Move star beams
  const scale = 1; // beams are moved per-frame from main.js
  for (let i = starBeams.length - 1; i >= 0; i--) {
    const b = starBeams[i];
    const wave = BEAM_AMP * Math.sin(BEAM_FREQ * b.dist);
    b.x += b.vx + b.perpX * wave * 0.1;
    b.y += b.vy + b.perpY * wave * 0.1;
    b.dist += BEAM_SPEED;
    if (b.x < -60 || b.x > _arenaW + 60 || b.y < -60 || b.y > _arenaH + 60) {
      starBeams.splice(i, 1);
    }
  }
}

// ─── Drawing ──────────────────────────────────────────────────────────────────

export function drawPowerup(ctx, now) {
  // Draw star beams
  const t = now / 1000;
  for (const b of starBeams) {
    drawStarShape(ctx, b.x, b.y, 9, b.hue, t);
  }

  // Draw pickup item
  if (!item) return;
  const bob = Math.sin(now / 380) * 4;
  if (tier === 0) {
    drawMushroom(ctx, item.x, item.y + bob, ITEM_R, t);
  } else {
    drawStar(ctx, item.x, item.y + bob, ITEM_R, t);
  }
}

function drawStarShape(ctx, cx, cy, r, hue, t) {
  ctx.save();
  ctx.shadowBlur  = 14;
  ctx.shadowColor = `hsl(${hue}, 100%, 65%)`;
  ctx.fillStyle   = `hsl(${hue}, 100%, 68%)`;
  ctx.translate(cx, cy);
  ctx.rotate(t * 4 + hue * 0.02);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a  = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const pr = i % 2 === 0 ? r : r * 0.42;
    i === 0 ? ctx.moveTo(Math.cos(a) * pr, Math.sin(a) * pr)
            : ctx.lineTo(Math.cos(a) * pr, Math.sin(a) * pr);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function drawStar(ctx, cx, cy, r, t) {
  ctx.save();
  ctx.shadowBlur = 18; ctx.shadowColor = '#ffe040';
  ctx.translate(cx, cy); ctx.rotate(t * 3);
  ctx.fillStyle = '#ffe040';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a  = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const pr = i % 2 === 0 ? r : r * 0.42;
    i === 0 ? ctx.moveTo(Math.cos(a) * pr, Math.sin(a) * pr)
            : ctx.lineTo(Math.cos(a) * pr, Math.sin(a) * pr);
  }
  ctx.closePath(); ctx.fill();
  // Shine dot
  ctx.fillStyle = '#fff'; ctx.shadowBlur = 0;
  ctx.beginPath(); ctx.arc(-r * 0.22, -r * 0.28, r * 0.18, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawMushroom(ctx, cx, cy, r, t) {
  ctx.save();
  ctx.translate(cx, cy);
  // Stem
  ctx.fillStyle = '#ffe0c0';
  ctx.fillRect(-r * 0.5, 0, r, r * 0.7);
  // Eyes on stem
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(-r * 0.2, r * 0.3, r * 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( r * 0.2, r * 0.3, r * 0.1, 0, Math.PI * 2); ctx.fill();
  // Cap (red)
  ctx.fillStyle = '#e31010';
  ctx.shadowBlur = 10; ctx.shadowColor = '#ff4444';
  ctx.beginPath(); ctx.arc(0, -r * 0.1, r, Math.PI, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -r * 0.1, r, 0, Math.PI); ctx.fill();
  // White dots
  ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff';
  for (const [dx, dy] of [[-r*0.35, -r*0.3], [r*0.35, -r*0.3], [0, -r*0.55], [-r*0.55, -r*0.05], [r*0.55, -r*0.05]]) {
    ctx.beginPath(); ctx.arc(dx, dy, r * 0.14, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
