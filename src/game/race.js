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

export function drawMapBackground(ctx, width, height, now) {
  const idx = Math.min(playerMap, TOTAL_MAPS - 1);
  const cfg = MAP_CONFIGS[idx];
  ctx.fillStyle = cfg.bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = cfg.border;
  ctx.fillStyle = cfg.border;

  if (idx === 0) { // Sunny Meadow — flowers
    for (let gx = 50; gx < width; gx += 90) for (let gy = 45; gy < height; gy += 75) {
      for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(gx + Math.cos(a) * 13, gy + Math.sin(a) * 13, 8, 0, Math.PI * 2); ctx.fill(); }
      ctx.beginPath(); ctx.arc(gx, gy, 8, 0, Math.PI * 2); ctx.fill();
    }
  } else if (idx === 1) { // Pink Desert — diagonal sand ripples
    ctx.lineWidth = 4;
    for (let s = -height; s < width + height; s += 38) { ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(s + height, height); ctx.stroke(); }
  } else if (idx === 2) { // Crystal Cave — hexagonal grid
    ctx.lineWidth = 1.5;
    const r = 28;
    for (let col = 0; col * r * 1.5 < width + r * 2; col++) for (let row = 0; row * r * 1.73 < height + r * 2; row++) {
      const hx = col * r * 1.5, hy = row * r * 1.73 + (col % 2) * r * 0.87;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; i === 0 ? ctx.moveTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r) : ctx.lineTo(hx + Math.cos(a) * r, hy + Math.sin(a) * r); }
      ctx.closePath(); ctx.stroke();
    }
  } else if (idx === 3) { // Mushroom Forest — polka dots with spots
    for (let gx = 55; gx < width; gx += 75) for (let gy = 50; gy < height; gy += 65) {
      ctx.beginPath(); ctx.arc(gx, gy, 22, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.5; ctx.fillStyle = cfg.bg;
      for (const [ox, oy] of [[-8, -6], [8, -6], [0, 8]]) { ctx.beginPath(); ctx.arc(gx + ox, gy + oy, 5, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 0.16; ctx.fillStyle = cfg.border;
    }
  } else if (idx === 4) { // Candy Land — diagonal stripes
    ctx.lineWidth = 16;
    for (let s = -height; s < width + height; s += 44) {
      ctx.strokeStyle = s % 88 < 44 ? cfg.border : '#ffffff';
      ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(s - height, height); ctx.stroke();
    }
  } else if (idx === 5) { // Snowy Hills — snowflakes
    ctx.lineWidth = 1.5;
    for (let gx = 40; gx < width; gx += 65) for (let gy = 40; gy < height; gy += 58) {
      for (let arm = 0; arm < 6; arm++) { const a = arm / 6 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + Math.cos(a) * 18, gy + Math.sin(a) * 18); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(gx, gy, 3, 0, Math.PI * 2); ctx.fill();
    }
  } else if (idx === 6) { // Golden Fields — horizontal harvest lines
    ctx.lineWidth = 3;
    for (let gy = 12; gy < height; gy += 22) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke(); }
  } else if (idx === 7) { // Thunderstorm — lightning bolts
    ctx.lineWidth = 2.5;
    for (let gx = 60; gx < width; gx += 110) for (let gy = 30; gy < height; gy += 100) {
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx - 10, gy + 22); ctx.lineTo(gx + 6, gy + 22); ctx.lineTo(gx - 8, gy + 50); ctx.stroke();
    }
  } else if (idx === 8) { // Lava Plains — lava blobs
    for (let gx = 55; gx < width; gx += 85) for (let gy = 45; gy < height; gy += 72) {
      ctx.beginPath(); ctx.ellipse(gx, gy, 30, 18, gx / 120, 0, Math.PI * 2); ctx.fill();
    }
  } else if (idx === 9) { // Ice World — diamond lattice
    ctx.lineWidth = 1.5;
    for (let gx = 35; gx < width; gx += 58) for (let gy = 30; gy < height; gy += 48) {
      ctx.beginPath(); ctx.moveTo(gx, gy - 20); ctx.lineTo(gx + 20, gy); ctx.lineTo(gx, gy + 20); ctx.lineTo(gx - 20, gy); ctx.closePath(); ctx.stroke();
    }
  } else if (idx === 10) { // Enchanted Wood — tree silhouettes
    for (let gx = 65; gx < width; gx += 95) {
      ctx.fillRect(gx - 5, height * 0.28, 10, height * 0.72);
      ctx.beginPath(); ctx.arc(gx, height * 0.22, 35, 0, Math.PI * 2); ctx.fill();
    }
  } else if (idx === 11) { // Rainbow Valley — stacked arcs
    ctx.lineWidth = 10; ctx.globalAlpha = 0.12;
    const colors = ['#ff6b6b', '#ffd700', '#6bff6b', '#6bb4ff', '#d06bff'];
    for (let a = 0; a < 5; a++) { ctx.strokeStyle = colors[a]; ctx.beginPath(); ctx.arc(width / 2, height * 0.8, 70 + a * 65, Math.PI, Math.PI * 2); ctx.stroke(); }
  } else if (idx === 12) { // Shadow Realm — crosshatch
    ctx.lineWidth = 1;
    for (let s = 0; s < width + height; s += 32) { ctx.beginPath(); ctx.moveTo(s, 0); ctx.lineTo(0, s); ctx.stroke(); ctx.beginPath(); ctx.moveTo(width - s, 0); ctx.lineTo(width, s); ctx.stroke(); }
  } else if (idx === 13) { // Volcano Peak — concentric heat rings
    ctx.lineWidth = 3;
    for (let r = 35; r < Math.max(width, height) * 1.2; r += 52) { ctx.beginPath(); ctx.arc(width / 2, height, r, 0, Math.PI * 2); ctx.stroke(); }
  } else if (idx === 14) { // Boss Gateway — 5-point stars
    for (let gx = 55; gx < width; gx += 88) for (let gy = 45; gy < height; gy += 75) {
      ctx.beginPath();
      for (let pt = 0; pt < 10; pt++) { const a = pt / 10 * Math.PI * 2 - Math.PI / 2; const r = pt % 2 === 0 ? 22 : 9; pt === 0 ? ctx.moveTo(gx + Math.cos(a) * r, gy + Math.sin(a) * r) : ctx.lineTo(gx + Math.cos(a) * r, gy + Math.sin(a) * r); }
      ctx.closePath(); ctx.fill();
    }
  }

  ctx.restore();
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
