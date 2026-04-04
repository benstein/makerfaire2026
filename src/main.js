// src/main.js
// SACRED — the game loop must always run cleanly

import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';
import { STATES, getState, getTimeRemaining, startGame, endGame, goToTitle, updateTimer } from './game/gameState.js';
import { resetPlayer, updatePlayer, drawPlayer, getPlayerPos, getPlayerFacing, getPlayerHealth, getPlayerBounds, damagePlayer, healPlayer, isPlayerJumping } from './game/player.js';
import { resetEnemies, updateEnemies, drawEnemies, getEnemies, removeEnemy } from './game/enemies.js';
import { resetWeapons, tryFire, updateProjectiles, drawProjectiles, getProjectiles, removeProjectile } from './game/weapons.js';
import { resetXPOrbs, spawnXPOrb, updateXPOrbs, drawXPOrbs } from './game/xpOrbs.js';
import { resetPowers, addXP, addKill, updatePowers, activatePower, isShielded, isTripleShot, getTripleShotCount, drawPowerHUD, drawStatsScreen } from './game/powers.js';
import { resetFirePosts, updateFirePosts, checkProjectileHits, drawFirePosts } from './game/firePosts.js';
import { resetHeartDrops, spawnHeartDrop, updateHeartDrops, drawHeartDrops } from './game/heartDrops.js';
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
      resetFirePosts(width, height, now);
      resetHeartDrops();
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

    // Firing — triple shot fires multiple spread projectiles that scale with level
    if (input.fire || input.fireHeld) {
      if (isTripleShot()) {
        const facing = getPlayerFacing();
        const pos = getPlayerPos();
        const count = getTripleShotCount();
        const totalSpread = 0.5 + (count - 3) * 0.05; // widens slightly with more shots
        for (let s = 0; s < count; s++) {
          const angle = count === 1 ? 0 : -totalSpread / 2 + (s / (count - 1)) * totalSpread;
          const cos = Math.cos(angle), sin = Math.sin(angle);
          const dir = { x: facing.x * cos - facing.y * sin, y: facing.x * sin + facing.y * cos };
          tryFire(pos, dir, now - s); // offset time to bypass cooldown
        }
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

    // Fire post updates + projectile hits
    updateFirePosts(now, width, height);
    const postDrops = checkProjectileHits(getProjectiles(), removeProjectile);
    for (const drop of postDrops) {
      if (drop.type === 'heart') {
        spawnHeartDrop(drop.x, drop.y);
      } else {
        for (let k = 0; k < drop.amount; k++) {
          spawnXPOrb(drop.x + (Math.random() - 0.5) * 12, drop.y + (Math.random() - 0.5) * 12);
        }
        addXP(drop.amount);
      }
    }

    // XP orb collection
    const collected = updateXPOrbs(getPlayerBounds(), now);
    if (collected > 0) {
      addXP(collected);
    }

    // Heart drop collection
    updateHeartDrops(getPlayerBounds(), healPlayer, now);

    // Enemy-player collisions (skip while jumping)
    if (!isPlayerJumping()) {
      const playerBounds = getPlayerBounds();
      const enemies = getEnemies();
      for (let i = enemies.length - 1; i >= 0; i--) {
        if (aabb(playerBounds, enemies[i])) {
          if (isShielded()) {
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
    }

    // No timer-based win — game goes until you die
  }

  // --- Render ---
  clearCanvas();

  if (state === STATES.TITLE) {
    drawTitleScreen();
  } else if (state === STATES.PLAYING) {
    drawFirePosts(ctx, now);
    drawHeartDrops(ctx, now);
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
