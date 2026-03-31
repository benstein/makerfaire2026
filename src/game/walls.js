// src/game/walls.js
// Sana's maze walls! Player can't pass through, but enemies ghost right through them.

import { CONFIG } from './config.js';

let walls = [];

// Wall positions as fractions of arena size — keeps layout proportional
const WALL_LAYOUT = [
  // Horizontal walls
  { x: 0.15, y: 0.30, w: 0.22, h: 0.02 },
  { x: 0.60, y: 0.25, w: 0.25, h: 0.02 },
  { x: 0.25, y: 0.70, w: 0.20, h: 0.02 },
  { x: 0.55, y: 0.75, w: 0.28, h: 0.02 },
  // Vertical walls
  { x: 0.35, y: 0.10, w: 0.02, h: 0.22 },
  { x: 0.70, y: 0.40, w: 0.02, h: 0.25 },
  { x: 0.20, y: 0.45, w: 0.02, h: 0.20 },
];

const WALL_COLOR = '#4a4a6a';
const WALL_BORDER = '#6a6a8a';
const WALL_MIN_THICKNESS = 12;

export function resetWalls(arenaWidth, arenaHeight) {
  walls = WALL_LAYOUT.map(def => ({
    x: def.x * arenaWidth,
    y: def.y * arenaHeight,
    w: Math.max(def.w * arenaWidth, WALL_MIN_THICKNESS),
    h: Math.max(def.h * arenaHeight, WALL_MIN_THICKNESS),
  }));
}

export function resolvePlayerWallCollision(px, py, playerSize) {
  const half = playerSize / 2;
  let newX = px;
  let newY = py;

  for (const wall of walls) {
    // Player bounds
    const pLeft = newX - half;
    const pRight = newX + half;
    const pTop = newY - half;
    const pBottom = newY + half;

    // Check overlap
    if (pRight > wall.x && pLeft < wall.x + wall.w &&
        pBottom > wall.y && pTop < wall.y + wall.h) {
      // Find smallest push-out direction
      const pushLeft = pRight - wall.x;
      const pushRight = (wall.x + wall.w) - pLeft;
      const pushUp = pBottom - wall.y;
      const pushDown = (wall.y + wall.h) - pTop;

      const minPush = Math.min(pushLeft, pushRight, pushUp, pushDown);

      if (minPush === pushLeft) newX -= pushLeft;
      else if (minPush === pushRight) newX += pushRight;
      else if (minPush === pushUp) newY -= pushUp;
      else newY += pushDown;
    }
  }

  return { x: newX, y: newY };
}

export function drawWalls(ctx) {
  for (const wall of walls) {
    // Wall body
    ctx.fillStyle = WALL_COLOR;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

    // Top/left highlight
    ctx.fillStyle = WALL_BORDER;
    ctx.fillRect(wall.x, wall.y, wall.w, 2);
    ctx.fillRect(wall.x, wall.y, 2, wall.h);

    // Bottom/right shadow
    ctx.fillStyle = '#2a2a4a';
    ctx.fillRect(wall.x, wall.y + wall.h - 2, wall.w, 2);
    ctx.fillRect(wall.x + wall.w - 2, wall.y, 2, wall.h);

    // Brick pattern
    ctx.strokeStyle = '#3a3a5a';
    ctx.lineWidth = 0.5;
    const brickH = 10;
    const brickW = 20;
    for (let row = 0; row < wall.h / brickH; row++) {
      const by = wall.y + row * brickH;
      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(wall.x, by);
      ctx.lineTo(wall.x + wall.w, by);
      ctx.stroke();
      // Vertical lines (offset every other row)
      const offset = (row % 2) * (brickW / 2);
      for (let col = 0; col < wall.w / brickW + 1; col++) {
        const bx = wall.x + col * brickW + offset;
        if (bx > wall.x && bx < wall.x + wall.w) {
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx, Math.min(by + brickH, wall.y + wall.h));
          ctx.stroke();
        }
      }
    }
  }
}

export function getWalls() {
  return walls;
}
