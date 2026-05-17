// src/game/tower.js — helper tower floating in the lava, shoots missiles at enemies

import { LAVA_HEIGHT } from './lava.js';

const FLOAT_SPEED      = 0.48;  // radians/sec oscillation
const FLOAT_AMPLITUDE  = 0.30;  // fraction of arena width
const FIRE_INTERVAL    = 2200;  // ms between shots
const MISSILE_SPEED    = 6.5;   // px per 60fps frame
const TRAIL_LEN        = 10;

// Tower body dimensions (relative to lava surface)
const BASE_W  = 54;
const BASE_H  = 14;
const BODY_W  = 36;
const BODY_H  = 42;
const BARREL_LEN = 22;
const BARREL_W   = 8;

let towerX    = 0;
let aimAngle  = -Math.PI / 2;  // radians, -π/2 = straight up
let missiles  = [];
let lastFireTime = 0;

export function resetTower(arenaWidth, now) {
  towerX = arenaWidth / 2;
  aimAngle = -Math.PI / 2;
  missiles = [];
  lastFireTime = now - FIRE_INTERVAL + 1800; // first shot after 1.8s
}

export function updateTower(dt, now, arenaWidth, arenaHeight, enemies) {
  const t = now / 1000;
  towerX = arenaWidth / 2 + Math.sin(t * FLOAT_SPEED) * arenaWidth * FLOAT_AMPLITUDE;

  const lavaTop  = arenaHeight - LAVA_HEIGHT;
  const barrelTipX = towerX;
  const barrelTipY = lavaTop - BASE_H - BODY_H - BARREL_LEN;

  // Rotate aim toward nearest enemy (smooth)
  let nearest = null, nearestDist = Infinity;
  for (const e of enemies) {
    const ex = e.x + e.w / 2, ey = e.y + e.h / 2;
    const d  = Math.hypot(ex - barrelTipX, ey - barrelTipY);
    if (d < nearestDist) { nearestDist = d; nearest = e; }
  }

  if (nearest) {
    const targetAngle = Math.atan2(
      (nearest.y + nearest.h / 2) - barrelTipY,
      (nearest.x + nearest.w / 2) - barrelTipX
    );
    // Smooth rotation toward target
    let diff = targetAngle - aimAngle;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    aimAngle += diff * Math.min(1, dt * 0.004);

    // Fire
    if (now - lastFireTime > FIRE_INTERVAL) {
      const vx = Math.cos(aimAngle) * MISSILE_SPEED;
      const vy = Math.sin(aimAngle) * MISSILE_SPEED;
      missiles.push({
        x: barrelTipX - 4, y: barrelTipY - 4,
        w: 8, h: 8,
        vx, vy,
        angle: aimAngle,
        born: now,
        trail: [],
      });
      lastFireTime = now;
    }
  }

  // Move missiles
  const scale = dt / 16.67;
  for (let i = missiles.length - 1; i >= 0; i--) {
    const m = missiles[i];
    m.trail.unshift({ x: m.x + m.w / 2, y: m.y + m.h / 2 });
    if (m.trail.length > TRAIL_LEN) m.trail.pop();
    m.x += m.vx * scale;
    m.y += m.vy * scale;
    if (m.x < -80 || m.x > arenaWidth + 80 ||
        m.y < -80 || m.y > arenaHeight + 80 ||
        now - m.born > 5000) {
      missiles.splice(i, 1);
    }
  }
}

export function getMissiles() { return missiles; }
export function removeMissile(i) { missiles.splice(i, 1); }

