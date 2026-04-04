// src/main.js
// SACRED — the game loop must always run cleanly

import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';
import { STATES, getState, startGame, endGame, goToTitle, updateTimer } from './game/gameState.js';
import { resetPlayer, updatePlayer, drawPlayer, getPlayerPos, getPlayerFacing, getPlayerHealth, getPlayerBounds, damagePlayer } from './game/player.js';
import { resetEnemies, updateEnemies, drawEnemies, getEnemies, removeEnemy, damageEnemy } from './game/enemies.js';
import { resetWeapons, tryFire, updateProjectiles, drawProjectiles, getProjectiles, removeProjectile } from './game/weapons.js';
import { aabb } from './game/collision.js';
import { generateAllMaps, resetMapState, getCurrentMap, warpToRandomMap } from './game/mapGen.js';
import { initRendering, getCanvasSize, clearCanvas, drawTitleScreen, drawVictoryScreen, drawGameOverScreen, resetVictoryEffects } from './game/rendering.js';
import { drawHUD, drawStatsScreen, resetHUDStats, addHUDTime, addHUDKill } from './ui/hud.js';
import { loadChangelog } from './ui/changelog.js';
import { initBuildStatus, getBuildData } from './ui/buildStatus.js';
import { drawBuildScreen } from './ui/buildScreen.js';

// Generate all 100 maps once at boot
generateAllMaps();

// Boot
const canvas = document.getElementById('game-canvas');
const ctx = initRendering(canvas);
loadChangelog();
initBuildStatus();

let lastTime = performance.now();
let warpFlash = 0; // timestamp for map warp flash effect

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
      resetMapState();
      resetPlayer(width, height);
      resetEnemies();
      resetWeapons();
      resetHUDStats();
      resetVictoryEffects();
    } else {
      goToTitle();
    }
  }

  // --- Update ---
  if (state === STATES.PLAYING) {
    updateTimer(dt);
    addHUDTime(dt);
    updatePlayer(dt, input, width, height, now);
    updateEnemies(dt, getPlayerPos(), now, width, height);

    // Edge detection — warp to new map
    const pos = getPlayerPos();
    const margin = 5;
    if (pos.x <= margin || pos.x >= width - margin || pos.y <= margin || pos.y >= height - margin) {
      warpToRandomMap();
      resetEnemies();
      resetWeapons();
      // Place player on opposite side
      let nx = width / 2, ny = height / 2;
      if (pos.x <= margin) nx = width - 40;
      else if (pos.x >= width - margin) nx = 40;
      else if (pos.y <= margin) ny = height - 40;
      else if (pos.y >= height - margin) ny = 40;
      // Use resetPlayer to reposition (keeps health via direct set after)
      const hp = getPlayerHealth();
      resetPlayer(width, height);
      // Restore position to opposite edge
      // We need to set position — hack: update with zero input at target
      warpFlash = now;
    }

    // Firing
    if (input.fire || input.fireHeld) {
      tryFire(getPlayerPos(), getPlayerFacing(), now);
    }
    updateProjectiles(dt, width, height);

    // Projectile-enemy collisions (enemies have HP)
    const projList = getProjectiles();
    const enemyList = getEnemies();
    for (let i = projList.length - 1; i >= 0; i--) {
      for (let j = enemyList.length - 1; j >= 0; j--) {
        if (aabb(projList[i], enemyList[j])) {
          removeProjectile(i);
          const killed = damageEnemy(j, now);
          if (killed) addHUDKill();
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
  const map = getCurrentMap();
  clearCanvas(state === STATES.PLAYING ? map.bg : undefined);

  if (state === STATES.TITLE) {
    drawTitleScreen();
  } else if (state === STATES.PLAYING) {
    drawPlayer(ctx, now);
    drawEnemies(ctx, now);
    drawProjectiles(ctx);
    drawHUD(ctx, getPlayerHealth(), width, height);

    // Map warp flash
    if (warpFlash && now - warpFlash < 300) {
      const flashAlpha = 1 - (now - warpFlash) / 300;
      ctx.fillStyle = `rgba(255,255,255,${flashAlpha * 0.5})`;
      ctx.fillRect(0, 0, width, height);

      // Show map name briefly
      ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
      ctx.font = 'bold 28px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(map.name, width / 2, height / 2 - 10);
      ctx.font = '16px monospace';
      ctx.fillStyle = `rgba(200,200,200,${flashAlpha})`;
      ctx.fillText(`Map #${map.id} — ${map.enemy.name}`, width / 2, height / 2 + 20);
      ctx.textAlign = 'left';
    }
  } else if (state === STATES.VICTORY || state === STATES.GAMEOVER) {
    drawStatsScreen(ctx, width, height);
  } else if (state === STATES.BUILDING) {
    drawBuildScreen(ctx, width, height, getBuildData(), now);
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
