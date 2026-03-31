// src/game/enemies.js

import { CONFIG } from './config.js';
import { getGameProgress } from './gameState.js';

let enemies = [];
let lastSpawnTime = 0;
let enemyProjectiles = [];

export function resetEnemies() {
  enemies = [];
  lastSpawnTime = 0;
  enemyProjectiles = [];
}

export function spawnEnemy(arenaWidth, arenaHeight) {
  const edge = Math.floor(Math.random() * 4);
  let ex, ey;

  switch (edge) {
    case 0: ex = Math.random() * arenaWidth; ey = -CONFIG.enemySize; break;
    case 1: ex = arenaWidth + CONFIG.enemySize; ey = Math.random() * arenaHeight; break;
    case 2: ex = Math.random() * arenaWidth; ey = arenaHeight + CONFIG.enemySize; break;
    case 3: ex = -CONFIG.enemySize; ey = Math.random() * arenaHeight; break;
  }

  enemies.push({ x: ex, y: ey, w: CONFIG.enemySize, h: CONFIG.enemySize, lastFireTime: 0 });
}

function getCurrentSpawnInterval() {
  const progress = getGameProgress();
  const start = CONFIG.enemySpawnIntervalStart;
  const end = CONFIG.enemySpawnIntervalEnd;
  return start + (end - start) * progress;
}

export function updateEnemies(dt, playerPos, now, arenaWidth, arenaHeight) {
  const interval = getCurrentSpawnInterval();
  if (now - lastSpawnTime > interval) {
    spawnEnemy(arenaWidth, arenaHeight);
    lastSpawnTime = now;
  }

  for (const enemy of enemies) {
    const dx = playerPos.x - (enemy.x + enemy.w / 2);
    const dy = playerPos.y - (enemy.y + enemy.h / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const scale = dt / 16.67;
      enemy.x += (dx / dist) * CONFIG.enemySpeed * scale;
      enemy.y += (dy / dist) * CONFIG.enemySpeed * scale;

      // Enemy shooting
      if (now - enemy.lastFireTime > CONFIG.enemyFireInterval && Math.random() < CONFIG.enemyFireChance) {
        enemy.lastFireTime = now;
        const s = CONFIG.enemyProjectileSize;
        enemyProjectiles.push({
          x: enemy.x + enemy.w / 2 - s / 2,
          y: enemy.y - s,
          w: s,
          h: s,
          vx: (dx / dist) * CONFIG.enemyProjectileSpeed,
          vy: (dy / dist) * CONFIG.enemyProjectileSpeed,
        });
      }
    }
  }
}

export function updateEnemyProjectiles(dt, arenaWidth, arenaHeight) {
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const p = enemyProjectiles[i];
    const scale = dt / 16.67;
    p.x += p.vx * scale;
    p.y += p.vy * scale;

    if (p.x < -50 || p.x > arenaWidth + 50 || p.y < -50 || p.y > arenaHeight + 50) {
      enemyProjectiles.splice(i, 1);
    }
  }
}

const UNICORN_COLORS = ['#f0a0d0', '#c0a0f0', '#a0d0f0', '#a0f0c0', '#f0d0a0', '#f0a0a0'];

