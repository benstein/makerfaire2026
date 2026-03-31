// src/main.js
import { CONFIG } from './game/config.js';
import { pollInput, getInput } from './game/input.js';
import { STATES, getState, getTimeRemaining, startGame, goToTitle, updateTimer, endGame } from './game/gameState.js';
import { resetPlayer, updatePlayer, drawPlayer, getPlayerHealth, getPlayerPos, getPlayerBounds, damagePlayer } from './game/player.js';
import { resetEnemies, updateEnemies, drawEnemies, getEnemies, removeEnemy } from './game/enemies.js';
import { aabb } from './game/collision.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let lastTime = performance.now();

function gameLoop(now) {
  const dt = now - lastTime;
  lastTime = now;

  pollInput();
  const input = getInput();

  const state = getState();

  // Handle Start button from any state
  if (input.start) {
    if (state === STATES.TITLE) {
      startGame();
      resetPlayer(canvas.width, canvas.height);
      resetEnemies();
    } else {
      goToTitle();
    }
  }

  // Update
  if (state === STATES.PLAYING) {
    updateTimer(dt);
    updatePlayer(input, canvas.width, canvas.height, performance.now());

    const now2 = performance.now();
    updateEnemies(getPlayerPos(), now2, canvas.width, canvas.height);

    // Enemy-player collisions
    const playerBounds = getPlayerBounds();
    const enemyList = getEnemies();
    for (let i = enemyList.length - 1; i >= 0; i--) {
      if (aabb(playerBounds, enemyList[i])) {
        if (damagePlayer(now2)) {
          removeEnemy(i);
          if (getPlayerHealth() <= 0) {
            endGame(false);
          }
        }
      }
    }
  }

  // Render
  ctx.fillStyle = CONFIG.arenaBackground;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#fff';
  ctx.font = '32px monospace';
  ctx.textAlign = 'center';

  if (state === STATES.TITLE) {
    ctx.fillText('ARENA SURVIVAL', canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = '18px monospace';
    ctx.fillText('PRESS START', canvas.width / 2, canvas.height / 2 + 20);
  } else if (state === STATES.PLAYING) {
    drawPlayer(ctx, performance.now());
    drawEnemies(ctx);
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`TIME: ${getTimeRemaining()}s`, 20, 30);
  } else if (state === STATES.VICTORY) {
    ctx.fillStyle = '#2ecc71';
    ctx.fillText('YOU SURVIVED!', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText('PRESS START TO PLAY AGAIN', canvas.width / 2, canvas.height / 2 + 20);
  } else if (state === STATES.GAMEOVER) {
    ctx.fillStyle = '#e74c3c';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);
    ctx.fillStyle = '#fff';
    ctx.font = '18px monospace';
    ctx.fillText('PRESS START TO TRY AGAIN', canvas.width / 2, canvas.height / 2 + 20);
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
