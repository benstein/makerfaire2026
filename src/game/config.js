// src/game/config.js
// All tunable game values live here.
// Many kid requests ("make enemies faster") are just config changes.

export const CONFIG = {
  // Player
  playerSpeed: 4,
  playerSize: 28,
  playerColor: '#2c3e50',
  playerMaxHealth: 3,
  invincibilityDuration: 1000, // ms

  // Enemies
  enemySpeed: 0.9,
  enemySize: 110,
  enemyColor: '#e74c3c',
  enemySpawnIntervalStart: 2000, // ms at game start
  enemySpawnIntervalEnd: 400,    // ms at game end (ramps down)

  // Weapons
  projectileSpeed: 7,
  projectileSize: 6,
  projectileColor: '#1f3a5f',
  fireRateCooldown: 250, // ms between shots

  // Game
  gameDuration: 15, // seconds
  arenaBackground: '#eaf2f8',

  // HUD
  heartColor: '#e74c3c',
  timerColor: '#d35400',
  hudFontSize: 56,
};
