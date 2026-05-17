// src/main.js
// SACRED — the game loop must always run cleanly

import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';
import { STATES, getState, getTimeRemaining, startGame, endGame, goToTitle, updateTimer } from './game/gameState.js';
import { resetPlayer, updatePlayer, drawPlayer, getPlayerPos, setPlayerPos, getPlayerFacing, getPlayerHealth, getPlayerMaxHealth, getPlayerBounds, damagePlayer, growPlayer, healPlayer } from './game/player.js';
import { resetDonuts, updateDonuts, drawDonuts, getDonuts, eatDonut, isExploding, explodeDone, drawDonutExplosion } from './game/donuts.js';
import { resetEnemies, updateEnemies, drawEnemies, getEnemies, removeEnemy, getFireballs, removeFireball, drawFireballs } from './game/enemies.js';
import { resetWeapons, tryFire, updateProjectiles, drawProjectiles, getProjectiles, removeProjectile } from './game/weapons.js';
import { aabb } from './game/collision.js';
import { initRendering, getCanvasSize, clearCanvas, drawTitleScreen, drawVictoryScreen, drawGameOverScreen, resetVictoryEffects, drawTicker } from './game/rendering.js';
import { resetLightning, updateLightning, drawLightning } from './game/lightning.js';
import { resetCube, updateCube, drawCube, getCube, isCubeAlive, damageCube } from './game/cube.js';
import { resetHammer, updateHammer, drawHammer, getHammerBlocks } from './game/hammer.js';
import { resetAd, updateAd, drawAd } from './game/ad.js';
import { resetPortals, updatePortals, drawPortals } from './game/portals.js';
import { resetFebreze, updateFebreze, drawFebreze } from './game/febreze.js';
import { resetPowerup, updatePowerup, drawPowerup, getStarBeams, removeStarBeam } from './game/powerup.js';
import { resetDeathStar, updateDeathStar, drawDeathStar, damageDeathStar, isDeathStarAlive, getDeathStarBounds, isInBeam } from './game/deathstar.js';
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

// Rainbow death burst
const DEATH_DURATION = 1400;
let deathAnimStart = -1;
let deathPos = null;
let deathParticles = [];

