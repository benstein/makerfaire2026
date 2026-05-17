// src/main.js
// SACRED — the game loop must always run cleanly

import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';
import { STATES, getState, getTimeRemaining, startGame, endGame, goToTitle, updateTimer } from './game/gameState.js';
import { resetPlayer, updatePlayer, drawPlayer, getPlayerPos, getPlayerFacing, getPlayerHealth, getPlayerBounds, damagePlayer } from './game/player.js';
import { resetEnemies, updateEnemies, drawEnemies, getEnemies, removeEnemy, clearEnemies } from './game/enemies.js';
import { resetBoss, shouldSpawnBoss, spawnBoss, getBoss, isBossAlive, updateBoss, damageBoss, drawBoss } from './game/boss.js';
import { resetFinalSmash, addKill, getKillCount, isFinalSmashActive, updateFinalSmash, drawFinalSmash, KILLS_FOR_SMASH } from './game/finalSmash.js';
import { resetWeapons, tryFire, updateProjectiles, drawProjectiles, getProjectiles, removeProjectile } from './game/weapons.js';
import { aabb } from './game/collision.js';
import { initRendering, getCanvasSize, clearCanvas, drawForestBackground, drawTitleScreen, drawVictoryScreen, drawGameOverScreen, resetVictoryEffects } from './game/rendering.js';
import { drawHUD } from './ui/hud.js';
import { loadChangelog } from './ui/changelog.js';
import { initBuildStatus, getBuildData } from './ui/buildStatus.js';
import { drawBuildScreen } from './ui/buildScreen.js';
import { drawErrorBadge } from './ui/errorBadge.js';

// --- Smoke check: catch any runtime errors and surface them on screen ---
let errorCount = 0;
let lastError = null;

window.addEventListener('error', (e) => {
  errorCount++;
  lastError = e.message || (e.error && e.error.message) || 'Unknown error';
  console.warn('[smoke] error caught:', e.error || e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  errorCount++;
  lastError = (e.reason && e.reason.message) || String(e.reason);
  console.warn('[smoke] unhandled rejection:', e.reason);
});

// Boot
const canvas = document.getElementById('game-canvas');
const ctx = initRendering(canvas);
loadChangelog();
initBuildStatus();

let lastTime = performance.now();

function gameLoop(now) {
  try {
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
    if (state !== STATES.BUILDING) {
      if ((input.start || input.fire) && (state === STATES.TITLE || state === STATES.GAMEOVER || state === STATES.VICTORY)) {
        startGame();
        resetPlayer(width, height);
        resetEnemies();
        resetWeapons();
        resetVictoryEffects();
        resetFinalSmash();
        resetBoss();
      } else if (input.start) {
        goToTitle();
      }
    }

    // --- Update ---
    if (state === STATES.PLAYING) {
      updateTimer(dt);
      updatePlayer(dt, input, width, height, now);

      // Spawn boss at 20s remaining
      if (shouldSpawnBoss(getTimeRemaining())) spawnBoss(width, height);
      updateBoss(dt, getPlayerPos());
      updateEnemies(dt, getPlayerPos(), now, width, height);

      // Firing
      if (input.fire || input.fireHeld) {
        tryFire(getPlayerPos(), getPlayerFacing(), now);
      }
      updateProjectiles(dt, width, height);

      // Projectile collisions
      const projList = getProjectiles();

      // vs boss
      const currentBoss = getBoss();
      if (currentBoss && isBossAlive()) {
        for (let i = projList.length - 1; i >= 0; i--) {
          if (aabb(projList[i], currentBoss)) {
            removeProjectile(i);
            if (damageBoss()) endGame(true); // boss dead → victory!
            break;
          }
        }
      }

      // vs regular enemies
      const enemyList = getEnemies();
      for (let i = projList.length - 1; i >= 0; i--) {
        for (let j = enemyList.length - 1; j >= 0; j--) {
          if (aabb(projList[i], enemyList[j])) {
            removeProjectile(i);
            removeEnemy(j);
            if (addKill(now)) clearEnemies();
            break;
          }
        }
      }

      updateFinalSmash(now);

      // Enemy/boss–player collisions
      const playerBounds = getPlayerBounds();
      if (isBossAlive() && aabb(playerBounds, getBoss())) {
        if (damagePlayer(now) && getPlayerHealth() <= 0) endGame(false);
      }
      const enemies = getEnemies();
      for (let i = enemies.length - 1; i >= 0; i--) {
        if (aabb(playerBounds, enemies[i])) {
          if (damagePlayer(now)) {
            removeEnemy(i);
            if (getPlayerHealth() <= 0) endGame(false);
          }
        }
      }
    }

    // --- Render ---
    clearCanvas();

    if (state === STATES.TITLE) {
      drawTitleScreen();
    } else if (state === STATES.PLAYING) {
      drawForestBackground(ctx, width, height);
      drawPlayer(ctx, now);
      drawEnemies(ctx);
      drawBoss(ctx, now);
      drawProjectiles(ctx);
      drawFinalSmash(ctx, getPlayerPos(), width, height, now);
      drawHUD(ctx, getPlayerHealth(), getTimeRemaining(), width, getKillCount(), KILLS_FOR_SMASH);
    } else if (state === STATES.VICTORY) {
      drawVictoryScreen();
    } else if (state === STATES.GAMEOVER) {
      drawGameOverScreen();
    } else if (state === STATES.BUILDING) {
      drawBuildScreen(ctx, width, height, getBuildData(), now);
    }
  } catch (err) {
    errorCount++;
    lastError = err.message || String(err);
    console.warn('[smoke] gameLoop error:', err);
  }

  // Badge sits on top of everything, even if the main render threw
  if (errorCount > 0) {
    drawErrorBadge(ctx, errorCount, lastError, now);
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
