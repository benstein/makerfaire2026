// src/main.js
// SACRED — the game loop must always run cleanly

import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';
import { STATES, getState, getTimeRemaining, startGame, endGame, goToTitle, updateTimer } from './game/gameState.js';
import { resetPlayer, updatePlayer, drawPlayer, getPlayerPos, getPlayerFacing, getPlayerHealth, getPlayerBounds, damagePlayer } from './game/player.js';
import { resetEnemies, updateEnemies, drawEnemies, getEnemies, removeEnemy } from './game/enemies.js';
import { resetWeapons, tryFire, updateProjectiles, drawProjectiles, getProjectiles, removeProjectile } from './game/weapons.js';
import { aabb } from './game/collision.js';
import { initRendering, getCanvasSize, clearCanvas, drawTitleScreen, drawVictoryScreen, drawGameOverScreen, resetVictoryEffects } from './game/rendering.js';
import { resetPowerups, onEnemyKilled, updatePowerups, drawPowerups, getSpeedMultiplier, getFireCooldownMultiplier } from './game/powerups.js';
import { resetRoadblocks, spawnRoadblock, getRoadblocks, drawRoadblocks } from './game/roadblocks.js';
import { spawnBoss, resetBoss, getBoss, isBossAlive, damageBoss, updateBoss, drawBoss } from './game/boss.js';
import { resetPasture, getPenBounds, getDangerBounds, isInPen, isPlayerInDangerZone, captureBear, getCapturedCount, BEARS_NEEDED, drawPasture } from './game/pasture.js';
import { drawHUD } from './ui/hud.js';
import { loadChangelog } from './ui/changelog.js';
import { initBuildStatus, getBuildData } from './ui/buildStatus.js';
import { drawBuildScreen } from './ui/buildScreen.js';

// Boot
const canvas = document.getElementById('game-canvas');
const ctx = initRendering(canvas);
loadChangelog();
initBuildStatus();

let lastTime = performance.now();

function gameLoop(now) {
  const dt = now - lastTime;
  lastTime = now;

  pollInput();
  const input = getInput();
  const state = getState();
  const { width, height } = getCanvasSize();

  // Re-enter fullscreen on any button press if we lost it (e.g. after Vite HMR reload)
  if ((input.fire || input.start) && !document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }

  // --- State transitions ---
  if ((input.start || (input.fire && state === STATES.TITLE)) && state !== STATES.BUILDING) {
    if (state === STATES.TITLE) {
      startGame();
      resetPlayer(width, height);
      resetEnemies();
      resetWeapons();
      resetPowerups();
      resetRoadblocks();
      resetBoss();
      resetPasture();
      resetVictoryEffects();
    } else {
      goToTitle();
    }
  }

  // --- Update ---
  if (state === STATES.PLAYING) {
    updateTimer(dt);
    updatePlayer(dt, input, width, height, now, getSpeedMultiplier(now));
    updateEnemies(dt, getPlayerPos(), now, width, height);

    // Firing
    if (input.fire || input.fireHeld) {
      tryFire(getPlayerPos(), getPlayerFacing(), now, getFireCooldownMultiplier(now));
    }
    updateProjectiles(dt, width, height);

    // Projectile-enemy collisions
    const projList = getProjectiles();
    const enemyList = getEnemies();
    for (let i = projList.length - 1; i >= 0; i--) {
      for (let j = enemyList.length - 1; j >= 0; j--) {
        if (aabb(projList[i], enemyList[j])) {
          removeProjectile(i);
          removeEnemy(j);
          onEnemyKilled(width, height);
          break;
        }
      }
    }

    // Enemy-player collisions
    const playerBounds = getPlayerBounds();
    const enemies = getEnemies();
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (aabb(playerBounds, enemies[i])) {
        if (damagePlayer(now)) {
          const pos = getPlayerPos();
          spawnRoadblock(pos.x, pos.y, width, height);
          removeEnemy(i);
          if (getPlayerHealth() <= 0) endGame(false);
        }
      }
    }

    // Bear capture — herd bears into the pen
    const enemiesNow = getEnemies();
    for (let i = enemiesNow.length - 1; i >= 0; i--) {
      if (isInPen(enemiesNow[i], width, height)) {
        captureBear(enemiesNow[i], width, height);
        removeEnemy(i);
        if (getCapturedCount() >= BEARS_NEEDED) {
          endGame(true);
        }
      }
    }

    // Danger zone — instant death
    if (isPlayerInDangerZone(getPlayerBounds(), width, height)) {
      endGame(false);
    }

    // Roadblock-player collisions
    const roadblockList = getRoadblocks();
    for (const rb of roadblockList) {
      if (aabb(playerBounds, rb)) {
        if (damagePlayer(now)) {
          if (getPlayerHealth() <= 0) endGame(false);
        }
      }
    }

    updatePowerups(dt, playerBounds, now);
  }

  if (state === STATES.BOSS_FIGHT) {
    // First frame of boss fight — clear enemies and spawn boss
    if (!getBoss()) {
      resetEnemies();
      resetWeapons();
      spawnBoss(width, height, now);
    }

    updatePlayer(dt, input, width, height, now, getSpeedMultiplier(now));

    if (input.fire || input.fireHeld) {
      tryFire(getPlayerPos(), getPlayerFacing(), now, getFireCooldownMultiplier(now));
    }
    updateProjectiles(dt, width, height);
    updateBoss(dt, getPlayerPos(), now, width, height);

    // Projectile-boss collisions
    const projList = getProjectiles();
    const boss = getBoss();
    if (boss) {
      for (let i = projList.length - 1; i >= 0; i--) {
        if (aabb(projList[i], boss)) {
          removeProjectile(i);
          if (damageBoss()) endGame(true);
          break;
        }
      }
    }

    // Boss-player collision
    const playerBounds = getPlayerBounds();
    if (boss && aabb(playerBounds, boss)) {
      if (damagePlayer(now) && getPlayerHealth() <= 0) endGame(false);
    }

    // Roadblocks still hurt
    const roadblockList = getRoadblocks();
    for (const rb of roadblockList) {
      if (aabb(getPlayerBounds(), rb)) {
        if (damagePlayer(now) && getPlayerHealth() <= 0) endGame(false);
      }
    }
  }

  // --- Render ---
  clearCanvas();

  if (state === STATES.TITLE) {
    drawTitleScreen();
  } else if (state === STATES.PLAYING) {
    drawPasture(ctx, width, height, now);
    drawRoadblocks(ctx, now);
    drawPlayer(ctx, now);
    drawEnemies(ctx);
    drawProjectiles(ctx);
    drawPowerups(ctx, now);
    // Show bears-in-pen count instead of timer
    ctx.save();
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#2d5a1b';
    ctx.textAlign = 'right';
    ctx.fillText(`Bears: ${getCapturedCount()} / ${BEARS_NEEDED}`, width - 16, 36);
    ctx.restore();
    drawHUD(ctx, getPlayerHealth(), getTimeRemaining(), width);
  } else if (state === STATES.BOSS_FIGHT) {
    drawRoadblocks(ctx, now);
    drawBoss(ctx, now, width);
    drawPlayer(ctx, now);
    drawProjectiles(ctx);
    drawHUD(ctx, getPlayerHealth(), 0, width);
  } else if (state === STATES.VICTORY) {
    drawVictoryScreen();
  } else if (state === STATES.GAMEOVER) {
    drawGameOverScreen();
  } else if (state === STATES.BUILDING) {
    drawBuildScreen(ctx, width, height, getBuildData(), now);
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
