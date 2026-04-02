// src/main.js
// SACRED — the game loop must always run cleanly

import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';
import { STATES, getState, startGame, endGame, goToTitle, addXP, getLevel, getXP, getXPNeeded, getMaxLevel, updateLevelUp, getLevelUpProgress } from './game/gameState.js';
import { resetPlayer, updatePlayer, drawPlayer, getPlayerPos, getPlayerFacing, getPlayerHealth, getPlayerBounds, damagePlayer } from './game/player.js';
import { resetEnemies, updateEnemies, drawEnemies, getEnemies, removeEnemy } from './game/enemies.js';
import { resetWeapons, tryFire, updateProjectiles, drawProjectiles, getProjectiles, removeProjectile } from './game/weapons.js';
import { resetXPOrbs, spawnXPOrb, updateXPOrbs, drawXPOrbs } from './game/xpOrbs.js';
import { resetMeat, tryDropMeat, updateMeat, drawMeat } from './game/meat.js';
import { resetPowers, updatePowers, activatePower, isInvisible, isPiercing, drawPowerHUD } from './game/powers.js';
import { aabb } from './game/collision.js';
import { initRendering, getCanvasSize, clearCanvas, drawTitleScreen, drawVictoryScreen, drawGameOverScreen, drawLevelUpScreen, resetVictoryEffects } from './game/rendering.js';
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

  // --- State transitions ---
  if (input.start && state !== STATES.BUILDING) {
    if (state === STATES.TITLE) {
      startGame();
      resetPlayer(width, height);
      resetEnemies();
      resetWeapons();
      resetXPOrbs();
      resetMeat();
      resetPowers(now);
      resetVictoryEffects();
    } else if (state !== STATES.LEVELING_UP) {
      goToTitle();
    }
  }

  // --- Update ---
  if (state === STATES.PLAYING) {
    updatePowers(now);
    updatePlayer(dt, input, width, height, now);
    updateEnemies(dt, getPlayerPos(), now, width, height);

    // Activate power with X button
    if (input.usePower) {
      activatePower(now);
    }

    // Firing
    if (input.fire || input.fireHeld) {
      tryFire(getPlayerPos(), getPlayerFacing(), now);
    }
    updateProjectiles(dt, width, height);

    // Drop meat with B button
    if (input.dropMeat) {
      const pos = getPlayerPos();
      tryDropMeat(pos.x, pos.y, now);
    }
    updateMeat(now);

    // Projectile-enemy collisions — piercing bullets go through!
    const projList = getProjectiles();
    const enemyList = getEnemies();
    const piercing = isPiercing();
    for (let i = projList.length - 1; i >= 0; i--) {
      let hitSomething = false;
      for (let j = enemyList.length - 1; j >= 0; j--) {
        if (aabb(projList[i], enemyList[j])) {
          const enemy = enemyList[j];
          const ex = enemy.x + enemy.w / 2;
          const ey = enemy.y + enemy.h / 2;
          removeEnemy(j);
          spawnXPOrb(ex, ey);
          hitSomething = true;
          if (!piercing) break; // normal bullets stop; piercing continues
        }
      }
      if (hitSomething && !piercing) {
        removeProjectile(i);
      }
    }

    // XP orb collection
    const collected = updateXPOrbs(getPlayerBounds(), now);
    if (collected > 0) {
      addXP(collected);
    }

    // Enemy-player collisions (skip during invisibility)
    if (!isInvisible()) {
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

  // --- Level-up transition ---
  if (state === STATES.LEVELING_UP) {
    updateLevelUp(now);
    // When transition ends, reset arena for new level
    if (getState() === STATES.PLAYING) {
      resetEnemies();
      resetWeapons();
      resetXPOrbs();
      resetMeat();
      resetPowers(now);
      resetPlayer(width, height);
    }
  }

  // --- Render ---
  const level = getLevel();
  clearCanvas(level);

  if (state === STATES.TITLE) {
    drawTitleScreen();
  } else if (state === STATES.PLAYING) {
    drawMeat(ctx, now);
    drawXPOrbs(ctx, now);
    drawPlayer(ctx, now);
    drawEnemies(ctx, now);
    drawProjectiles(ctx);
    drawHUD(ctx, getPlayerHealth(), level, getXP(), getXPNeeded(), getMaxLevel(), width);
    drawPowerHUD(ctx, now, width, height);
  } else if (state === STATES.LEVELING_UP) {
    drawLevelUpScreen(level, getLevelUpProgress(now));
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
