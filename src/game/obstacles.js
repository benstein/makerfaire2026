// src/game/obstacles.js
// Pipes and ? blocks with solid hitboxes

import { aabb } from './collision.js';

let obstacles = [];

export function resetObstacles(arenaWidth, arenaHeight) {
  const bs = 32; // brick/block size
  obstacles = [
    // Question blocks (scattered around the arena)
    { x: arenaWidth * 0.2, y: arenaHeight * 0.3, w: bs, h: bs, type: 'qblock' },
    { x: arenaWidth * 0.5, y: arenaHeight * 0.25, w: bs, h: bs, type: 'qblock' },
    { x: arenaWidth * 0.8, y: arenaHeight * 0.35, w: bs, h: bs, type: 'qblock' },
    { x: arenaWidth * 0.35, y: arenaHeight * 0.6, w: bs, h: bs, type: 'qblock' },
    { x: arenaWidth * 0.65, y: arenaHeight * 0.55, w: bs, h: bs, type: 'qblock' },

    // Pipes (rim is the hitbox — wider than the body)
    { x: arenaWidth * 0.1 - 4, y: arenaHeight * 0.7, w: 48, h: 60, type: 'pipe' },
    { x: arenaWidth * 0.88 - 4, y: arenaHeight * 0.65, w: 48, h: 80, type: 'pipe' },
  ];
}

export function getObstacles() {
  return obstacles;
}

// Push a movable rect out of all obstacles. Returns the corrected {x, y}.
export function resolveCollision(rect) {
  for (const obs of obstacles) {
    if (!aabb(rect, obs)) continue;

    // Find smallest overlap axis and push out
    const overlapLeft = (rect.x + rect.w) - obs.x;
    const overlapRight = (obs.x + obs.w) - rect.x;
    const overlapTop = (rect.y + rect.h) - obs.y;
    const overlapBottom = (obs.y + obs.h) - rect.y;

    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    if (minOverlap === overlapLeft) rect.x = obs.x - rect.w;
    else if (minOverlap === overlapRight) rect.x = obs.x + obs.w;
    else if (minOverlap === overlapTop) rect.y = obs.y - rect.h;
    else rect.y = obs.y + obs.h;
  }
  return rect;
}

// Check if a rect overlaps any obstacle
export function hitsObstacle(rect) {
  for (const obs of obstacles) {
    if (aabb(rect, obs)) return true;
  }
  return false;
}

export function drawObstacles(ctx) {
  const bs = 32;
  for (const obs of obstacles) {
    if (obs.type === 'qblock') {
      // Question block
      ctx.fillStyle = '#E8A020';
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeStyle = '#804000';
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
      // Inner border highlight
      ctx.fillStyle = '#FFCC44';
      ctx.fillRect(obs.x + 3, obs.y + 3, obs.w - 6, obs.h - 6);
      ctx.fillStyle = '#E8A020';
      ctx.fillRect(obs.x + 5, obs.y + 5, obs.w - 10, obs.h - 10);
      // ? mark
      ctx.fillStyle = '#804000';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('?', obs.x + obs.w / 2, obs.y + obs.h * 0.75);
      ctx.textAlign = 'left';
    } else if (obs.type === 'pipe') {
      const pipeBody = 40;
      const rimExtra = 4;
      const bodyX = obs.x + rimExtra;
      // Pipe body (green)
      ctx.fillStyle = '#00A800';
      ctx.fillRect(bodyX, obs.y + 14, pipeBody, obs.h - 14);
      // Pipe rim (wider top)
      ctx.fillStyle = '#00D800';
      ctx.fillRect(obs.x, obs.y, obs.w, 14);
      // Rim border
      ctx.strokeStyle = '#006800';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(obs.x, obs.y, obs.w, 14);
      // Pipe highlight (light stripe)
      ctx.fillStyle = '#40FF40';
      ctx.fillRect(bodyX + 4, obs.y + 14, 6, obs.h - 14);
      // Dark stripe on right
      ctx.fillStyle = '#006800';
      ctx.fillRect(bodyX + pipeBody - 6, obs.y + 14, 4, obs.h - 14);
    }
  }
}
