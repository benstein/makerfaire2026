// src/game/febreze.js — Febreze ad panel that slides in from the right side

const PANEL_W    = 270;
const PANEL_H    = 185;
const INTERVAL   = 18000;  // ms between appearances
const VISIBLE_MS = 3200;   // ms fully on screen
const SLIDE_MS   = 420;    // ms to slide in / out

let nextShowAt  = 0;
let showStart   = 0;  // 0 = not showing

export function resetFebreze(now) {
  showStart  = 0;
  nextShowAt = now + 8000; // first ad after 8s
}

export function updateFebreze(now) {
  if (showStart === 0 && now >= nextShowAt) {
    showStart  = now;
  }
  // Schedule next after this one finishes
  if (showStart > 0 && now - showStart > SLIDE_MS + VISIBLE_MS + SLIDE_MS) {
    showStart  = 0;
    nextShowAt = now + INTERVAL;
  }
}

export function drawFebreze(ctx, canvasW, canvasH, now) {
  if (showStart === 0) return;

  const age     = now - showStart;
  const totalMs = SLIDE_MS + VISIBLE_MS + SLIDE_MS;

  // x offset: slides from right edge in, pauses, then slides back
  let slideX;
  if (age < SLIDE_MS) {
    // sliding in
    slideX = PANEL_W * (1 - age / SLIDE_MS);
  } else if (age < SLIDE_MS + VISIBLE_MS) {
    // fully visible
    slideX = 0;
  } else {
    // sliding out
    const t = (age - SLIDE_MS - VISIBLE_MS) / SLIDE_MS;
    slideX = PANEL_W * t;
  }

  const px = canvasW - PANEL_W + slideX;
  const py = canvasH / 2 - PANEL_H / 2;

  ctx.save();
  ctx.translate(px, py);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.roundRect(4, 4, PANEL_W, PANEL_H, 12);
  ctx.fill();

  // Panel background (Febreze gradient — teal to sky blue)
  const bg = ctx.createLinearGradient(0, 0, PANEL_W, PANEL_H);
  bg.addColorStop(0,   '#00b4cc');
  bg.addColorStop(0.5, '#0099b8');
  bg.addColorStop(1,   '#006fa6');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(0, 0, PANEL_W, PANEL_H, 12);
  ctx.fill();

  // White wave decoration
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.moveTo(0, PANEL_H * 0.6);
  ctx.bezierCurveTo(PANEL_W * 0.25, PANEL_H * 0.45, PANEL_W * 0.75, PANEL_H * 0.75, PANEL_W, PANEL_H * 0.55);
  ctx.lineTo(PANEL_W, PANEL_H);
  ctx.lineTo(0, PANEL_H);
  ctx.closePath();
  ctx.fill();

  // Febreze logo text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px sans-serif';
  ctx.textAlign = 'left';
  ctx.shadowBlur = 8;
  ctx.shadowColor = 'rgba(0,50,100,0.4)';
  ctx.fillText('febreze', 18, 48);
  ctx.shadowBlur = 0;

  // Registered trademark
  ctx.font = '13px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('®', 148, 32);

  // Tagline
  ctx.fillStyle = '#fff';
  ctx.font = 'italic bold 14px sans-serif';
  ctx.fillText('breathe happy.™', 18, 72);

  // Product bottle (drawn with canvas shapes)
  // Bottle body
  const bx = PANEL_W - 88, by = 20;
  const bottleGrad = ctx.createLinearGradient(bx, by, bx + 54, by);
  bottleGrad.addColorStop(0,   '#a8e8f8');
  bottleGrad.addColorStop(0.4, '#ffffff');
  bottleGrad.addColorStop(1,   '#70c8e0');
  ctx.fillStyle = bottleGrad;
  ctx.beginPath();
  ctx.roundRect(bx + 10, by + 18, 36, 100, [6, 6, 12, 12]);
  ctx.fill();
  // Bottle shoulder
  ctx.fillStyle = '#c0ecf8';
  ctx.beginPath();
  ctx.roundRect(bx + 8, by + 12, 40, 22, 8);
  ctx.fill();
  // Pump nozzle
  ctx.fillStyle = '#0077a0';
  ctx.fillRect(bx + 23, by, 10, 18);
  ctx.beginPath();
  ctx.roundRect(bx + 14, by + 15, 28, 8, 4);
  ctx.fill();
  // Label
  ctx.fillStyle = '#0077a0';
  ctx.beginPath();
  ctx.roundRect(bx + 12, by + 38, 32, 52, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 7px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CAR', bx + 28, by + 57);
  ctx.fillText('FRESH', bx + 28, by + 68);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '6px sans-serif';
  ctx.fillText('NEW CAR SCENT', bx + 28, by + 80);

  // Scent squiggles
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (let s = 0; s < 3; s++) {
    const sx = bx + 15 + s * 14;
    const sy = by + 6;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(sx - 5, sy - 5, sx + 5, sy - 10, sx, sy - 15);
    ctx.stroke();
  }

  // Bottom text strip
  ctx.fillStyle = 'rgba(0,40,80,0.45)';
  ctx.beginPath();
  ctx.roundRect(0, PANEL_H - 38, PANEL_W, 38, [0, 0, 12, 12]);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('eliminates odors • freshens air', PANEL_W / 2, PANEL_H - 18);
  ctx.font = '9px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fillText('not a real ad • we just think it smells nice', PANEL_W / 2, PANEL_H - 6);

  ctx.textAlign = 'left';
  ctx.restore();
}
