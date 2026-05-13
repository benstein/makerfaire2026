// src/game/rendering.js

import { CONFIG } from './config.js';

let canvas, ctx;

export function initRendering(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  return ctx;
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

export function getCanvasSize() {
  return { width: canvas.width, height: canvas.height };
}

// --- Frostbite Falls scene at NIGHT (Rocky & Bullwinkle) ---
let fbReady = false;
let pineTrees = [];
let snowflakes = [];
let stars = [];

function initFrostbite() {
  const w = canvas.width;
  const h = canvas.height;

  pineTrees = [];
  for (let i = 0; i < 16; i++) {
    const side = i % 2 === 0;
    pineTrees.push({
      x: side ? 10 + Math.random() * 110 : w - 120 + Math.random() * 110,
      h: 60 + Math.random() * 90,
      w: 28 + Math.random() * 32,
      layers: 2 + Math.floor(Math.random() * 2),
      dark: Math.random() > 0.5,
    });
  }

  snowflakes = [];
  for (let i = 0; i < 35; i++) {
    snowflakes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 2.5,
      speed: 0.3 + Math.random() * 0.6,
      drift: (Math.random() - 0.5) * 0.4,
    });
  }

  stars = [];
  // Lots of little twinkling stars across the upper sky
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * (h * 0.65),
      r: 0.5 + Math.random() * 1.6,
      twinkleSpeed: 0.001 + Math.random() * 0.004,
      phase: Math.random() * Math.PI * 2,
      // Occasional bigger sparkle-star
      bright: Math.random() < 0.08,
    });
  }

  fbReady = true;
}

