// src/main.js
// SACRED — the game loop must always run cleanly

import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';
import { STATES, getState, getTimeRemaining, startGame, endGame, goToTitle, updateTimer, startBossFight } from './game/gameState.js';
import { resetPlayer, updatePlayer, drawPlayer, getPlayerPos, getPlayerFacing, getPlayerHealth, getPlayerBounds, damagePlayer, setPlayerPosition } from './game/player.js';
import { resetEnemies, updateEnemies, drawEnemies, getEnemies, removeEnemy } from './game/enemies.js';
import { resetWeapons, tryFire, updateProjectiles, drawProjectiles, getProjectiles, removeProjectile } from './game/weapons.js';
import { aabb } from './game/collision.js';
import { initRendering, getCanvasSize, clearCanvas, drawTitleScreen, drawVictoryScreen, drawGameOverScreen, resetVictoryEffects } from './game/rendering.js';
import { resetPowerups, onEnemyKilled, updatePowerups, drawPowerups, getSpeedMultiplier, getFireCooldownMultiplier } from './game/powerups.js';
import { resetRoadblocks, spawnRoadblock, getRoadblocks, drawRoadblocks } from './game/roadblocks.js';
import { spawnBoss, resetBoss, getBoss, isBossAlive, damageBoss, updateBoss, drawBoss, returnBossToSpawn } from './game/boss.js';
import { resetAirstrike, triggerAirstrike, updateAirstrike, getChickens, drawAirstrike, canAirstrike } from './game/airstrike.js';
import { resetRace, updateRaceAI, advancePlayerMap, getPlayerMap, getSoupMap, getSoupRaceX, getSoupRaceY, getRaceWinner, getCurrentMapConfig, TOTAL_MAPS, resetSoupToLeftEdge, drawRaceHUD, drawMapBackground } from './game/race.js';
import { resetSoup, drawSoup, setSoupPosition } from './game/soup.js';
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
  if (state !== STATES.BUILDING) {
    if ((input.start || input.fire) && (state === STATES.TITLE || state === STATES.GAMEOVER || state === STATES.VICTORY)) {
      startGame();
      resetPlayer(width, height);
      resetEnemies();
      resetWeapons();
      resetPowerups();
      resetRoadblocks();
      resetBoss();
      resetAirstrike();
      resetVictoryEffects();
      resetRace(width, height);
      resetSoup(width / 2, height / 2);
    } else if (input.start) {
      goToTitle();
    }
  }

  // --- Update ---
  if (state === STATES.PLAYING) {
    updatePlayer(dt, input, width, height, now, getSpeedMultiplier(now));
    updateEnemies(dt, getPlayerPos(), now, width, height);

    // Soup races across the screen autonomously — bears ignore him
    updateRaceAI(dt, width, height, now);
    setSoupPosition(getSoupRaceX(), getSoupRaceY());

    // Soup won — player loses
    if (getRaceWinner() === 'soup') {
      endGame(false);
    }

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

    // Enemy-player collisions (bears only chase player, not Soup)
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

    // Player reaches right edge → advance to next map
    const pb = getPlayerBounds();
    if (pb.x + pb.w >= width - 8) {
      advancePlayerMap();
      if (getRaceWinner() === 'player') {
        // Player finished all 15 maps — boss fight!
        startBossFight();
        resetEnemies();
        resetWeapons();
        spawnBoss(width, height, now);
      } else {
        // Next map — bears stay! Player enters from the left at the same Y they exited
        resetWeapons();
        setPlayerPosition(60, getPlayerPos().y);
        resetSoupToLeftEdge(height);
      }
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

    // B button — airstrike
    if (input.bomb && canAirstrike(now)) triggerAirstrike(width, height, now);
    updateAirstrike(dt, now, width, height);

    // Chickens hit enemies
    const chickens = getChickens();
    for (let ci = chickens.length - 1; ci >= 0; ci--) {
      const ch = chickens[ci];
      const enemyList2 = getEnemies();
      for (let ei = enemyList2.length - 1; ei >= 0; ei--) {
        if (aabb(ch, enemyList2[ei])) {
          removeEnemy(ei);
          onEnemyKilled(width, height);
          break;
        }
      }
      // Chickens hit player
      if (aabb(ch, getPlayerBounds())) {
        if (damagePlayer(now)) {
          chickens.splice(ci, 1);
          if (getPlayerHealth() <= 0) endGame(false);
        }
      }
    }
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

    // Boss-player collision — boss bounces back to spawn on hit
    const playerBounds = getPlayerBounds();
    if (boss && aabb(playerBounds, boss)) {
      if (damagePlayer(now)) {
        returnBossToSpawn();
        if (getPlayerHealth() <= 0) endGame(false);
      }
    }

    updatePowerups(dt, playerBounds, now);

    // Roadblocks still hurt
    const roadblockList = getRoadblocks();
    for (const rb of roadblockList) {
      if (aabb(getPlayerBounds(), rb)) {
        if (damagePlayer(now) && getPlayerHealth() <= 0) endGame(false);
      }
    }

    // Airstrike works in boss fight too
    if (input.bomb && canAirstrike(now)) triggerAirstrike(width, height, now);
    updateAirstrike(dt, now, width, height);
    const bossChickens = getChickens();
    for (let ci = bossChickens.length - 1; ci >= 0; ci--) {
      const ch = bossChickens[ci];
      if (aabb(ch, getPlayerBounds())) {
        if (damagePlayer(now) && getPlayerHealth() <= 0) { endGame(false); break; }
      }
    }
  }

  // --- Render ---
  clearCanvas();

  if (state === STATES.TITLE) {
    drawTitleScreen();
  } else if (state === STATES.PLAYING) {
    drawMapBackground(ctx, width, height, now);

    drawRoadblocks(ctx, now);
    drawPlayer(ctx, now);
    drawEnemies(ctx);
    drawProjectiles(ctx);
    drawPowerups(ctx, now);
    drawAirstrike(ctx, now);
    drawSoup(ctx, now);
    drawRaceHUD(ctx, width, height, now);
    drawHUD(ctx, getPlayerHealth(), getTimeRemaining(), width);
  } else if (state === STATES.BOSS_FIGHT) {
    drawMapBackground(ctx, width, height, now);
    drawRoadblocks(ctx, now);
    drawBoss(ctx, now, width);
    drawPlayer(ctx, now);
    drawProjectiles(ctx);
    drawPowerups(ctx, now);
    drawAirstrike(ctx, now);
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
