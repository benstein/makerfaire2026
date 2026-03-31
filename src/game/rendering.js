// src/game/rendering.js

import { CONFIG } from './config.js';

let canvas, ctx;
let bgCanvas = null;
let floatingParticles = [];

const RAINBOW = ['#ff6b6b', '#ffa500', '#ffd700', '#69ff69', '#69b4ff', '#b469ff'];

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
  generateBackground();
  generateParticles();
}

function generateParticles() {
  const w = canvas.width;
  const h = canvas.height;
  floatingParticles = [];

  // Floating hearts, stars, and sparkles
  const count = Math.floor(w * h / 3000);
  for (let i = 0; i < count; i++) {
    floatingParticles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      type: ['heart', 'star', 'sparkle', 'flower'][Math.floor(Math.random() * 4)],
      size: 3 + Math.random() * 8,
      speed: 0.2 + Math.random() * 0.5,
      drift: (Math.random() - 0.5) * 0.3,
      phase: Math.random() * Math.PI * 2,
      color: RAINBOW[Math.floor(Math.random() * RAINBOW.length)],
      alpha: 0.15 + Math.random() * 0.3,
    });
  }
}

function generateBackground() {
  const w = canvas.width;
  const h = canvas.height;

  bgCanvas = document.createElement('canvas');
  bgCanvas.width = w;
  bgCanvas.height = h;
  const bctx = bgCanvas.getContext('2d');

  // White background
  bctx.fillStyle = '#ffffff';
  bctx.fillRect(0, 0, w, h);
}

function drawCloud(ctx, x, y, scale) {
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  const s = 30 * scale;
  // Cluster of circles to make fluffy cloud
  const puffs = [
    { dx: 0, dy: 0, r: s },
    { dx: -s * 0.7, dy: s * 0.15, r: s * 0.75 },
    { dx: s * 0.7, dy: s * 0.1, r: s * 0.8 },
    { dx: -s * 0.35, dy: -s * 0.4, r: s * 0.65 },
    { dx: s * 0.3, dy: -s * 0.45, r: s * 0.6 },
    { dx: s * 1.1, dy: s * 0.25, r: s * 0.55 },
    { dx: -s * 1.05, dy: s * 0.3, r: s * 0.5 },
  ];
  for (const puff of puffs) {
    ctx.beginPath();
    ctx.arc(x + puff.dx, y + puff.dy, puff.r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Pink tint on top
  ctx.fillStyle = 'rgba(255,200,220,0.2)';
  ctx.beginPath();
  ctx.arc(x, y - s * 0.3, s * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawSmallHeart(ctx, cx, cy, size) {
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.3);
  ctx.bezierCurveTo(cx - size, cy - size * 0.3, cx - size, cy - size, cx, cy - size * 0.5);
  ctx.bezierCurveTo(cx + size, cy - size, cx + size, cy - size * 0.3, cx, cy + size * 0.3);
  ctx.fill();
}

function drawSmallStar(ctx, cx, cy, size) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const method = i === 0 ? 'moveTo' : 'lineTo';
    ctx[method](cx + Math.cos(angle) * size, cy + Math.sin(angle) * size);
  }
  ctx.closePath();
  ctx.fill();
}

function drawSmallFlower(ctx, cx, cy, size, color) {
  // Petals
  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(
      cx + Math.cos(angle) * size * 0.4,
      cy + Math.sin(angle) * size * 0.4,
      size * 0.4, size * 0.25,
      angle, 0, Math.PI * 2
    );
    ctx.fill();
  }
  // Center
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.arc(cx, cy, size * 0.25, 0, Math.PI * 2);
  ctx.fill();
}

export function getCanvasSize() {
  return { width: canvas.width, height: canvas.height };
}

export function clearCanvas() {
  // Draw pre-rendered background
  if (bgCanvas) {
    ctx.drawImage(bgCanvas, 0, 0);
  } else {
    ctx.fillStyle = CONFIG.arenaBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Animate floating particles
  const now = performance.now() / 1000;
  for (const p of floatingParticles) {
    p.y -= p.speed;
    p.x += p.drift + Math.sin(now * 2 + p.phase) * 0.3;

    // Wrap around
    if (p.y < -20) { p.y = canvas.height + 20; p.x = Math.random() * canvas.width; }
    if (p.x < -20) p.x = canvas.width + 20;
    if (p.x > canvas.width + 20) p.x = -20;

    const pulse = 1 + Math.sin(now * 3 + p.phase) * 0.2;
    ctx.globalAlpha = p.alpha * (0.7 + Math.sin(now * 2 + p.phase) * 0.3);
    ctx.fillStyle = p.color;

    if (p.type === 'heart') {
      drawSmallHeart(ctx, p.x, p.y, p.size * pulse);
    } else if (p.type === 'star') {
      drawSmallStar(ctx, p.x, p.y, p.size * pulse);
    } else if (p.type === 'flower') {
      drawSmallFlower(ctx, p.x, p.y, p.size * pulse, p.color);
    } else {
      // Sparkle — diamond shape
      const ss = p.size * pulse;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - ss);
      ctx.lineTo(p.x + ss * 0.4, p.y);
      ctx.lineTo(p.x, p.y + ss);
      ctx.lineTo(p.x - ss * 0.4, p.y);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

export function drawTitleScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Rainbow title
  const title = 'ARENA SURVIVAL';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  const now = performance.now() / 1000;
  for (let i = 0; i < title.length; i++) {
    const colorIdx = Math.floor((i + now * 3) % RAINBOW.length);
    ctx.fillStyle = RAINBOW[colorIdx < 0 ? colorIdx + RAINBOW.length : colorIdx];
    const charX = cx - (title.length * 14.4) + i * 28.8;
    const wobble = Math.sin(now * 3 + i * 0.5) * 4;
    ctx.fillText(title[i], charX, cy - 30 + wobble);
  }

  ctx.font = '20px monospace';
  ctx.fillStyle = '#ff88cc';
  ctx.fillText('PRESS START', cx, cy + 30);

  ctx.textAlign = 'left';
}

export function drawVictoryScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const now = performance.now() / 1000;
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  const text = 'YOU SURVIVED!';
  for (let i = 0; i < text.length; i++) {
    ctx.fillStyle = RAINBOW[Math.floor((i + now * 4) % RAINBOW.length)];
    const charX = cx - (text.length * 14.4) + i * 28.8;
    const wobble = Math.sin(now * 4 + i * 0.6) * 6;
    ctx.fillText(text[i], charX, cy - 30 + wobble);
  }

  ctx.font = '20px monospace';
  ctx.fillStyle = '#ff88cc';
  ctx.fillText('PRESS START TO PLAY AGAIN', cx, cy + 30);

  ctx.textAlign = 'left';
}

export function drawGameOverScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.fillStyle = '#ff69b4';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', cx, cy - 30);

  ctx.font = '20px monospace';
  ctx.fillStyle = '#ff88cc';
  ctx.fillText('PRESS START TO TRY AGAIN', cx, cy + 30);

  ctx.textAlign = 'left';
}
