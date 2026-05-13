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

// --- Seussian scene state ---
const SEUSS_COLORS = ['#ff4499', '#ff8800', '#ffdd00', '#33cc55', '#3388ff', '#cc44ff'];
let seussReady = false;
let seussTrees = [];
let seussStars = [];

function initSeuss() {
  const w = canvas.width;
  const h = canvas.height;
  seussTrees = [];
  for (let i = 0; i < 20; i++) {
    const side = i % 2 === 0;
    const tx = side ? 15 + Math.random() * 110 : w - 125 + Math.random() * 110;
    seussTrees.push({
      x: tx,
      trunkH: 50 + Math.random() * 80,
      puffColor: SEUSS_COLORS[i % SEUSS_COLORS.length],
      puffR: 14 + Math.random() * 18,
      wobbleOff: Math.random() * Math.PI * 2,
    });
  }
  seussStars = [];
  for (let i = 0; i < 22; i++) {
    seussStars.push({
      x: Math.random() * w,
      y: 20 + Math.random() * h * 0.44,
      r: 5 + Math.random() * 8,
      color: SEUSS_COLORS[i % SEUSS_COLORS.length],
      phase: Math.random() * Math.PI * 2,
    });
  }
  seussReady = true;
}

export function clearCanvas() {
  if (!seussReady) initSeuss();
  const now = performance.now();
  const w = canvas.width;
  const h = canvas.height;

  // Sky: hot pink → warm orange → lemon yellow
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0,    '#ff7ec7');
  sky.addColorStop(0.45, '#ff9944');
  sky.addColorStop(1,    '#ffe066');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Twinkling Seuss stars
  for (const s of seussStars) {
    const twinkle = 0.55 + 0.45 * Math.sin(now / 550 + s.phase);
    ctx.globalAlpha = twinkle;
    ctx.fillStyle = s.color;
    drawSeussStar(s.x, s.y, s.r);
    ctx.globalAlpha = 1;
  }

  // Rolling hills — 3 layers, back to front
  drawSeussHill(w * -0.05, h * 0.70, w * 1.10, h * 0.32, '#4ed9c0');
  drawSeussHill(w * -0.05, h * 0.79, w * 0.78, h * 0.24, '#ff7777');
  drawSeussHill(w * -0.05, h * 0.87, w * 1.15, h * 0.17, '#66cc33');
  ctx.fillStyle = '#66cc33';
  ctx.fillRect(0, h * 0.94, w, h * 0.07);

  // Truffula trees wobbling in the breeze
  const groundY = h * 0.90;
  for (const tree of seussTrees) {
    const wobble = Math.sin(now / 900 + tree.wobbleOff) * 5;
    const tipX = tree.x + wobble;
    const tipY = groundY - tree.trunkH;

    // Trunk — thin, slightly curved
    ctx.strokeStyle = '#7a4010';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(tree.x, groundY);
    ctx.quadraticCurveTo(tree.x + wobble * 0.4, groundY - tree.trunkH * 0.55, tipX, tipY);
    ctx.stroke();

    // Pom-pom
    ctx.fillStyle = tree.puffColor;
    ctx.beginPath();
    ctx.arc(tipX, tipY - tree.puffR * 0.55, tree.puffR, 0, Math.PI * 2);
    ctx.fill();
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.beginPath();
    ctx.arc(tipX - tree.puffR * 0.3, tipY - tree.puffR * 1.0, tree.puffR * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSeussHill(x, y, width, height, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + height);
  ctx.bezierCurveTo(x + width * 0.25, y - height * 0.1, x + width * 0.75, y - height * 0.1, x + width, y + height);
  ctx.lineTo(x + width, canvas.height);
  ctx.lineTo(x, canvas.height);
  ctx.closePath();
  ctx.fill();
}

function drawSeussStar(x, y, r) {
  const pts = 5;
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const a = (i * Math.PI) / pts - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.4;
    const sx = x + Math.cos(a) * rad;
    const sy = y + Math.sin(a) * rad;
    i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
  }
  ctx.closePath();
  ctx.fill();
}

// Re-init on resize so trees and stars fill the new canvas.
window.addEventListener('resize', () => { seussReady = false; });

export function drawTitleScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const now = performance.now();
  const bounce = Math.sin(now / 350) * 6;

  // Drop shadow
  ctx.font = 'bold 54px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#880022';
  ctx.fillText('ARENA SURVIVAL!', cx + 3, cy - 26 + bounce);

  // White fill + red outline
  ctx.fillStyle = '#ffffff';
  ctx.fillText('ARENA SURVIVAL!', cx, cy - 30 + bounce);
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = 3;
  ctx.strokeText('ARENA SURVIVAL!', cx, cy - 30 + bounce);

  // Pulsing subtitle
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = '#cc0000';
  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(now / 400);
  ctx.fillText('~ PRESS START ~', cx, cy + 30);
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

  for (const p of victoryParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04;
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

  const pulse = 0.3 + Math.sin(now * 3) * 0.15;
  ctx.fillStyle = `rgba(46, 204, 113, ${pulse})`;
  ctx.beginPath();
  ctx.arc(cx, cy - 20, 180, 0, Math.PI * 2);
  ctx.fill();

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
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = 0.6 + Math.sin(now * 2) * 0.4;
  ctx.fillText('PRESS START TO PLAY AGAIN', cx, cy + 40);
  ctx.globalAlpha = 1;

  const corners = [[60, 60], [canvas.width - 60, 60], [60, canvas.height - 60], [canvas.width - 60, canvas.height - 60]];
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

  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', cx, cy - 30);

  ctx.font = '20px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('PRESS START TO TRY AGAIN', cx, cy + 30);

  ctx.textAlign = 'left';
}
