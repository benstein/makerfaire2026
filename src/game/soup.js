// src/game/soup.js
// Soup the dog — your loyal sidekick who eats enemies

import { CONFIG } from './config.js';
import { aabb } from './collision.js';
import { getEnemies, removeEnemy } from './enemies.js';
import { spawnXPOrb } from './xpOrbs.js';

const SOUP_SIZE = 20;
const SOUP_SPEED = 3.5;
const EAT_DURATION = 1000;     // 1 second to eat
const GUARD_RADIUS = 120;      // how close an enemy must be to trigger Soup
const FOLLOW_DIST = 40;        // how close Soup stays to player
const TRICK_INTERVAL = 3000;   // new trick every 3 seconds
const TRICK_DURATION = 1500;   // each trick lasts 1.5s

let sx, sy;           // Soup's position
let state = 'idle';   // 'idle' | 'chasing' | 'eating' | 'returning'
let targetEnemy = -1; // index of enemy being chased
let eatStartTime = 0;
let eatX = 0, eatY = 0; // where Soup is eating

// Tricks
let currentTrick = 0;
let trickStartTime = 0;
let lastTrickChange = 0;
const TRICKS = [
  'spin',       // spin in circles
  'sit',        // sit and wag tail
  'roll',       // roll over
  'jump',       // hop up and down
  'zoomies',    // run in a tiny circle
  'shake',      // shake body
];

export function resetSoup(playerX, playerY) {
  sx = playerX + 30;
  sy = playerY + 10;
  state = 'idle';
  targetEnemy = -1;
  eatStartTime = 0;
  currentTrick = Math.floor(Math.random() * TRICKS.length);
  trickStartTime = performance.now();
  lastTrickChange = performance.now();
}

export function updateSoup(dt, playerPos, now) {
  const scale = dt / 16.67;

  if (state === 'eating') {
    // Stay at eat position, finish eating
    sx = eatX;
    sy = eatY;
    if (now - eatStartTime > EAT_DURATION) {
      state = 'returning';
    }
    return;
  }

  if (state === 'chasing') {
    const enemies = getEnemies();
    // Check if target still exists
    if (targetEnemy < 0 || targetEnemy >= enemies.length) {
      state = 'returning';
      targetEnemy = -1;
    } else {
      const enemy = enemies[targetEnemy];
      const ecx = enemy.x + enemy.w / 2;
      const ecy = enemy.y + enemy.h / 2;
      const dx = ecx - sx;
      const dy = ecy - sy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 15) {
        // Eat the enemy!
        const ex = enemy.x + enemy.w / 2;
        const ey = enemy.y + enemy.h / 2;
        removeEnemy(targetEnemy);
        spawnXPOrb(ex, ey);
        eatX = sx;
        eatY = sy;
        eatStartTime = now;
        state = 'eating';
        targetEnemy = -1;
      } else {
        // Chase at double speed
        const chaseSpeed = SOUP_SPEED * 2;
        sx += (dx / dist) * chaseSpeed * scale;
        sy += (dy / dist) * chaseSpeed * scale;
      }
    }
    return;
  }

  // Idle or returning — follow player
  const dx = playerPos.x - sx;
  const dy = playerPos.y - sy;
  const distToPlayer = Math.sqrt(dx * dx + dy * dy);

  if (distToPlayer > FOLLOW_DIST) {
    const followSpeed = state === 'returning' ? SOUP_SPEED * 1.5 : SOUP_SPEED;
    sx += (dx / distToPlayer) * followSpeed * scale;
    sy += (dy / distToPlayer) * followSpeed * scale;
  }

  if (state === 'returning' && distToPlayer < FOLLOW_DIST + 10) {
    state = 'idle';
  }

  // Look for nearby enemies to chase
  if (state === 'idle') {
    const enemies = getEnemies();
    let closestIdx = -1;
    let closestDist = GUARD_RADIUS;

    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const ecx = enemy.x + enemy.w / 2;
      const ecy = enemy.y + enemy.h / 2;
      // Distance to player (not to Soup)
      const dxp = ecx - playerPos.x;
      const dyp = ecy - playerPos.y;
      const distToPlayer = Math.sqrt(dxp * dxp + dyp * dyp);

      if (distToPlayer < closestDist) {
        closestDist = distToPlayer;
        closestIdx = i;
      }
    }

    if (closestIdx >= 0) {
      targetEnemy = closestIdx;
      state = 'chasing';
    }

    // Cycle tricks
    if (now - lastTrickChange > TRICK_INTERVAL) {
      currentTrick = Math.floor(Math.random() * TRICKS.length);
      trickStartTime = now;
      lastTrickChange = now;
    }
  }
}

