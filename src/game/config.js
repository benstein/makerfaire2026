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
  enemySpeed: 2,
  enemySize: 22,
  enemyColor: '#e74c3c',
  enemySpawnIntervalStart: 2000, // ms at game start
  enemySpawnIntervalEnd: 400,    // ms at game end (ramps down)

  // Weapons
  projectileSpeed: 7,
  projectileSize: 6,
  projectileColor: '#1f3a5f',
  fireRateCooldown: 250, // ms between shots

  // Game
  gameDuration: 60, // seconds
  arenaBackground: '#05080f',

  // HUD
  heartColor: '#ff4466',
  timerColor: '#ffcc44',
  hudFontSize: 56,
};
