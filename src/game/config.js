// src/game/config.js
// All tunable game values live here.
// Many kid requests ("make enemies faster") are just config changes.

export const CONFIG = {
  // Player
  playerSpeed: 7,
  playerSize: 28,
  playerColor: '#ff1493',
  playerMaxHealth: 6,
  invincibilityDuration: 1000, // ms

  // Enemies
  enemySpeed: 2,
  enemySize: 22,
  enemyColor: '#e74c3c',
  enemySpawnIntervalStart: 2000, // ms at game start
  enemySpawnIntervalEnd: 400,    // ms at game end (ramps down)

  // Weapons
  projectileSpeed: 7,
  projectileSize: 14,
  projectileColor: '#ff69b4',
  fireRateCooldown: 250, // ms between shots

  // Game
  gameDuration: 60, // seconds
  arenaBackground: '#1e5e0a',

  // HUD
  heartColor: '#e74c3c',
  timerColor: '#d35400',
  hudFontSize: 56,
};
