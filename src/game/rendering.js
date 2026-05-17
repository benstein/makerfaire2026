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

// Preload logo — ready well before title screen is shown
const _logo = new Image();
_logo.src = '/assets/logo.jpg';

export function clearCanvas() {
  const now = performance.now() / 1000;
  // Slowly cycling full-spectrum rainbow — hue rotates around the colour wheel
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  for (let i = 0; i <= 6; i++) {
    const hue = ((i / 6) * 360 + now * 30) % 360;
    grad.addColorStop(i / 6, `hsl(${hue}, 85%, 78%)`);
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

export function drawTitleScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const now = performance.now();
  const bounce = Math.sin(now / 400) * 5;

  const logoSize = Math.round(Math.min(canvas.width * 0.30, canvas.height * 0.60, 500));
  const lx = Math.round(cx - logoSize / 2);
  const ly = Math.round(cy - logoSize / 2 - 22 + bounce);

  if (_logo.complete && _logo.naturalWidth) {
    ctx.save();
    ctx.shadowBlur = 32;
    ctx.shadowColor = 'rgba(255, 210, 0, 0.55)';
    ctx.beginPath();
    ctx.roundRect(lx, ly, logoSize, logoSize, Math.round(logoSize * 0.07));
    ctx.clip();
    ctx.drawImage(_logo, lx, ly, logoSize, logoSize);
    ctx.restore();
  } else {
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('SAY IT! PLAY IT!', cx, cy - 22 + bounce);
  }

  const pressY = ly + logoSize + 32;
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(now / 400);
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#5d6d7e';
  ctx.fillText('Press Start / A to play', cx, pressY);
  ctx.globalAlpha = 0.45;
  ctx.font = '14px monospace';
  ctx.fillText('(or Return on keyboard)', cx, pressY + 24);
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

  // Rainbow cycling CHAMPION! title
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

  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = '#2c3e50';
  ctx.globalAlpha = 0.6 + Math.sin(now * 2) * 0.4;
  ctx.fillText('PRESS START / A TO PLAY AGAIN', cx, cy + 40);
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
  const now = performance.now();

  const bounce = Math.sin(now / 400) * 5;
  const logoSize = Math.round(Math.min(canvas.width * 0.25, canvas.height * 0.50, 400));
  const lx = Math.round(cx - logoSize / 2);
  const ly = Math.round(cy - logoSize / 2 - 44 + bounce);
  const r  = Math.round(logoSize * 0.07);

  if (_logo.complete && _logo.naturalWidth) {
    ctx.save();
    ctx.shadowBlur = 44;
    ctx.shadowColor = 'rgba(231, 76, 60, 0.85)';
    ctx.beginPath(); ctx.roundRect(lx, ly, logoSize, logoSize, r); ctx.clip();
    ctx.drawImage(_logo, lx, ly, logoSize, logoSize);
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(lx, ly, logoSize, logoSize, r); ctx.clip();
    ctx.fillStyle = 'rgba(200, 0, 0, 0.28)';
    ctx.fillRect(lx, ly, logoSize, logoSize);
    ctx.restore();
  }

  const textY = ly + logoSize + 64;
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e74c3c';
  ctx.fillText('GAME OVER', cx, textY);

  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(now / 400);
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#5d6d7e';
  ctx.fillText('Press Start / A to try again', cx, textY + 36);
  ctx.globalAlpha = 0.4;
  ctx.font = '14px monospace';
  ctx.fillText('(or Return on keyboard)', cx, textY + 58);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}
