// src/game/rendering.js

import { CONFIG } from './config.js';

let canvas, ctx;

// Pre-generated ice scenery (proportional so it scales to any resolution)
const icePatches = [
  { x: 0.12, y: 0.15, rx: 0.13, ry: 0.055, angle: 0.3 },
  { x: 0.72, y: 0.08, rx: 0.16, ry: 0.045, angle: -0.2 },
  { x: 0.88, y: 0.62, rx: 0.09, ry: 0.07, angle: 0.55 },
  { x: 0.28, y: 0.88, rx: 0.18, ry: 0.05, angle: 0.1 },
  { x: 0.5,  y: 0.48, rx: 0.07, ry: 0.035, angle: -0.4 },
  { x: 0.08, y: 0.72, rx: 0.09, ry: 0.04, angle: 0.65 },
  { x: 0.6,  y: 0.78, rx: 0.12, ry: 0.05, angle: -0.1 },
];

const iceCracks = [
  [{x:0.20,y:0.00},{x:0.25,y:0.18},{x:0.21,y:0.33},{x:0.27,y:0.52}],
  [{x:0.27,y:0.18},{x:0.35,y:0.28},{x:0.30,y:0.40}],
  [{x:0.60,y:0.05},{x:0.55,y:0.22},{x:0.61,y:0.38}],
  [{x:0.61,y:0.22},{x:0.70,y:0.30}],
  [{x:0.80,y:0.28},{x:0.74,y:0.48},{x:0.79,y:0.66},{x:0.71,y:0.82}],
  [{x:0.74,y:0.48},{x:0.83,y:0.55}],
  [{x:0.08,y:0.48},{x:0.18,y:0.60},{x:0.13,y:0.76}],
  [{x:0.18,y:0.60},{x:0.10,y:0.68}],
  [{x:0.38,y:0.68},{x:0.48,y:0.80},{x:0.43,y:0.96}],
  [{x:0.48,y:0.80},{x:0.55,y:0.75}],
];

const snowflakes = Array.from({ length: 50 }, () => ({
  x: Math.random(),
  y: Math.random(),
  size: 1.5 + Math.random() * 3.5,
  speed: 0.018 + Math.random() * 0.032,
  drift: 0.008 + Math.random() * 0.012,
  phase: Math.random() * Math.PI * 2,
}));

function drawSnowflake(c, fx, fy, size) {
  c.beginPath();
  c.arc(fx, fy, size, 0, Math.PI * 2);
  c.fill();
  // Simple cross arms
  c.fillRect(fx - size * 2.2, fy - size * 0.35, size * 4.4, size * 0.7);
  c.fillRect(fx - size * 0.35, fy - size * 2.2, size * 0.7, size * 4.4);
}

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
  const w = canvas.width;
  const h = canvas.height;
  const t = performance.now() / 1000;

  // Icy base
  ctx.fillStyle = CONFIG.arenaBackground;
  ctx.fillRect(0, 0, w, h);

  // Subtle gradient from top (bright) to bottom (deeper ice)
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, 'rgba(220,240,255,0.35)');
  grad.addColorStop(1, 'rgba(80,140,180,0.25)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Glassy ice patches
  for (const p of icePatches) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(p.x * w, p.y * h, p.rx * w, p.ry * h, p.angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Ice cracks
  ctx.save();
  ctx.strokeStyle = '#7aaec8';
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.55;
  for (const crack of iceCracks) {
    ctx.beginPath();
    ctx.moveTo(crack[0].x * w, crack[0].y * h);
    for (let i = 1; i < crack.length; i++) {
      ctx.lineTo(crack[i].x * w, crack[i].y * h);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Falling snowflakes
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (const flake of snowflakes) {
    const fx = ((flake.x + Math.sin(t * flake.drift * 6 + flake.phase) * 0.03) % 1) * w;
    const fy = ((flake.y + t * flake.speed) % 1) * h;
    drawSnowflake(ctx, fx, fy, flake.size);
  }
  ctx.restore();
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
