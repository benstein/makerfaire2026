// src/main.js
// SACRED — the game loop must always run cleanly

import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';
import { STATES, getState, getTimeRemaining, startGame, endGame, goToTitle, updateTimer } from './game/gameState.js';
import { resetPlayer, updatePlayer, drawPlayer, getPlayerPos, getPlayerFacing, getPlayerHealth, getPlayerBounds, damagePlayer } from './game/player.js';
import { resetEnemies, updateEnemies, drawEnemies, getEnemies, removeEnemy } from './game/enemies.js';
import { resetWeapons, tryFire, updateProjectiles, drawProjectiles, getProjectiles, removeProjectile } from './game/weapons.js';
import { aabb } from './game/collision.js';
import { initRendering, getCanvasSize, clearCanvas, drawTitleScreen, drawVictoryScreen, drawGameOverScreen } from './game/rendering.js';
import { drawHUD } from './ui/hud.js';
import { loadChangelog } from './ui/changelog.js';

// Boot
const canvas = document.getElementById('game-canvas');
const ctx = initRendering(canvas);
loadChangelog();

let lastTime = performance.now();

function gameLoop(now) {
  const dt = now - lastTime;
  lastTime = now;

  pollInput();
  const input = getInput();
  const state = getState();
  const { width, height } = getCanvasSize();

  // --- State transitions ---
  if (input.start) {
    if (state === STATES.TITLE) {
      startGame();
      resetPlayer(width, height);
      resetEnemies();
      resetWeapons();
    } else {
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
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
