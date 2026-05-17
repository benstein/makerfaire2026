// src/game/panda.js
// Tao's pet panda — follows the player, slowly chomps nearby enemies.

const FOLLOW_DIST   = 70;   // target distance from player
const PANDA_SPEED   = 2.8;  // a bit slower than the player
const CHOMP_RANGE   = 48;   // how close an enemy must be before the panda attacks
const CHOMP_COOLDOWN = 2800; // ms between chomps — not very powerful!
const PANDA_SIZE    = 32;   // radius

let px = 100, py = 100;
let lastChompTime = -9999;
let chompAnim = 0; // mouth open timer

export function resetPanda(arenaWidth, arenaHeight) {
  px = arenaWidth  / 2 + 80;
  py = arenaHeight / 2 + 80;
  lastChompTime = -9999;
  chompAnim = 0;
}

export function getPandaBounds() {
  return { x: px - PANDA_SIZE * 0.7, y: py - PANDA_SIZE * 0.7, w: PANDA_SIZE * 1.4, h: PANDA_SIZE * 1.4 };
}

// Returns index of enemy killed, or -1
export function updatePanda(dt, playerPos, enemies, now) {
  const scale = dt / 16.67;

  // --- Follow player, staying FOLLOW_DIST behind ---
  const dx = playerPos.x - px;
  const dy = playerPos.y - py;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > FOLLOW_DIST) {
    const move = Math.min(PANDA_SPEED * scale, dist - FOLLOW_DIST);
    px += (dx / dist) * move;
    py += (dy / dist) * move;
  }

  // Decay chomp animation
  if (chompAnim > 0) chompAnim = Math.max(0, chompAnim - dt);

  // --- Find nearest enemy within chomp range ---
  if (now - lastChompTime < CHOMP_COOLDOWN) return -1;

  let nearest = -1, nearDist = CHOMP_RANGE;
  for (let i = 0; i < enemies.length; i++) {
    const ex = enemies[i].x + enemies[i].w / 2;
    const ey = enemies[i].y + enemies[i].h / 2;
    const d  = Math.sqrt((ex - px) ** 2 + (ey - py) ** 2);
    if (d < nearDist) { nearDist = d; nearest = i; }
  }

  if (nearest !== -1) {
    lastChompTime = now;
    chompAnim = 300; // open mouth for 300ms
    return nearest;
  }
  return -1;
}

export function drawPanda(ctx, now) {
  const r = PANDA_SIZE;
  const cx = Math.round(px);
  const cy = Math.round(py);
  const chomping = chompAnim > 0;
  const bob = Math.sin(now / 350) * 2.5; // gentle idle bounce

  ctx.save();
  ctx.translate(cx, cy + bob);

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.9, r * 0.7, r * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body — big white circle
  ctx.fillStyle = '#f5f5f5';
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, r * 0.18, r * 0.85, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Black ears
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-r * 0.52, -r * 0.55, r * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( r * 0.52, -r * 0.55, r * 0.28, 0, Math.PI * 2); ctx.fill();
  // Inner ear
  ctx.fillStyle = '#444';
  ctx.beginPath(); ctx.arc(-r * 0.52, -r * 0.55, r * 0.14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( r * 0.52, -r * 0.55, r * 0.14, 0, Math.PI * 2); ctx.fill();

  // Head — white
  ctx.fillStyle = '#f5f5f5';
  ctx.strokeStyle = '#ccc';
  ctx.beginPath();
  ctx.arc(0, -r * 0.35, r * 0.55, 0, Math.PI * 2);
  ctx.fill(); ctx.stroke();

  // Black eye patches
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.ellipse(-r * 0.22, -r * 0.42, r * 0.18, r * 0.14, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( r * 0.22, -r * 0.42, r * 0.18, r * 0.14,  0.3, 0, Math.PI * 2); ctx.fill();
  // Eyes — white shine dot
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-r * 0.22, -r * 0.44, r * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( r * 0.22, -r * 0.44, r * 0.07, 0, Math.PI * 2); ctx.fill();
  // Pupils
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(-r * 0.20, -r * 0.43, r * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( r * 0.24, -r * 0.43, r * 0.05, 0, Math.PI * 2); ctx.fill();

  // Nose
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.ellipse(0, -r * 0.25, r * 0.08, r * 0.05, 0, 0, Math.PI * 2); ctx.fill();

  // Mouth — open wide when chomping, small smile otherwise
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  if (chomping) {
    ctx.fillStyle = '#cc3333';
    ctx.beginPath();
    ctx.arc(0, -r * 0.14, r * 0.18, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-r * 0.08, -r * 0.10, r * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( r * 0.08, -r * 0.10, r * 0.06, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(0, -r * 0.18, r * 0.1, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  // Black legs (peeking below body)
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.ellipse(-r * 0.38, r * 0.88, r * 0.22, r * 0.18, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( r * 0.38, r * 0.88, r * 0.22, r * 0.18,  0.2, 0, Math.PI * 2); ctx.fill();

  // Black arms
  ctx.beginPath(); ctx.ellipse(-r * 0.72, r * 0.28, r * 0.18, r * 0.28, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( r * 0.72, r * 0.28, r * 0.18, r * 0.28,  0.5, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}
