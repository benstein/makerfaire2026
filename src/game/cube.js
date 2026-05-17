// src/game/cube.js
// The big cube. 1000 HP. Slow and relentless.

const FACE   = 90;   // front face side length in px
const DEPTH  = 34;   // 3-D depth offset
const HP_MAX = 1000;
const SPEED  = 0.65;

let cube = null;

export function resetCube(arenaWidth, arenaHeight) {
  cube = {
    x: arenaWidth / 2 - FACE / 2,
    y: -FACE - DEPTH,               // enter from top edge
    w: FACE,
    h: FACE,
    hp: HP_MAX,
  };
}

export function getCube()     { return cube; }
export function isCubeAlive() { return cube !== null && cube.hp > 0; }

// Returns true when the cube dies.
export function damageCube() {
  if (!cube || cube.hp <= 0) return false;
  cube.hp = Math.max(0, cube.hp - 1);
  return cube.hp <= 0;
}

export function updateCube(dt, playerPos) {
  if (!cube || cube.hp <= 0) return;
  const dx   = playerPos.x - (cube.x + cube.w / 2);
  const dy   = playerPos.y - (cube.y + cube.h / 2);
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 0) {
    const scale = dt / 16.67;
    cube.x += (dx / dist) * SPEED * scale;
    cube.y += (dy / dist) * SPEED * scale;
  }
}

export function drawCube(ctx, now) {
  if (!cube || cube.hp <= 0) return;

  const t  = now / 1000;
  const cx = cube.x + FACE / 2;
  const cy = cube.y + FACE / 2;
  const f  = FACE;
  const d  = DEPTH;

  // Isometric offsets: top-right corner is the "back"
  const ox = d * 0.75;
  const oy = -d * 0.75;

  // ── TOP FACE ──────────────────────────────────────────────
  ctx.fillStyle = '#3a5c78';
  ctx.beginPath();
  ctx.moveTo(cx - f/2,      cy - f/2);
  ctx.lineTo(cx - f/2 + ox, cy - f/2 + oy);
  ctx.lineTo(cx + f/2 + ox, cy - f/2 + oy);
  ctx.lineTo(cx + f/2,      cy - f/2);
  ctx.closePath();
  ctx.fill();

  // Top face grid
  ctx.strokeStyle = 'rgba(120,210,255,0.25)';
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 3; i++) {
    const t2 = i / 3;
    // horizontal lines across top face
    ctx.beginPath();
    ctx.moveTo(cx - f/2 + ox * t2,       cy - f/2 + oy * t2);
    ctx.lineTo(cx - f/2 + ox * t2 + f,   cy - f/2 + oy * t2);
    ctx.stroke();
    // depth lines across top face
    ctx.beginPath();
    ctx.moveTo(cx - f/2 + (f / 3) * i,       cy - f/2);
    ctx.lineTo(cx - f/2 + (f / 3) * i + ox,  cy - f/2 + oy);
    ctx.stroke();
  }

  // ── RIGHT FACE ────────────────────────────────────────────
  ctx.fillStyle = '#182a38';
  ctx.beginPath();
  ctx.moveTo(cx + f/2,      cy - f/2);
  ctx.lineTo(cx + f/2 + ox, cy - f/2 + oy);
  ctx.lineTo(cx + f/2 + ox, cy + f/2 + oy);
  ctx.lineTo(cx + f/2,      cy + f/2);
  ctx.closePath();
  ctx.fill();

  // Right face grid
  ctx.strokeStyle = 'rgba(80,160,220,0.2)';
  ctx.lineWidth = 0.8;
  for (let i = 1; i < 3; i++) {
    const t2 = i / 3;
    ctx.beginPath();
    ctx.moveTo(cx + f/2,       cy - f/2 + f * t2);
    ctx.lineTo(cx + f/2 + ox,  cy - f/2 + f * t2 + oy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + f/2 + ox * t2,  cy - f/2 + oy * t2);
    ctx.lineTo(cx + f/2 + ox * t2,  cy + f/2 + oy * t2);
    ctx.stroke();
  }

  // ── FRONT FACE ────────────────────────────────────────────
  const pulseBright = Math.sin(t * 2.5) * 8;
  const frontGrad = ctx.createLinearGradient(cx - f/2, cy - f/2, cx + f/2, cy + f/2);
  frontGrad.addColorStop(0, `hsl(210, 55%, ${30 + pulseBright}%)`);
  frontGrad.addColorStop(1, `hsl(210, 50%, ${18 + pulseBright}%)`);
  ctx.fillStyle = frontGrad;
  ctx.fillRect(cx - f/2, cy - f/2, f, f);

  // Front face grid lines
  ctx.strokeStyle = `rgba(100,190,255,0.22)`;
  ctx.lineWidth = 1;
  for (let i = 1; i < 3; i++) {
    const g = (f / 3) * i;
    ctx.beginPath(); ctx.moveTo(cx - f/2 + g, cy - f/2); ctx.lineTo(cx - f/2 + g, cy + f/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - f/2, cy - f/2 + g); ctx.lineTo(cx + f/2, cy - f/2 + g); ctx.stroke();
  }

  // Glowing front-face border
  const glowAlpha = 0.6 + Math.sin(t * 3) * 0.2;
  ctx.shadowBlur  = 14;
  ctx.shadowColor = `rgba(80,180,255,${glowAlpha})`;
  ctx.strokeStyle = `rgba(100,200,255,${glowAlpha})`;
  ctx.lineWidth   = 2.2;
  ctx.strokeRect(cx - f/2, cy - f/2, f, f);
  ctx.shadowBlur  = 0;

  // Glowing edge lines (top + right face outlines)
  ctx.strokeStyle = `rgba(120,210,255,${glowAlpha * 0.7})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - f/2, cy - f/2); ctx.lineTo(cx - f/2 + ox, cy - f/2 + oy);
  ctx.lineTo(cx + f/2 + ox, cy - f/2 + oy); ctx.lineTo(cx + f/2, cy - f/2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + f/2 + ox, cy - f/2 + oy); ctx.lineTo(cx + f/2 + ox, cy + f/2 + oy);
  ctx.stroke();

  // "CUBE" label on front face
  ctx.fillStyle = `rgba(160,220,255,${0.45 + Math.sin(t * 2) * 0.2})`;
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('QUESO', cx, cy + 6);
  ctx.textAlign = 'left';

  // ── HP BAR ────────────────────────────────────────────────
  const barW  = f + ox;
  const barX  = cx - f / 2;
  const barY  = cy - f / 2 + oy - 20;
  const frac  = cube.hp / HP_MAX;
  const barColor = frac > 0.6 ? '#00dd55' : frac > 0.3 ? '#ffaa00' : '#ff2200';

  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.roundRect(barX - 2, barY - 2, barW + 4, 14, 4); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.roundRect(barX, barY, barW, 10, 3); ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = barColor;
    ctx.beginPath(); ctx.roundRect(barX, barY, barW * frac, 10, 3); ctx.fill();
  }

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${cube.hp} / ${HP_MAX}`, cx + ox / 2, barY - 4);
  ctx.textAlign = 'left';
}
