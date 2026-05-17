// src/game/turtle.js
// Giant turtle that wanders the arena and chomps the player if they get too close.

const TURTLE_SIZE = 120;
const TURTLE_SPEED = 0.9;
const EAT_RANGE = 90;       // px from turtle center to player center
const CHOMP_COOLDOWN = 2000; // ms between chomps
const DIR_CHANGE_MS = 2800;  // how often turtle picks a new direction
const TURTLE_HP = 5;

let turtle = null;

export function resetTurtle(arenaWidth, arenaHeight) {
  turtle = {
    x: arenaWidth  * 0.5 - TURTLE_SIZE / 2,
    y: arenaHeight * 0.3 - TURTLE_SIZE / 2,
    w: TURTLE_SIZE,
    h: TURTLE_SIZE,
    hp: TURTLE_HP,
    angle: Math.random() * Math.PI * 2,
    lastDirChange: 0,
    lastChomp: -CHOMP_COOLDOWN,
    chompAnim: 0,   // 1 = fully open, decays to 0
  };
}

export function getTurtle()     { return turtle; }
export function isTurtleAlive() { return turtle !== null && turtle.hp > 0; }

export function damageTurtle() {
  if (!turtle || turtle.hp <= 0) return false;
  turtle.hp--;
  return turtle.hp <= 0;
}

// Returns true if the player was chomped this frame.
export function updateTurtle(dt, playerPos, now, arenaWidth, arenaHeight) {
  if (!turtle || turtle.hp <= 0) return false;

  const scale = dt / 16.67;

  // Periodically pick a new wandering direction
  if (now - turtle.lastDirChange > DIR_CHANGE_MS) {
    turtle.angle += (Math.random() - 0.5) * Math.PI * 1.2;
    turtle.lastDirChange = now;
  }

  // Move
  turtle.x += Math.cos(turtle.angle) * TURTLE_SPEED * scale;
  turtle.y += Math.sin(turtle.angle) * TURTLE_SPEED * scale;

  // Bounce off arena walls
  if (turtle.x < 0)                          { turtle.x = 0;                          turtle.angle = Math.PI - turtle.angle; }
  if (turtle.x + TURTLE_SIZE > arenaWidth)   { turtle.x = arenaWidth - TURTLE_SIZE;   turtle.angle = Math.PI - turtle.angle; }
  if (turtle.y < 0)                          { turtle.y = 0;                           turtle.angle = -turtle.angle; }
  if (turtle.y + TURTLE_SIZE > arenaHeight)  { turtle.y = arenaHeight - TURTLE_SIZE;  turtle.angle = -turtle.angle; }

  // Decay chomp animation
  turtle.chompAnim = Math.max(0, turtle.chompAnim - dt / 350);

  // Proximity check — did the player wander too close?
  const cx = turtle.x + TURTLE_SIZE / 2;
  const cy = turtle.y + TURTLE_SIZE / 2;
  const dx = playerPos.x - cx;
  const dy = playerPos.y - cy;
  if (Math.sqrt(dx * dx + dy * dy) < EAT_RANGE && now - turtle.lastChomp > CHOMP_COOLDOWN) {
    turtle.lastChomp = now;
    turtle.chompAnim = 1;
    turtle.angle = Math.atan2(dy, dx); // face the player
    return true;
  }

  return false;
}

export function drawTurtle(ctx, now) {
  if (!turtle || turtle.hp <= 0) return;

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
  ctx.translate(cx - (TURTLE_HP - 1) * 6, turtle.y - 14);
  for (let i = 0; i < TURTLE_HP; i++) {
    ctx.fillStyle = i < turtle.hp ? '#2ecc71' : '#444';
    ctx.beginPath();
    ctx.arc(i * 12, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
