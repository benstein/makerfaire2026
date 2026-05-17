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

  const entryT = Math.min(1, age / 700);
  const bounce = entryT < 1 ? (1 + Math.sin(entryT * Math.PI) * 0.35) : 1;
  const pulse = 1 + Math.sin(now / 160) * 0.04;

  const drawW = boss.w * bounce * pulse;
  const drawH = boss.h * bounce * pulse;
  const cx = boss.x + boss.w / 2;
  const cy = boss.y + boss.h / 2;
  const drawX = cx - drawW / 2;
  const drawY = cy - drawH / 2;

  const bodyColor = phase2 ? '#7a5fa0' : '#7a9aaa';
  const glowColor = phase2 ? '#e056fd' : '#aaddff';

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(cx + 6, cy + drawH * 0.5 + 6, drawW * 0.45, drawH * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glow
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 24 + Math.sin(now / 200) * 8;

  // Ears (behind body)
  ctx.fillStyle = phase2 ? '#9b7bc0' : '#8aabb8';
  ctx.beginPath(); ctx.arc(drawX + drawW * 0.18, drawY + drawH * 0.08, drawW * 0.13, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(drawX + drawW * 0.82, drawY + drawH * 0.08, drawW * 0.13, 0, Math.PI * 2); ctx.fill();

  // Body
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(drawX, drawY + drawH * 0.08, drawW, drawH * 0.85, drawW * 0.18);
  ctx.fill();
  ctx.restore();

  // Inner ears
  ctx.fillStyle = '#ffb3cc';
  ctx.beginPath(); ctx.arc(drawX + drawW * 0.18, drawY + drawH * 0.08, drawW * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(drawX + drawW * 0.82, drawY + drawH * 0.08, drawW * 0.07, 0, Math.PI * 2); ctx.fill();

  // Eyes (beady and high up)
  const eyeY = drawY + drawH * 0.28;
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(drawX + drawW * 0.33, eyeY, drawW * 0.08, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(drawX + drawW * 0.67, eyeY, drawW * 0.08, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(drawX + drawW * 0.33 + drawW * 0.03, eyeY - drawH * 0.03, drawW * 0.03, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(drawX + drawW * 0.67 + drawW * 0.03, eyeY - drawH * 0.03, drawW * 0.03, 0, Math.PI * 2); ctx.fill();

  // Angry brows
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(drawX + drawW * 0.2, eyeY - drawH * 0.08); ctx.lineTo(drawX + drawW * 0.42, eyeY - drawH * 0.02); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(drawX + drawW * 0.8, eyeY - drawH * 0.08); ctx.lineTo(drawX + drawW * 0.58, eyeY - drawH * 0.02); ctx.stroke();

  // Wide snout
  ctx.fillStyle = phase2 ? '#9980c0' : '#90b8c8';
  ctx.beginPath();
  ctx.ellipse(cx, drawY + drawH * 0.7, drawW * 0.38, drawH * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // Big nostrils
  ctx.fillStyle = '#445566';
  ctx.beginPath(); ctx.ellipse(cx - drawW * 0.14, drawY + drawH * 0.67, drawW * 0.08, drawH * 0.07, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + drawW * 0.14, drawY + drawH * 0.67, drawW * 0.08, drawH * 0.07, 0.3, 0, Math.PI * 2); ctx.fill();

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
