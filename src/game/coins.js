// src/game/coins.js
// Coins drop from defeated enemies. Collect 5 for a fire-rate boost!

import { CONFIG } from './config.js';
import { aabb } from './collision.js';
import { getPlayerBounds } from './player.js';

let coins = [];
let collected = 0;
const COIN_SIZE = 14;
const COIN_DROP_CHANCE = 0.5;
const COINS_FOR_BOOST = 5;
const BOOSTED_COOLDOWN = 80; // ms — much faster than normal 250ms

export function resetCoins() {
  coins = [];
  collected = 0;
}

export function spawnCoin(x, y) {
  if (Math.random() > COIN_DROP_CHANCE) return;
  coins.push({
    x: x - COIN_SIZE / 2,
    y: y - COIN_SIZE / 2,
    w: COIN_SIZE,
    h: COIN_SIZE,
    spawnTime: performance.now(),
  });
}

export function updateCoins() {
  const playerBounds = getPlayerBounds();
  for (let i = coins.length - 1; i >= 0; i--) {
    if (aabb(playerBounds, coins[i])) {
      coins.splice(i, 1);
      collected++;
    }
  }
}

export function drawCoins(ctx, now) {
  for (const coin of coins) {
    const cx = coin.x + COIN_SIZE / 2;
    const cy = coin.y + COIN_SIZE / 2;
    const age = now - coin.spawnTime;

    // Bob up and down
    const bob = Math.sin(age / 300) * 3;

    // Gold coin body — squeeze horizontally to simulate spinning
    const spinPhase = Math.cos(age / 200);
    const radiusX = (COIN_SIZE / 2) * Math.abs(spinPhase);
    const radiusY = COIN_SIZE / 2;

    ctx.save();
    ctx.translate(cx, cy + bob);

    // Outer gold ring
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(radiusX, 2), radiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    // Inner darker detail
    ctx.fillStyle = '#f39c12';
    ctx.beginPath();
    ctx.ellipse(0, 0, Math.max(radiusX * 0.6, 1), radiusY * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle
    if (Math.sin(age / 150) > 0.7) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-radiusX * 0.3, -radiusY * 0.3, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

export function getCoinsCollected() {
  return collected;
}

export function getFireRateCooldown() {
  if (collected >= COINS_FOR_BOOST) {
    return BOOSTED_COOLDOWN;
  }
  return CONFIG.fireRateCooldown;
}

export function hasFireBoost() {
  return collected >= COINS_FOR_BOOST;
}
