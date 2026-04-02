// src/game/powers.js
// Random power-ups every 10 seconds, activated with X button

const POWER_INTERVAL = 10000; // 10 seconds to get a new power
const POWER_NAMES = ['SPEED BOOST', 'INVISIBILITY', 'PIERCING SHOTS'];
const POWER_COLORS = ['#ffd700', '#9b59b6', '#e74c3c'];
const POWER_ICONS = ['>>>', '***', '>>>'];
const POWER_DURATIONS = [5000, 3000, 5000]; // ms

let pendingPower = null;   // { type: 0|1|2 } — waiting to be activated
let activePower = null;    // { type, startTime, duration }
let lastPowerTime = 0;     // when the level started or last power was granted
let powerFlashTime = 0;    // for the "new power!" flash

export function resetPowers(now) {
  pendingPower = null;
  activePower = null;
  lastPowerTime = now || performance.now();
  powerFlashTime = 0;
}

export function updatePowers(now) {
  // Grant a new random power every 10 seconds if none pending
  if (!pendingPower && !activePower) {
    if (now - lastPowerTime >= POWER_INTERVAL) {
      pendingPower = { type: Math.floor(Math.random() * 3) };
      powerFlashTime = now;
      lastPowerTime = now;
    }
  }

  // Expire active power
  if (activePower) {
    if (now - activePower.startTime >= activePower.duration) {
      activePower = null;
      lastPowerTime = now; // restart timer for next power
    }
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
  return true;
}

export function getPendingPower() {
  return pendingPower;
}

export function getActivePower() {
  return activePower;
}

export function isSpeedBoosted() {
  return activePower && activePower.type === 0;
}

export function isInvisible() {
  return activePower && activePower.type === 1;
}

export function isPiercing() {
  return activePower && activePower.type === 2;
}

export function getActivePowerTimeLeft(now) {
  if (!activePower) return 0;
  return Math.max(0, activePower.duration - (now - activePower.startTime));
}

export function getPowerChargeProgress(now) {
  if (pendingPower || activePower) return 1;
  return Math.min(1, (now - lastPowerTime) / POWER_INTERVAL);
}

export function drawPowerHUD(ctx, now, canvasWidth, canvasHeight) {
  const padding = 20;
  const y = canvasHeight - 50;

  // Power charge bar (bottom-left)
  const barW = 100;
  const barH = 8;
  const barX = padding;
  const barY = y + 20;

  if (!pendingPower && !activePower) {
    // Charging...
    const progress = getPowerChargeProgress(now);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(barX, barY, barW * progress, barH);
    ctx.fillStyle = '#666';
    ctx.font = '11px monospace';
    ctx.fillText('Power charging...', barX, barY - 4);
    return;
  }

  if (pendingPower) {
    const p = pendingPower;
    const age = now - powerFlashTime;
    const flash = age < 2000 ? (0.7 + Math.sin(age / 100) * 0.3) : 1;

    // "POWER READY!" label
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = `rgba(255, 215, 0, ${flash})`;
    ctx.fillText('POWER READY! [X]', barX, barY - 4);

    // Power name
    ctx.font = 'bold 16px monospace';
    ctx.fillStyle = POWER_COLORS[p.type];
    ctx.fillText(POWER_NAMES[p.type], barX, barY + 20);

    // Pulsing border
    const pulseAlpha = 0.3 + Math.sin(now / 150) * 0.3;
    ctx.strokeStyle = `rgba(255, 215, 0, ${pulseAlpha})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(barX - 4, barY - 18, 170, 46);
    return;
  }

  if (activePower) {
    const p = activePower;
    const timeLeft = getActivePowerTimeLeft(now);
    const progress = timeLeft / p.duration;

    // Active power bar
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = POWER_COLORS[p.type];
    ctx.fillRect(barX, barY, barW * progress, barH);

    // Label
    ctx.font = 'bold 13px monospace';
    ctx.fillStyle = POWER_COLORS[p.type];
    ctx.fillText(`${POWER_NAMES[p.type]} ${(timeLeft / 1000).toFixed(1)}s`, barX, barY - 4);
  }
}
