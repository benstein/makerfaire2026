// src/game/rendering.js

import { CONFIG } from './config.js';

let canvas, ctx;
let grassCache = null; // cached offscreen canvas for grassy knoll background

export function initRendering(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', () => {
    resizeCanvas();
    grassCache = null; // invalidate cache on resize
  });
  return ctx;
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

export function getCanvasSize() {
  return { width: canvas.width, height: canvas.height };
}

function buildGrassBackground() {
  const w = canvas.width;
  const h = canvas.height;
  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  const oc = offscreen.getContext('2d');

  // Sky gradient — blue sky fading to warm horizon
  const skyGrad = oc.createLinearGradient(0, 0, 0, h * 0.55);
  skyGrad.addColorStop(0, '#5ab9ea');
  skyGrad.addColorStop(0.7, '#87ceeb');
  skyGrad.addColorStop(1, '#c8e6c9');
  oc.fillStyle = skyGrad;
  oc.fillRect(0, 0, w, h * 0.55);

  // Distant rolling hills (light green, far away)
  oc.fillStyle = '#6db86d';
  oc.beginPath();
  oc.moveTo(0, h * 0.50);
  for (let x = 0; x <= w; x += 2) {
    const y = h * 0.50 + Math.sin(x * 0.004) * h * 0.03 + Math.sin(x * 0.009 + 1) * h * 0.015;
    oc.lineTo(x, y);
  }
  oc.lineTo(w, h);
  oc.lineTo(0, h);
  oc.closePath();
  oc.fill();

  // Mid-ground knoll — the main grassy knoll
  const knollGrad = oc.createLinearGradient(0, h * 0.45, 0, h);
  knollGrad.addColorStop(0, '#4caf50');
  knollGrad.addColorStop(0.4, '#388e3c');
  knollGrad.addColorStop(1, '#2e7d32');
  oc.fillStyle = knollGrad;
  oc.beginPath();
  oc.moveTo(0, h * 0.58);
  for (let x = 0; x <= w; x += 2) {
    const y = h * 0.58
      + Math.sin(x * 0.003 + 0.5) * h * 0.04
      + Math.sin(x * 0.007 + 2) * h * 0.02
      + Math.sin(x * 0.015) * h * 0.008;
    oc.lineTo(x, y);
  }
  oc.lineTo(w, h);
  oc.lineTo(0, h);
  oc.closePath();
  oc.fill();

  // Foreground grass fill — darkest green
  const fgGrad = oc.createLinearGradient(0, h * 0.65, 0, h);
  fgGrad.addColorStop(0, '#388e3c');
  fgGrad.addColorStop(1, '#1b5e20');
  oc.fillStyle = fgGrad;
  oc.beginPath();
  oc.moveTo(0, h * 0.68);
  for (let x = 0; x <= w; x += 2) {
    const y = h * 0.68 + Math.sin(x * 0.006 + 3) * h * 0.02 + Math.sin(x * 0.013 + 1) * h * 0.01;
    oc.lineTo(x, y);
  }
  oc.lineTo(w, h);
  oc.lineTo(0, h);
  oc.closePath();
  oc.fill();

  // Grass blades — lots of little green strokes for texture
  const bladeColors = ['#43a047', '#66bb6a', '#2e7d32', '#81c784', '#a5d6a7'];
  for (let i = 0; i < 1200; i++) {
    const bx = Math.random() * w;
    const by = h * 0.55 + Math.random() * h * 0.45;
    const bladeH = 6 + Math.random() * 14;
    const lean = (Math.random() - 0.5) * 6;
    oc.strokeStyle = bladeColors[Math.floor(Math.random() * bladeColors.length)];
    oc.lineWidth = 1 + Math.random() * 1.5;
    oc.beginPath();
    oc.moveTo(bx, by);
    oc.quadraticCurveTo(bx + lean * 0.5, by - bladeH * 0.6, bx + lean, by - bladeH);
    oc.stroke();
  }

  // A few small wildflowers scattered on the knoll
  const flowerColors = ['#fff176', '#ef5350', '#ce93d8', '#fff', '#ffab40'];
  for (let i = 0; i < 40; i++) {
    const fx = Math.random() * w;
    const fy = h * 0.58 + Math.random() * h * 0.35;
    const fr = 2 + Math.random() * 3;
    oc.fillStyle = flowerColors[Math.floor(Math.random() * flowerColors.length)];
    oc.beginPath();
    oc.arc(fx, fy, fr, 0, Math.PI * 2);
    oc.fill();
  }

  // Soft sun glow in upper corner
  const sunX = w * 0.85;
  const sunY = h * 0.1;
  const sunGrad = oc.createRadialGradient(sunX, sunY, 0, sunX, sunY, h * 0.25);
  sunGrad.addColorStop(0, 'rgba(255, 253, 200, 0.6)');
  sunGrad.addColorStop(0.3, 'rgba(255, 245, 157, 0.25)');
  sunGrad.addColorStop(1, 'rgba(255, 245, 157, 0)');
  oc.fillStyle = sunGrad;
  oc.fillRect(0, 0, w, h * 0.55);

  // Sun disk
  oc.fillStyle = 'rgba(255, 249, 196, 0.9)';
  oc.beginPath();
  oc.arc(sunX, sunY, 30, 0, Math.PI * 2);
  oc.fill();

  return offscreen;
}

export function clearCanvas() {
  if (!grassCache || grassCache.width !== canvas.width || grassCache.height !== canvas.height) {
    grassCache = buildGrassBackground();
  }
  ctx.drawImage(grassCache, 0, 0);
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
