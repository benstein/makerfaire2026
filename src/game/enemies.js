// src/game/enemies.js

import { CONFIG } from './config.js';
import { getCurrentMap } from './mapGen.js';

let enemies = [];
let lastSpawnTime = 0;

// Rockettes dance state
let dancing = false;
let danceStartTime = 0;
const DANCE_DURATION = 3000; // 3 seconds of showtime
const DANCE_MIN_INTERVAL = 8000;  // at least 8s between dances
const DANCE_MAX_INTERVAL = 18000; // at most 18s
let nextDanceTime = 0;
let danceLineY = 0; // y position of the kick line
let danceTargets = []; // where each enemy needs to go in the line

export function resetEnemies() {
  enemies = [];
  lastSpawnTime = 0;
  dancing = false;
  danceStartTime = 0;
  nextDanceTime = performance.now() + DANCE_MIN_INTERVAL + Math.random() * (DANCE_MAX_INTERVAL - DANCE_MIN_INTERVAL);
  danceTargets = [];
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

export function isDancing() {
  return dancing;
}

export function updateEnemies(dt, playerPos, now, arenaWidth, arenaHeight) {
  const map = getCurrentMap();
  const baseInterval = 2000 * map.enemy.spawnRate;
  if (now - lastSpawnTime > baseInterval) {
    spawnEnemy(arenaWidth, arenaHeight);
    lastSpawnTime = now;
  }

  // Check if it's time to dance
  if (!dancing && enemies.length >= 3 && now >= nextDanceTime) {
    dancing = true;
    danceStartTime = now;
    danceLineY = arenaHeight * 0.5;

    // Sort enemies left to right for the kick line
    const sorted = [...enemies].sort((a, b) => a.x - b.x);
    const lineWidth = Math.min(arenaWidth * 0.8, sorted.length * 40);
    const startX = (arenaWidth - lineWidth) / 2;
    danceTargets = [];
    for (let i = 0; i < enemies.length; i++) {
      const sortIdx = sorted.indexOf(enemies[i]);
      const targetX = startX + (sorted.length > 1 ? (sortIdx / (sorted.length - 1)) * lineWidth : lineWidth / 2);
      danceTargets.push({ x: targetX, y: danceLineY });
    }
  }

  // End dance
  if (dancing && now - danceStartTime > DANCE_DURATION) {
    dancing = false;
    nextDanceTime = now + DANCE_MIN_INTERVAL + Math.random() * (DANCE_MAX_INTERVAL - DANCE_MIN_INTERVAL);
  }

  const scale = dt / 16.67;

  if (dancing) {
    // Slide enemies toward their line positions
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const target = danceTargets[i];
      if (!target) continue;
      const dx = target.x - (enemy.x + enemy.w / 2);
      const dy = target.y - (enemy.y + enemy.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 2) {
        const moveSpeed = 4;
        enemy.x += (dx / dist) * moveSpeed * scale;
        enemy.y += (dy / dist) * moveSpeed * scale;
      }
    }
  } else {
    // Normal chase
    for (const enemy of enemies) {
      const dx = playerPos.x - (enemy.x + enemy.w / 2);
      const dy = playerPos.y - (enemy.y + enemy.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        enemy.x += (dx / dist) * enemy.speed * scale;
        enemy.y += (dy / dist) * enemy.speed * scale;
      }
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
    const danceT = dancing ? (now - danceStartTime) / 1000 : 0;
    const idx = enemies.indexOf(enemy);

    if (dancing) {
      // ROCKETTES MODE
      // The dance has 3 beats: high kicks (0-1s), jazz hands (1-2s), shimmy (2-3s)
      const beatPhase = (danceT * 2) % 3; // cycles through moves
      const kickOffset = idx * 0.3; // stagger for wave effect

      ctx.save();

      // Body sway
      const sway = Math.sin(danceT * 8 + idx * 0.5) * 3;
      ctx.translate(sway, 0);

      // Body
      ctx.fillStyle = flashing ? '#fff' : enemy.color;
      ctx.fillRect(-ew * 0.35, bodyY - ew * 0.5, ew * 0.7, ew * 0.5);

      // High kick leg
      const kickAngle = Math.sin(danceT * 6 + kickOffset) * 0.8;
      const kickHeight = Math.abs(Math.sin(danceT * 6 + kickOffset));
      ctx.strokeStyle = flashing ? '#fff' : enemy.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(ew * 0.1, bodyY);
      ctx.lineTo(ew * 0.1 + Math.sin(kickAngle) * ew * 0.6, bodyY - kickHeight * ew * 0.7);
      ctx.stroke();
      // Other leg planted
      ctx.beginPath();
      ctx.moveTo(-ew * 0.1, bodyY);
      ctx.lineTo(-ew * 0.1, bodyY + ew * 0.2);
      ctx.stroke();

      // Jazz hands / arms
      const armWave = Math.sin(danceT * 10 + idx * 0.7);
      ctx.lineWidth = 2.5;
      // Left arm
      ctx.beginPath();
      ctx.moveTo(-ew * 0.35, bodyY - ew * 0.35);
      ctx.lineTo(-ew * 0.6, bodyY - ew * 0.7 + armWave * ew * 0.15);
      ctx.stroke();
      // Right arm
      ctx.beginPath();
      ctx.moveTo(ew * 0.35, bodyY - ew * 0.35);
      ctx.lineTo(ew * 0.6, bodyY - ew * 0.7 - armWave * ew * 0.15);
      ctx.stroke();

      // Jazz hand sparkles
      ctx.fillStyle = '#ffd700';
      const sparkle1 = Math.sin(danceT * 12 + idx) > 0.3;
      const sparkle2 = Math.sin(danceT * 12 + idx + 1) > 0.3;
      if (sparkle1) {
        ctx.beginPath();
        ctx.arc(-ew * 0.6, bodyY - ew * 0.7 + armWave * ew * 0.15, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (sparkle2) {
        ctx.beginPath();
        ctx.arc(ew * 0.6, bodyY - ew * 0.7 - armWave * ew * 0.15, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Happy eyes (big and excited)
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-ew * 0.12, bodyY - ew * 0.38, ew * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ew * 0.12, bodyY - ew * 0.38, ew * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(-ew * 0.12, bodyY - ew * 0.38, ew * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(ew * 0.12, bodyY - ew * 0.38, ew * 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Big smile
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, bodyY - ew * 0.25, ew * 0.12, 0.2, Math.PI - 0.2);
      ctx.stroke();

      ctx.restore();
    } else {
      // Normal riding pose
      ctx.fillStyle = flashing ? '#fff' : enemy.color;
      ctx.fillRect(-ew * 0.35, bodyY - ew * 0.5, ew * 0.7, ew * 0.5);

      // Eyes on the enemy
      ctx.fillStyle = '#fff';
      ctx.fillRect(-ew * 0.2, bodyY - ew * 0.4, ew * 0.15, ew * 0.12);
      ctx.fillRect(ew * 0.05, bodyY - ew * 0.4, ew * 0.15, ew * 0.12);
      ctx.fillStyle = '#000';
      ctx.fillRect(-ew * 0.15, bodyY - ew * 0.38, ew * 0.06, ew * 0.08);
      ctx.fillRect(ew * 0.1, bodyY - ew * 0.38, ew * 0.06, ew * 0.08);
    }

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

export function drawDanceBanner(ctx, now, canvasWidth) {
  if (!dancing) return;
  const danceT = (now - danceStartTime) / 1000;
  const time = now / 1000;

  // "SHOWTIME!" banner
  const bannerY = danceLineY - 60;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 32px monospace';

  // Each letter in a different color, bouncing
  const text = 'SHOWTIME!';
  const colors = ['#ff6b6b', '#ffa500', '#ffd700', '#69ff69', '#69b4ff', '#b469ff', '#ff69b4', '#ffd700', '#ff6b6b'];
  const charW = ctx.measureText('M').width;
  const totalW = text.length * charW;

  for (let i = 0; i < text.length; i++) {
    const charX = canvasWidth / 2 - totalW / 2 + i * charW + charW / 2;
    const bounce = Math.sin(time * 8 + i * 0.6) * 8;
    const rotation = Math.sin(time * 5 + i * 0.8) * 0.1;
    ctx.save();
    ctx.translate(charX, bannerY + bounce);
    ctx.rotate(rotation);
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }

  // Sparkle bursts around the text
  for (let s = 0; s < 8; s++) {
    const sparkAngle = time * 3 + s * Math.PI / 4;
    const sparkDist = 30 + Math.sin(time * 5 + s) * 15;
    const sx = canvasWidth / 2 + Math.cos(sparkAngle) * (totalW / 2 + sparkDist);
    const sy = bannerY - 5 + Math.sin(sparkAngle) * 20;
    const sparkAlpha = 0.4 + Math.sin(time * 10 + s * 2) * 0.4;
    if (sparkAlpha > 0.3) {
      ctx.fillStyle = `rgba(255, 215, 0, ${sparkAlpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
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
