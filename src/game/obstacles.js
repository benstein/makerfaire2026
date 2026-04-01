// src/game/obstacles.js
// Pipes and ? blocks with solid hitboxes + pipe teleportation

import { aabb } from './collision.js';

let obstacles = [];
let pipes = []; // just the pipe obstacles, for quick access
let warpCooldownUntil = 0; // prevent instant re-warp
let warpAnim = null; // { phase: 'down'|'up', pipe: obstacle, targetPipe: obstacle, startTime, duration }

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
    { x: arenaWidth * 0.1 - 4, y: arenaHeight * 0.7, w: 48, h: 60, type: 'pipe', id: 0 },
    { x: arenaWidth * 0.88 - 4, y: arenaHeight * 0.65, w: 48, h: 80, type: 'pipe', id: 1 },
  ];
  pipes = obstacles.filter(o => o.type === 'pipe');
  warpCooldownUntil = 0;
  warpAnim = null;
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

const WARP_DOWN_DURATION = 400; // ms to sink into pipe
const WARP_UP_DURATION = 400;   // ms to rise from other pipe
const WARP_COOLDOWN = 1200;     // ms before you can warp again

// Check if player is on top of a pipe and trigger warp
export function checkPipeWarp(playerBounds, now) {
  if (warpAnim) return null; // already warping
  if (now < warpCooldownUntil) return null;

  for (const pipe of pipes) {
    // "On top" = player's bottom edge is near the pipe's top edge, horizontally overlapping
    const playerBottom = playerBounds.y + playerBounds.h;
    const playerCenterX = playerBounds.x + playerBounds.w / 2;
    const pipeCenterX = pipe.x + pipe.w / 2;
    const pipeTop = pipe.y;

    const verticallyClose = playerBottom >= pipeTop - 2 && playerBottom <= pipeTop + 8;
    const horizontallyOverlapping = Math.abs(playerCenterX - pipeCenterX) < pipe.w / 2;

    if (verticallyClose && horizontallyOverlapping) {
      // Found the entry pipe — find the other one
      const targetPipe = pipes.find(p => p.id !== pipe.id);
      if (!targetPipe) return null;

      warpAnim = {
        phase: 'down',
        pipe,
        targetPipe,
        startTime: now,
        duration: WARP_DOWN_DURATION,
      };
      return { warping: true, pipe };
    }
  }
  return null;
}

// Update warp animation. Returns player override position or null.
export function updateWarp(now) {
  if (!warpAnim) return null;

  const elapsed = now - warpAnim.startTime;

  if (warpAnim.phase === 'down') {
    const t = Math.min(elapsed / warpAnim.duration, 1);
    const pipe = warpAnim.pipe;
    const cx = pipe.x + pipe.w / 2;
    const cy = pipe.y + t * 40; // sink into pipe

    if (t >= 1) {
      // Player sank into pipe — transition to water world!
      const pipeId = warpAnim.pipe.id;
      warpAnim = null;
      warpCooldownUntil = now + WARP_COOLDOWN;
      return { x: cx, y: cy, scale: 0.3, warping: false, enterWaterWorld: true, pipeId };
    }

    return { x: cx, y: cy, scale: 1 - t * 0.7, warping: true };
  }

  if (warpAnim.phase === 'up') {
    const t = Math.min(elapsed / warpAnim.duration, 1);
    const pipe = warpAnim.targetPipe;
    const cx = pipe.x + pipe.w / 2;
    const cy = pipe.y + (1 - t) * 40; // rise up from pipe

    if (t >= 1) {
      // Warp complete
      const finalX = cx;
      const finalY = pipe.y - 20; // pop out above the pipe
      warpAnim = null;
      warpCooldownUntil = now + WARP_COOLDOWN;
      return { x: finalX, y: finalY, scale: 1, warping: false, done: true };
    }

    return { x: cx, y: cy, scale: 0.3 + t * 0.7, warping: true };
  }

  return null;
}

// Start the rise-up animation at a specific pipe (used when returning from water world)
export function startRiseFromPipe(pipeId, now) {
  const pipe = pipes.find(p => p.id === pipeId);
  if (!pipe) return;
  const targetPipe = pipe; // rising from this pipe
  warpAnim = {
    phase: 'up',
    pipe: targetPipe,
    targetPipe: targetPipe,
    startTime: now,
    duration: WARP_UP_DURATION,
  };
}

export function isWarping() {
  return warpAnim !== null;
}

export function getWarpAnim() {
  return warpAnim;
}

export function drawObstacles(ctx, now) {
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

      // Dark inside of pipe (visible hole at top)
      ctx.fillStyle = '#003300';
      ctx.fillRect(bodyX + 6, obs.y + 2, pipeBody - 12, 12);

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

      // Pulsing glow around rim to show it's a warp pipe
      const time = (now || performance.now()) / 1000;
      const canWarp = !warpAnim && (now || performance.now()) >= warpCooldownUntil;
      if (canWarp) {
        const glow = 0.3 + Math.sin(time * 4 + obs.id * 2) * 0.2;
        ctx.save();
        ctx.shadowColor = '#FFFF00';
        ctx.shadowBlur = 10 + Math.sin(time * 4) * 5;
        ctx.strokeStyle = `rgba(255, 255, 0, ${glow})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(obs.x - 1, obs.y - 1, obs.w + 2, 16);
        ctx.restore();
      }
    }
  }
}
