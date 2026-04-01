// src/main.js
// SACRED — the game loop must always run cleanly

import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';
import { STATES, getState, getTimeRemaining, startGame, endGame, goToTitle, updateTimer } from './game/gameState.js';
import { resetPlayer, updatePlayer, drawPlayer, getPlayerPos, setPlayerPos, getPlayerFacing, getPlayerHealth, getPlayerBounds, damagePlayer } from './game/player.js';
import { resetEnemies, updateEnemies, drawEnemies, getEnemies, removeEnemy } from './game/enemies.js';
import { resetWeapons, tryFire, updateProjectiles, drawProjectiles, getProjectiles, removeProjectile } from './game/weapons.js';
import { aabb } from './game/collision.js';
import { resetObstacles, drawObstacles, resolveCollision, hitsObstacle, checkPipeWarp, updateWarp, isWarping } from './game/obstacles.js';
import { initRendering, getCanvasSize, clearCanvas, drawTitleScreen, drawVictoryScreen, drawGameOverScreen, resetVictoryEffects } from './game/rendering.js';
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
let playerWarpScale = 1;

function gameLoop(now) {
  const dt = now - lastTime;
  lastTime = now;

  pollInput();
  const input = getInput();
  const state = getState();
  const { width, height } = getCanvasSize();

  // --- State transitions ---
  if (input.start && state !== STATES.BUILDING) {
    if (state === STATES.TITLE) {
      startGame();
      resetPlayer(width, height);
      resetEnemies();
      resetWeapons();
      resetObstacles(width, height);
      resetVictoryEffects();
    } else {
      goToTitle();
    }
  }

  // --- Update ---
  if (state === STATES.PLAYING) {
    updateTimer(dt);

    // Warp animation in progress — override player position
    const warpState = updateWarp(now);
    if (warpState) {
      setPlayerPos(warpState.x, warpState.y);
      playerWarpScale = warpState.scale;
      if (warpState.done) {
        playerWarpScale = 1;
      }
    } else {
      playerWarpScale = 1;
    }

    if (!isWarping()) {
      updatePlayer(dt, input, width, height, now);

      // Push player out of obstacles
      const pBounds = getPlayerBounds();
      const resolved = resolveCollision({ ...pBounds });
      if (resolved.x !== pBounds.x || resolved.y !== pBounds.y) {
        const half = CONFIG.playerSize / 2;
        setPlayerPos(resolved.x + half, resolved.y + half);
      }

      // Check if player stepped on a pipe to warp
      checkPipeWarp(getPlayerBounds(), now);
    }

    updateEnemies(dt, getPlayerPos(), now, width, height);

    // Push enemies out of obstacles
    const enemyListForObs = getEnemies();
    for (const enemy of enemyListForObs) {
      const res = resolveCollision({ x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h });
      enemy.x = res.x;
      enemy.y = res.y;
    }

    // Firing (can still fire while warping — it's fun!)
    if (input.fire || input.fireHeld) {
      tryFire(getPlayerPos(), getPlayerFacing(), now);
    }
    updateProjectiles(dt, width, height);

    // Projectile-obstacle collisions (fireballs hit blocks/pipes)
    const projListObs = getProjectiles();
    for (let i = projListObs.length - 1; i >= 0; i--) {
      if (hitsObstacle(projListObs[i])) {
        removeProjectile(i);
      }
    }

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

    // Enemy-player collisions (not during warp — you're inside the pipe!)
    if (!isWarping()) {
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
  }

  // --- Render ---
  clearCanvas();

  if (state === STATES.TITLE) {
    drawTitleScreen();
  } else if (state === STATES.PLAYING) {
    drawObstacles(ctx, now);
    drawPlayer(ctx, now, playerWarpScale);
    drawEnemies(ctx, now);
    drawProjectiles(ctx, now);
    drawHUD(ctx, getPlayerHealth(), getTimeRemaining(), width);
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
