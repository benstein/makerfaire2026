// src/main.js
// SACRED — the game loop must always run cleanly

import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';
import { STATES, getState, getTimeRemaining, startGame, endGame, goToTitle, updateTimer } from './game/gameState.js';
import { resetPlayer, updatePlayer, drawPlayer, getPlayerPos, getPlayerFacing, getPlayerHealth, getPlayerBounds, damagePlayer } from './game/player.js';
import { resetEnemies, updateEnemies, drawEnemies, getEnemies, removeEnemy } from './game/enemies.js';
import { resetWeapons, tryFire, updateProjectiles, drawProjectiles, processRingHits } from './game/weapons.js';
import { resetLightning, updateLightning, drawLightning } from './game/lightning.js';
import { aabb } from './game/collision.js';
import { initRendering, getCanvasSize, clearCanvas, drawTitleScreen, drawVictoryScreen, drawGameOverScreen, resetVictoryEffects } from './game/rendering.js';
import { drawHUD } from './ui/hud.js';
import { loadChangelog } from './ui/changelog.js';
import { initBuildStatus, getBuildData } from './ui/buildStatus.js';
import { drawBuildScreen } from './ui/buildScreen.js';
import { drawErrorBadge } from './ui/errorBadge.js';
import { startMusic, stopMusic, sfxFire, sfxExplosion, sfxHurt, sfxLightning, sfxGameOver, sfxVictory } from './game/audio.js';

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
let prevState = null;

function gameLoop(now) {
  try {
    const dt = now - lastTime;
    lastTime = now;

  pollInput();
  const input = getInput();
  const state = getState();
  const { width, height } = getCanvasSize();

  // --- Audio: react to state changes ---
  if (state !== prevState) {
    if (state === STATES.PLAYING) startMusic();
    if (state === STATES.GAMEOVER) sfxGameOver();
    if (state === STATES.VICTORY)  sfxVictory();
    if (state === STATES.TITLE && prevState === STATES.PLAYING) stopMusic();
    prevState = state;
  }

  // --- State transitions ---
  if (input.start && state !== STATES.BUILDING) {
    if (state === STATES.TITLE) {
      startGame();
      resetPlayer(width, height);
      resetEnemies();
      resetWeapons();
      resetLightning();
      resetVictoryEffects();
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
      const firedNow = tryFire(getPlayerPos(), getPlayerFacing(), now);
      if (firedNow) sfxFire();
    }
    updateProjectiles(dt, width, height, getPlayerPos());

    // Ring of fire — count kills for explosion sounds
    const beforeKill = getEnemies().length;
    processRingHits(getEnemies(), removeEnemy, now);
    const killed = beforeKill - getEnemies().length;
    for (let k = 0; k < Math.min(killed, 3); k++) sfxExplosion();

    // Lightning — play zap when bolt connects
    const lightningDamage = (t) => {
      if (damagePlayer(t)) { sfxLightning(); return true; }
      return false;
    };
    updateLightning(dt, now, width, height, getPlayerPos(), lightningDamage);
    if (getPlayerHealth() <= 0) endGame(false);

    // Enemy-player collisions
    const playerBounds = getPlayerBounds();
    const enemies = getEnemies();
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (aabb(playerBounds, enemies[i])) {
        if (damagePlayer(now)) {
          sfxHurt();
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
    drawLightning(ctx, width, height, now);
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
