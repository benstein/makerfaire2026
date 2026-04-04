// src/game/enemies.js

import { CONFIG } from './config.js';
import { getCurrentMap } from './mapGen.js';

let enemies = [];
let lastSpawnTime = 0;

export function resetEnemies() {
  enemies = [];
  lastSpawnTime = 0;
}

export function spawnEnemy(arenaWidth, arenaHeight) {
  const map = getCurrentMap();
  const et = map.enemy;
  const edge = Math.floor(Math.random() * 4);
  let ex, ey;

  switch (edge) {
    case 0: ex = Math.random() * arenaWidth; ey = -et.size; break;
    case 1: ex = arenaWidth + et.size; ey = Math.random() * arenaHeight; break;
    case 2: ex = Math.random() * arenaWidth; ey = arenaHeight + et.size; break;
    case 3: ex = -et.size; ey = Math.random() * arenaHeight; break;
  }

  enemies.push({
    x: ex, y: ey, w: et.size, h: et.size,
    hp: et.hp, maxHp: et.hp,
    speed: et.speed,
    color: et.color,
    hitFlash: 0,
  });
}

export function updateEnemies(dt, playerPos, now, arenaWidth, arenaHeight) {
  const map = getCurrentMap();
  const baseInterval = 2000 * map.enemy.spawnRate;
  if (now - lastSpawnTime > baseInterval) {
    spawnEnemy(arenaWidth, arenaHeight);
    lastSpawnTime = now;
  }

  for (const enemy of enemies) {
    const dx = playerPos.x - (enemy.x + enemy.w / 2);
    const dy = playerPos.y - (enemy.y + enemy.h / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0) {
      const scale = dt / 16.67;
      enemy.x += (dx / dist) * enemy.speed * scale;
      enemy.y += (dy / dist) * enemy.speed * scale;
    }
  }
}

export function drawEnemies(ctx, now) {
  for (const enemy of enemies) {
    const flashing = enemy.hitFlash && (now - enemy.hitFlash) < 120;

    ctx.save();
    ctx.translate(enemy.x, enemy.y);

    // Body
    ctx.fillStyle = flashing ? '#fff' : enemy.color;
    ctx.fillRect(0, 0, enemy.w, enemy.h);

    // Eyes
    const ew = enemy.w;
    ctx.fillStyle = '#fff';
    ctx.fillRect(ew * 0.2, ew * 0.2, ew * 0.2, ew * 0.15);
    ctx.fillRect(ew * 0.6, ew * 0.2, ew * 0.2, ew * 0.15);
    ctx.fillStyle = '#000';
    ctx.fillRect(ew * 0.28, ew * 0.23, ew * 0.08, ew * 0.1);
    ctx.fillRect(ew * 0.68, ew * 0.23, ew * 0.08, ew * 0.1);

    // HP bar (only if damaged)
    if (enemy.hp < enemy.maxHp) {
      const barW = enemy.w;
      const barH = 3;
      ctx.fillStyle = '#333';
      ctx.fillRect(0, -6, barW, barH);
      const ratio = enemy.hp / enemy.maxHp;
      ctx.fillStyle = ratio > 0.5 ? '#2ecc71' : '#e74c3c';
      ctx.fillRect(0, -6, barW * ratio, barH);
    }

    ctx.restore();
  }
}

// Damage enemy, return true if killed
export function damageEnemy(index, now) {
  const enemy = enemies[index];
  enemy.hp -= 1;
  enemy.hitFlash = now;
  if (enemy.hp <= 0) {
    enemies.splice(index, 1);
    return true;
  }
  return false;
}

export function getEnemies() {
  return enemies;
}

export function removeEnemy(index) {
  enemies.splice(index, 1);
}
