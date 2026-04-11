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

// --- Space background ---
let stars = [];
let starsGenerated = false;

function ensureStars() {
  if (starsGenerated && stars.length > 0) return;
  stars = [];
  const w = canvas.width, h = canvas.height;
  // Distant tiny stars
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: 0.5 + Math.random() * 1.5,
      brightness: 0.3 + Math.random() * 0.7,
      twinkleSpeed: 1 + Math.random() * 4,
      twinkleOffset: Math.random() * Math.PI * 2,
    });
  }
  // A few brighter stars
  for (let i = 0; i < 15; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      size: 2 + Math.random() * 2,
      brightness: 0.8 + Math.random() * 0.2,
      twinkleSpeed: 2 + Math.random() * 3,
      twinkleOffset: Math.random() * Math.PI * 2,
      bright: true,
    });
  }
  starsGenerated = true;
}

export function clearCanvas(bgOverride) {
  ensureStars();
  const now = performance.now() / 1000;
  const w = canvas.width, h = canvas.height;

  // Deep space black
  ctx.fillStyle = '#050510';
  ctx.fillRect(0, 0, w, h);

  // Nebula clouds tinted by the map color
  const nebulaColor = bgOverride || CONFIG.arenaBackground;
  // Parse the color for the nebula glow
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = nebulaColor;
  // Large soft blobs
  ctx.beginPath();
  ctx.arc(w * 0.3, h * 0.4, w * 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.7, h * 0.6, w * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.2, w * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Second layer, slightly shifted
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#4444aa';
  ctx.beginPath();
  ctx.arc(w * 0.6, h * 0.3, w * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#663366';
  ctx.beginPath();
  ctx.arc(w * 0.2, h * 0.7, w * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Stars
  for (const star of stars) {
    const twinkle = 0.5 + Math.sin(now * star.twinkleSpeed + star.twinkleOffset) * 0.5;
    const alpha = star.brightness * twinkle;

    if (star.bright) {
      // Cross-shaped bright star
      ctx.fillStyle = `rgba(200, 220, 255, ${alpha * 0.3})`;
      ctx.fillRect(star.x - star.size * 2, star.y - 0.5, star.size * 4, 1);
      ctx.fillRect(star.x - 0.5, star.y - star.size * 2, 1, star.size * 4);
    }

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawTitleScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ARENA SURVIVAL', cx, cy - 30);

  ctx.font = '20px monospace';
  ctx.fillStyle = '#888';
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
