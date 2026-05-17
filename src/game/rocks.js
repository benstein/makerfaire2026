// src/game/rocks.js — rocks that spawn in the arena; safe to stand on, monsters eat them

import { LAVA_HEIGHT } from './lava.js';

const ROCK_HP       = 4;
const SPAWN_INTERVAL = 7000;  // ms between spawns
const FIRST_SPAWN    = 3000;  // delay before first rock
const MAX_ROCKS      = 4;
const CHOMP_COOLDOWN = 900;   // ms per monster bite

let rocks = [];
let lastSpawnTime;

export function resetRocks(now) {
  rocks = [];
  lastSpawnTime = now - SPAWN_INTERVAL + FIRST_SPAWN;
}

export function updateRocks(now, arenaWidth, arenaHeight) {
  if (rocks.length < MAX_ROCKS && now - lastSpawnTime > SPAWN_INTERVAL) {
    spawnRock(arenaWidth, arenaHeight, now);
    lastSpawnTime = now;
  }
}

function spawnRock(arenaWidth, arenaHeight, now) {
  const size = 60 + Math.random() * 30;
  const margin = size + 50;
  const safeH  = arenaHeight - LAVA_HEIGHT - margin;

  // Don't spawn if arena is too small
  if (safeH < margin) return;

  const cx = margin + Math.random() * (arenaWidth - margin * 2);
  const cy = margin + Math.random() * safeH;

  rocks.push({
    x: cx - size / 2,
    y: cy - size * 0.42,  // slightly squished height
    w: size,
    h: size * 0.75,
    hp: ROCK_HP,
    maxHp: ROCK_HP,
    hue: 20 + Math.random() * 25,  // warm gray-brown
    points: makeRockPoints(size),
    lastChompTime: 0,
    hitFlash: 0,
    born: now,
  });
}

function makeRockPoints(size) {
  const n = 9 + Math.floor(Math.random() * 4);
  return Array.from({ length: n }, (_, i) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2 + (Math.random() - 0.5) * 0.55;
    const r = 0.70 + Math.random() * 0.30;
    return { a: angle, r };
  });
}

// Called from main.js when an enemy overlaps a rock; returns true if rock died
export function chompRock(rockIndex, now) {
  const rock = rocks[rockIndex];
  if (!rock) return false;
  if (now - rock.lastChompTime < CHOMP_COOLDOWN) return false;

  rock.hp -= 1;
  rock.lastChompTime = now;
  rock.hitFlash = now;

  if (rock.hp <= 0) {
    rocks.splice(rockIndex, 1);
    return true;
  }
  return false;
}

// True if the player bounding box overlaps any rock
export function isPlayerOnRock(pb) {
  for (const rock of rocks) {
    if (pb.x < rock.x + rock.w && pb.x + pb.w > rock.x &&
        pb.y < rock.y + rock.h && pb.y + pb.h > rock.y) {
      return true;
    }
  }
  return false;
}

export function getRocks() { return rocks; }

export function drawRocks(ctx, now) {
  for (const rock of rocks) drawBoulder(ctx, rock, now);
}

function drawBoulder(ctx, rock, now) {
  const cx = rock.x + rock.w / 2;
  const cy = rock.y + rock.h / 2;
  const rx = rock.w / 2;
  const ry = rock.h / 2;
  const hpFrac = rock.hp / rock.maxHp;

  const flashAge = now - rock.hitFlash;
  const flash = flashAge < 200 ? (1 - flashAge / 200) : 0;

  ctx.save();
  ctx.translate(cx, cy);

  // Ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(5, ry * 0.72, rx * 0.88, ry * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Build the boulder outline
  ctx.beginPath();
  for (let i = 0; i <= rock.points.length; i++) {
    const pt = rock.points[i % rock.points.length];
    const px = Math.cos(pt.a) * rx * pt.r;
    const py = Math.sin(pt.a) * ry * pt.r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Gradient fill — lighter as it crumbles
  const baseL = 42 + (1 - hpFrac) * 14;
  const grad = ctx.createRadialGradient(-rx * 0.28, -ry * 0.3, 0, 0, 0, rx);
  grad.addColorStop(0,   `hsl(${rock.hue}, 14%, ${baseL + 24}%)`);
  grad.addColorStop(0.55, `hsl(${rock.hue}, 11%, ${baseL}%)`);
  grad.addColorStop(1,   `hsl(${rock.hue}, 8%,  ${baseL - 18}%)`);
  ctx.fillStyle = grad;
  ctx.fill();

  // Chomp flash (orange burst)
  if (flash > 0) {
    ctx.fillStyle = `rgba(255, 120, 0, ${flash * 0.6})`;
    ctx.fill();
  }

  // Outline
  ctx.strokeStyle = `hsl(${rock.hue}, 9%, 20%)`;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Safe-zone green glow outline
  ctx.strokeStyle = `rgba(80, 230, 110, 0.40)`;
  ctx.lineWidth = 5;
  ctx.stroke();

  // Cracks — one per damage taken
  const cracksTaken = rock.maxHp - rock.hp;
  ctx.strokeStyle = `rgba(30, 20, 10, 0.65)`;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  for (let c = 0; c < cracksTaken; c++) {
    const ca = 0.5 + c * 1.9;
    const len = rx * (0.3 + Math.sin(c * 17.3) * 0.2);
    ctx.beginPath();
    ctx.moveTo(Math.cos(ca) * rx * 0.15, Math.sin(ca) * ry * 0.15);
    ctx.lineTo(Math.cos(ca) * len, Math.sin(ca) * ry * (len / rx));
    // branch
    const ba = ca + 0.45;
    ctx.lineTo(Math.cos(ba) * len * 0.55, Math.sin(ba) * ry * 0.55 * (len / rx));
    ctx.stroke();
  }

  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.beginPath();
  ctx.ellipse(-rx * 0.22, -ry * 0.28, rx * 0.30, ry * 0.20, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // HP pips below the rock
  const pipSpacing = rx * 0.55;
  const pipStartX = -(rock.maxHp - 1) * pipSpacing / 2;
  for (let i = 0; i < rock.maxHp; i++) {
    ctx.beginPath();
    ctx.arc(pipStartX + i * pipSpacing, ry * 0.85, 5, 0, Math.PI * 2);
    ctx.fillStyle = i < rock.hp ? '#6ee87a' : 'rgba(100,100,100,0.38)';
    ctx.fill();
  }

  ctx.restore();
}
