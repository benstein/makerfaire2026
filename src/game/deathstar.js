// src/game/deathstar.js — DEATH STAR final boss

const RADIUS     = 78;
const HP_MAX     = 300;
const SPEED      = 0.55;
const CHARGE_MS  = 2200;   // warning glow before firing
const BEAM_MS    = 600;    // beam is active & deadly
const COOLDOWN   = 9000;   // ms between superlaser shots
const BEAM_W     = 28;     // half-width of the beam hitbox
const APPEAR_AT  = 20000;  // ms into the game before Death Star enters

let ds = null;  // the death star object

export function resetDeathStar() {
  ds = null;
}

export function updateDeathStar(dt, now, playerPos, arenaWidth, arenaHeight) {
  // Spawn after APPEAR_AT ms
  if (!ds) {
    if (now < APPEAR_AT) return;
    ds = {
      x: arenaWidth / 2,
      y: -RADIUS * 2,  // enter from top
      hp: HP_MAX,
      hitFlash: 0,
      // Superlaser state
      lastFired: now + COOLDOWN * 0.6,  // first shot after ~60% cooldown
      charging: false,
      chargeStart: 0,
      beamActive: false,
      beamStart: 0,
      beamAngle: 0,
      dead: false,
    };
    return;
  }

  if (ds.dead) return;

  const scale = dt / 16.67;

  // Move toward player (slowly, stop at comfortable distance)
  const dx = playerPos.x - ds.x;
  const dy = playerPos.y - ds.y;
  const dist = Math.hypot(dx, dy);
  const targetDist = 200;
  if (dist > targetDist) {
    ds.x += (dx / dist) * SPEED * scale;
    ds.y += (dy / dist) * SPEED * scale;
  }

  // Clamp to arena
  ds.x = Math.max(RADIUS, Math.min(arenaWidth - RADIUS, ds.x));
  ds.y = Math.max(RADIUS, Math.min(arenaHeight - RADIUS, ds.y));

  // Superlaser state machine
  if (!ds.charging && !ds.beamActive && now - ds.lastFired > COOLDOWN) {
    ds.charging   = true;
    ds.chargeStart = now;
    ds.beamAngle  = Math.atan2(playerPos.y - ds.y, playerPos.x - ds.x);
  }
  if (ds.charging && now - ds.chargeStart > CHARGE_MS) {
    ds.charging   = false;
    ds.beamActive = true;
    ds.beamStart  = now;
    ds.lastFired  = now;
  }
  if (ds.beamActive && now - ds.beamStart > BEAM_MS) {
    ds.beamActive = false;
  }
}

// Returns true if the player is inside the active beam
export function isInBeam(playerBounds) {
  if (!ds || !ds.beamActive) return false;
  // Project player center onto beam axis and check perpendicular distance
  const px = playerBounds.x + playerBounds.w / 2 - ds.x;
  const py = playerBounds.y + playerBounds.h / 2 - ds.y;
  const bx = Math.cos(ds.beamAngle);
  const by = Math.sin(ds.beamAngle);
  const along = px * bx + py * by;
  if (along < 0) return false;  // behind the dish
  const perp  = Math.abs(px * by - py * bx);
  return perp < BEAM_W + playerBounds.w / 2;
}

export function damageDeathStar(now) {
  if (!ds || ds.dead) return false;
  ds.hp--;
  ds.hitFlash = now;
  if (ds.hp <= 0) { ds.dead = true; return true; }
  return false;
}

export function isDeathStarAlive() { return ds !== null && !ds.dead; }

export function getDeathStarBounds() {
  if (!ds) return null;
  return { x: ds.x - RADIUS, y: ds.y - RADIUS, w: RADIUS * 2, h: RADIUS * 2 };
}

