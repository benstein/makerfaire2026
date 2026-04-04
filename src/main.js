// src/main.js
// SACRED — the game loop must always run cleanly

import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';
import { STATES, getState, getTimeRemaining, startGame, endGame, goToTitle, updateTimer } from './game/gameState.js';
import { resetPlayer, updatePlayer, drawPlayer, getPlayerPos, getPlayerFacing, getPlayerHealth, getPlayerBounds, damagePlayer } from './game/player.js';
import { resetEnemies, updateEnemies, drawEnemies, getEnemies, removeEnemy } from './game/enemies.js';
import { resetWeapons, tryFire, updateProjectiles, drawProjectiles, getProjectiles, removeProjectile } from './game/weapons.js';
import { resetXPOrbs, spawnXPOrb, updateXPOrbs, drawXPOrbs } from './game/xpOrbs.js';
import { resetPowers, addXP, addKill, updatePowers, activatePower, isShielded, isTripleShot, drawPowerHUD, drawStatsScreen } from './game/powers.js';
import { aabb } from './game/collision.js';
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
let gameEndedWon = false;

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
      resetXPOrbs();
      resetPowers();
      resetVictoryEffects();
      gameEndedWon = false;
    } else {
      goToTitle();
    }
  }

  // --- Update ---
  if (state === STATES.PLAYING) {
    updateTimer(dt);
    updatePowers(dt, now);
    updatePlayer(dt, input, width, height, now);
    updateEnemies(dt, getPlayerPos(), now, width, height);

    // Activate power with X
    if (input.usePower) {
      activatePower(now);
    }

    // Firing — triple shot fires 3 spread projectiles
    if (input.fire || input.fireHeld) {
      if (isTripleShot()) {
        const facing = getPlayerFacing();
        const pos = getPlayerPos();
        const spread = 0.25;
        // Center shot
        tryFire(pos, facing, now);
        // Left spread
        const cosL = Math.cos(spread), sinL = Math.sin(spread);
        tryFire(pos, { x: facing.x * cosL - facing.y * sinL, y: facing.x * sinL + facing.y * cosL }, now - 1);
        // Right spread
        const cosR = Math.cos(-spread), sinR = Math.sin(-spread);
        tryFire(pos, { x: facing.x * cosR - facing.y * sinR, y: facing.x * sinR + facing.y * cosR }, now - 2);
      } else {
        tryFire(getPlayerPos(), getPlayerFacing(), now);
      }
    }
    updateProjectiles(dt, width, height);

    // Projectile-enemy collisions
    const projList = getProjectiles();
    const enemyList = getEnemies();
    for (let i = projList.length - 1; i >= 0; i--) {
      for (let j = enemyList.length - 1; j >= 0; j--) {
        if (aabb(projList[i], enemyList[j])) {
          const enemy = enemyList[j];
          const ex = enemy.x + enemy.w / 2;
          const ey = enemy.y + enemy.h / 2;
          removeProjectile(i);
          removeEnemy(j);
          spawnXPOrb(ex, ey);
          addXP(1);
          addKill();
          break;
        }
      }
    }

    // XP orb collection
    const collected = updateXPOrbs(getPlayerBounds(), now);
    if (collected > 0) {
      addXP(collected);
    }

    // Enemy-player collisions (shield blocks damage)
    const playerBounds = getPlayerBounds();
    const enemies = getEnemies();
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (aabb(playerBounds, enemies[i])) {
        if (isShielded()) {
          // Shield destroys enemy on contact!
          const enemy = enemies[i];
          spawnXPOrb(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2);
          addXP(1);
          addKill();
          removeEnemy(i);
        } else if (damagePlayer(now)) {
          removeEnemy(i);
          if (getPlayerHealth() <= 0) {
            gameEndedWon = false;
            endGame(false);
          }
        }
      }
    }

    // No timer-based win — game goes until you die
  }

  // --- Render ---
  clearCanvas();

  if (state === STATES.TITLE) {
    drawTitleScreen();
  } else if (state === STATES.PLAYING) {
    drawXPOrbs(ctx, now);
    drawPlayer(ctx, now);
    drawEnemies(ctx);
    drawProjectiles(ctx);
    drawHUD(ctx, getPlayerHealth(), getTimeRemaining(), width);
    drawPowerHUD(ctx, now, width, height);
  } else if (state === STATES.VICTORY || state === STATES.GAMEOVER) {
    drawStatsScreen(ctx, width, height, gameEndedWon);
  } else if (state === STATES.BUILDING) {
    drawBuildScreen(ctx, width, height, getBuildData(), now);
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
