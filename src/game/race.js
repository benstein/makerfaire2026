// src/game/race.js
// Zeke's race — player vs Soup the dog through 15 maps

export const TOTAL_MAPS = 15;

const MAP_CONFIGS = [
  { name: 'Sunny Meadow',    bg: '#e8f5c8', border: '#6aaa00' },
  { name: 'Pink Desert',     bg: '#f7e0c8', border: '#e06020' },
  { name: 'Crystal Cave',    bg: '#c8eef0', border: '#0090a0' },
  { name: 'Mushroom Forest', bg: '#f0c8f0', border: '#9030a0' },
  { name: 'Candy Land',      bg: '#ffe0f4', border: '#e050a0' },
  { name: 'Snowy Hills',     bg: '#ddeeff', border: '#2060cc' },
  { name: 'Golden Fields',   bg: '#f8f0a0', border: '#c08000' },
  { name: 'Thunderstorm',    bg: '#c8d4e0', border: '#4060a0' },
  { name: 'Lava Plains',     bg: '#f5d0a8', border: '#c04000' },
  { name: 'Ice World',       bg: '#c8e8f8', border: '#006090' },
  { name: 'Enchanted Wood',  bg: '#c8f0c8', border: '#008040' },
  { name: 'Rainbow Valley',  bg: '#f0e8c8', border: '#c08030' },
  { name: 'Shadow Realm',    bg: '#d0d0dc', border: '#404070' },
  { name: 'Volcano Peak',    bg: '#f0c8b0', border: '#c03000' },
  { name: 'Boss Gateway',    bg: '#f0d0d0', border: '#a00000' },
];

const SOUP_SPEED = 2.4; // px/frame at 60fps — player speed is 4, so Soup is ~60% but doesn't get slowed by bears

let playerMap = 0;
let soupMap = 0;
let soupX = 0;
let soupY = 0;
let winner = null; // null | 'player' | 'soup'

export function resetRace(width, height) {
  playerMap = 0;
  soupMap = 0;
  soupX = 60;
  soupY = height * 0.4;
  winner = null;
}

export function getPlayerMap() { return playerMap; }
export function getSoupMap() { return soupMap; }
export function getSoupRaceX() { return soupX; }
export function getSoupRaceY() { return soupY; }
export function getRaceWinner() { return winner; }
export function getCurrentMapConfig() { return MAP_CONFIGS[Math.min(playerMap, TOTAL_MAPS - 1)]; }

export function advancePlayerMap() {
  playerMap++;
  if (playerMap >= TOTAL_MAPS && !winner) winner = 'player';
}

export function updateRaceAI(dt, width, height, now) {
  if (winner) return;
  const scale = dt / 16.67;
  soupX += SOUP_SPEED * scale;
  soupY = height * 0.45 + Math.sin(now / 250) * 18;

  if (soupX >= width - 30) {
    soupMap++;
    soupX = 60;
    if (soupMap >= TOTAL_MAPS && !winner) winner = 'soup';
  }
}

export function resetSoupToLeftEdge(height) {
  soupX = 60;
  soupY = height * 0.4;
}

export function drawRaceHUD(ctx, width, height, now) {
  const mapCfg = getCurrentMapConfig();

  // Map name banner at top-center
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = mapCfg.border;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeText(`MAP ${playerMap + 1} / ${TOTAL_MAPS}  —  ${mapCfg.name}`, width / 2, 32);
  ctx.fillText(`MAP ${playerMap + 1} / ${TOTAL_MAPS}  —  ${mapCfg.name}`, width / 2, 32);

  // Race progress bars
  const barW = 160;
  const barH = 14;
  const barX = width - barW - 16;
  const barY = 16;
  const gap = 22;

  // Player bar
  const playerPct = playerMap / TOTAL_MAPS;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = '#2c7bd4';
  ctx.fillRect(barX, barY, barW * playerPct, barH);
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#2c3e50';
  ctx.fillText('YOU', barX - 36, barY + barH - 2);

  // Soup bar
  const soupPct = (soupMap + Math.min(soupX / width, 1)) / TOTAL_MAPS;
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(barX, barY + gap, barW, barH);
  ctx.fillStyle = '#d35400';
  ctx.fillRect(barX, barY + gap, barW * soupPct, barH);
  ctx.fillStyle = '#2c3e50';
  ctx.fillText('SOUP', barX - 42, barY + gap + barH - 2);

  ctx.textAlign = 'left';
  ctx.restore();

  // Finish line on right edge
  ctx.save();
  const stripeH = 20;
  for (let fy = 0; fy < height; fy += stripeH) {
    ctx.fillStyle = (Math.floor(fy / stripeH) % 2 === 0) ? '#fff' : '#222';
    ctx.fillRect(width - 8, fy, 8, stripeH);
  }
  // Arrow hint
  ctx.fillStyle = mapCfg.border;
  ctx.font = 'bold 28px monospace';
  ctx.textAlign = 'right';
  const pulseAlpha = 0.6 + Math.sin(now / 300) * 0.4;
  ctx.globalAlpha = pulseAlpha;
  ctx.fillText('▶▶', width - 14, height / 2 + 10);
  ctx.globalAlpha = 1;
  ctx.restore();
}