function triggerDeathAnim(now) {
  if (deathAnimStart !== -1) return;
  deathAnimStart = now;
  deathPos = getPlayerPos();
  deathParticles = [];
  for (let i = 0; i < 90; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 8;
    deathParticles.push({
      x: deathPos.x, y: deathPos.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      hue: Math.random() * 360,
      r: 3 + Math.random() * 9,
    });
  }
}

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
        resetLightning(now);
        resetCube(width, height);
        resetHammer(now);
        resetAd(now);
        resetPortals(width, height);
        resetDonuts(now);
        resetFebreze(now);
        resetDeathStar();
        resetPowerup(now, width, height);
        deathAnimStart = -1;
        deathParticles = [];
        resetVictoryEffects();
      } else if (input.start) {
        goToTitle();
      }
    }

    // --- Update ---
    if (state === STATES.PLAYING) {
      updateTimer(dt);
      const prevPos = getPlayerPos();
      updatePlayer(dt, input, width, height, now);
      // Solid block collision — axis-separation push-back
      const newPos = getPlayerPos();
      for (const block of getHammerBlocks()) {
        if (!aabb(getPlayerBounds(), block)) continue;
        setPlayerPos(newPos.x, prevPos.y);
        if (!aabb(getPlayerBounds(), block)) break;
        setPlayerPos(prevPos.x, newPos.y);
        if (!aabb(getPlayerBounds(), block)) break;
        setPlayerPos(prevPos.x, prevPos.y);
        break;
      }
      updateHammer(now, width, height);
      updateAd(now);
      // Nether portal warp / TNT explosion
      const portalResult = updatePortals(getPlayerBounds(), now);
      if (portalResult.explode) { endGame(false); }
      // No warp on entry — TNT still arms (per Cyrus/Ezra/Akil)
      updateEnemies(dt, getPlayerPos(), now, width, height);

      // Firing
      if (input.fire || input.fireHeld) {
        tryFire(getPlayerPos(), getPlayerFacing(), now);
      }
      updateProjectiles(dt, width, height);
      updateLightning(now, width, height);
      updateCube(dt, getPlayerPos());
      updateFebreze(now);
      updatePowerup(getPlayerBounds(), now);
      updateDeathStar(dt, now, getPlayerPos(), width, height);
      updateDonuts(now, width, height);

      // Donut-player collisions
      if (!isExploding()) {
        const donutList = getDonuts();
        const pb = getPlayerBounds();
        for (let i = donutList.length - 1; i >= 0; i--) {
          const d = donutList[i];
          const dist = Math.hypot(pb.x + pb.w / 2 - d.x, pb.y + pb.h / 2 - d.y);
          if (dist < d.r + pb.w / 2) {
            const count = eatDonut(i, now);
            if (count < 5) { growPlayer(); healPlayer(1); }
          }
        }
      }

      // Donut explosion — draw and then game over
      if (explodeDone(now)) endGame(false);

      // Projectile collisions
      const projList = getProjectiles();

      // vs Death Star
      if (isDeathStarAlive()) {
        const dsb = getDeathStarBounds();
        for (let i = projList.length - 1; i >= 0; i--) {
          if (aabb(projList[i], dsb)) {
            removeProjectile(i);
            damageDeathStar(now);
            break;
          }
        }
        // Superlaser beam hits player
        if (isInBeam(getPlayerBounds())) {
          if (damagePlayer(now) && getPlayerHealth() <= 0) triggerDeathAnim(now);
        }
        // Death Star body contact
        if (aabb(getPlayerBounds(), dsb)) {
          if (damagePlayer(now) && getPlayerHealth() <= 0) triggerDeathAnim(now);
        }
      }

      // vs cube
      if (isCubeAlive()) {
        for (let i = projList.length - 1; i >= 0; i--) {
          if (aabb(projList[i], getCube())) {
            removeProjectile(i);
            damageCube();
            break;
          }
        }
      }

      // Star beams vs enemies (kill on contact)
      const beams = getStarBeams();
      for (let bi = beams.length - 1; bi >= 0; bi--) {
        const bb = { x: beams[bi].x - 9, y: beams[bi].y - 9, w: 18, h: 18 };
        const el2 = getEnemies();
        for (let j = el2.length - 1; j >= 0; j--) {
          if (aabb(bb, el2[j])) { removeEnemy(j); removeStarBeam(bi); break; }
        }
      }

      // vs basketballs (swords destroy them)
      const basketballs = getFireballs();
      for (let i = projList.length - 1; i >= 0; i--) {
        for (let j = basketballs.length - 1; j >= 0; j--) {
          if (aabb(projList[i], basketballs[j])) {
            removeProjectile(i);
            removeFireball(j);
            break;
          }
        }
      }

      // vs regular enemies
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

      // Cube-player collision
      if (isCubeAlive() && aabb(getPlayerBounds(), getCube())) {
        if (damagePlayer(now) && getPlayerHealth() <= 0) triggerDeathAnim(now);
      }

      // Enemy-player collisions
      const playerBounds = getPlayerBounds();
      const enemies = getEnemies();
      for (let i = enemies.length - 1; i >= 0; i--) {
        if (aabb(playerBounds, enemies[i])) {
          if (damagePlayer(now)) {
            removeEnemy(i);
            if (getPlayerHealth() <= 0) triggerDeathAnim(now);
          }
        }
      }

      // Fireball-player collisions
      const fbs = getFireballs();
      for (let i = fbs.length - 1; i >= 0; i--) {
        if (aabb(playerBounds, fbs[i])) {
          removeFireball(i);
          if (damagePlayer(now) && getPlayerHealth() <= 0) triggerDeathAnim(now);
        }
      }

      // Death animation — advance particles, then end game
      if (deathAnimStart !== -1) {
        const scale = dt / 16.67;
        for (const p of deathParticles) {
          p.x += p.vx * scale;
          p.y += p.vy * scale;
          p.vy += 0.04 * scale;
        }
        if (now - deathAnimStart >= DEATH_DURATION) {
          deathAnimStart = -1;
          endGame(false);
        }
      }
    }

    // --- Render ---
    clearCanvas();

    if (state === STATES.TITLE) {
      drawTitleScreen();
    } else if (state === STATES.PLAYING) {
      drawLightning(ctx, width, height, now);
      drawPortals(ctx, width, height, now);
      drawHammer(ctx, width, height, now);
      drawCube(ctx, now);
      drawDeathStar(ctx, now);
      drawDonuts(ctx, now);
      drawFireballs(ctx, now);
      drawPowerup(ctx, now);
      if (deathAnimStart === -1) drawPlayer(ctx, now);
      // Rainbow death burst particles
      if (deathAnimStart !== -1) {
        const elapsed = now - deathAnimStart;
        const fade = Math.max(0, 1 - elapsed / DEATH_DURATION);
        for (const p of deathParticles) {
          ctx.save();
          ctx.globalAlpha = fade;
          ctx.shadowBlur  = 10;
          ctx.shadowColor = `hsl(${p.hue}, 100%, 65%)`;
          ctx.fillStyle   = `hsl(${p.hue}, 100%, 65%)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (0.4 + fade * 0.6), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      drawEnemies(ctx, now);
      drawProjectiles(ctx);
      drawHUD(ctx, getPlayerHealth(), getTimeRemaining(), width, getPlayerMaxHealth());
      if (isExploding()) drawDonutExplosion(ctx, ...Object.values(getPlayerPos()), width, height, now);
      drawAd(ctx, width, height, now);
      drawFebreze(ctx, width, height, now);
      drawTicker(now);
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