export function drawSoup(ctx, now) {
  ctx.save();
  ctx.translate(sx, sy);

  const trick = TRICKS[currentTrick];
  const trickAge = now - trickStartTime;
  const trickT = Math.min(1, trickAge / TRICK_DURATION);

  // Apply trick transforms when idle
  if (state === 'idle' && trickT < 1) {
    if (trick === 'spin') {
      ctx.rotate(trickT * Math.PI * 4);
    } else if (trick === 'jump') {
      const jumpH = Math.sin(trickT * Math.PI) * 15;
      ctx.translate(0, -jumpH);
    } else if (trick === 'roll') {
      ctx.rotate(trickT * Math.PI * 2);
    } else if (trick === 'zoomies') {
      const zAngle = trickT * Math.PI * 6;
      ctx.translate(Math.cos(zAngle) * 8, Math.sin(zAngle) * 8);
    } else if (trick === 'shake') {
      ctx.translate(Math.sin(trickAge / 30) * 3, 0);
    }
  }

  // Eating wobble
  if (state === 'eating') {
    const eatT = (now - eatStartTime) / EAT_DURATION;
    ctx.rotate(Math.sin(now / 40) * 0.15);
  }

  const s = SOUP_SIZE;
  const hs = s / 2;

  // Body (tan/brown oval)
  ctx.fillStyle = '#D4A55A';
  ctx.beginPath();
  ctx.ellipse(0, 2, hs + 2, hs - 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head (rounder, slightly up-left)
  ctx.fillStyle = '#C49550';
  ctx.beginPath();
  ctx.arc(-hs + 2, -4, hs * 0.65, 0, Math.PI * 2);
  ctx.fill();

  // Ears (floppy)
  ctx.fillStyle = '#8B6B3D';
  const earWag = state === 'idle' ? Math.sin(now / 200) * 0.2 : 0;
  ctx.save();
  ctx.translate(-hs - 2, -8);
  ctx.rotate(-0.5 + earWag);
  ctx.beginPath();
  ctx.ellipse(0, 0, 4, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(-hs + 8, -10);
  ctx.rotate(0.3 - earWag);
  ctx.beginPath();
  ctx.ellipse(0, 0, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Eyes
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(-hs + 0, -6, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-hs + 7, -6, 2, 0, Math.PI * 2);
  ctx.fill();
  // Eye shine
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-hs + 1, -7, 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-hs + 8, -7, 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#2a1a0a';
  ctx.beginPath();
  ctx.ellipse(-hs - 2, -3, 2.5, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Mouth / tongue
  if (state === 'eating') {
    // Open mouth eating
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(-hs, 0, 4, 0, Math.PI);
    ctx.fill();
  } else if (state === 'idle') {
    // Happy panting tongue
    ctx.fillStyle = '#e88';
    ctx.beginPath();
    ctx.ellipse(-hs - 1, 1, 2, 3 + Math.sin(now / 200) * 1, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tail (wagging!)
  const wagSpeed = state === 'eating' ? 80 : (state === 'chasing' ? 60 : 150);
  const wagAmp = state === 'chasing' ? 0.6 : 0.4;
  const tailWag = Math.sin(now / wagSpeed) * wagAmp;
  ctx.strokeStyle = '#C49550';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hs, 0);
  ctx.quadraticCurveTo(hs + 6, -6 + tailWag * 10, hs + 10, -10 + tailWag * 12);
  ctx.stroke();

  // Legs (4 little stubs)
  ctx.fillStyle = '#C49550';
  const legKick = state === 'chasing' ? Math.sin(now / 60) * 3 : 0;
  ctx.fillRect(-6, hs - 4 + legKick, 4, 6);
  ctx.fillRect(2, hs - 4 - legKick, 4, 6);
  ctx.fillRect(-hs + 4, hs - 3 - legKick, 3, 5);
  ctx.fillRect(hs - 6, hs - 3 + legKick, 3, 5);

  // "SOUP" name tag (tiny collar)
  ctx.fillStyle = '#e74c3c';
  ctx.fillRect(-4, 0, 10, 3);
  ctx.fillStyle = '#ffd700';
  ctx.font = '5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('S', 1, 3);

  // Trick label when doing a trick
  if (state === 'idle' && trickT < 1) {
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = `rgba(255,215,0,${1 - trickT})`;
    ctx.textAlign = 'center';
    const labels = { spin: 'SPIN!', sit: 'SIT!', roll: 'ROLL!', jump: 'JUMP!', zoomies: 'ZOOM!', shake: 'SHAKE!' };
    ctx.fillText(labels[trick] || '', 0, -hs - 10);
  }

  ctx.textAlign = 'left';
  ctx.restore();
}

export function getSoupPos() {
  return { x: sx, y: sy };
}

export function isSoupEating() {
  return state === 'eating';
}
