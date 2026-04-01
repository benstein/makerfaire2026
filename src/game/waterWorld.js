// src/game/waterWorld.js
// Underwater side-scroller sub-level accessed via warp pipes

import { CONFIG } from './config.js';
import { aabb } from './collision.js';

// Water world dimensions (scrolls horizontally)
const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 600; // will be stretched to canvas height

// Swimming Mario state
let mx, my, mvx, mvy;
const SWIM_ACCEL = 0.15;
const SWIM_FRICTION = 0.97;
const GRAVITY = 0.03; // gentle sinking
const MARIO_SIZE = 32;

// Camera
let cameraX = 0;

// Fish enemies
let fish = [];
const FISH_TYPES = ['cheep', 'blooper'];

// Bubbles (decoration)
let bubbles = [];

// Pipes
let entryPipe, exitPipe;

// Exit animation
let exitAnim = null; // { phase: 'down'|'up', startTime, duration }

// Entry pipe ID the player used (so we know which pipe to exit from in the arena)
let entryPipeId = 0;

export function getExitPipeId() {
  // Player exits from the OTHER pipe in the arena
  return entryPipeId === 0 ? 1 : 0;
}

export function resetWaterWorld(canvasWidth, canvasHeight, pipeId) {
  entryPipeId = pipeId;

  // Mario starts near the left pipe
  mx = 120;
  my = canvasHeight / 2;
  mvx = 0;
  mvy = 0;
  cameraX = 0;
  exitAnim = null;

  // Entry pipe on left, exit pipe on right
  entryPipe = { x: 20, y: canvasHeight * 0.6, w: 48, h: 80 };
  exitPipe = { x: WORLD_WIDTH - 68, y: canvasHeight * 0.5, w: 48, h: 80 };

  // Spawn fish throughout the level
  fish = [];
  const fishCount = 12 + Math.floor(Math.random() * 6);
  for (let i = 0; i < fishCount; i++) {
    const fx = 300 + Math.random() * (WORLD_WIDTH - 500);
    const fy = 40 + Math.random() * (canvasHeight - 80);
    const isBlooper = Math.random() < 0.25;
    fish.push({
      x: fx, y: fy,
      w: isBlooper ? 24 : 28,
      h: isBlooper ? 28 : 18,
      type: isBlooper ? 'blooper' : 'cheep',
      vx: isBlooper ? 0 : (Math.random() < 0.5 ? -1.5 : 1.5) * (0.8 + Math.random() * 0.8),
      vy: isBlooper ? -2 : (Math.random() - 0.5) * 0.5,
      baseY: fy,
      color: isBlooper ? '#fff' : ['#E52521', '#FF6600', '#2ECC71', '#FFD700'][Math.floor(Math.random() * 4)],
      phase: Math.random() * Math.PI * 2,
    });
  }

  // Bubbles
  bubbles = [];
  for (let i = 0; i < 30; i++) {
    bubbles.push({
      x: Math.random() * WORLD_WIDTH,
      y: Math.random() * canvasHeight,
      size: 2 + Math.random() * 4,
      speed: 0.3 + Math.random() * 0.5,
      wobble: Math.random() * Math.PI * 2,
    });
  }
}