export function drawTower(ctx, now, arenaWidth, arenaHeight) {
  const t = now / 1000;
  const lavaTop = arenaHeight - LAVA_HEIGHT;

  // === Missile trails (world-space, drawn before missile bodies) ===
  for (const m of missiles) {
    for (let i = 0; i < m.trail.length; i++) {
      const tp = m.trail[i];
      const alpha = (1 - i / m.trail.length) * 0.55;
      const r = Math.max(0.5, 5 * (1 - i / m.trail.length));
      ctx.fillStyle = `rgba(255, 160, 30, ${alpha})`;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // === Tower body ===
  ctx.save();
  ctx.translate(towerX, lavaTop);

  // Hover jets (glow into lava below platform)
  for (const side of [-1, 1]) {
    const jx = side * BASE_W * 0.38;
    const jlen = 16 + Math.sin(t * 20 + side) * 5;
    const jg = ctx.createLinearGradient(jx, 0, jx, jlen);
    jg.addColorStop(0, 'rgba(255,200,60,0.85)');
    jg.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = jg;
    ctx.beginPath();
    ctx.ellipse(jx, jlen / 2, 7, jlen / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Platform base
  ctx.shadowBlur = 14;
  ctx.shadowColor = 'rgba(255,120,0,0.6)';
  const platG = ctx.createLinearGradient(0, -BASE_H, 0, 0);
  platG.addColorStop(0, '#6a5a4a');
  platG.addColorStop(1, '#3a2a18');
  ctx.fillStyle = platG;
  ctx.beginPath();
  ctx.roundRect(-BASE_W / 2, -BASE_H, BASE_W, BASE_H, 4);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Stripe
  ctx.fillStyle = '#8a7a6a';
  ctx.fillRect(-BASE_W / 2 + 6, -BASE_H + 4, BASE_W - 12, 3);

  // Tower body
  const bodyTop = -BASE_H - BODY_H;
  const bodyG = ctx.createLinearGradient(-BODY_W / 2, bodyTop, BODY_W / 2, -BASE_H);
  bodyG.addColorStop(0, '#5aa0c0');
  bodyG.addColorStop(0.5, '#2a7090');
  bodyG.addColorStop(1, '#1a5070');
  ctx.fillStyle = bodyG;
  ctx.beginPath();
  ctx.roundRect(-BODY_W / 2, bodyTop, BODY_W, BODY_H, [6, 6, 2, 2]);
  ctx.fill();
  // Body highlight
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.fillRect(-BODY_W / 2 + 4, bodyTop + 5, BODY_W * 0.32, BODY_H - 10);

  // Porthole window
  const winY = bodyTop + BODY_H * 0.38;
  ctx.fillStyle = '#99eeff';
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#44ccff';
  ctx.beginPath();
  ctx.arc(0, winY, BODY_W * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  // Shine
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.beginPath();
  ctx.arc(-BODY_W * 0.07, winY - BODY_W * 0.07, BODY_W * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // Turret cap + rotating barrel
  const turretY = bodyTop;
  ctx.save();
  ctx.translate(0, turretY);
  ctx.rotate(aimAngle + Math.PI / 2); // +90° so 0=up aligns with canvas up

  // Turret dome
  ctx.fillStyle = '#2a5070';
  ctx.beginPath();
  ctx.arc(0, 0, BODY_W * 0.40, 0, Math.PI * 2);
  ctx.fill();

  // Barrel
  ctx.fillStyle = '#1a3050';
  ctx.strokeStyle = '#0a2040';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(-BARREL_W / 2, -BARREL_LEN, BARREL_W, BARREL_LEN, 2);
  ctx.fill();
  ctx.stroke();
  // Muzzle ring (gold)
  ctx.fillStyle = '#ffd700';
  ctx.shadowBlur = 6;
  ctx.shadowColor = '#ffaa00';
  ctx.beginPath();
  ctx.ellipse(0, -BARREL_LEN, BARREL_W / 2 + 2, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore(); // turret rotation

  // HELPER label
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#88eeff';
  ctx.fillText('HELPER', 0, bodyTop + BODY_H * 0.82);

  ctx.restore(); // tower translate

  // === Missile bodies ===
  for (const m of missiles) {
    drawMissile(ctx, m, now);
  }
}

function drawMissile(ctx, m, now) {
  const cx = m.x + m.w / 2;
  const cy = m.y + m.h / 2;
  const age = now - m.born;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(m.angle + Math.PI / 2); // nose forward

  // Body
  ctx.fillStyle = '#c8c8d0';
  ctx.beginPath();
  ctx.roundRect(-3, -11, 6, 16, 2);
  ctx.fill();

  // Nose cone (red)
  ctx.fillStyle = '#ff3300';
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.lineTo(-3, -11);
  ctx.lineTo(3, -11);
  ctx.closePath();
  ctx.fill();

  // Fins
  ctx.fillStyle = '#7090b0';
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(s * 3, 4);
    ctx.lineTo(s * 8, 9);
    ctx.lineTo(s * 3, 6);
    ctx.closePath();
    ctx.fill();
  }

  // Engine glow (flicker)
  const gFlicker = 0.7 + Math.sin(age * 0.05) * 0.3;
  ctx.fillStyle = `rgba(255,200,50,${gFlicker})`;
  ctx.shadowBlur = 8;
  ctx.shadowColor = '#ff8800';
  ctx.beginPath();
  ctx.ellipse(0, 7, 3, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}
