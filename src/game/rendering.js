// src/game/rendering.js

import { CONFIG } from './config.js';

let canvas, ctx;

export function initRendering(canvasEl) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  return ctx;
}

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}

export function getCanvasSize() {
  return { width: canvas.width, height: canvas.height };
}

// Preload logo — ready well before title screen is shown
const _logo = new Image();
_logo.src = '/assets/logo.jpg';

export function clearCanvas() {
  const w = canvas.width, h = canvas.height;
  const now = performance.now();
  const wall = Math.round(Math.min(w, h) * 0.09); // wall thickness

  // --- Sky beyond the walls ---
  ctx.fillStyle = '#6a8fa8';
  ctx.fillRect(0, 0, w, h);

  // --- Stone floor tiles inside the walls ---
  const tileSize = 52;
  const floorX = wall, floorY = wall, floorW = w - wall * 2, floorH = h - wall * 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(floorX, floorY, floorW, floorH);
  ctx.clip();
  for (let row = 0; row * tileSize < floorH + tileSize; row++) {
    for (let col = 0; col * tileSize < floorW + tileSize; col++) {
      const tx = floorX + col * tileSize;
      const ty = floorY + row * tileSize;
      const shade = ((row + col) % 2 === 0) ? '#c4b49a' : '#bfad94';
      ctx.fillStyle = shade;
      ctx.fillRect(tx + 1, ty + 1, tileSize - 2, tileSize - 2);
    }
  }
  // Grout lines
  ctx.strokeStyle = '#a8966e';
  ctx.lineWidth = 1;
  for (let row = 0; row * tileSize <= floorH; row++) {
    ctx.beginPath(); ctx.moveTo(floorX, floorY + row * tileSize); ctx.lineTo(floorX + floorW, floorY + row * tileSize); ctx.stroke();
  }
  for (let col = 0; col * tileSize <= floorW; col++) {
    ctx.beginPath(); ctx.moveTo(floorX + col * tileSize, floorY); ctx.lineTo(floorX + col * tileSize, floorY + floorH); ctx.stroke();
  }
  ctx.restore();

  // --- Stone walls (4 sides) ---
  const stoneColors = ['#8b8075', '#7d7268', '#877c70'];
  function drawStoneWall(x, y, bw, bh) {
    const blockW = 36, blockH = 22;
    for (let row = 0; row * blockH < bh; row++) {
      for (let col = 0; col * blockW < bw + blockW; col++) {
        const offset = (row % 2) * (blockW / 2);
        const bx = x + col * blockW - offset;
        const by = y + row * blockH;
        const c = stoneColors[(row * 3 + col) % stoneColors.length];
        ctx.fillStyle = c;
        ctx.fillRect(bx + 1, by + 1, blockW - 2, blockH - 2);
      }
    }
    ctx.strokeStyle = '#5a5148';
    ctx.lineWidth = 1;
    for (let row = 0; row * blockH <= bh; row++) {
      ctx.beginPath(); ctx.moveTo(x, y + row * blockH); ctx.lineTo(x + bw, y + row * blockH); ctx.stroke();
    }
    for (let col = 0; col * blockW <= bw + blockW; col++) {
      const offset = 0;
      ctx.beginPath(); ctx.moveTo(x + col * blockW, y); ctx.lineTo(x + col * blockW, y + bh); ctx.stroke();
    }
  }
  drawStoneWall(0,       0,       w,    wall); // top
  drawStoneWall(0,       h-wall,  w,    wall); // bottom
  drawStoneWall(0,       wall,    wall, h - wall * 2); // left
  drawStoneWall(w-wall,  wall,    wall, h - wall * 2); // right

  // --- Battlements (crenellations) on top of walls ---
  const mW = Math.round(wall * 0.6), mH = Math.round(wall * 0.45);
  ctx.fillStyle = '#6b6058';
  const mCount = Math.floor(w / (mW * 2));
  for (let i = 0; i < mCount; i++) {
    ctx.fillRect(i * mW * 2,        0,    mW, mH); // top
    ctx.fillRect(i * mW * 2,        h - mH, mW, mH); // bottom
  }
  const mCountV = Math.floor(h / (mW * 2));
  for (let i = 0; i < mCountV; i++) {
    ctx.fillRect(0,       i * mW * 2, mH, mW); // left
    ctx.fillRect(w - mH,  i * mW * 2, mH, mW); // right
  }

  // --- Corner towers ---
  function drawTower(tx, ty) {
    const tr = wall * 1.1;
    ctx.fillStyle = '#7a6f65';
    ctx.beginPath(); ctx.arc(tx, ty, tr, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5a5148'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(tx, ty, tr, 0, Math.PI * 2); ctx.stroke();
    // Tower battlements (ring of merlons)
    ctx.fillStyle = '#625850';
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      const mx = tx + Math.cos(angle) * tr * 0.82;
      const my = ty + Math.sin(angle) * tr * 0.82;
      ctx.beginPath(); ctx.arc(mx, my, tr * 0.18, 0, Math.PI * 2); ctx.fill();
    }
    // Inner circle
    ctx.fillStyle = '#8a7e72';
    ctx.beginPath(); ctx.arc(tx, ty, tr * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5a5148';
    ctx.beginPath(); ctx.arc(tx, ty, tr * 0.55, 0, Math.PI * 2); ctx.stroke();
  }
  drawTower(wall * 0.5, wall * 0.5);
  drawTower(w - wall * 0.5, wall * 0.5);
  drawTower(wall * 0.5, h - wall * 0.5);
  drawTower(w - wall * 0.5, h - wall * 0.5);

  // --- Flickering torches on the walls ---
  function drawTorch(tx, ty) {
    const flicker = 0.7 + 0.3 * Math.sin(now / 80 + tx * 0.1);
    // Bracket
    ctx.fillStyle = '#444';
    ctx.fillRect(tx - 3, ty, 6, 8);
    // Flame glow
    ctx.save();
    ctx.globalAlpha = 0.35 * flicker;
    ctx.fillStyle = '#ff8800';
    ctx.beginPath(); ctx.arc(tx, ty - 8, 12 * flicker, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Flame
    ctx.fillStyle = `hsl(${30 + flicker * 15}, 100%, ${50 + flicker * 10}%)`;
    ctx.beginPath();
    ctx.moveTo(tx, ty - 16 * flicker);
    ctx.quadraticCurveTo(tx + 5, ty - 6, tx, ty);
    ctx.quadraticCurveTo(tx - 5, ty - 6, tx, ty - 16 * flicker);
    ctx.fill();
    // Bright core
    ctx.fillStyle = '#fff9c0';
    ctx.beginPath(); ctx.arc(tx, ty - 4, 3 * flicker, 0, Math.PI * 2); ctx.fill();
  }
  // Top and bottom wall torches
  drawTorch(Math.round(w * 0.25), wall - 4);
  drawTorch(Math.round(w * 0.75), wall - 4);
  drawTorch(Math.round(w * 0.25), h - wall + 4);
  drawTorch(Math.round(w * 0.75), h - wall + 4);
  // Left and right wall torches
  drawTorch(wall - 4, Math.round(h * 0.33));
  drawTorch(wall - 4, Math.round(h * 0.67));
  drawTorch(w - wall + 4, Math.round(h * 0.33));
  drawTorch(w - wall + 4, Math.round(h * 0.67));
}

export function drawMarioBackground(fctx, width, height, now) {
  const t = now / 1000;

  // Sky
  fctx.fillStyle = '#5c94fc';
  fctx.fillRect(0, 0, width, height);

  // Clouds
  for (const [cx2, cy2, sz] of [
    [width * 0.12, height * 0.11, 88],
    [width * 0.47, height * 0.07, 108],
    [width * 0.78, height * 0.17, 72],
  ]) {
    fctx.fillStyle = '#fff';
    fctx.beginPath();
    fctx.arc(cx2, cy2, sz * 0.38, 0, Math.PI * 2);
    fctx.arc(cx2 + sz * 0.33, cy2 + sz * 0.08, sz * 0.28, 0, Math.PI * 2);
    fctx.arc(cx2 - sz * 0.28, cy2 + sz * 0.1,  sz * 0.24, 0, Math.PI * 2);
    fctx.fill();
    fctx.fillRect(cx2 - sz * 0.52, cy2 + sz * 0.1, sz * 1.05, sz * 0.28);
  }

  // Floating ? blocks
  const blink = Math.floor(t * 2) % 2;
  for (const [bx, by] of [
    [width * 0.22, height * 0.42],
    [width * 0.50, height * 0.32],
    [width * 0.72, height * 0.47],
  ]) {
    const bs = 34;
    fctx.fillStyle = '#e8a000';
    fctx.fillRect(bx - bs / 2, by - bs / 2, bs, bs);
    fctx.strokeStyle = '#703000';
    fctx.lineWidth = 2;
    fctx.strokeRect(bx - bs / 2, by - bs / 2, bs, bs);
    // Inner border highlight
    fctx.strokeStyle = '#ffd060';
    fctx.lineWidth = 1.5;
    fctx.strokeRect(bx - bs / 2 + 3, by - bs / 2 + 3, bs - 6, bs - 6);
    fctx.fillStyle = blink ? '#ffffff' : '#ffe060';
    fctx.font = `bold ${Math.round(bs * 0.72)}px monospace`;
    fctx.textAlign = 'center';
    fctx.fillText('?', bx, by + bs * 0.25);
    fctx.textAlign = 'left';
  }

  // Ground strip
  const gH = 58;
  const gY = height - gH;
  fctx.fillStyle = '#00a800';
  fctx.fillRect(0, gY, width, 14);
  fctx.fillStyle = '#c84c0c';
  fctx.fillRect(0, gY + 14, width, gH - 14);

  // Brick grid on dirt
  const brickW = 42, brickH = Math.round((gH - 14) / 2);
  fctx.strokeStyle = '#a03800';
  fctx.lineWidth = 1.5;
  for (let row = 0; row < 2; row++) {
    const ry = gY + 14 + row * brickH;
    fctx.beginPath(); fctx.moveTo(0, ry); fctx.lineTo(width, ry); fctx.stroke();
    const offset = row % 2 === 0 ? 0 : brickW / 2;
    for (let bx2 = offset; bx2 < width; bx2 += brickW) {
      fctx.beginPath(); fctx.moveTo(bx2, ry); fctx.lineTo(bx2, ry + brickH); fctx.stroke();
    }
  }

  // Green pipes + warp glow
  const warpPulse = 0.55 + Math.sin(now / 320) * 0.35;
  for (const px2 of [width * 0.14, width * 0.86]) {
    const pw = 50;
    fctx.fillStyle = '#00a800';
    fctx.fillRect(px2 - pw / 2, gY - gH * 0.6, pw, gH * 0.6 + gH);
    fctx.fillStyle = '#00c800';
    fctx.fillRect(px2 - pw / 2 - 5, gY - gH * 0.6 - 14, pw + 10, 20);
    fctx.fillStyle = 'rgba(255,255,255,0.18)';
    fctx.fillRect(px2 - pw / 2 + 5, gY - gH * 0.6 + 4, 8, gH * 0.6 + gH - 8);
    // Warp glow at pipe opening
    fctx.save();
    fctx.globalAlpha = warpPulse * 0.7;
    fctx.fillStyle = '#80ffaa';
    fctx.beginPath();
    fctx.ellipse(px2, gY - gH * 0.6 - 4, pw * 0.45, 8, 0, 0, Math.PI * 2);
    fctx.fill();
    fctx.restore();
  }
}

export function drawTitleScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const now = performance.now();
  const bounce = Math.sin(now / 400) * 5;

  const logoSize = Math.round(Math.min(canvas.width * 0.30, canvas.height * 0.60, 500));
  const lx = Math.round(cx - logoSize / 2);
  const ly = Math.round(cy - logoSize / 2 - 22 + bounce);

  if (_logo.complete && _logo.naturalWidth) {
    ctx.save();
    ctx.shadowBlur = 32;
    ctx.shadowColor = 'rgba(255, 210, 0, 0.55)';
    ctx.beginPath();
    ctx.roundRect(lx, ly, logoSize, logoSize, Math.round(logoSize * 0.07));
    ctx.clip();
    ctx.drawImage(_logo, lx, ly, logoSize, logoSize);
    ctx.restore();
  } else {
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#2c3e50';
    ctx.fillText('SAY IT! PLAY IT!', cx, cy - 22 + bounce);
  }

  const pressY = ly + logoSize + 32;
  ctx.textAlign = 'center';
  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(now / 400);
  ctx.font = 'bold 20px monospace';
  ctx.fillStyle = '#5d6d7e';
  ctx.fillText('Press Start to play', cx, pressY);
  ctx.globalAlpha = 0.45;
  ctx.font = '14px monospace';
  ctx.fillText('(or Return on keyboard)', cx, pressY + 24);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

const VICTORY_COLORS = ['#ff6b6b', '#ffa500', '#ffd700', '#2ecc71', '#3498db', '#9b59b6', '#e91e63'];
let victoryParticles = [];
let victoryStartTime = 0;

function ensureVictoryParticles(now) {
  if (victoryStartTime === 0 || victoryParticles.length === 0) {
    victoryStartTime = now;
    victoryParticles = [];
    for (let i = 0; i < 80; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      victoryParticles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 3 + Math.random() * 6,
        color: VICTORY_COLORS[Math.floor(Math.random() * VICTORY_COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        type: Math.random() > 0.5 ? 'rect' : 'circle',
      });
    }
  }
}

export function drawVictoryScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const now = performance.now() / 1000;
  ensureVictoryParticles(now);

  // Confetti particles
  for (const p of victoryParticles) {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04; // gravity
    p.rotation += p.rotSpeed;

    if (p.x < -20) p.x = canvas.width + 20;
    if (p.x > canvas.width + 20) p.x = -20;
    if (p.y > canvas.height + 20) {
      p.y = -10;
      p.x = Math.random() * canvas.width;
      p.vy = Math.random() * 2;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    if (p.type === 'rect') {
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Pulsing glow behind text
  const pulse = 0.3 + Math.sin(now * 3) * 0.15;
  ctx.fillStyle = `rgba(46, 204, 113, ${pulse})`;
  ctx.beginPath();
  ctx.arc(cx, cy - 20, 180, 0, Math.PI * 2);
  ctx.fill();

  // Rainbow cycling CHAMPION! title
  const title = 'CHAMPION!';
  ctx.font = 'bold 64px monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i < title.length; i++) {
    const colorIdx = Math.floor((i + now * 4) % VICTORY_COLORS.length);
    ctx.fillStyle = VICTORY_COLORS[colorIdx];
    const charWidth = ctx.measureText('M').width;
    const totalWidth = title.length * charWidth;
    const charX = cx - totalWidth / 2 + i * charWidth + charWidth / 2;
    const wobble = Math.sin(now * 4 + i * 0.7) * 8;
    const scale = 1 + Math.sin(now * 3 + i * 0.5) * 0.05;
    ctx.save();
    ctx.translate(charX, cy - 25 + wobble);
    ctx.scale(scale, scale);
    ctx.fillText(title[i], 0, 0);
    ctx.restore();
  }

  ctx.font = 'bold 24px monospace';
  ctx.fillStyle = '#2c3e50';
  ctx.globalAlpha = 0.6 + Math.sin(now * 2) * 0.4;
  ctx.fillText('PRESS START TO PLAY AGAIN', cx, cy + 40);
  ctx.globalAlpha = 1;

  // Star bursts in corners
  const corners = [[80, 80], [canvas.width - 80, 80], [80, canvas.height - 80], [canvas.width - 80, canvas.height - 80]];
  for (let c = 0; c < corners.length; c++) {
    const [sx, sy] = corners[c];
    const starSize = 12 + Math.sin(now * 5 + c * 1.5) * 5;
    ctx.fillStyle = VICTORY_COLORS[(c + Math.floor(now * 2)) % VICTORY_COLORS.length];
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(now * 2 + c);
    ctx.beginPath();
    for (let s = 0; s < 8; s++) {
      const angle = (s / 8) * Math.PI * 2;
      const r = s % 2 === 0 ? starSize : starSize * 0.4;
      ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.textAlign = 'left';
}

export function resetVictoryEffects() {
  victoryParticles = [];
  victoryStartTime = 0;
}

export function drawGameOverScreen() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const now = performance.now();

  const bounce = Math.sin(now / 400) * 5;
  const logoSize = Math.round(Math.min(canvas.width * 0.25, canvas.height * 0.50, 400));
  const lx = Math.round(cx - logoSize / 2);
  const ly = Math.round(cy - logoSize / 2 - 44 + bounce);
  const r  = Math.round(logoSize * 0.07);

  if (_logo.complete && _logo.naturalWidth) {
    ctx.save();
    ctx.shadowBlur = 44;
    ctx.shadowColor = 'rgba(231, 76, 60, 0.85)';
    ctx.beginPath(); ctx.roundRect(lx, ly, logoSize, logoSize, r); ctx.clip();
    ctx.drawImage(_logo, lx, ly, logoSize, logoSize);
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.roundRect(lx, ly, logoSize, logoSize, r); ctx.clip();
    ctx.fillStyle = 'rgba(200, 0, 0, 0.28)';
    ctx.fillRect(lx, ly, logoSize, logoSize);
    ctx.restore();
  }

  const textY = ly + logoSize + 64;
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e74c3c';
  ctx.fillText('GAME OVER', cx, textY);

  ctx.globalAlpha = 0.7 + 0.3 * Math.sin(now / 400);
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#5d6d7e';
  ctx.fillText('Press Start to try again', cx, textY + 36);
  ctx.globalAlpha = 0.4;
  ctx.font = '14px monospace';
  ctx.fillText('(or Return on keyboard)', cx, textY + 58);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}
