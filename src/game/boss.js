// src/game/boss.js
// Giant boss yeti — spawns at 20s remaining, takes 10 hits, killing it wins the game.

import { CONFIG } from './config.js';

const BOSS_HP_MAX   = 10;
const BOSS_SIZE     = CONFIG.enemySize * 4;   // ~88px — imposing
const BOSS_SPEED    = CONFIG.enemySpeed * 1.4;
const SPAWN_AT_SECS = 20;                      // seconds remaining when boss appears

let boss = null;
let spawned = false;

export function resetBoss() {
  boss    = null;
  spawned = false;
}

export function shouldSpawnBoss(timeRemaining) {
  return !spawned && timeRemaining <= SPAWN_AT_SECS;
}

export function spawnBoss(arenaWidth, arenaHeight) {
  spawned = true;
  const edge = Math.floor(Math.random() * 4);
  let bx, by;
  switch (edge) {
    case 0: bx = arenaWidth / 2;       by = -BOSS_SIZE;             break;
    case 1: bx = arenaWidth + BOSS_SIZE; by = arenaHeight / 2;      break;
    case 2: bx = arenaWidth / 2;       by = arenaHeight + BOSS_SIZE; break;
    default: bx = -BOSS_SIZE;          by = arenaHeight / 2;        break;
  }
  boss = { x: bx, y: by, w: BOSS_SIZE, h: BOSS_SIZE, hp: BOSS_HP_MAX };
}

export function getBoss()     { return boss; }
export function isBossAlive() { return boss !== null && boss.hp > 0; }

export function updateBoss(dt, playerPos) {
  if (!boss) return;
  const cx = boss.x + boss.w / 2;
  const cy = boss.y + boss.h / 2;
  const dx = playerPos.x - cx;
  const dy = playerPos.y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > 0) {
    const scale = dt / 16.67;
    boss.x += (dx / dist) * BOSS_SPEED * scale;
    boss.y += (dy / dist) * BOSS_SPEED * scale;
  }
}

// Returns true when the boss is dead
export function damageBoss() {
  if (!boss) return false;
  boss.hp--;
  return boss.hp <= 0;
}

export function drawBoss(ctx, now) {
  if (!boss) return;
  const cx = boss.x + boss.w / 2;
  const cy = boss.y + boss.h / 2;
  const r  = boss.w / 2;

  ctx.save();
  ctx.shadowBlur  = 40;
  ctx.shadowColor = `rgba(220, 0, 0, ${0.3 + 0.2 * Math.sin(now / 300)})`;
  drawBossYeti(ctx, cx, cy, r, now);
  ctx.restore();

  drawBossHealthBar(ctx, cx, boss.y - 24, r, boss.hp, BOSS_HP_MAX);
}

function drawBossYeti(ctx, cx, cy, r, now) {
  const stomp = Math.sin(now / 180) * r * 0.04;
  cy += stomp;

  for (let i = 3; i >= 0; i--) {
    ctx.fillStyle = i % 2 === 0 ? '#bbccdd' : '#ddeeff';
    ctx.beginPath();
    ctx.arc(cx, cy + r * 0.15, r * (0.85 + i * 0.05), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#aabbd0';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.88, cy + r * 0.15 + Math.sin(a) * r * 0.88, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#cce0f5';
  ctx.beginPath();
  ctx.arc(cx, cy - r * 0.55, r * 0.56, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#aabbd0';
  for (let i = 0; i < 6; i++) {
    const a = Math.PI + (i / 5) * Math.PI;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r * 0.5, cy - r * 0.55 + Math.sin(a) * r * 0.5, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Angry glowing red eyes
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(cx - r * 0.2,  cy - r * 0.63, r * 0.2,  0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.2,  cy - r * 0.63, r * 0.2,  0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff0000';
  ctx.beginPath(); ctx.arc(cx - r * 0.18, cy - r * 0.61, r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(cx + r * 0.22, cy - r * 0.61, r * 0.12, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = '#336699'; ctx.lineWidth = r * 0.08; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - r * 0.32, cy - r * 0.77); ctx.lineTo(cx - r * 0.08, cy - r * 0.72); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + r * 0.32, cy - r * 0.77); ctx.lineTo(cx + r * 0.08, cy - r * 0.72); ctx.stroke();

  ctx.strokeStyle = '#224466'; ctx.lineWidth = r * 0.1;
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.28, cy - r * 0.40);
  ctx.quadraticCurveTo(cx, cy - r * 0.52, cx + r * 0.28, cy - r * 0.40);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  for (let side = -1; side <= 1; side += 2) {
    ctx.beginPath();
    ctx.moveTo(cx + side * r * 0.06, cy - r * 0.44);
    ctx.lineTo(cx + side * r * 0.10, cy - r * 0.30);
    ctx.lineTo(cx + side * r * 0.14, cy - r * 0.44);
    ctx.fill();
  }

  // Massive reaching arms
  ctx.strokeStyle = '#bbccdd'; ctx.lineWidth = r * 0.35; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx - r * 0.7, cy + r * 0.1); ctx.lineTo(cx - r * 1.35, cy - r * 0.25); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + r * 0.7, cy + r * 0.1); ctx.lineTo(cx + r * 1.35, cy - r * 0.25); ctx.stroke();
  ctx.strokeStyle = '#336699'; ctx.lineWidth = r * 0.09;
  for (let s = -1; s <= 1; s++) {
    ctx.beginPath(); ctx.moveTo(cx - r * 1.35 + s * r * 0.1, cy - r * 0.25); ctx.lineTo(cx - r * 1.55 + s * r * 0.14, cy - r * 0.48); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + r * 1.35 + s * r * 0.1, cy - r * 0.25); ctx.lineTo(cx + r * 1.55 + s * r * 0.14, cy - r * 0.48); ctx.stroke();
  }
}

function drawBossHealthBar(ctx, cx, top, r, hp, maxHp) {
  const bw = r * 2.4;
  const bh = 14;
  const bx = cx - bw / 2;
  const pct = hp / maxHp;

  ctx.font = 'bold 13px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff4444';
  ctx.fillText('BOSS YETI', cx, top - 4);

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath(); ctx.roundRect(bx - 2, top, bw + 4, bh + 4, 4); ctx.fill();
  ctx.fillStyle = '#330000';
  ctx.beginPath(); ctx.roundRect(bx, top + 2, bw, bh, 3); ctx.fill();

  if (pct > 0) {
    ctx.fillStyle = `hsl(${Math.round(pct * 50)}, 100%, 45%)`;
    ctx.beginPath(); ctx.roundRect(bx, top + 2, bw * pct, bh, 3); ctx.fill();
  }

  ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
  for (let i = 1; i < maxHp; i++) {
    const tx = bx + bw * i / maxHp;
    ctx.beginPath(); ctx.moveTo(tx, top + 2); ctx.lineTo(tx, top + 2 + bh); ctx.stroke();
  }
  ctx.textAlign = 'left';
}
