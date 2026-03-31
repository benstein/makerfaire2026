// src/game/floors.js
// Multi-floor system with holes. Step in a hole to drop down a floor.
// Start on floor 10, reach floor 0 to win!

let currentFloor = 10;
let holes = [];
let dropping = false;
let dropTimer = 0;
const DROP_DURATION = 600; // ms for drop animation
const HOLE_COUNT_MIN = 3;
const HOLE_COUNT_MAX = 6;
const HOLE_RADIUS = 28;
const PLAYER_SAFE_ZONE = 100;

// Seeded random for consistent hole layouts per floor
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function resetFloors() {
  currentFloor = 10;
  dropping = false;
  dropTimer = 0;
  generateHoles();
}

function generateHoles(arenaWidth, arenaHeight) {
  // Store dimensions for later use
  if (arenaWidth) {
    generateHoles._w = arenaWidth;
    generateHoles._h = arenaHeight;
  }
  const w = generateHoles._w || 800;
  const h = generateHoles._h || 600;

  holes = [];
  const rng = seededRandom(currentFloor * 7919 + 42);
  const count = HOLE_COUNT_MIN + Math.floor(rng() * (HOLE_COUNT_MAX - HOLE_COUNT_MIN + 1));

  for (let i = 0; i < count; i++) {
    let hx, hy;
    for (let attempt = 0; attempt < 50; attempt++) {
      hx = HOLE_RADIUS * 2 + rng() * (w - HOLE_RADIUS * 4);
      hy = HOLE_RADIUS * 2 + rng() * (h - HOLE_RADIUS * 4);
      const cx = w / 2;
      const cy = h / 2;
      const distFromCenter = Math.sqrt((hx - cx) ** 2 + (hy - cy) ** 2);
      if (distFromCenter > PLAYER_SAFE_ZONE) break;
    }
    holes.push({ x: hx, y: hy, r: HOLE_RADIUS });
  }
}

export function initFloorHoles(arenaWidth, arenaHeight) {
  generateHoles(arenaWidth, arenaHeight);
}

export function checkHoleCollision(playerPos) {
  if (dropping) return false;
  const pr = 8; // small collision zone — you have to step INTO the hole
  for (const hole of holes) {
    const dx = playerPos.x - hole.x;
    const dy = playerPos.y - hole.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < hole.r - pr) {
      return true;
    }
  }
  return false;
}

export function startDrop() {
  dropping = true;
  dropTimer = 0;
}

export function updateFloors(dt) {
  if (!dropping) return false;
  dropTimer += dt;
  if (dropTimer >= DROP_DURATION) {
    dropping = false;
    dropTimer = 0;
    currentFloor--;
    if (currentFloor <= 0) {
      currentFloor = 0;
      return 'win';
    }
    generateHoles();
    return 'landed';
  }
  return 'dropping';
}

export function getDropProgress() {
  if (!dropping) return 0;
  return Math.min(1, dropTimer / DROP_DURATION);
}

export function isDropping() {
  return dropping;
}

export function getCurrentFloor() {
  return currentFloor;
}

export function drawHoles(ctx, now) {
  for (const hole of holes) {
    const { x, y, r } = hole;

    // Dark pit
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    grad.addColorStop(0.7, 'rgba(0, 0, 0, 0.8)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Rim highlight
    ctx.strokeStyle = 'rgba(100, 100, 120, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();

    // Subtle depth lines inside
    ctx.strokeStyle = 'rgba(60, 60, 80, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, r * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    // Down arrow hint
    ctx.globalAlpha = 0.25 + Math.sin(now / 400) * 0.15;
    ctx.fillStyle = '#888';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('\u25BC', x, y + 5);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}

export function drawDropEffect(ctx, width, height) {
  if (!dropping) return;
  const progress = getDropProgress();

  // Screen darkens and zooms as you fall
  ctx.fillStyle = `rgba(0, 0, 0, ${progress * 0.8})`;
  ctx.fillRect(0, 0, width, height);

  // Floor number falling away text
  if (progress < 0.6) {
    ctx.globalAlpha = 1 - progress * 1.5;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${48 + progress * 40}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`F${currentFloor}`, width / 2, height / 2);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  // New floor number appearing
  if (progress > 0.5) {
    const fadeIn = (progress - 0.5) * 2;
    ctx.globalAlpha = fadeIn;
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${80 - fadeIn * 32}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(`F${currentFloor - 1}`, width / 2, height / 2);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
}