export function updateWaterWorld(dt, input, canvasWidth, canvasHeight, now) {
  if (exitAnim) return updateExitAnim(now);

  const scale = dt / 16.67;

  // Swimming controls — floaty water physics
  mvx += input.stickX * SWIM_ACCEL * scale;
  mvy += input.stickY * SWIM_ACCEL * scale;
  mvy += GRAVITY * scale; // gentle sink

  // Water friction
  mvx *= SWIM_FRICTION;
  mvy *= SWIM_FRICTION;

  // A button = swim burst upward
  if (input.fire) {
    mvy -= 0.8;
  }

  mx += mvx * scale;
  my += mvy * scale;

  // Clamp to world
  mx = Math.max(MARIO_SIZE / 2, Math.min(WORLD_WIDTH - MARIO_SIZE / 2, mx));
  my = Math.max(MARIO_SIZE / 2, Math.min(canvasHeight - MARIO_SIZE / 2, my));

  // Camera follows Mario
  cameraX = Math.max(0, Math.min(WORLD_WIDTH - canvasWidth, mx - canvasWidth * 0.35));

  // Update fish
  for (const f of fish) {
    if (f.type === 'cheep') {
      f.x += f.vx * scale;
      f.y = f.baseY + Math.sin(now / 800 + f.phase) * 30;
      // Bounce off world edges
      if (f.x < 0 || f.x > WORLD_WIDTH) f.vx *= -1;
    } else {
      // Blooper — bob up then drift down
      f.vy += 0.02 * scale;
      if (f.y > f.baseY + 40) f.vy = -2.5; // jet upward
      f.y += f.vy * scale;
      f.x += Math.sin(now / 600 + f.phase) * 0.3 * scale;
    }
  }

  // Update bubbles
  for (const b of bubbles) {
    b.y -= b.speed * scale;
    b.x += Math.sin(now / 1000 + b.wobble) * 0.2;
    if (b.y < -10) {
      b.y = canvasHeight + 10;
      b.x = Math.random() * WORLD_WIDTH;
    }
  }

  // Fish-Mario collision
  const marioBounds = { x: mx - MARIO_SIZE / 2 + 4, y: my - MARIO_SIZE / 2 + 4, w: MARIO_SIZE - 8, h: MARIO_SIZE - 8 };
  for (const f of fish) {
    if (aabb(marioBounds, f)) {
      return { hit: true }; // Mario got hit by a fish
    }
  }

  // Check if Mario reached exit pipe
  const exitZone = { x: exitPipe.x - 10, y: exitPipe.y, w: exitPipe.w + 20, h: exitPipe.h };
  if (aabb(marioBounds, exitZone)) {
    exitAnim = { phase: 'down', startTime: now, duration: 500 };
    return { exiting: true };
  }

  return null;
}

function updateExitAnim(now) {
  const elapsed = now - exitAnim.startTime;
  const t = Math.min(elapsed / exitAnim.duration, 1);

  if (t >= 1) {
    exitAnim = null;
    return { exitComplete: true };
  }

  return { animating: true };
}

export function isExitAnimating() {
  return exitAnim !== null;
}

