// src/game/rendering.js

import { CONFIG } from './config.js';

let canvas, ctx;
let nebulaCanvas = null;
let twinkleStars = [];

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
  generateNebula();
}

function generateNebula() {
  const w = canvas.width;
  const h = canvas.height;

  nebulaCanvas = document.createElement('canvas');
  nebulaCanvas.width = w;
  nebulaCanvas.height = h;
  const nctx = nebulaCanvas.getContext('2d');

  // Deep space base
  nctx.fillStyle = '#050510';
  nctx.fillRect(0, 0, w, h);

  // Nebula clouds — layered radial gradients
  const clouds = [
    { x: w * 0.25, y: h * 0.3, r: w * 0.45, colors: ['rgba(90,20,140,0.25)', 'rgba(60,10,100,0.1)', 'transparent'] },
    { x: w * 0.7,  y: h * 0.6, r: w * 0.5,  colors: ['rgba(20,60,160,0.2)', 'rgba(10,30,120,0.1)', 'transparent'] },
    { x: w * 0.5,  y: h * 0.4, r: w * 0.35, colors: ['rgba(140,30,80,0.18)', 'rgba(100,10,60,0.08)', 'transparent'] },
    { x: w * 0.15, y: h * 0.7, r: w * 0.3,  colors: ['rgba(20,100,140,0.15)', 'rgba(10,60,100,0.08)', 'transparent'] },
    { x: w * 0.8,  y: h * 0.2, r: w * 0.28, colors: ['rgba(120,40,160,0.2)', 'rgba(80,20,120,0.08)', 'transparent'] },
    { x: w * 0.45, y: h * 0.8, r: w * 0.32, colors: ['rgba(40,20,120,0.15)', 'rgba(20,10,80,0.06)', 'transparent'] },
  ];

  for (const cloud of clouds) {
    const grad = nctx.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.r);
    grad.addColorStop(0, cloud.colors[0]);
    grad.addColorStop(0.5, cloud.colors[1]);
    grad.addColorStop(1, cloud.colors[2]);
    nctx.fillStyle = grad;
    nctx.fillRect(0, 0, w, h);
  }

  // Wispy gas tendrils
  for (let i = 0; i < 8; i++) {
    nctx.save();
    nctx.globalAlpha = 0.04 + Math.random() * 0.06;
    nctx.strokeStyle = ['#8844aa', '#4466cc', '#cc3366', '#2288aa'][i % 4];
    nctx.lineWidth = 30 + Math.random() * 60;
    nctx.lineCap = 'round';
    nctx.beginPath();
    let px = Math.random() * w;
    let py = Math.random() * h;
    nctx.moveTo(px, py);
    for (let s = 0; s < 5; s++) {
      px += (Math.random() - 0.5) * w * 0.4;
      py += (Math.random() - 0.5) * h * 0.4;
      nctx.quadraticCurveTo(
        px + (Math.random() - 0.5) * 200,
        py + (Math.random() - 0.5) * 200,
        px, py
      );
    }
    nctx.stroke();
    nctx.restore();
  }

  // Background stars (static — painted into nebula texture)
  twinkleStars = [];
  const starCount = Math.floor(w * h / 800);
  for (let i = 0; i < starCount; i++) {
    const sx = Math.random() * w;
    const sy = Math.random() * h;
    const size = Math.random();

    if (size > 0.92) {
      // Bright stars — will twinkle, drawn live
      twinkleStars.push({
        x: sx, y: sy,
        baseSize: 1.2 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
        speed: 1.5 + Math.random() * 3,
        color: ['#ffffff', '#aaccff', '#ffddaa', '#ffaacc'][Math.floor(Math.random() * 4)],
      });
    } else {
      // Dim static stars
      const brightness = 40 + Math.floor(Math.random() * 80);
      nctx.fillStyle = `rgb(${brightness + 20},${brightness + 10},${brightness + 30})`;
      nctx.fillRect(sx, sy, size > 0.7 ? 1.5 : 1, size > 0.7 ? 1.5 : 1);
    }
  }
}

export function getCanvasSize() {
  return { width: canvas.width, height: canvas.height };
}

export function clearCanvas() {
  // Draw pre-rendered nebula
  if (nebulaCanvas) {
    ctx.drawImage(nebulaCanvas, 0, 0);
  } else {
    ctx.fillStyle = '#050510';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Twinkling bright stars
  const now = performance.now() / 1000;
  for (const star of twinkleStars) {
    const flicker = 0.4 + 0.6 * ((Math.sin(now * star.speed + star.phase) + 1) / 2);
    ctx.globalAlpha = flicker;
    ctx.fillStyle = star.color;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.baseSize * flicker, 0, Math.PI * 2);
    ctx.fill();

    // Cross sparkle on brightest stars
    if (star.baseSize > 1.8 && flicker > 0.8) {
      ctx.strokeStyle = star.color;
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = flicker * 0.4;
      const len = star.baseSize * 4;
      ctx.beginPath();
      ctx.moveTo(star.x - len, star.y);
      ctx.lineTo(star.x + len, star.y);
      ctx.moveTo(star.x, star.y - len);
      ctx.lineTo(star.x, star.y + len);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
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

export function drawVictoryScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  ctx.fillStyle = '#2ecc71';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('YOU SURVIVED!', cx, cy - 30);

  ctx.font = '20px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText('PRESS START TO PLAY AGAIN', cx, cy + 30);

  ctx.textAlign = 'left';
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
