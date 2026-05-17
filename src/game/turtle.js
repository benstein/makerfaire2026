// src/game/turtle.js
// Giant turtle that wanders the arena and chomps the player if they get too close.

const TURTLE_SIZE  = 120;
const TURTLE_SPEED = 0.9;
const EAT_RANGE    = 90;
const CHOMP_COOLDOWN  = 2000;
const DIR_CHANGE_MS   = 2800;
const TURTLE_HP = 5;

const BOWSER_SIZE  = 150;
const BOWSER_HP    = 10;
const BOWSER_SPEED = 2.2;
const FIREBALL_COOLDOWN = 2400;
const FIREBALL_SPEED    = 3.2;
const FIREBALL_SIZE     = 20;

const SPAWN_INTERVAL = 20000; // ms between new turtles
const MAX_TURTLES    = 5;

let turtles = [];
let bowserMode = false;
let fireballs  = [];
let lastFireballTime = 0;
let nextSpawnTime    = 0;

export function isBowserMode()    { return bowserMode; }
export function getTurtles()      { return turtles; }
export function getTurtle()       { return turtles[0] ?? null; }
export function isTurtleAlive()   { return turtles.some(t => t.hp > 0); }
export function getFireballs()    { return fireballs; }
export function removeFireball(i) { fireballs.splice(i, 1); }

function makeTurtle(x, y) {
  return {
    x, y, w: TURTLE_SIZE, h: TURTLE_SIZE,
    hp: TURTLE_HP, maxHp: TURTLE_HP,
    angle: Math.random() * Math.PI * 2,
    lastDirChange: 0, lastChomp: -CHOMP_COOLDOWN, chompAnim: 0,
    isBowser: false,
  };
}

function spawnEdgeTurtle(aw, ah) {
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  switch (edge) {
    case 0: x = Math.random() * aw;    y = -TURTLE_SIZE; break;
    case 1: x = aw;                     y = Math.random() * ah; break;
    case 2: x = Math.random() * aw;    y = ah; break;
    default: x = -TURTLE_SIZE;          y = Math.random() * ah; break;
  }
  return makeTurtle(x, y);
}

export function resetTurtle(arenaWidth, arenaHeight) {
  bowserMode = false;
  fireballs  = [];
  lastFireballTime = 0;
  turtles = [makeTurtle(arenaWidth * 0.5 - TURTLE_SIZE / 2, arenaHeight * 0.3 - TURTLE_SIZE / 2)];
  nextSpawnTime = performance.now() + SPAWN_INTERVAL;
}

export function transformToBowser() {
  if (!turtles.length) return;
  const t = turtles[0];
  const oldCx = t.x + t.w / 2;
  const oldCy = t.y + t.h / 2;
  bowserMode  = true;
  t.isBowser  = true;
  t.w = BOWSER_SIZE; t.h = BOWSER_SIZE;
  t.hp = BOWSER_HP;  t.maxHp = BOWSER_HP;
  t.x = oldCx - BOWSER_SIZE / 2;
  t.y = oldCy - BOWSER_SIZE / 2;
  fireballs = []; lastFireballTime = 0;
}

// Returns true if this turtle died.
export function damageTurtle(index = 0) {
  const t = turtles[index];
  if (!t || t.hp <= 0) return false;
  t.hp--;
  if (t.hp <= 0) {
    if (t.isBowser) bowserMode = false;
    turtles.splice(index, 1);
    return true;
  }
  return false;
}

