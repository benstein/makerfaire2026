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

// --- Frostbite Falls scene (Rocky & Bullwinkle) ---
let fbReady = false;
let pineTrees = [];
let snowflakes = [];

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

  fbReady = true;
}

export function clearCanvas() {
  if (!fbReady) initFrostbite();
  const w = canvas.width;
  const h = canvas.height;

  // Flat blue sky — classic R&B limited-animation palette
  ctx.fillStyle = '#4d88cc';
  ctx.fillRect(0, 0, w, h);

  // Back hill — dark blue-green
  ctx.fillStyle = '#2e6644';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.62);
  ctx.bezierCurveTo(w * 0.20, h * 0.50, w * 0.55, h * 0.57, w * 0.80, h * 0.52);
  ctx.bezierCurveTo(w * 0.92, h * 0.50, w, h * 0.56, w, h * 0.64);
  ctx.lineTo(w, h); ctx.lineTo(0, h);
  ctx.closePath(); ctx.fill();

  // Ground — flat green
  ctx.fillStyle = '#4aaa33';
  ctx.fillRect(0, h * 0.80, w, h * 0.20);
  ctx.fillStyle = '#60cc44';
  ctx.fillRect(0, h * 0.80, w, h * 0.022);

  // Log cabin silhouette
  const cx = w * 0.43, cy = h * 0.56, cw = w * 0.14, ch = h * 0.13;
  ctx.fillStyle = '#7a5030'; ctx.fillRect(cx, cy, cw, ch);
  ctx.fillStyle = '#bb2222';
  ctx.beginPath();
  ctx.moveTo(cx - cw * 0.08, cy);
  ctx.lineTo(cx + cw / 2, cy - ch * 0.75);
  ctx.lineTo(cx + cw * 1.08, cy);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#994422'; ctx.fillRect(cx + cw * 0.62, cy - ch * 0.82, cw * 0.14, ch * 0.48);
  ctx.fillStyle = '#ffee88';
  ctx.fillRect(cx + cw * 0.12, cy + ch * 0.30, cw * 0.28, ch * 0.32);
  ctx.fillRect(cx + cw * 0.60, cy + ch * 0.30, cw * 0.28, ch * 0.32);

  // Pine trees — flat triangles on sticks, thick outlines
  const groundY = h * 0.80;
  for (const tree of pineTrees) {
    // Trunk
    ctx.fillStyle = '#5c3010';
    ctx.fillRect(tree.x - 4, groundY - tree.h * 0.24, 8, tree.h * 0.24);

    for (let layer = 0; layer <= tree.layers; layer++) {
      const frac = layer / (tree.layers + 0.5);
      const ly = tree.h * 0.08 + (tree.h * 0.70) * frac;
      const lw = tree.w * (0.25 + 0.75 * frac);
      const lh = tree.h * (0.38 - 0.04 * frac);
      ctx.fillStyle = layer % 2 === 0 ? '#1a6628' : '#228833';
      ctx.strokeStyle = '#0a2e10';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tree.x, groundY - tree.h + ly);
      ctx.lineTo(tree.x + lw / 2, groundY - tree.h + ly + lh);
      ctx.lineTo(tree.x - lw / 2, groundY - tree.h + ly + lh);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    }
  }

  // Drifting snowflakes
  ctx.fillStyle = '#ffffff';
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
