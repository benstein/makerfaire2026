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
      } else if (input.start) {
        goToTitle();
      }
    }

    // --- Update ---
    if (state === STATES.PLAYING) {
      updateTimer(dt);
      updatePlayer(dt, input, width, height, now);
      updateEnemies(dt, getPlayerPos(), now, width, height);

      // Firing
      if (input.fire || input.fireHeld) {
        tryFire(getPlayerPos(), getPlayerFacing(), now);
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
            removeEnemy(i);
            if (getPlayerHealth() <= 0) {
              endGame(false);
            }
          }
        }
      }
    }

    // --- Render ---
    clearCanvas();

    if (state === STATES.TITLE) {
      drawTitleScreen();
    } else if (state === STATES.PLAYING) {
      drawPlayer(ctx, now);
      drawEnemies(ctx);
      drawProjectiles(ctx);
      drawHUD(ctx, getPlayerHealth(), getTimeRemaining(), width);
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