// Returns true if the player was chomped by any turtle this frame.
export function updateTurtle(dt, playerPos, now, arenaWidth, arenaHeight) {
  const scale = dt / 16.67;
  let chomped = false;

  // Spawn a new turtle periodically (not during Bowser fight)
  if (!bowserMode && turtles.length < MAX_TURTLES && now >= nextSpawnTime) {
    turtles.push(spawnEdgeTurtle(arenaWidth, arenaHeight));
    nextSpawnTime = now + SPAWN_INTERVAL;
  }

  for (const t of turtles) {
    if (t.hp <= 0) continue;
    const size = t.w;

    if (t.isBowser) {
      // Bowser charges at the player
      const dx = playerPos.x - (t.x + size / 2);
      const dy = playerPos.y - (t.y + size / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        t.x += (dx / dist) * BOWSER_SPEED * scale;
        t.y += (dy / dist) * BOWSER_SPEED * scale;
        t.angle = Math.atan2(dy, dx);
      }
      t.x = Math.max(0, Math.min(arenaWidth  - size, t.x));
      t.y = Math.max(0, Math.min(arenaHeight - size, t.y));

      if (now - lastFireballTime > FIREBALL_COOLDOWN && dist > 0) {
        lastFireballTime = now;
        fireballs.push({
          x: t.x + size / 2 - FIREBALL_SIZE / 2,
          y: t.y + size / 2 - FIREBALL_SIZE / 2,
          w: FIREBALL_SIZE, h: FIREBALL_SIZE,
          vx: (dx / dist) * FIREBALL_SPEED,
          vy: (dy / dist) * FIREBALL_SPEED,
        });
      }
    } else {
      // Normal turtle: wander
      if (now - t.lastDirChange > DIR_CHANGE_MS) {
        t.angle += (Math.random() - 0.5) * Math.PI * 1.2;
        t.lastDirChange = now;
      }
      t.x += Math.cos(t.angle) * TURTLE_SPEED * scale;
      t.y += Math.sin(t.angle) * TURTLE_SPEED * scale;

      if (t.x < 0)               { t.x = 0;               t.angle = Math.PI - t.angle; }
      if (t.x + size > arenaWidth)  { t.x = arenaWidth - size;  t.angle = Math.PI - t.angle; }
      if (t.y < 0)               { t.y = 0;               t.angle = -t.angle; }
      if (t.y + size > arenaHeight) { t.y = arenaHeight - size; t.angle = -t.angle; }

      // Proximity chomp
      t.chompAnim = Math.max(0, t.chompAnim - dt / 350);
      const dx = playerPos.x - (t.x + size / 2);
      const dy = playerPos.y - (t.y + size / 2);
      if (Math.sqrt(dx * dx + dy * dy) < EAT_RANGE && now - t.lastChomp > CHOMP_COOLDOWN) {
        t.lastChomp = now;
        t.chompAnim = 1;
        t.angle = Math.atan2(dy, dx);
        chomped = true;
      }
    }
  }

  // Move fireballs
  for (let i = fireballs.length - 1; i >= 0; i--) {
    fireballs[i].x += fireballs[i].vx * scale;
    fireballs[i].y += fireballs[i].vy * scale;
    if (fireballs[i].x < -60 || fireballs[i].x > arenaWidth + 60 ||
        fireballs[i].y < -60 || fireballs[i].y > arenaHeight + 60) {
      fireballs.splice(i, 1);
    }
  }

  return chomped;
}

export function drawTurtle(ctx, now) {
  drawFireballs(ctx, now);
  for (const t of turtles) {
    if (t.hp <= 0) continue;
    if (t.isBowser) { drawBowser(ctx, t, now); continue; }
    drawOneTurtle(ctx, t, now);
  }
}

