// src/game/powers.js
// XP-based power-up system. First power at 5 XP, then +5 more each time.

const POWER_NAMES = ['SPEED BOOST', 'SHIELD WALL', 'TRIPLE SHOT'];
const POWER_COLORS = ['#ffd700', '#3498db', '#e74c3c'];
const POWER_DURATIONS = [5000, 4000, 5000]; // ms

let xp = 0;
let totalXP = 0;
let xpThreshold = 5;       // first power at 5 XP
let powersEarned = 0;
let pendingPower = null;    // { type }
let activePower = null;     // { type, startTime, duration }
let powerFlashTime = 0;

// Stats
let totalKills = 0;
let powersUsed = 0;
let stopwatchMs = 0;

export function resetPowers() {
  xp = 0;
  totalXP = 0;
  xpThreshold = 5;
  powersEarned = 0;
  pendingPower = null;
  activePower = null;
  powerFlashTime = 0;
  totalKills = 0;
  powersUsed = 0;
  stopwatchMs = 0;
}

export function addXP(amount) {
  xp += amount;
  totalXP += amount;
}

export function addKill() {
  totalKills++;
}

export function updatePowers(dt, now) {
  stopwatchMs += dt;

  // Check if earned a new power
  if (!pendingPower && !activePower && xp >= xpThreshold) {
    xp -= xpThreshold;
    xpThreshold += 5; // next one costs 5 more
    powersEarned++;
    pendingPower = { type: Math.floor(Math.random() * 3) };
    powerFlashTime = now;
  }

  // Expire active power
  if (activePower && now - activePower.startTime >= activePower.duration) {
    activePower = null;
  }
}

export function activatePower(now) {
  if (!pendingPower) return false;
  activePower = {
    type: pendingPower.type,
    startTime: now,
    duration: POWER_DURATIONS[pendingPower.type],
  };
  pendingPower = null;
  powersUsed++;
  return true;
}

export function getPendingPower() { return pendingPower; }
export function getActivePower() { return activePower; }
export function getXP() { return xp; }
export function getXPThreshold() { return xpThreshold; }

export function isSpeedBoosted() { return activePower?.type === 0; }
export function isShielded() { return activePower?.type === 1; }
export function isTripleShot() { return activePower?.type === 2; }

export function getActivePowerTimeLeft(now) {
  if (!activePower) return 0;
  return Math.max(0, activePower.duration - (now - activePower.startTime));
}

export function getStopwatchMs() { return stopwatchMs; }

export function getStats() {
  return {
    kills: totalKills,
    totalXP,
    powersUsed,
    timeMs: stopwatchMs,
    powersEarned,
  };
}

export function drawPowerHUD(ctx, now, canvasWidth, canvasHeight) {
  const padding = 20;

  // Stopwatch (top-center)
  const elapsed = stopwatchMs / 1000;
  const mins = Math.floor(elapsed / 60);
  const secs = Math.floor(elapsed % 60);
  const ms = Math.floor((elapsed % 1) * 10);
  ctx.fillStyle = '#ccc';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}.${ms}`, canvasWidth / 2, padding + 22);
  ctx.textAlign = 'left';

  // XP bar (top-right)
  const barWidth = 120;
  const barHeight = 10;
  const barX = canvasWidth - padding - barWidth;
  const barY = padding + 32;

  ctx.fillStyle = '#4AF';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`${xp}/${xpThreshold} XP`, canvasWidth - padding, padding + 22);

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(barX, barY, barWidth, barHeight);
  const fill = Math.min(1, xp / xpThreshold);
  if (fill > 0) {
    const grad = ctx.createLinearGradient(barX, 0, barX + barWidth * fill, 0);
    grad.addColorStop(0, '#4AF');
    grad.addColorStop(1, '#AEF');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, barWidth * fill, barHeight);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Kill counter
  ctx.fillStyle = '#e74c3c';
  ctx.font = '14px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`Kills: ${totalKills}`, canvasWidth - padding, barY + barHeight + 18);

  // Power indicator (bottom-left)
  const py = canvasHeight - 50;
  const px = padding;

  if (pendingPower) {
    const p = pendingPower;
    const age = now - powerFlashTime;
    const flash = age < 2000 ? (0.7 + Math.sin(age / 100) * 0.3) : 1;

    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = `rgba(255, 215, 0, ${flash})`;
    ctx.fillText('POWER READY! [X]', px, py);

    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = POWER_COLORS[p.type];
    ctx.fillText(POWER_NAMES[p.type], px, py + 20);

    const pulseAlpha = 0.3 + Math.sin(now / 150) * 0.3;
    ctx.strokeStyle = `rgba(255, 215, 0, ${pulseAlpha})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(px - 4, py - 14, 170, 42);
  } else if (activePower) {
    const p = activePower;
    const timeLeft = getActivePowerTimeLeft(now);
    const progress = timeLeft / p.duration;

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(px, py + 8, 100, 8);
    ctx.fillStyle = POWER_COLORS[p.type];
    ctx.fillRect(px, py + 8, 100 * progress, 8);

    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = POWER_COLORS[p.type];
    ctx.fillText(`${POWER_NAMES[p.type]} ${(timeLeft / 1000).toFixed(1)}s`, px, py);
  }

  ctx.textAlign = 'left';
}

export function drawStatsScreen(ctx, width, height, won) {
  const cx = width / 2;
  const cy = height / 2;
  const stats = getStats();
  const now = performance.now() / 1000;

  // Title
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#2ecc71' : '#e74c3c';
  ctx.fillText(won ? 'CHAMPION!' : 'GAME OVER', cx, cy - 100);

  // Stats box
  const statLines = [
    { label: 'Time', value: formatTime(stats.timeMs), color: '#f1c40f' },
    { label: 'Kills', value: String(stats.kills), color: '#e74c3c' },
    { label: 'Total XP', value: String(stats.totalXP), color: '#4AF' },
    { label: 'Powers Used', value: String(stats.powersUsed), color: '#ffd700' },
  ];

  ctx.font = '22px monospace';
  const lineH = 36;
  const startY = cy - 30;

  for (let i = 0; i < statLines.length; i++) {
    const s = statLines[i];
    const y = startY + i * lineH;

    // Stagger animation
    const delay = i * 0.15;
    const alpha = Math.min(1, Math.max(0, (now - delay) * 2 % 100));

    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#888';
    ctx.textAlign = 'right';
    ctx.fillText(s.label, cx - 10, y);
    ctx.fillStyle = s.color;
    ctx.textAlign = 'left';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(s.value, cx + 10, y);
    ctx.font = '22px monospace';
  }
  ctx.globalAlpha = 1;

  // Restart prompt
  ctx.font = '18px monospace';
  ctx.fillStyle = '#888';
  ctx.textAlign = 'center';
  const blink = Math.sin(now * 3) > 0;
  if (blink) ctx.fillText('PRESS START TO PLAY AGAIN', cx, startY + statLines.length * lineH + 30);

  ctx.textAlign = 'left';
}

function formatTime(ms) {
  const totalSecs = ms / 1000;
  const mins = Math.floor(totalSecs / 60);
  const secs = Math.floor(totalSecs % 60);
  const tenths = Math.floor((totalSecs % 1) * 10);
  return `${mins}:${String(secs).padStart(2, '0')}.${tenths}`;
}