export function clearCanvas() {
  if (!fbReady) initFrostbite();
  const w = canvas.width;
  const h = canvas.height;
  const now = performance.now();

  // Deep night sky — dark navy at top fading to a slightly warmer purple-blue near the horizon
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.80);
  sky.addColorStop(0, '#070a1a');
  sky.addColorStop(0.6, '#10183a');
  sky.addColorStop(1, '#1d2350');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // --- Twinkling stars ---
  for (const s of stars) {
    const tw = 0.5 + 0.5 * Math.sin(now * s.twinkleSpeed + s.phase);
    ctx.fillStyle = `rgba(255,255,255,${0.35 + 0.55 * tw})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    // Cross-glint on the bright ones
    if (s.bright && tw > 0.6) {
      ctx.strokeStyle = `rgba(255,255,220,${0.8 * tw})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(s.x - s.r * 3, s.y); ctx.lineTo(s.x + s.r * 3, s.y);
      ctx.moveTo(s.x, s.y - s.r * 3); ctx.lineTo(s.x, s.y + s.r * 3);
      ctx.stroke();
    }
  }

  // --- Glowing moon (upper right) ---
  const moonX = w * 0.82;
  const moonY = h * 0.18;
  const moonR = 38;
  // Soft outer halo
  const halo = ctx.createRadialGradient(moonX, moonY, moonR * 0.9, moonX, moonY, moonR * 3);
  halo.addColorStop(0, 'rgba(255,250,220,0.30)');
  halo.addColorStop(0.5, 'rgba(220,230,255,0.10)');
  halo.addColorStop(1, 'rgba(220,230,255,0)');
  ctx.fillStyle = halo;
  ctx.beginPath(); ctx.arc(moonX, moonY, moonR * 3, 0, Math.PI * 2); ctx.fill();
  // Moon disc — pale cream
  ctx.fillStyle = '#fdf6d4';
  ctx.beginPath(); ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2); ctx.fill();
  // Craters
  ctx.fillStyle = 'rgba(190,180,140,0.55)';
  ctx.beginPath(); ctx.arc(moonX - 10, moonY - 6, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(moonX + 8, moonY + 9, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(moonX + 14, moonY - 12, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(moonX - 6, moonY + 14, 4, 0, Math.PI * 2); ctx.fill();

  // Back hill — dark silhouette against the night sky
  ctx.fillStyle = '#0a1626';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  ctx.bezierCurveTo(w * 0.20, h * 0.50, w * 0.55, h * 0.57, w * 0.80, h * 0.52);
  ctx.bezierCurveTo(w * 0.92, h * 0.50, w, h * 0.56, w, h * 0.64);
  ctx.lineTo(w, h); ctx.lineTo(0, h);
  ctx.closePath(); ctx.fill();

  // Moonlit snowy ground — cool blue-white
  ctx.fillStyle = '#3a4470';
  ctx.fillRect(0, h * 0.80, w, h * 0.20);
  ctx.fillStyle = '#7a8ebf';
  ctx.fillRect(0, h * 0.80, w, h * 0.022);

  // Log cabin silhouette — darker at night, with warm glowing windows
  const cx = w * 0.43, cy = h * 0.56, cw = w * 0.14, ch = h * 0.13;
  ctx.fillStyle = '#3a2818'; ctx.fillRect(cx, cy, cw, ch);
  ctx.fillStyle = '#5a1818';
  ctx.beginPath();
  ctx.moveTo(cx - cw * 0.08, cy);
  ctx.lineTo(cx + cw / 2, cy - ch * 0.75);
  ctx.lineTo(cx + cw * 1.08, cy);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3a2010'; ctx.fillRect(cx + cw * 0.62, cy - ch * 0.82, cw * 0.14, ch * 0.48);
  // Smoke from the chimney
  ctx.fillStyle = 'rgba(200,200,210,0.18)';
  ctx.beginPath();
  ctx.ellipse(cx + cw * 0.70, cy - ch * 1.0, cw * 0.14, ch * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  // Glowing windows
  const winGlow = ctx.createRadialGradient(cx + cw * 0.26, cy + ch * 0.46, 1, cx + cw * 0.26, cy + ch * 0.46, cw * 0.30);
  winGlow.addColorStop(0, 'rgba(255,220,120,0.85)');
  winGlow.addColorStop(1, 'rgba(255,180,80,0)');
  ctx.fillStyle = winGlow;
  ctx.fillRect(cx - cw * 0.10, cy + ch * 0.10, cw * 0.70, ch * 0.70);
  const winGlow2 = ctx.createRadialGradient(cx + cw * 0.74, cy + ch * 0.46, 1, cx + cw * 0.74, cy + ch * 0.46, cw * 0.30);
  winGlow2.addColorStop(0, 'rgba(255,220,120,0.85)');
  winGlow2.addColorStop(1, 'rgba(255,180,80,0)');
  ctx.fillStyle = winGlow2;
  ctx.fillRect(cx + cw * 0.38, cy + ch * 0.10, cw * 0.70, ch * 0.70);
  // Bright window panes
  ctx.fillStyle = '#ffe9a0';
  ctx.fillRect(cx + cw * 0.12, cy + ch * 0.30, cw * 0.28, ch * 0.32);
  ctx.fillRect(cx + cw * 0.60, cy + ch * 0.30, cw * 0.28, ch * 0.32);

  // Pine trees — near-black silhouettes by moonlight
  const groundY = h * 0.80;
  for (const tree of pineTrees) {
    // Trunk
    ctx.fillStyle = '#1a0e06';
    ctx.fillRect(tree.x - 4, groundY - tree.h * 0.24, 8, tree.h * 0.24);

    for (let layer = 0; layer <= tree.layers; layer++) {
      const frac = layer / (tree.layers + 0.5);
      const ly = tree.h * 0.08 + (tree.h * 0.70) * frac;
      const lw = tree.w * (0.25 + 0.75 * frac);
      const lh = tree.h * (0.38 - 0.04 * frac);
      ctx.fillStyle = layer % 2 === 0 ? '#06180c' : '#0a2010';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tree.x, groundY - tree.h + ly);
      ctx.lineTo(tree.x + lw / 2, groundY - tree.h + ly + lh);
      ctx.lineTo(tree.x - lw / 2, groundY - tree.h + ly + lh);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
  }

  // Drifting snowflakes — softer at night
  ctx.fillStyle = 'rgba(240,245,255,0.85)';
  for (const f of snowflakes) {
    f.x += f.drift; f.y += f.speed;
    if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
    if (f.x < -5) f.x = w + 5;
    if (f.x > w + 5) f.x = -5;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

window.addEventListener('resize', () => { fbReady = false; });

export function drawTitleScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const now = performance.now();
  const bounce = Math.sin(now / 400) * 5;

  // Classic R&B cartoon title — thick black outline, flat yellow fill
  ctx.font = 'bold 56px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 9;
  ctx.strokeText('ARENA SURVIVAL', cx, cy - 28 + bounce);
  ctx.fillStyle = '#ffdd00';
  ctx.fillText('ARENA SURVIVAL', cx, cy - 28 + bounce);

  ctx.font = 'bold 20px monospace';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 5;
  ctx.strokeText('~ PRESS START ~', cx, cy + 25);
  ctx.fillStyle = '#ff3333';
  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(now / 400);
  ctx.fillText('~ PRESS START ~', cx, cy + 25);
  ctx.globalAlpha = 1;

  ctx.textAlign = 'left';
}

const VICTORY_COLORS = ['#ff6b6b', '#ffa500', '#ffd700', '#2ecc71', '#3498db', '#9b59b6', '#e91e63'];
let victoryParticles = [];
let victoryStartTime = 0;

function ensureVictoryParticles(now) {
  if (victoryStartTime === 0 || victoryParticles.length === 0) {
    victoryStartTime = now;
    victoryParticles = [];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      victoryParticles.push({
        x: canvas.width / 2, y: canvas.height / 2,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
        size: 3 + Math.random() * 6,
        color: VICTORY_COLORS[Math.floor(Math.random() * VICTORY_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        type: Math.random() > 0.5 ? 'rect' : 'circle',
      });
    }
  }
}

export function drawVictoryScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const now = performance.now() / 1000;
  ensureVictoryParticles(now);

  for (const p of victoryParticles) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.rotation += p.rotSpeed;
    if (p.x < -20) p.x = canvas.width + 20;
    if (p.x > canvas.width + 20) p.x = -20;
    if (p.y > canvas.height + 20) { p.y = -10; p.x = Math.random() * canvas.width; p.vy = Math.random() * 2; }
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    if (p.type === 'rect') { ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); }
    else { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }

  const pulse = 0.3 + Math.sin(now * 3) * 0.15;
  ctx.fillStyle = `rgba(46, 204, 113, ${pulse})`;
  ctx.beginPath(); ctx.arc(cx, cy - 20, 180, 0, Math.PI * 2); ctx.fill();

  const title = 'CHAMPION!';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i < title.length; i++) {
    const colorIdx = Math.floor((i + now * 4) % VICTORY_COLORS.length);
    ctx.fillStyle = VICTORY_COLORS[colorIdx];
    const charWidth = ctx.measureText('M').width;
    const totalWidth = title.length * charWidth;
    const charX = cx - totalWidth / 2 + i * charWidth + charWidth / 2;
    const wobble = Math.sin(now * 4 + i * 0.7) * 8;
    ctx.save(); ctx.translate(charX, cy - 25 + wobble);
    ctx.scale(1 + Math.sin(now * 3 + i * 0.5) * 0.05, 1 + Math.sin(now * 3 + i * 0.5) * 0.05);
    ctx.fillText(title[i], 0, 0); ctx.restore();
  }

  ctx.font = 'bold 24px monospace'; ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.6 + Math.sin(now * 2) * 0.4;
  ctx.fillText('PRESS START TO PLAY AGAIN', cx, cy + 40);
  ctx.globalAlpha = 1;

  const corners = [[60,60],[canvas.width-60,60],[60,canvas.height-60],[canvas.width-60,canvas.height-60]];
  for (let c = 0; c < corners.length; c++) {
    const [sx, sy] = corners[c];
    const sz = 12 + Math.sin(now * 5 + c * 1.5) * 5;
    ctx.fillStyle = VICTORY_COLORS[(c + Math.floor(now * 2)) % VICTORY_COLORS.length];
    ctx.save(); ctx.translate(sx, sy); ctx.rotate(now * 2 + c);
    ctx.beginPath();
    for (let s = 0; s < 8; s++) {
      const a = (s / 8) * Math.PI * 2;
      const r = s % 2 === 0 ? sz : sz * 0.4;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  ctx.textAlign = 'left';
}

export function resetVictoryEffects() {
  victoryParticles = [];
  victoryStartTime = 0;
}

export function drawGameOverScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', cx, cy - 30);
  ctx.font = '20px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('PRESS START TO TRY AGAIN', cx, cy + 30);
  ctx.textAlign = 'left';
}
