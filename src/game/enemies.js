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
    bobPhase: Math.random() * Math.PI * 2,
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
  const time = now / 1000;

  for (const enemy of enemies) {
    const flashing = enemy.hitFlash && (now - enemy.hitFlash) < 120;
    const ew = enemy.w;
    const cx = enemy.x + ew / 2;
    const cy = enemy.y + ew / 2;

    // Ocean bobbing
    const bob = Math.sin(time * 2.5 + enemy.bobPhase) * 4;
    const tilt = Math.sin(time * 2 + enemy.bobPhase + 0.5) * 0.08;

    ctx.save();
    ctx.translate(cx, cy + bob);
    ctx.rotate(tilt);

    const boatW = ew + 12;
    const boatH = ew * 0.4;

    // Water ripples under the boat
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let r = 0; r < 3; r++) {
      const rippleW = boatW * 0.6 + r * 8;
      const rippleY = boatH * 0.5 + 4 + r * 3;
      const rippleWave = Math.sin(time * 3 + enemy.bobPhase + r) * 2;
      ctx.beginPath();
      ctx.moveTo(-rippleW / 2 + rippleWave, rippleY);
      ctx.quadraticCurveTo(0, rippleY + 2, rippleW / 2 + rippleWave, rippleY);
      ctx.stroke();
    }

    // Boat hull
    ctx.fillStyle = '#8B5E3C';
    ctx.beginPath();
    ctx.moveTo(-boatW / 2, 0);
    ctx.lineTo(-boatW / 2 + 5, boatH);
    ctx.lineTo(boatW / 2 - 5, boatH);
    ctx.lineTo(boatW / 2, 0);
    ctx.closePath();
    ctx.fill();

    // Hull stripe
    ctx.fillStyle = '#6B3A1A';
    ctx.fillRect(-boatW / 2 + 4, boatH * 0.4, boatW - 8, 3);

    // Hull planks (horizontal lines)
    ctx.strokeStyle = '#5C2D00';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-boatW / 2 + 6, boatH * 0.65);
    ctx.lineTo(boatW / 2 - 6, boatH * 0.65);
    ctx.stroke();

    // Sail mast
    ctx.fillStyle = '#4A2810';
    ctx.fillRect(-1, -ew * 0.9, 2, ew * 0.9);

    // Sail (triangle, colored like the enemy)
    ctx.fillStyle = flashing ? '#fff' : enemy.color;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(1, -ew * 0.85);
    ctx.lineTo(ew * 0.5 + 3, -ew * 0.3);
    ctx.lineTo(1, -ew * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Sail billow line
    ctx.strokeStyle = flashing ? '#ccc' : enemy.color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(1, -ew * 0.85);
    ctx.quadraticCurveTo(ew * 0.35, -ew * 0.55, 1, -ew * 0.1);
    ctx.stroke();

    // Little flag on top
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(0, -ew * 0.9);
    ctx.lineTo(8, -ew * 0.9 - 3);
    ctx.lineTo(0, -ew * 0.9 - 6);
    ctx.closePath();
    ctx.fill();

    // Enemy riding the boat (upper body visible)
    const bodyY = -ew * 0.15;
    ctx.fillStyle = flashing ? '#fff' : enemy.color;
    ctx.fillRect(-ew * 0.35, bodyY - ew * 0.5, ew * 0.7, ew * 0.5);

    // Eyes on the enemy
    ctx.fillStyle = '#fff';
    ctx.fillRect(-ew * 0.2, bodyY - ew * 0.4, ew * 0.15, ew * 0.12);
    ctx.fillRect(ew * 0.05, bodyY - ew * 0.4, ew * 0.15, ew * 0.12);
    ctx.fillStyle = '#000';
    ctx.fillRect(-ew * 0.15, bodyY - ew * 0.38, ew * 0.06, ew * 0.08);
    ctx.fillRect(ew * 0.1, bodyY - ew * 0.38, ew * 0.06, ew * 0.08);

    // HP bar (only if damaged)
    if (enemy.hp < enemy.maxHp) {
      const barW = ew + 4;
      ctx.fillStyle = '#333';
      ctx.fillRect(-barW / 2, bodyY - ew * 0.6, barW, 3);
      const ratio = enemy.hp / enemy.maxHp;
      ctx.fillStyle = ratio > 0.5 ? '#2ecc71' : '#e74c3c';
      ctx.fillRect(-barW / 2, bodyY - ew * 0.6, barW * ratio, 3);
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
