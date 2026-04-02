// src/game/meat.js
// Dropped meat that distracts enemies

import { aabb } from './collision.js';

let meats = [];
let lastDropTime = 0;
const DROP_COOLDOWN = 1500; // ms between drops
const MEAT_LIFETIME = 8000; // ms before meat disappears
const EAT_DURATION = 1000;  // ms to eat meat

export function resetMeat() {
  meats = [];
  lastDropTime = 0;
}

export function tryDropMeat(x, y, now) {
  if (now - lastDropTime < DROP_COOLDOWN) return false;
  lastDropTime = now;
  meats.push({
    x: x - 10,
    y: y - 8,
    w: 20,
    h: 16,
    spawnTime: now,
    beingEaten: false,
    eatStartTime: 0,
  });
  return true;
}

export function getMeats() {
  return meats;
}

export function updateMeat(now) {
  for (let i = meats.length - 1; i >= 0; i--) {
    const meat = meats[i];

    // Remove if eaten
    if (meat.beingEaten && now - meat.eatStartTime > EAT_DURATION) {
      meats.splice(i, 1);
      continue;
    }

    // Remove if expired
    if (!meat.beingEaten && now - meat.spawnTime > MEAT_LIFETIME) {
      meats.splice(i, 1);
    }
  }
}

// Find the nearest meat that isn't already being eaten, for an enemy to target
export function findNearestMeat(ex, ey) {
  let closest = null;
  let closestDist = Infinity;
  for (const meat of meats) {
    if (meat.beingEaten) continue;
    const dx = (meat.x + meat.w / 2) - ex;
    const dy = (meat.y + meat.h / 2) - ey;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < closestDist) {
      closestDist = dist;
      closest = meat;
    }
  }
  return closest;
}

// Try to start eating a meat (called when enemy reaches it)
export function startEating(meat, now) {
  if (meat.beingEaten) return false;
  meat.beingEaten = true;
  meat.eatStartTime = now;
  return true;
}

export function drawMeat(ctx, now) {
  for (const meat of meats) {
    const cx = meat.x + meat.w / 2;
    const cy = meat.y + meat.h / 2;
    const age = now - meat.spawnTime;

    // Blink when about to expire
    if (!meat.beingEaten && MEAT_LIFETIME - age < 2000) {
      if (Math.floor(age / 150) % 2 === 0) continue;
    }

    ctx.save();
    ctx.translate(cx, cy);

    if (meat.beingEaten) {
      // Shrink as it's eaten
      const eatProgress = Math.min(1, (now - meat.eatStartTime) / EAT_DURATION);
      const s = 1 - eatProgress * 0.8;
      ctx.scale(s, s);
      // Wobble
      ctx.rotate(Math.sin(now / 50) * 0.2);
    }

    // Meat body — brown steak shape
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fat marbling
    ctx.fillStyle = '#D2691E';
    ctx.beginPath();
    ctx.ellipse(-2, -1, 5, 3, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Bone sticking out
    ctx.fillStyle = '#F5DEB3';
    ctx.beginPath();
    ctx.moveTo(7, -2);
    ctx.lineTo(12, -5);
    ctx.lineTo(13, -3);
    ctx.lineTo(8, 0);
    ctx.closePath();
    ctx.fill();
    // Bone knob
    ctx.beginPath();
    ctx.arc(13, -4, 2, 0, Math.PI * 2);
    ctx.fill();

    // Grill marks
    ctx.strokeStyle = '#5C2D00';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-5, -2);
    ctx.lineTo(-1, 2);
    ctx.moveTo(-1, -3);
    ctx.lineTo(3, 1);
    ctx.moveTo(3, -2);
    ctx.lineTo(6, 1);
    ctx.stroke();

    // Steam wisps if not being eaten
    if (!meat.beingEaten) {
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      for (let w = 0; w < 3; w++) {
        const wx = -4 + w * 4;
        const waveOffset = Math.sin(now / 300 + w * 2) * 2;
        const steamY = -8 - Math.sin(now / 400 + w) * 3;
        ctx.beginPath();
        ctx.moveTo(wx, -6);
        ctx.quadraticCurveTo(wx + waveOffset, steamY - 3, wx, steamY - 6);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}