export function drawWaterWorld(ctx, canvasWidth, canvasHeight, now, playerHealth, timeRemaining) {
  // Water background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
  grad.addColorStop(0, '#0A2463');
  grad.addColorStop(0.5, '#1B4F8A');
  grad.addColorStop(1, '#0D2137');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.save();
  ctx.translate(-cameraX, 0);

  // Sandy bottom
  ctx.fillStyle = '#C2956B';
  ctx.fillRect(0, canvasHeight - 30, WORLD_WIDTH, 30);
  ctx.fillStyle = '#A67B50';
  for (let sx = 0; sx < WORLD_WIDTH; sx += 60) {
    ctx.fillRect(sx + 10, canvasHeight - 25, 30, 3);
  }

  // Seaweed
  for (let sw = 100; sw < WORLD_WIDTH; sw += 180 + Math.sin(sw) * 50) {
    const swayTime = now / 1000;
    ctx.fillStyle = '#1B7A2B';
    ctx.save();
    ctx.translate(sw, canvasHeight - 30);
    for (let seg = 0; seg < 4; seg++) {
      const sway = Math.sin(swayTime * 1.5 + sw * 0.01 + seg * 0.8) * 6;
      ctx.fillRect(sway - 4, -20 - seg * 18, 8, 20);
    }
    ctx.restore();
  }

  // Bubbles
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#88CCFF';
  for (const b of bubbles) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Entry pipe (left)
  drawUnderwaterPipe(ctx, entryPipe, 'entry');

  // Exit pipe (right)
  drawUnderwaterPipe(ctx, exitPipe, 'exit');

  // "EXIT" label above exit pipe
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  const exitLabelBob = Math.sin(now / 500) * 3;
  ctx.fillText('EXIT', exitPipe.x + exitPipe.w / 2, exitPipe.y - 12 + exitLabelBob);
  // Arrow pointing down
  ctx.fillText('v', exitPipe.x + exitPipe.w / 2, exitPipe.y - 0 + exitLabelBob);
  ctx.textAlign = 'left';

  // Fish
  for (const f of fish) {
    ctx.save();
    ctx.translate(f.x + f.w / 2, f.y + f.h / 2);

    if (f.type === 'cheep') {
      // Cheep Cheep — colorful fish
      const dir = f.vx > 0 ? 1 : -1;
      ctx.scale(dir, 1);

      // Body
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, f.w / 2, f.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tail
      ctx.beginPath();
      ctx.moveTo(-f.w / 2, 0);
      ctx.lineTo(-f.w / 2 - 8, -6);
      ctx.lineTo(-f.w / 2 - 8, 6);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(f.w * 0.15, -2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(f.w * 0.2, -2, 2, 0, Math.PI * 2);
      ctx.fill();

      // Fin
      ctx.fillStyle = f.color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(0, -f.h / 2);
      ctx.lineTo(-6, -f.h / 2 - 8);
      ctx.lineTo(4, -f.h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    } else {
      // Blooper — white squid
      ctx.fillStyle = '#fff';
      // Body dome
      ctx.beginPath();
      ctx.ellipse(0, -4, 10, 14, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(-10, -4, 20, 8);

      // Tentacles
      const wiggle = Math.sin(now / 200 + f.phase);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      for (let t = -2; t <= 2; t++) {
        ctx.beginPath();
        ctx.moveTo(t * 4, 4);
        ctx.quadraticCurveTo(t * 4 + wiggle * 3, 14, t * 4 + wiggle * 5, 18);
        ctx.stroke();
      }

      // Eyes
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-4, -4, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(4, -4, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // Swimming Mario
  if (!exitAnim || (now - exitAnim.startTime) / exitAnim.duration < 1) {
    const marioAlpha = exitAnim ? 1 - (now - exitAnim.startTime) / exitAnim.duration : 1;
    ctx.save();
    ctx.globalAlpha = marioAlpha;
    ctx.translate(mx, my);

    // Swimming pose — horizontal Mario
    const swimBob = Math.sin(now / 200) * 3;
    const s = MARIO_SIZE;
    const px = s / 14;

    // Body tilted for swimming
    ctx.rotate(Math.sin(now / 300) * 0.1);

    // Simplified swimming Mario
    // Hat
    ctx.fillStyle = '#E52521';
    ctx.fillRect(-s/2 + 2*px, -s/2, 10*px, 2*px);
    // Face
    ctx.fillStyle = '#FEB982';
    ctx.fillRect(-s/2 + 2*px, -s/2 + 2*px, 8*px, 4*px);
    // Eyes
    ctx.fillStyle = '#6B3A23';
    ctx.fillRect(-s/2 + 3*px, -s/2 + 3*px, px, px);
    ctx.fillRect(-s/2 + 7*px, -s/2 + 3*px, px, px);
    // Mustache
    ctx.fillRect(-s/2 + 3*px, -s/2 + 5*px, 5*px, px);
    // Body (blue overalls)
    ctx.fillStyle = '#049CD8';
    ctx.fillRect(-s/2 + px, -s/2 + 6*px, 10*px, 4*px);
    // Shirt
    ctx.fillStyle = '#E52521';
    ctx.fillRect(-s/2 + 4*px, -s/2 + 6*px, 3*px, px);
    // Kicking legs
    const kick = Math.sin(now / 100) * 2 * px;
    ctx.fillStyle = '#6B3A23';
    ctx.fillRect(-s/2 + 2*px, -s/2 + 10*px + kick, 3*px, 2*px);
    ctx.fillRect(-s/2 + 7*px, -s/2 + 10*px - kick, 3*px, 2*px);
    // Arms swimming
    const armSwim = Math.sin(now / 150) * 3 * px;
    ctx.fillStyle = '#FEB982';
    ctx.fillRect(-s/2 - px + armSwim, -s/2 + 7*px, 2*px, px);
    ctx.fillRect(-s/2 + 11*px - armSwim, -s/2 + 7*px, 2*px, px);

    ctx.restore();
  }

  ctx.restore(); // undo camera translation

  // Water overlay (translucent blue tint)
  ctx.fillStyle = 'rgba(10, 36, 99, 0.15)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Light rays from surface
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#88DDFF';
  for (let r = 0; r < 5; r++) {
    const rx = (r * canvasWidth / 4 + now / 30) % (canvasWidth + 200) - 100;
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.lineTo(rx + 40, 0);
    ctx.lineTo(rx + 100, canvasHeight);
    ctx.lineTo(rx + 20, canvasHeight);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // HUD overlay — hearts + timer + "WATER WORLD" label
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('~ WATER WORLD ~', canvasWidth / 2, 24);
  ctx.textAlign = 'left';

  // Hearts
  for (let i = 0; i < CONFIG.playerMaxHealth; i++) {
    const hx = 15 + i * 28;
    const hy = 40;
    if (i < playerHealth) {
      ctx.fillStyle = CONFIG.heartColor;
    } else {
      ctx.fillStyle = '#333';
    }
    ctx.beginPath();
    ctx.moveTo(hx + 10, hy + 6);
    ctx.bezierCurveTo(hx, hy - 3, hx - 6, hy - 8, hx + 10, hy - 4);
    ctx.bezierCurveTo(hx + 26, hy - 8, hx + 20, hy - 3, hx + 10, hy + 6);
    ctx.fill();
  }

  // Timer
  ctx.fillStyle = CONFIG.timerColor;
  ctx.font = `bold ${CONFIG.hudFontSize}px monospace`;
  ctx.textAlign = 'right';
  ctx.fillText(String(Math.ceil(timeRemaining)), canvasWidth - 15, 55);
  ctx.textAlign = 'left';

  // Scroll progress bar
  const progress = Math.min(1, mx / (WORLD_WIDTH - 100));
  const barW = canvasWidth * 0.4;
  const barX = canvasWidth / 2 - barW / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(barX, canvasHeight - 16, barW, 6);
  ctx.fillStyle = '#2ECC71';
  ctx.fillRect(barX, canvasHeight - 16, barW * progress, 6);
}

function drawUnderwaterPipe(ctx, pipe, label) {
  const pipeBody = 40;
  const rimExtra = 4;
  const bodyX = pipe.x + rimExtra;

  // Dark hole
  ctx.fillStyle = '#001100';
  ctx.fillRect(bodyX + 6, pipe.y + 2, pipeBody - 12, 12);

  // Pipe body
  ctx.fillStyle = '#00A800';
  ctx.fillRect(bodyX, pipe.y + 14, pipeBody, pipe.h - 14);
  // Rim
  ctx.fillStyle = '#00D800';
  ctx.fillRect(pipe.x, pipe.y, pipe.w, 14);
  ctx.strokeStyle = '#006800';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(pipe.x, pipe.y, pipe.w, 14);
  // Highlight
  ctx.fillStyle = '#40FF40';
  ctx.fillRect(bodyX + 4, pipe.y + 14, 6, pipe.h - 14);
  ctx.fillStyle = '#006800';
  ctx.fillRect(bodyX + pipeBody - 6, pipe.y + 14, 4, pipe.h - 14);

  // Barnacles/coral on underwater pipes
  ctx.fillStyle = '#7B5E3A';
  ctx.fillRect(pipe.x - 3, pipe.y + pipe.h - 10, 6, 6);
  ctx.fillRect(pipe.x + pipe.w - 3, pipe.y + pipe.h - 15, 6, 8);
  ctx.fillStyle = '#FF6B6B';
  ctx.beginPath();
  ctx.arc(pipe.x + pipe.w + 2, pipe.y + 30, 4, 0, Math.PI * 2);
  ctx.fill();
}