export function drawEnemies(ctx) {
  const now = performance.now();
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const cx = enemy.x + enemy.w / 2;
    const cy = enemy.y + enemy.h / 2;
    const s = enemy.w;
    const color = UNICORN_COLORS[i % UNICORN_COLORS.length];
    const bounce = Math.sin(now / 200 + i * 1.5) * 2;

    ctx.save();
    ctx.translate(cx, cy + bounce);

    // Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, s * 0.1, s * 0.45, s * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -s * 0.2, s * 0.28, 0, Math.PI * 2);
    ctx.fill();

    // Horn — rainbow!
    const hornGrad = ctx.createLinearGradient(0, -s * 0.5, 0, -s * 0.85);
    hornGrad.addColorStop(0, '#f1c40f');
    hornGrad.addColorStop(0.5, '#ff69b4');
    hornGrad.addColorStop(1, '#9b59b6');
    ctx.fillStyle = hornGrad;
    ctx.beginPath();
    ctx.moveTo(-s * 0.06, -s * 0.42);
    ctx.lineTo(0, -s * 0.85);
    ctx.lineTo(s * 0.06, -s * 0.42);
    ctx.closePath();
    ctx.fill();

    // Horn sparkle
    if (Math.sin(now / 120 + i) > 0.5) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(s * 0.02, -s * 0.7, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ears
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.38);
    ctx.lineTo(-s * 0.12, -s * 0.55);
    ctx.lineTo(-s * 0.04, -s * 0.38);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s * 0.04, -s * 0.38);
    ctx.lineTo(s * 0.12, -s * 0.55);
    ctx.lineTo(s * 0.2, -s * 0.38);
    ctx.fill();

    // Eyes — big cute anime eyes
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(-s * 0.1, -s * 0.22, 3, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.1, -s * 0.22, 3, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Eye sparkles
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-s * 0.08, -s * 0.25, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.12, -s * 0.25, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Blush
    ctx.fillStyle = 'rgba(255,120,170,0.4)';
    ctx.beginPath();
    ctx.ellipse(-s * 0.2, -s * 0.13, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(s * 0.2, -s * 0.13, 4, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute smile
    ctx.strokeStyle = '#c06090';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -s * 0.14, s * 0.08, 0.3, Math.PI - 0.3);
    ctx.stroke();

    // Legs (stubby)
    ctx.fillStyle = color;
    for (const lx of [-s * 0.25, -s * 0.08, s * 0.08, s * 0.25]) {
      ctx.fillRect(lx - 3, s * 0.3, 6, s * 0.15);
    }

    // Mane — rainbow colored tufts
    const maneColors = ['#ff6b6b', '#ffa500', '#ffd700', '#69ff69', '#69b4ff', '#b469ff'];
    for (let m = 0; m < 5; m++) {
      ctx.fillStyle = maneColors[m % maneColors.length];
      const angle = -Math.PI * 0.7 + (m / 4) * Math.PI * 0.5;
      const mx = Math.cos(angle) * s * 0.32;
      const my = -s * 0.2 + Math.sin(angle) * s * 0.32;
      ctx.beginPath();
      ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tail — rainbow poof
    for (let t = 0; t < 4; t++) {
      ctx.fillStyle = maneColors[t % maneColors.length];
      ctx.beginPath();
      ctx.arc(-s * 0.42 + Math.cos(t * 1.5) * 4, s * 0.08 + Math.sin(t * 1.5) * 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

const CANDY_COLORS = [
  { body: '#ff6b6b', stripe: '#fff' },
  { body: '#69b4ff', stripe: '#fff' },
  { body: '#69ff69', stripe: '#ffd700' },
  { body: '#ff69b4', stripe: '#fff' },
  { body: '#b469ff', stripe: '#ffd700' },
];

export function drawEnemyProjectiles(ctx) {
  const now = performance.now();
  for (let i = 0; i < enemyProjectiles.length; i++) {
    const p = enemyProjectiles[i];
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    const size = p.w * 0.5;
    const spin = now / 300 + i * 2;
    const candy = CANDY_COLORS[i % CANDY_COLORS.length];

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin);

    // Candy wrapper shape — oval body with twisted ends
    // Body
    ctx.fillStyle = candy.body;
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 1.1, size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stripes on candy
    ctx.strokeStyle = candy.stripe;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, -size * 0.7);
    ctx.lineTo(-size * 0.3, size * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.3, -size * 0.7);
    ctx.lineTo(size * 0.3, size * 0.7);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Wrapper twist — left
    ctx.fillStyle = candy.body;
    ctx.beginPath();
    ctx.moveTo(-size * 1.1, -size * 0.15);
    ctx.lineTo(-size * 1.7, -size * 0.45);
    ctx.lineTo(-size * 1.7, size * 0.45);
    ctx.lineTo(-size * 1.1, size * 0.15);
    ctx.closePath();
    ctx.fill();

    // Wrapper twist — right
    ctx.beginPath();
    ctx.moveTo(size * 1.1, -size * 0.15);
    ctx.lineTo(size * 1.7, -size * 0.45);
    ctx.lineTo(size * 1.7, size * 0.45);
    ctx.lineTo(size * 1.1, size * 0.15);
    ctx.closePath();
    ctx.fill();

    // Shine
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(-size * 0.2, -size * 0.2, size * 0.3, size * 0.15, -0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Sparkle trail
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = candy.body;
    ctx.beginPath();
    ctx.arc(cx - p.vx * 3, cy - p.vy * 3, size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(cx - p.vx * 6, cy - p.vy * 6, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export function getEnemies() {
  return enemies;
}

export function getEnemyProjectiles() {
  return enemyProjectiles;
}

export function removeEnemyProjectile(index) {
  enemyProjectiles.splice(index, 1);
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