function drawOneTurtle(ctx, turtle, now) {

  const cx = turtle.x + TURTLE_SIZE / 2;
  const cy = turtle.y + TURTLE_SIZE / 2;
  const r  = TURTLE_SIZE / 2; // 60

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(turtle.angle);

  // --- Legs ---
  ctx.fillStyle = '#4a7c2f';
  for (const [lx, ly, rw, rh, ra] of [
    [-r * 0.52, -r * 0.52, r * 0.24, r * 0.15,  0.4],
    [ r * 0.28, -r * 0.56, r * 0.24, r * 0.15, -0.4],
    [-r * 0.52,  r * 0.52, r * 0.24, r * 0.15, -0.4],
    [ r * 0.28,  r * 0.56, r * 0.24, r * 0.15,  0.4],
  ]) {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(ra);
    ctx.beginPath();
    ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // --- Shell ---
  ctx.fillStyle = '#2e5c12';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.82, r * 0.76, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shell rim (lighter edge)
  ctx.strokeStyle = '#3d7a1a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.82, r * 0.76, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Scute pattern — center hex + ring
  ctx.strokeStyle = '#1e3d0a';
  ctx.lineWidth = 2;
  const scutes = [
    [0, 0, r * 0.28],
    [-r * 0.34, -r * 0.24, r * 0.2],
    [ r * 0.34, -r * 0.24, r * 0.2],
    [ 0,        -r * 0.44, r * 0.16],
    [-r * 0.34,  r * 0.24, r * 0.2],
    [ r * 0.34,  r * 0.24, r * 0.2],
    [ 0,         r * 0.44, r * 0.16],
  ];
  for (const [sx, sy, sr] of scutes) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const hx = sx + Math.cos(a) * sr;
      const hy = sy + Math.sin(a) * sr;
      i === 0 ? ctx.moveTo(hx, hy) : ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Shell gloss
  ctx.fillStyle = 'rgba(255,255,255,0.09)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.18, -r * 0.22, r * 0.3, r * 0.2, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // --- Neck ---
  ctx.fillStyle = '#5a9438';
  ctx.beginPath();
  ctx.ellipse(r * 0.7, 0, r * 0.2, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();

  // --- Head ---
  const headReach = r * 0.78 + turtle.chompAnim * r * 0.22;
  ctx.fillStyle = '#4a7c2f';
  ctx.beginPath();
  ctx.ellipse(headReach, 0, r * 0.3, r * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(headReach + r * 0.05, -r * 0.11, r * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(headReach + r * 0.05,  r * 0.11, r * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(headReach + r * 0.08, -r * 0.13, r * 0.03, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(headReach + r * 0.08,  r * 0.09, r * 0.03, 0, Math.PI * 2); ctx.fill();

  // Mouth
  if (turtle.chompAnim > 0.05) {
    const gap = turtle.chompAnim * r * 0.2;
    // Lower jaw
    ctx.fillStyle = '#8b3a00';
    ctx.beginPath();
    ctx.moveTo(headReach - r * 0.18, 0);
    ctx.lineTo(headReach + r * 0.22,  gap * 0.2);
    ctx.lineTo(headReach + r * 0.22,  gap);
    ctx.lineTo(headReach - r * 0.05,  gap * 0.5);
    ctx.closePath();
    ctx.fill();
    // Upper jaw
    ctx.beginPath();
    ctx.moveTo(headReach - r * 0.18, 0);
    ctx.lineTo(headReach + r * 0.22, -gap * 0.2);
    ctx.lineTo(headReach + r * 0.22, -gap);
    ctx.lineTo(headReach - r * 0.05, -gap * 0.5);
    ctx.closePath();
    ctx.fill();
    // Teeth (upper)
    ctx.fillStyle = '#fffde7';
    for (let i = 0; i < 3; i++) {
      const tx = headReach - r * 0.05 + i * r * 0.1;
      ctx.beginPath();
      ctx.moveTo(tx,           -gap * 0.35);
      ctx.lineTo(tx + r * 0.04, -gap * 0.85);
      ctx.lineTo(tx + r * 0.08, -gap * 0.35);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(tx,            gap * 0.35);
      ctx.lineTo(tx + r * 0.04, gap * 0.85);
      ctx.lineTo(tx + r * 0.08, gap * 0.35);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = '#1e3d0a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(headReach - r * 0.12, 0);
    ctx.lineTo(headReach + r * 0.2,  0);
    ctx.stroke();
  }

  ctx.restore();

  // HP pips above turtle
  ctx.save();
  ctx.translate(cx - (turtle.maxHp - 1) * 6, turtle.y - 14);
  for (let i = 0; i < turtle.maxHp; i++) {
    ctx.fillStyle = i < turtle.hp ? '#2ecc71' : '#444';
    ctx.beginPath();
    ctx.arc(i * 12, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFireballs(ctx, now) {
  for (const fb of fireballs) {
    const fcx = fb.x + fb.w / 2;
    const fcy = fb.y + fb.h / 2;
    const fr  = fb.w / 2;
    const flicker = Math.sin(now / 60) * 0.3;
    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = '#ff8800';
    ctx.fillStyle = `rgba(255, ${Math.round(80 + flicker * 80)}, 0, 0.92)`;
    ctx.beginPath(); ctx.arc(fcx, fcy, fr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff9a0';
    ctx.beginPath(); ctx.arc(fcx, fcy, fr * 0.48, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawBowser(ctx, turtle, now) {
  drawFireballs(ctx, now);

  const cx = turtle.x + turtle.w / 2;
  const cy = turtle.y + turtle.h / 2;
  const r  = turtle.w / 2; // 75

  ctx.save();
  ctx.translate(cx, cy);

  // Spiky shell ring
  ctx.fillStyle = '#c86000';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + now / 1800;
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.12);
    ctx.lineTo(-r * 0.14, -r * 0.84);
    ctx.lineTo( r * 0.14, -r * 0.84);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Body
  ctx.fillStyle = '#2a6018';
  ctx.beginPath(); ctx.ellipse(0, 0, r * 0.9, r * 0.86, 0, 0, Math.PI * 2); ctx.fill();

  // Shell scutes
  ctx.strokeStyle = '#1a3d0a'; ctx.lineWidth = 2;
  for (const [sx, sy, sr] of [
    [0, 0, r * 0.32], [-r*0.36, -r*0.22, r*0.2], [r*0.36, -r*0.22, r*0.2],
    [-r*0.36, r*0.24, r*0.2], [r*0.36, r*0.24, r*0.2],
  ]) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i/6)*Math.PI*2 - Math.PI/6;
      i === 0 ? ctx.moveTo(sx + Math.cos(a)*sr, sy + Math.sin(a)*sr)
              : ctx.lineTo(sx + Math.cos(a)*sr, sy + Math.sin(a)*sr);
    }
    ctx.closePath(); ctx.stroke();
  }

  // Eyes — yellow sclera, red pupils
  ctx.fillStyle = '#ffdd00';
  ctx.beginPath(); ctx.ellipse(-r*0.3, -r*0.33, r*0.24, r*0.2, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( r*0.3, -r*0.33, r*0.24, r*0.2, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#cc0000';
  ctx.beginPath(); ctx.ellipse(-r*0.27, -r*0.32, r*0.13, r*0.15, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( r*0.27, -r*0.32, r*0.13, r*0.15, 0, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(-r*0.25, -r*0.31, r*0.07, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc( r*0.25, -r*0.31, r*0.07, 0, Math.PI*2); ctx.fill();

  // Angry V-eyebrows
  ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-r*0.48, -r*0.5); ctx.lineTo(-r*0.12, -r*0.43); ctx.stroke();
  ctx.beginPath(); ctx.moveTo( r*0.48, -r*0.5); ctx.lineTo( r*0.12, -r*0.43); ctx.stroke();

  // Crown
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  ctx.moveTo(-r*0.3, -r*0.7); ctx.lineTo(-r*0.3, -r*0.9);
  ctx.lineTo(-r*0.15,-r*0.76); ctx.lineTo(0, -r*0.94);
  ctx.lineTo( r*0.15,-r*0.76); ctx.lineTo( r*0.3, -r*0.9);
  ctx.lineTo( r*0.3, -r*0.7); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#b8860b'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#ff4444';
  ctx.beginPath(); ctx.arc(0, -r*0.86, r*0.05, 0, Math.PI*2); ctx.fill();

  // Claws
  ctx.fillStyle = '#3a7820';
  ctx.beginPath(); ctx.ellipse(-r*1.0, 0, r*0.24, r*0.17, 0.5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse( r*1.0, 0, r*0.24, r*0.17,-0.5, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#1a3d0a'; ctx.lineWidth = r*0.07;
  for (const sx of [-1, 1]) {
    for (let s = -1; s <= 1; s++) {
      ctx.beginPath();
      ctx.moveTo(sx*r*1.0 + s*r*0.09, 0);
      ctx.lineTo(sx*r*1.22 + s*r*0.13, -r*0.16);
      ctx.stroke();
    }
  }

  ctx.restore();

  // HP bar above Bowser
  const barW = turtle.w * 1.05;
  const barX = cx - barW / 2;
  const barY = turtle.y - 20;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.beginPath(); ctx.roundRect(barX - 2, barY - 2, barW + 4, 13, 4); ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.roundRect(barX, barY, barW, 9, 3); ctx.fill();
  const hpFrac = turtle.hp / BOWSER_HP;
  if (hpFrac > 0) {
    ctx.fillStyle = hpFrac > 0.4 ? '#ff5500' : '#ff0000';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW * hpFrac, 9, 3); ctx.fill();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BOWSER', cx, barY - 5);
  ctx.textAlign = 'left';
}
