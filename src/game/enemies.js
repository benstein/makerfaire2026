// src/game/enemies.js

import { CONFIG } from './config.js';
import { getGameProgress, getLevel } from './gameState.js';
import { findNearestMeat, startEating } from './meat.js';
import { aabb } from './collision.js';

let enemies = [];
let lastSpawnTime = 0;

export function resetEnemies() {
  enemies = [];
  lastSpawnTime = 0;
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

  enemies.push({ x: ex, y: ey, w: CONFIG.enemySize, h: CONFIG.enemySize });
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
    // If eating, freeze in place
    if (enemy.eating) {
      if (now - enemy.eatStart > 1000) {
        enemy.eating = false;
      }
      continue;
    }

    const ecx = enemy.x + enemy.w / 2;
    const ecy = enemy.y + enemy.h / 2;

    // Check for nearby meat to chase
    const meat = findNearestMeat(ecx, ecy);
    let targetX, targetY;

    if (meat) {
      targetX = meat.x + meat.w / 2;
      targetY = meat.y + meat.h / 2;
    } else {
      targetX = playerPos.x;
      targetY = playerPos.y;
    }

    const dx = targetX - ecx;
    const dy = targetY - ecy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const scale = dt / 16.67;
      const levelSpeedBonus = 1 + (getLevel() - 1) * 0.25;
      const speed = CONFIG.enemySpeed * levelSpeedBonus;
      enemy.x += (dx / dist) * speed * scale;
      enemy.y += (dy / dist) * speed * scale;
    }

    // If chasing meat, check if reached it
    if (meat && !meat.beingEaten) {
      const meatBounds = { x: meat.x, y: meat.y, w: meat.w, h: meat.h };
      if (aabb(enemy, meatBounds)) {
        if (startEating(meat, now)) {
          enemy.eating = true;
          enemy.eatStart = now;
        }
      }
    }
  }
}

// Enemy colors per level — gets scarier
const LEVEL_COLORS = ['#e74c3c', '#e67e22', '#9b59b6', '#1abc9c', '#ff1744'];

export function drawEnemies(ctx, now) {
  const level = getLevel();
  const color = LEVEL_COLORS[(level - 1) % LEVEL_COLORS.length];
  for (const enemy of enemies) {
    const sizeBonus = (level - 1) * 2;
    const s = enemy.w + sizeBonus;
    const offset = sizeBonus / 2;
    const ex = enemy.x - offset;
    const ey = enemy.y - offset;

    ctx.save();

    // Wobble when eating
    if (enemy.eating) {
      const wobble = Math.sin((now || performance.now()) / 40) * 3;
      ctx.translate(ex + s / 2, ey + s / 2);
      ctx.rotate(wobble * 0.1);
      ctx.translate(-s / 2, -s / 2);
    } else {
      ctx.translate(ex, ey);
    }

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, s, s);

    // Eyes
    if (level >= 2 || enemy.eating) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(4, 4, 5, 4);
      ctx.fillRect(s - 9, 4, 5, 4);
      ctx.fillStyle = '#000';
      ctx.fillRect(6, 5, 2, 2);
      ctx.fillRect(s - 7, 5, 2, 2);
    }

    // Happy mouth when eating
    if (enemy.eating) {
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(s / 2, s * 0.6, 4, 0, Math.PI);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
