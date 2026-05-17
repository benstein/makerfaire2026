// src/game/firePosts.js
// Breakable fire posts scattered around the arena with random loot

import { aabb } from './collision.js';

let posts = [];
const POST_SIZE = 18;
const RESPAWN_INTERVAL = 8000; // new post every 8 seconds
let lastSpawnTime = 0;
const MAX_POSTS = 8;

export function resetFirePosts(arenaWidth, arenaHeight, now) {
  posts = [];
  lastSpawnTime = now || performance.now();
  // Start with a few posts
  for (let i = 0; i < 5; i++) {
    spawnPost(arenaWidth, arenaHeight);
  }
}

function spawnPost(arenaWidth, arenaHeight) {
  if (posts.length >= MAX_POSTS) return;
  const margin = 60;
  posts.push({
    x: margin + Math.random() * (arenaWidth - margin * 2),
    y: margin + Math.random() * (arenaHeight - margin * 2),
    w: POST_SIZE,
    h: POST_SIZE,
    hp: 1,
  });
}

export function updateFirePosts(now, arenaWidth, arenaHeight) {
  // Periodically spawn new posts
  if (now - lastSpawnTime > RESPAWN_INTERVAL && posts.length < MAX_POSTS) {
    spawnPost(arenaWidth, arenaHeight);
    lastSpawnTime = now;
  }
}

// Check projectile hits. Returns array of loot drops: { x, y, type, xpAmount }
export function checkProjectileHits(projList, removeProjFn) {
  const drops = [];
  for (let i = projList.length - 1; i >= 0; i--) {
    for (let j = posts.length - 1; j >= 0; j--) {
      if (aabb(projList[i], posts[j])) {
        const post = posts[j];
        const cx = post.x + post.w / 2;
        const cy = post.y + post.h / 2;
        removeProjFn(i);
        posts.splice(j, 1);

        // Roll loot: 20% heart, 50% 1xp, 20% 3xp, 10% 5xp
        const roll = Math.random();
        if (roll < 0.2) {
          drops.push({ x: cx, y: cy, type: 'heart' });
        } else if (roll < 0.7) {
          drops.push({ x: cx, y: cy, type: 'xp', amount: 1 });
        } else if (roll < 0.9) {
          drops.push({ x: cx, y: cy, type: 'xp', amount: 3 });
        } else {
          drops.push({ x: cx, y: cy, type: 'xp', amount: 5 });
        }
        break;
      }
    }
  }
  return drops;
}

export function getFirePosts() {
  return posts;
}

export function drawFirePosts(ctx, now) {
  for (const post of posts) {
    const cx = post.x + post.w / 2;
    const cy = post.y + post.h / 2;
    const time = now / 1000;

    ctx.save();
    ctx.translate(cx, cy);

    // Stone base
    ctx.fillStyle = '#555';
    ctx.fillRect(-post.w / 2, -2, post.w, post.h / 2 + 2);
    ctx.fillStyle = '#444';
    ctx.fillRect(-post.w / 2 + 2, 0, post.w - 4, post.h / 2 - 2);

    // Post/stick
    ctx.fillStyle = '#6B3A1A';
    ctx.fillRect(-3, -post.h / 2 - 4, 6, post.h / 2 + 4);

    // Fire — animated flickering
    const flicker1 = Math.sin(time * 8 + cx) * 2;
    const flicker2 = Math.sin(time * 12 + cy) * 1.5;

    // Outer flame (orange)
    ctx.fillStyle = '#FF6600';
    ctx.beginPath();
    ctx.moveTo(-6 + flicker2, -4);
    ctx.quadraticCurveTo(-4 + flicker1, -18 + flicker2, 0, -20 - Math.abs(flicker1));
    ctx.quadraticCurveTo(4 - flicker1, -18 - flicker2, 6 - flicker2, -4);
    ctx.closePath();
    ctx.fill();

    // Inner flame (yellow)
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.moveTo(-3 + flicker1, -4);
    ctx.quadraticCurveTo(-2, -13 + flicker2, 0, -15 - Math.abs(flicker2));
    ctx.quadraticCurveTo(2, -13 - flicker1, 3 - flicker1, -4);
    ctx.closePath();
    ctx.fill();

    // Core (white-hot)
    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.ellipse(0, -6, 2, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    const glowAlpha = 0.08 + Math.sin(time * 6) * 0.04;
    ctx.fillStyle = `rgba(255, 100, 0, ${glowAlpha})`;
    ctx.beginPath();
    ctx.arc(0, -8, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
