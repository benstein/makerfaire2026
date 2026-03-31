// src/game/earthquake.js
// Zeke's earthquake! At 55s remaining, the arena shakes and chasms open up.

import { CONFIG } from './config.js';

let chasms = [];
let shakeIntensity = 0;
let shakeOffsetX = 0;
let shakeOffsetY = 0;
let triggered = false;
let triggerTime = 0;

const QUAKE_TRIGGER = 55; // seconds remaining
const SHAKE_DURATION = 3000; // ms of intense shaking
const SHAKE_MAX = 12; // max pixel offset during quake
const SHAKE_AFTER = 2; // gentle rumble after chasms open
const NUM_CHASMS = 4;

export function resetEarthquake() {
  chasms = [];
  shakeIntensity = 0;
  shakeOffsetX = 0;
  shakeOffsetY = 0;
  triggered = false;
  triggerTime = 0;
}

export function updateEarthquake(timeRemaining, now, arenaWidth, arenaHeight) {
  // Trigger earthquake at 55s remaining
  if (!triggered && timeRemaining <= QUAKE_TRIGGER) {
    triggered = true;
    triggerTime = now;
    spawnChasms(arenaWidth, arenaHeight);
  }

  if (!triggered) {
    shakeOffsetX = 0;
    shakeOffsetY = 0;
    return;
  }

  const elapsed = now - triggerTime;

  if (elapsed < SHAKE_DURATION) {
    // Intense shaking phase — ramps up then down
    const progress = elapsed / SHAKE_DURATION;
    const envelope = Math.sin(progress * Math.PI); // peaks in middle
    shakeIntensity = SHAKE_MAX * envelope;
  } else {
    // Gentle aftershock rumble
    shakeIntensity = SHAKE_AFTER;
  }

  shakeOffsetX = (Math.random() - 0.5) * 2 * shakeIntensity;
  shakeOffsetY = (Math.random() - 0.5) * 2 * shakeIntensity;
}

function spawnChasms(arenaWidth, arenaHeight) {
  const margin = 80;
  for (let i = 0; i < NUM_CHASMS; i++) {
    const isHorizontal = Math.random() > 0.5;
    const cx = margin + Math.random() * (arenaWidth - margin * 2);
    const cy = margin + Math.random() * (arenaHeight - margin * 2);

    // Jagged chasm shape defined by width/height bounding box
    const w = isHorizontal ? 80 + Math.random() * 120 : 20 + Math.random() * 15;
    const h = isHorizontal ? 20 + Math.random() * 15 : 80 + Math.random() * 120;

    // Generate jagged edge points
    const points = generateCrackPoints(cx, cy, w, h, isHorizontal);

    chasms.push({
      x: cx - w / 2,
      y: cy - h / 2,
      w,
      h,
      cx,
      cy,
      points,
      isHorizontal,
      bornAt: performance.now(),
    });
  }
}

function generateCrackPoints(cx, cy, w, h, isHorizontal) {
  const points = [];
  const segments = 8 + Math.floor(Math.random() * 4);

  if (isHorizontal) {
    // Top edge (left to right)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      points.push({
        x: cx - w / 2 + t * w,
        y: cy - h / 2 + (Math.random() - 0.5) * h * 0.6,
      });
    }
    // Bottom edge (right to left)
    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      points.push({
        x: cx - w / 2 + t * w,
        y: cy + h / 2 + (Math.random() - 0.5) * h * 0.6,
      });
    }
  } else {
    // Left edge (top to bottom)
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      points.push({
        x: cx - w / 2 + (Math.random() - 0.5) * w * 0.6,
        y: cy - h / 2 + t * h,
      });
    }
    // Right edge (bottom to top)
    for (let i = segments; i >= 0; i--) {
      const t = i / segments;
      points.push({
        x: cx + w / 2 + (Math.random() - 0.5) * w * 0.6,
        y: cy - h / 2 + t * h,
      });
    }
  }

  return points;
}

export function checkChasmCollision(playerBounds) {
  if (!triggered) return false;

  // Use center of player for chasm check (more forgiving)
  const px = playerBounds.x + playerBounds.w / 2;
  const py = playerBounds.y + playerBounds.h / 2;
  const shrink = 4; // forgiving margin

  for (const c of chasms) {
    if (
      px > c.x + shrink &&
      px < c.x + c.w - shrink &&
      py > c.y + shrink &&
      py < c.y + c.h - shrink
    ) {
      return true;
    }
  }
  return false;
}

export function getShakeOffset() {
  return { x: shakeOffsetX, y: shakeOffsetY };
}

export function isEarthquakeActive() {
  return triggered;
}

export function drawEarthquake(ctx, arenaWidth, arenaHeight) {
  if (!triggered) return;

  const now = performance.now();

  for (const c of chasms) {
    const age = now - c.bornAt;
    // Chasms widen over first 500ms
    const openProgress = Math.min(1, age / 500);

    ctx.save();
    ctx.translate(c.cx, c.cy);
    ctx.scale(openProgress, openProgress);
    ctx.translate(-c.cx, -c.cy);

    // Dark abyss
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.moveTo(c.points[0].x, c.points[0].y);
    for (let i = 1; i < c.points.length; i++) {
      ctx.lineTo(c.points[i].x, c.points[i].y);
    }
    ctx.closePath();
    ctx.fill();

    // Glowing red/orange edges (lava!)
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ff4500';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(c.points[0].x, c.points[0].y);
    for (let i = 1; i < c.points.length; i++) {
      ctx.lineTo(c.points[i].x, c.points[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner glow
    ctx.strokeStyle = '#ff6b35';
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 4;
    ctx.stroke();

    ctx.restore();
  }
}