export function drawDeathStar(ctx, now) {
  if (!ds) return;
  const t = now / 1000;

  // Death / explosion fade out
  if (ds.dead) {
    const age = now - ds.hitFlash;
    if (age > 1200) return;
    const prog = age / 1200;
    ctx.save();
    ctx.globalAlpha = 1 - prog;
    ctx.translate(ds.x, ds.y);
    // Expanding ring
    ctx.strokeStyle = `hsl(${50 + prog * 60}, 100%, 70%)`;
    ctx.lineWidth = 12 * (1 - prog);
    ctx.beginPath();
    ctx.arc(0, 0, RADIUS + prog * 120, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return;
  }

  const flashAge = now - ds.hitFlash;
  const flash = flashAge < 140 ? (1 - flashAge / 140) : 0;

  ctx.save();
  ctx.translate(ds.x, ds.y);

  // Superlaser beam (drawn behind the sphere)
  if (ds.beamActive) {
    const bAge   = now - ds.beamStart;
    const bProg  = bAge / BEAM_MS;
    const bAlpha = bProg < 0.3 ? bProg / 0.3 : 1 - (bProg - 0.3) / 0.7;
    const beamLen = 2000;

    ctx.save();
    ctx.rotate(ds.beamAngle);

    // Outer glow
    const beamGrad = ctx.createLinearGradient(RADIUS, 0, RADIUS + beamLen, 0);
    beamGrad.addColorStop(0,   `rgba(180, 255, 80, ${bAlpha * 0.9})`);
    beamGrad.addColorStop(0.5, `rgba(100, 255, 40, ${bAlpha * 0.6})`);
    beamGrad.addColorStop(1,   `rgba(60,  220, 20, 0)`);
    ctx.fillStyle = beamGrad;
    ctx.fillRect(RADIUS, -BEAM_W * 2.5, beamLen, BEAM_W * 5);

    // Bright core
    const coreGrad = ctx.createLinearGradient(RADIUS, 0, RADIUS + beamLen * 0.7, 0);
    coreGrad.addColorStop(0,   `rgba(255, 255, 200, ${bAlpha})`);
    coreGrad.addColorStop(1,   `rgba(180, 255, 80, 0)`);
    ctx.fillStyle = coreGrad;
    ctx.fillRect(RADIUS, -BEAM_W * 0.7, beamLen * 0.7, BEAM_W * 1.4);

    ctx.restore();
  }

  // Charging glow on the dish
  if (ds.charging) {
    const cProg   = (now - ds.chargeStart) / CHARGE_MS;
    const pulse   = 0.5 + 0.5 * Math.sin(t * 18);
    const cAlpha  = cProg * (0.6 + pulse * 0.4);
    const dishOffX = -RADIUS * 0.38, dishOffY = -RADIUS * 0.35;
    const glowGrad = ctx.createRadialGradient(dishOffX, dishOffY, 0, dishOffX, dishOffY, RADIUS * 0.9 * cProg);
    glowGrad.addColorStop(0,   `rgba(180, 255, 60, ${cAlpha})`);
    glowGrad.addColorStop(1,   `rgba(80,  200, 20, 0)`);
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(dishOffX, dishOffY, RADIUS * 0.9, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main sphere — gray gradient
  const sphereGrad = ctx.createRadialGradient(-RADIUS * 0.3, -RADIUS * 0.3, 0, 0, 0, RADIUS);
  sphereGrad.addColorStop(0,   '#c8ccd0');
  sphereGrad.addColorStop(0.55, '#7a8090');
  sphereGrad.addColorStop(1,   '#2a2e38');
  ctx.fillStyle = sphereGrad;
  ctx.shadowBlur  = 20;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.beginPath();
  ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Hit flash
  if (flash > 0) {
    ctx.fillStyle = `rgba(255, 80, 0, ${flash * 0.55})`;
    ctx.beginPath();
    ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }

  // Clip surface details to sphere
  ctx.beginPath();
  ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
  ctx.save();
  ctx.clip();

  // Equatorial trench
  ctx.strokeStyle = 'rgba(20, 24, 32, 0.7)';
  ctx.lineWidth   = 5;
  ctx.beginPath();
  ctx.moveTo(-RADIUS, 0);
  ctx.lineTo( RADIUS, 0);
  ctx.stroke();

  // Latitude panel lines
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = 'rgba(20,24,32,0.35)';
  for (const yOff of [-RADIUS * 0.55, -RADIUS * 0.22, RADIUS * 0.22, RADIUS * 0.55]) {
    const hw = Math.sqrt(Math.max(0, RADIUS * RADIUS - yOff * yOff));
    ctx.beginPath();
    ctx.moveTo(-hw, yOff);
    ctx.lineTo( hw, yOff);
    ctx.stroke();
  }

  // Vertical longitude lines
  ctx.strokeStyle = 'rgba(20,24,32,0.22)';
  for (const xOff of [-RADIUS * 0.6, -RADIUS * 0.3, RADIUS * 0.3, RADIUS * 0.6]) {
    ctx.beginPath();
    ctx.moveTo(xOff, -Math.sqrt(Math.max(0, RADIUS * RADIUS - xOff * xOff)));
    ctx.lineTo(xOff,  Math.sqrt(Math.max(0, RADIUS * RADIUS - xOff * xOff)));
    ctx.stroke();
  }

  // Superlaser dish (upper-left quadrant)
  const dishX = -RADIUS * 0.38, dishY = -RADIUS * 0.35, dishR = RADIUS * 0.38;
  const dishGrad = ctx.createRadialGradient(dishX, dishY, 0, dishX, dishY, dishR);
  dishGrad.addColorStop(0,   '#1a1e28');
  dishGrad.addColorStop(0.6, '#3a4050');
  dishGrad.addColorStop(1,   '#7a8090');
  ctx.fillStyle = dishGrad;
  ctx.beginPath();
  ctx.arc(dishX, dishY, dishR, 0, Math.PI * 2);
  ctx.fill();
  // Dish ring
  ctx.strokeStyle = '#5a6070';
  ctx.lineWidth   = 2.5;
  ctx.beginPath();
  ctx.arc(dishX, dishY, dishR, 0, Math.PI * 2);
  ctx.stroke();
  // Dish inner rings
  for (const fr of [0.65, 0.38]) {
    ctx.strokeStyle = 'rgba(100,110,130,0.6)';
    ctx.lineWidth   = 1.2;
    ctx.beginPath();
    ctx.arc(dishX, dishY, dishR * fr, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Center focus point
  ctx.fillStyle = ds.charging
    ? `hsl(${100 + Math.sin(t * 22) * 40}, 100%, 70%)`
    : '#3a8040';
  ctx.beginPath();
  ctx.arc(dishX, dishY, dishR * 0.12, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore(); // unclip

  // Sphere outline
  ctx.strokeStyle = 'rgba(20,24,32,0.6)';
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.arc(0, 0, RADIUS, 0, Math.PI * 2);
  ctx.stroke();

  // HP bar above the Death Star
  const barW = RADIUS * 2.2;
  const barH = 10;
  const barX = -barW / 2;
  const barY = -RADIUS - 22;
  const frac = ds.hp / HP_MAX;
  // Background
  ctx.fillStyle = '#1a1e28';
  ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 3); ctx.fill();
  // Health
  const hpColor = frac > 0.5 ? `hsl(${frac * 120}, 100%, 45%)` : `hsl(${frac * 120}, 100%, 45%)`;
  ctx.fillStyle = hpColor;
  ctx.beginPath(); ctx.roundRect(barX, barY, barW * frac, barH, 3); ctx.fill();
  // Label
  ctx.fillStyle = '#aabbcc';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('DEATH STAR', 0, barY - 4);
  ctx.textAlign = 'left';

  ctx.restore();
}
