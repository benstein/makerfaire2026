// src/game/powerups.js
// Power-ups that spawn every 10 enemy kills.

import { aabb } from './collision.js';

const DURATION = 8000; // ms active after collected
const SPAWN_EVERY = 10; // kills between spawns
const SIZE = 28;

const TYPES = [
  { id: 'speed',      label: 'SPEED',      color: '#f1c40f', glow: '#f39c12' },
  { id: 'rapidfire',  label: 'RAPID FIRE', color: '#1abc9c', glow: '#16a085' },
];

let pickups = [];      // { x, y, type, bobOffset }
let killCount = 0;
let spawnIndex = 0;    // cycles through TYPES
let activeEffects = {}; // { speed: expiresAt, rapidfire: expiresAt }

export function resetPowerups() {
  pickups = [];
  killCount = 0;
  spawnIndex = 0;
  activeEffects = {};
}

export function onEnemyKilled(arenaWidth, arenaHeight) {
  killCount++;
  if (killCount % SPAWN_EVERY === 0) {
    const type = TYPES[spawnIndex % TYPES.length];
    spawnIndex++;
    const margin = 60;
    pickups.push({
      x: margin + Math.random() * (arenaWidth - margin * 2),
      y: margin + Math.random() * (arenaHeight - margin * 2),
      type,
      bobOffset: Math.random() * Math.PI * 2,
    });
  }
}

export function updatePowerups(dt, playerBounds, now) {
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    const bounds = { x: p.x - SIZE / 2, y: p.y - SIZE / 2, w: SIZE, h: SIZE };
    if (aabb(bounds, playerBounds)) {
      activeEffects[p.type.id] = (now + DURATION);
      pickups.splice(i, 1);
    }
  }
}

export function getSpeedMultiplier(now) {
  return activeEffects.speed && now < activeEffects.speed ? 2.5 : 1;
}

export function getFireCooldownMultiplier(now) {
  return activeEffects.rapidfire && now < activeEffects.rapidfire ? 0.2 : 1;
}

export function getKillCount() {
  return killCount;
}

export function drawPowerups(ctx, now) {
  for (const p of pickups) {
    const bob = Math.sin(now / 400 + p.bobOffset) * 5;
    const pulse = 0.75 + 0.25 * Math.sin(now / 300 + p.bobOffset);
    const cx = p.x;
    const cy = p.y + bob;
    const r = (SIZE / 2) * pulse;

    // Glow
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.2);
    grad.addColorStop(0, p.type.glow + 'cc');
    grad.addColorStop(1, p.type.glow + '00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Main circle
    ctx.fillStyle = p.type.color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.round(9 * pulse)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.type.label, cx, cy);
    ctx.textBaseline = 'alphabetic';
  }

  // Active effect indicators (top of screen, below HUD)
  let col = 0;
  for (const [id, expiresAt] of Object.entries(activeEffects)) {
    if (now >= expiresAt) continue;
    const type = TYPES.find(t => t.id === id);
    const remaining = ((expiresAt - now) / 1000).toFixed(1);
    const blink = (expiresAt - now < 2000) && Math.floor(now / 200) % 2 === 0;
    if (blink) { col++; continue; }
    ctx.fillStyle = type.color;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`${type.label} ${remaining}s`, 12 + col * 180, 90);
    col++;
  }
}
