// src/game/boss.js
// Boss fight — appears when the timer hits zero. Kill it to win.

const BOSS_MAX_HEALTH = 15;
const BOSS_SIZE = 72;
const BOSS_SPEED = 1.8;
const BOSS_CHARGE_SPEED = 9;
const CHARGE_INTERVAL = 2800;
const CHARGE_DURATION = 480;

let boss = null;
let charging = false;
let chargeVX = 0, chargeVY = 0;
let chargeUntil = 0;
let lastChargeTime = 0;
let spawnTime = 0;
let spawnX = 0, spawnY = 0;

export function spawnBoss(arenaWidth, arenaHeight, now) {
  spawnX = arenaWidth / 2 - BOSS_SIZE / 2;
  spawnY = 80;
  boss = {
    x: spawnX,
    y: spawnY,
    w: BOSS_SIZE,
    h: BOSS_SIZE,
    health: BOSS_MAX_HEALTH,
  };
  charging = false;
  lastChargeTime = now + 2000; // 2s grace before first charge
  spawnTime = now;
}

export function returnBossToSpawn() {
  if (!boss) return;
  boss.x = spawnX;
  boss.y = spawnY;
  charging = false;
}

export function resetBoss() {
  boss = null;
  charging = false;
}

export function getBoss() {
  return boss;
}

export function isBossAlive() {
  return boss !== null && boss.health > 0;
}

export function damageBoss() {
  if (!boss) return false;
  boss.health = Math.max(0, boss.health - 1);
  return boss.health <= 0;
}

export function updateBoss(dt, playerPos, now, arenaWidth, arenaHeight) {
  if (!boss) return;
  const scale = dt / 16.67;
  const phase2 = boss.health <= BOSS_MAX_HEALTH / 2;
  const speed = BOSS_SPEED * (phase2 ? 1.7 : 1);

  const cx = boss.x + boss.w / 2;
  const cy = boss.y + boss.h / 2;
  const dx = playerPos.x - cx;
  const dy = playerPos.y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;

  if (charging && now < chargeUntil) {
    boss.x += chargeVX * scale;
    boss.y += chargeVY * scale;
    boss.x = Math.max(0, Math.min(arenaWidth - boss.w, boss.x));
    boss.y = Math.max(0, Math.min(arenaHeight - boss.h, boss.y));
    if (now >= chargeUntil) charging = false;
  } else {
    charging = false;
    boss.x += (dx / dist) * speed * scale;
    boss.y += (dy / dist) * speed * scale;

    const interval = phase2 ? CHARGE_INTERVAL * 0.6 : CHARGE_INTERVAL;
    if (now - lastChargeTime > interval) {
      charging = true;
      chargeUntil = now + CHARGE_DURATION;
      lastChargeTime = now;
      chargeVX = (dx / dist) * BOSS_CHARGE_SPEED;
      chargeVY = (dy / dist) * BOSS_CHARGE_SPEED;
    }
  }
}

export function drawBoss(ctx, now, canvasWidth) {
  if (!boss) return;
  const phase2 = boss.health <= BOSS_MAX_HEALTH / 2;
  const age = now - spawnTime;

  // Drop-in entrance
  const entryT = Math.min(1, age / 700);
  const bounce = entryT < 1 ? (1 + Math.sin(entryT * Math.PI) * 0.35) : 1;
  const pulse = 1 + Math.sin(now / 160) * 0.04;

  const drawW = boss.w * bounce * pulse;
  const drawH = boss.h * bounce * pulse;
  const drawX = boss.x + boss.w / 2 - drawW / 2;
  const drawY = boss.y + boss.h / 2 - drawH / 2;

  const baseColor = phase2 ? '#7d3c98' : '#c0392b';
  const glowColor = phase2 ? '#e056fd' : '#ff4444';

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(drawX + 7, drawY + 7, drawW, drawH);

  // Body with glow
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 22 + Math.sin(now / 180) * 8;
  ctx.fillStyle = baseColor;
  ctx.fillRect(drawX, drawY, drawW, drawH);
  ctx.restore();

  // Angry face
  const eyeY = drawY + drawH * 0.28;
  const eyeW = drawW * 0.13;
  const eyeH = eyeW * 1.4;
  ctx.fillStyle = '#fff';
  ctx.fillRect(drawX + drawW * 0.22, eyeY, eyeW, eyeH);
  ctx.fillRect(drawX + drawW * 0.65, eyeY, eyeW, eyeH);

  // Pupils (track player direction)
  ctx.fillStyle = '#111';
  ctx.fillRect(drawX + drawW * 0.22 + 2, eyeY + 2, eyeW - 4, eyeH - 4);
  ctx.fillRect(drawX + drawW * 0.65 + 2, eyeY + 2, eyeW - 4, eyeH - 4);

  // Angry brows
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(drawX + drawW * 0.16, eyeY - 7);
  ctx.lineTo(drawX + drawW * 0.38, eyeY - 1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(drawX + drawW * 0.84, eyeY - 7);
  ctx.lineTo(drawX + drawW * 0.62, eyeY - 1);
  ctx.stroke();

  // Jagged mouth
  ctx.beginPath();
  const mouthY = drawY + drawH * 0.65;
  const mouthL = drawX + drawW * 0.22;
  const mouthR = drawX + drawW * 0.78;
  ctx.moveTo(mouthL, mouthY);
  for (let i = 0; i <= 5; i++) {
    const tx = mouthL + (mouthR - mouthL) * (i / 5);
    const ty = mouthY + (i % 2 === 0 ? 8 : 0);
    ctx.lineTo(tx, ty);
  }
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // --- Health bar ---
  const barW = 280;
  const barH = 16;
  const barX = canvasWidth / 2 - barW / 2;
  const barY = 18;
  const pct = boss.health / BOSS_MAX_HEALTH;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
  ctx.fillStyle = '#222';
  ctx.fillRect(barX, barY, barW, barH);
  ctx.fillStyle = phase2 ? '#9b59b6' : '#e74c3c';
  ctx.fillRect(barX, barY, barW * pct, barH);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BOSS', canvasWidth / 2, barY + barH - 3);

  if (phase2) {
    const blink = Math.floor(now / 300) % 2 === 0;
    if (blink) {
      ctx.fillStyle = '#e056fd';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('⚡ ENRAGED! ⚡', canvasWidth / 2, barY + barH + 18);
    }
  }

  ctx.textAlign = 'left';
}
