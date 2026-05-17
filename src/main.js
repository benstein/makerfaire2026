// src/main.js
// SACRED — the game loop must always run cleanly

import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';
import { STATES, getState, getTimeRemaining, startGame, endGame, goToTitle, updateTimer } from './game/gameState.js';
import { resetPlayer, updatePlayer, drawPlayer, getPlayerPos, getPlayerFacing, getPlayerHealth, getPlayerBounds, getShieldBounds, damagePlayer, teleportPlayer } from './game/player.js';
import { resetEnemies, updateEnemies, drawEnemies, drawEnemyBullets, getEnemies, getEnemyBullets, removeEnemy, removeEnemyBullet, damageEnemy } from './game/enemies.js';
import { resetPanda, updatePanda, drawPanda } from './game/panda.js';
import { resetTurtle, updateTurtle, drawTurtle, getTurtle, isTurtleAlive, damageTurtle, isBowserMode, transformToBowser, getFireballs, removeFireball } from './game/turtle.js';
import { resetNuke, canNuke, triggerNuke, updateNuke, drawNuke, drawNukeHUD, isBlasting } from './game/nuke.js';
import { resetWeapons, tryFire, updateProjectiles, drawProjectiles, getProjectiles, removeProjectile } from './game/weapons.js';
import { aabb } from './game/collision.js';
import { initRendering, getCanvasSize, clearCanvas, drawMarioBackground, drawTitleScreen, drawVictoryScreen, drawGameOverScreen, resetVictoryEffects } from './game/rendering.js';
import { resetPortal, updatePortal, drawPortal, isMarioMode, checkPipeWarps, addGoombaKill, getGoombaKills } from './game/portal.js';
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
      if ((input.start || input.fireKb) && (state === STATES.TITLE || state === STATES.GAMEOVER || state === STATES.VICTORY)) {
        startGame();
        resetPlayer(width, height);
        resetEnemies();
        resetWeapons();
        resetVictoryEffects();
        resetTurtle(width, height);
        resetNuke();
        resetPanda(width, height);
        resetPortal(width, height);
      } else if (input.start) {
        goToTitle();
      }
    }

    // --- Update ---
    if (state === STATES.PLAYING) {
      updateTimer(dt);
      updatePlayer(dt, input, width, height, now);
      updatePortal(getPlayerBounds());

      // Pipe warp
      const warpDest = checkPipeWarps(getPlayerPos(), width, height, now);
      if (warpDest) teleportPlayer(warpDest.x, warpDest.y);

      updateEnemies(dt, getPlayerPos(), now, width, height);

      // Panda follows and slowly chomps enemies
      const pandaKill = updatePanda(dt, getPlayerPos(), getEnemies(), now);
      if (pandaKill !== -1) removeEnemy(pandaKill);

      // Turtle wanders and chomps
      if (updateTurtle(dt, getPlayerPos(), now, width, height)) {
        if (damagePlayer(now) && getPlayerHealth() <= 0) endGame(false);
      }

      // Nuke (B button — once per game)
      if (input.nuke && canNuke()) {
        triggerNuke(now);
        // Wipe all enemies and the turtle
        const allEnemies = getEnemies();
        for (let i = allEnemies.length - 1; i >= 0; i--) removeEnemy(i);
        if (isTurtleAlive()) resetTurtle(width, height);
      }
      updateNuke(now);

      // Firing
      if (input.fire || input.fireHeld) {
        tryFire(getPlayerPos(), getPlayerFacing(), now);
      }
      updateProjectiles(dt, width, height);

      // Projectile-enemy collisions
      const projList = getProjectiles();

      // vs turtle / Bowser
      if (isTurtleAlive()) {
        for (let i = projList.length - 1; i >= 0; i--) {
          if (aabb(projList[i], getTurtle())) {
            removeProjectile(i);
            if (damageTurtle() && isBowserMode()) endGame(true);
            break;
          }
        }
      }

      // Bowser body contact
      if (isTurtleAlive() && isBowserMode() && aabb(getPlayerBounds(), getTurtle())) {
        if (damagePlayer(now) && getPlayerHealth() <= 0) endGame(false);
      }

      // Fireball-player collision
      const fbs2 = getFireballs();
      const pb = getPlayerBounds();
      for (let i = fbs2.length - 1; i >= 0; i--) {
        if (aabb(pb, fbs2[i])) {
          removeFireball(i);
          if (damagePlayer(now) && getPlayerHealth() <= 0) endGame(false);
        }
      }

      // vs regular enemies
      const enemyList = getEnemies();
      for (let i = projList.length - 1; i >= 0; i--) {
        for (let j = enemyList.length - 1; j >= 0; j--) {
          if (aabb(projList[i], enemyList[j])) {
            removeProjectile(i);
            if (damageEnemy(j) && addGoombaKill()) {
              transformToBowser();
            }
            break;
          }
        }
      }

      // vs Bowser fireballs
      const fbs = getFireballs();
      for (let i = projList.length - 1; i >= 0; i--) {
        for (let j = fbs.length - 1; j >= 0; j--) {
          if (aabb(projList[i], fbs[j])) {
            removeProjectile(i);
            removeFireball(j);
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
            if (getPlayerHealth() <= 0) endGame(false);
          }
        }
      }

      // Enemy bullet collisions — check shield first, then player
      const shieldBounds = getShieldBounds();
      const eBullets = getEnemyBullets();
      for (let i = eBullets.length - 1; i >= 0; i--) {
        const b = eBullets[i];
        const bBounds = { x: b.x - 7, y: b.y - 7, w: 14, h: 14 };
        if (aabb(shieldBounds, bBounds)) {
          removeEnemyBullet(i); // blocked by shield — no damage!
        } else if (aabb(playerBounds, bBounds)) {
          removeEnemyBullet(i);
          if (damagePlayer(now) && getPlayerHealth() <= 0) endGame(false);
        }
      }
    }

    // --- Render ---
    clearCanvas();

    if (state === STATES.TITLE) {
      drawTitleScreen();
    } else if (state === STATES.PLAYING) {
      if (isMarioMode()) drawMarioBackground(ctx, width, height, now);
      drawPortal(ctx, now);
      drawTurtle(ctx, now);
      drawPanda(ctx, now);
      drawPlayer(ctx, now);
      drawEnemies(ctx);
      drawEnemyBullets(ctx);
      drawProjectiles(ctx);
      drawNuke(ctx, width, height, now);
      drawHUD(ctx, getPlayerHealth(), getTimeRemaining(), width);
      drawNukeHUD(ctx, width, height);
      if (isMarioMode() && !isBowserMode()) {
        const gk = getGoombaKills();
        ctx.font = 'bold 15px monospace';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
        ctx.strokeText(`GOOMBAS: ${gk}/10`, width / 2, height - 18);
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`GOOMBAS: ${gk}/10`, width / 2, height - 18);
        ctx.textAlign = 'left';
      }
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
