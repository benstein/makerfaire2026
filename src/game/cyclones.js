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
    // Draw tornado-like spiral
    ctx.save();
    ctx.translate(c.x, c.y);

    // Outer ring
    ctx.strokeStyle = 'rgba(127, 140, 141, 0.5)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, CYCLONE_PULL_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    // Spinning spiral
    ctx.strokeStyle = 'rgba(127, 140, 141, 0.8)';
    ctx.lineWidth = 2;
    ctx.rotate(c.rotation);
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((Math.PI * 2 / 3) * i);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, CYCLONE_PULL_RADIUS * 0.8);
      ctx.stroke();
      ctx.restore();
    }

    // Center
    ctx.fillStyle = 'rgba(127, 140, 141, 0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
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
