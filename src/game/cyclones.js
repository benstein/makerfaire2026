// src/game/cyclones.js
// Cyclones — touch one and you spin around it!

import { CONFIG } from './config.js';

const CYCLONE_SIZE = 50;
const CYCLONE_COLOR = '#7f8c8d';
const CYCLONE_PULL_RADIUS = 100;
const CYCLONE_SPIN_SPEED = 0.04; // radians per frame
const SPAWN_INTERVAL = 3000; // ms between spawns
const MAX_CYCLONES = 6;

let cyclones = [];
let lastSpawnTime = 0;
let playerSpinState = null; // { angle, cycloneIndex }

export function resetCyclones() {
  cyclones = [];
  lastSpawnTime = 0;
  playerSpinState = null;

  // Spawn initial cyclones
  const canvas = document.querySelector('canvas');
  if (canvas) {
    const { width, height } = canvas;
    for (let i = 0; i < 3; i++) {
      const x = Math.random() * (width - 200) + 100;
      const y = Math.random() * (height - 200) + 100;
      cyclones.push({ x, y, rotation: Math.random() * Math.PI * 2 });
    }
  }
}

export function updateCyclones(dt, playerPos, setPlayerPos) {
  const now = performance.now();

  // Spawn new cyclones periodically
  if (now - lastSpawnTime > SPAWN_INTERVAL && cyclones.length < MAX_CYCLONES) {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const { width, height } = canvas;
      const x = Math.random() * (width - 200) + 100;
      const y = Math.random() * (height - 200) + 100;
      cyclones.push({ x, y, rotation: Math.random() * Math.PI * 2 });
      lastSpawnTime = now;
    }
  }

  // Update cyclone rotations
  cyclones.forEach(c => {
    c.rotation += CYCLONE_SPIN_SPEED;
  });

  // Check if player is in any cyclone's pull radius
  let inCyclone = false;
  for (let i = 0; i < cyclones.length; i++) {
    const c = cyclones[i];
    const dx = playerPos.x - c.x;
    const dy = playerPos.y - c.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < CYCLONE_PULL_RADIUS) {
      inCyclone = true;
      if (!playerSpinState || playerSpinState.cycloneIndex !== i) {
        // Just entered a new cyclone
        playerSpinState = {
          cycloneIndex: i,
          angle: Math.atan2(dy, dx),
        };
      }

      // Update spin angle and position
      playerSpinState.angle += CYCLONE_SPIN_SPEED * 1.5;
      const orbitRadius = Math.max(60, CYCLONE_PULL_RADIUS - dist);
      const newX = c.x + Math.cos(playerSpinState.angle) * orbitRadius;
      const newY = c.y + Math.sin(playerSpinState.angle) * orbitRadius;

      // Apply new position to player
      if (setPlayerPos) {
        setPlayerPos(newX, newY);
      }
      return true;
    }
  }

  if (!inCyclone) {
    playerSpinState = null;
  }

  return false;
}

export function drawCyclones(ctx) {
  cyclones.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);

    const topW = 48;
    const midW = 22;
    const botW = 5;
    const height = 70;
    const bands = 6;

    // Faint pull-zone hint — just a soft glow on the ground
    const grd = ctx.createRadialGradient(0, height * 0.4, 0, 0, height * 0.4, CYCLONE_PULL_RADIUS * 0.9);
    grd.addColorStop(0, 'rgba(150, 180, 210, 0.12)');
    grd.addColorStop(1, 'rgba(150, 180, 210, 0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, height * 0.4, CYCLONE_PULL_RADIUS * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // Tornado body — horizontal bands that narrow from top to bottom
    for (let b = 0; b < bands; b++) {
      const t = b / bands;
      const t1 = (b + 1) / bands;
      const w0 = topW * (1 - t)   + botW * t;
      const w1 = topW * (1 - t1)  + botW * t1;
      // mix in midW bulge
      const wAdjusted0 = w0 - (w0 - midW) * Math.sin(t * Math.PI) * 0.4;
      const wAdjusted1 = w1 - (w1 - midW) * Math.sin(t1 * Math.PI) * 0.4;
      const y0 = -height * 0.5 + height * t;
      const y1 = -height * 0.5 + height * t1;

      // Swirl offset makes bands feel like they're rotating
      const swirl = Math.sin(c.rotation * 2 + b * 0.9) * 6;

      const alpha = 0.55 + 0.3 * (1 - t);
      ctx.fillStyle = `rgba(130, 160, 200, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(-wAdjusted0 + swirl,  y0);
      ctx.lineTo( wAdjusted0 + swirl,  y0);
      ctx.lineTo( wAdjusted1 - swirl,  y1);
      ctx.lineTo(-wAdjusted1 - swirl,  y1);
      ctx.closePath();
      ctx.fill();
    }

    // Swirling debris dots orbiting the funnel
    for (let d = 0; d < 5; d++) {
      const angle = c.rotation * 3 + (d / 5) * Math.PI * 2;
      const tPos  = d / 5;
      const r = (topW * (1 - tPos) + botW * tPos) * 0.85;
      const dy = -height * 0.5 + height * tPos;
      const dx = Math.cos(angle) * r;
      ctx.fillStyle = `rgba(80, 110, 160, ${0.7 - tPos * 0.4})`;
      ctx.beginPath();
      ctx.arc(dx, dy, 3 - tPos * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Narrow tip at the bottom
    ctx.fillStyle = 'rgba(80, 110, 160, 0.9)';
    ctx.beginPath();
    ctx.arc(0, height * 0.5, botW, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

export function isSpinning() {
  return playerSpinState !== null;
}

export function removeCyclone(index) {
  cyclones.splice(index, 1);
  if (playerSpinState && playerSpinState.cycloneIndex === index) {
    playerSpinState = null;
  }
}

export function getCyclones() {
  return cyclones;
}
