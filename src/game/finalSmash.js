// src/game/finalSmash.js
// Tracks projectile kills. Every 10 kills triggers a screen-clearing Final Smash.

export const KILLS_FOR_SMASH = 10;
const SMASH_DURATION = 1800;

let killCount = 0;
let smashActive = false;
let smashStartTime = 0;

export function resetFinalSmash() {
  killCount = 0;
  smashActive = false;
  smashStartTime = 0;
}

export function addKill(now) {
  if (smashActive) return false;
  killCount++;
  if (killCount >= KILLS_FOR_SMASH) {
    killCount = 0;
    smashActive = true;
    smashStartTime = now;
    return true;
  }
  return false;
}

export function getKillCount() {
  return killCount;
}

export function isFinalSmashActive() {
  return smashActive;
}

export function updateFinalSmash(now) {
  if (smashActive && now - smashStartTime > SMASH_DURATION) {
    smashActive = false;
  }
}

export function drawFinalSmash(ctx, playerPos, width, height, now) {
  if (!smashActive) return;
  const elapsed = now - smashStartTime;
  const t = Math.min(1, elapsed / SMASH_DURATION);
  const maxR = Math.sqrt(width * width + height * height);
  const radius = maxR * Math.pow(t, 0.55);

  // White flash at the moment of impact
  if (t < 0.1) {
    ctx.fillStyle = `rgba(255, 255, 220, ${(0.1 - t) / 0.1})`;
    ctx.fillRect(0, 0, width, height);
  }

  // Expanding shockwave rings
  ctx.lineWidth = Math.max(2, 32 * (1 - t));
  ctx.strokeStyle = `rgba(255, 210, 0, ${1 - t})`;
  ctx.beginPath();
  ctx.arc(playerPos.x, playerPos.y, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = Math.max(1, 16 * (1 - t));
  ctx.strokeStyle = `rgba(255, 80, 0, ${(1 - t) * 0.75})`;
  ctx.beginPath();
  ctx.arc(playerPos.x, playerPos.y, radius * 0.72, 0, Math.PI * 2);
  ctx.stroke();

  // "FINAL SMASH!" text — slams in then fades out
  if (t < 0.65) {
    const alpha = t < 0.5 ? 1 : 1 - (t - 0.5) / 0.15;
    const scale = Math.min(1, t / 0.12);
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = `bold ${Math.round(76 * scale)}px monospace`;
    ctx.textAlign = 'center';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#7b2d00';
    ctx.strokeText('FINAL SMASH!', width / 2, height / 2 + 10);
    ctx.fillStyle = '#ffd700';
    ctx.fillText('FINAL SMASH!', width / 2, height / 2 + 10);
    ctx.restore();
  }
}
