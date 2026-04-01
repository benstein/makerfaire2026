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

export function clearCanvas() {
  // Mario sky blue background
  ctx.fillStyle = CONFIG.arenaBackground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw scattered brick blocks across the arena floor (subtle)
  const brickSize = 32;
  ctx.fillStyle = '#C84C09';
  const brickColor2 = '#A0370A';
  // Draw a row of ground bricks at bottom
  for (let bx = 0; bx < canvas.width; bx += brickSize) {
    // Bottom row
    ctx.fillStyle = '#C84C09';
    ctx.fillRect(bx, canvas.height - brickSize, brickSize - 1, brickSize - 1);
    ctx.fillStyle = brickColor2;
    ctx.fillRect(bx, canvas.height - brickSize, brickSize - 1, 2);
    ctx.fillRect(bx, canvas.height - brickSize, 2, brickSize - 1);

    // Second row
    ctx.fillStyle = '#C84C09';
    ctx.fillRect(bx + brickSize/2, canvas.height - brickSize*2, brickSize - 1, brickSize - 1);
    ctx.fillStyle = brickColor2;
    ctx.fillRect(bx + brickSize/2, canvas.height - brickSize*2, brickSize - 1, 2);
    ctx.fillRect(bx + brickSize/2, canvas.height - brickSize*2, 2, brickSize - 1);
  }

  // Top row of bricks
  for (let bx = 0; bx < canvas.width; bx += brickSize) {
    ctx.fillStyle = '#C84C09';
    ctx.fillRect(bx, 0, brickSize - 1, brickSize - 1);
    ctx.fillStyle = brickColor2;
    ctx.fillRect(bx, 0, brickSize - 1, 2);
    ctx.fillRect(bx, 0, 2, brickSize - 1);

    ctx.fillStyle = '#C84C09';
    ctx.fillRect(bx + brickSize/2, brickSize, brickSize - 1, brickSize - 1);
    ctx.fillStyle = brickColor2;
    ctx.fillRect(bx + brickSize/2, brickSize, brickSize - 1, 2);
    ctx.fillRect(bx + brickSize/2, brickSize, 2, brickSize - 1);
  }

  // Floating ? blocks scattered around
  const qBlocks = [
    [canvas.width * 0.2, canvas.height * 0.3],
    [canvas.width * 0.5, canvas.height * 0.25],
    [canvas.width * 0.8, canvas.height * 0.35],
    [canvas.width * 0.35, canvas.height * 0.6],
    [canvas.width * 0.65, canvas.height * 0.55],
  ];
  for (const [qx, qy] of qBlocks) {
    // Question block
    ctx.fillStyle = '#E8A020';
    ctx.fillRect(qx, qy, brickSize, brickSize);
    ctx.strokeStyle = '#804000';
    ctx.lineWidth = 2;
    ctx.strokeRect(qx, qy, brickSize, brickSize);
    // ? mark
    ctx.fillStyle = '#804000';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('?', qx + brickSize/2, qy + brickSize * 0.75);
    ctx.textAlign = 'left';
  }

  // A few green pipes
  const pipes = [
    [canvas.width * 0.1, canvas.height * 0.7, 40, 60],
    [canvas.width * 0.88, canvas.height * 0.65, 40, 80],
  ];
  for (const [ppx, ppy, pw, ph] of pipes) {
    // Pipe body
    ctx.fillStyle = '#00A800';
    ctx.fillRect(ppx, ppy, pw, ph);
    // Pipe rim (wider top)
    ctx.fillStyle = '#00D800';
    ctx.fillRect(ppx - 4, ppy, pw + 8, 14);
    // Pipe highlight
    ctx.fillStyle = '#40FF40';
    ctx.fillRect(ppx + 4, ppy + 14, 6, ph - 14);
  }
}

export function drawTitleScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  // Mario-style red title with white outline
  ctx.font = 'bold 52px monospace';
  ctx.textAlign = 'center';
  // Shadow
  ctx.fillStyle = '#800000';
  ctx.fillText('SUPER ARENA BROS', cx + 3, cy - 27);
  // Main text
  ctx.fillStyle = '#E52521';
  ctx.fillText('SUPER ARENA BROS', cx, cy - 30);
  // Highlight
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1.5;
  ctx.strokeText('SUPER ARENA BROS', cx, cy - 30);

  ctx.font = '22px monospace';
  ctx.fillStyle = '#FFD700';
  ctx.fillText('PRESS START', cx, cy + 30);

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
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
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

  // Confetti particles
  for (const p of victoryParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04; // gravity
    p.rotation += p.rotSpeed;

    // Wrap horizontally, reset when falling off bottom
    if (p.x < -20) p.x = canvas.width + 20;
    if (p.x > canvas.width + 20) p.x = -20;
    if (p.y > canvas.height + 20) {
      p.y = -10;
      p.x = Math.random() * canvas.width;
      p.vy = Math.random() * 2;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    if (p.type === 'rect') {
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Pulsing glow behind text
  const pulse = 0.3 + Math.sin(now * 3) * 0.15;
  ctx.fillStyle = `rgba(46, 204, 113, ${pulse})`;
  ctx.beginPath();
  ctx.arc(cx, cy - 20, 180, 0, Math.PI * 2);
  ctx.fill();

  // Main title — rainbow cycling letters
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
    const scale = 1 + Math.sin(now * 3 + i * 0.5) * 0.05;
    ctx.save();
    ctx.translate(charX, cy - 25 + wobble);
    ctx.scale(scale, scale);
    ctx.fillText(title[i], 0, 0);
    ctx.restore();
  }

  // Subtitle
  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.6 + Math.sin(now * 2) * 0.4;
  ctx.fillText('PRESS START TO PLAY AGAIN', cx, cy + 40);
  ctx.globalAlpha = 1;

  // Star bursts in corners
  const corners = [[80, 80], [canvas.width - 80, 80], [80, canvas.height - 80], [canvas.width - 80, canvas.height - 80]];
  for (let c = 0; c < corners.length; c++) {
    const [sx, sy] = corners[c];
    const starSize = 12 + Math.sin(now * 5 + c * 1.5) * 5;
    ctx.fillStyle = VICTORY_COLORS[(c + Math.floor(now * 2)) % VICTORY_COLORS.length];
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(now * 2 + c);
    // 4-point star
    ctx.beginPath();
    for (let s = 0; s < 8; s++) {
      const angle = (s / 8) * Math.PI * 2;
      const r = s % 2 === 0 ? starSize : starSize * 0.4;
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
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
