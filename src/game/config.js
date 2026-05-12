// src/game/config.js
// All tunable game values live here.
// Many kid requests ("make enemies faster") are just config changes.

export const CONFIG = {
  // Player
  playerSpeed: 4,
  playerSize: 28,
  playerColor: '#ffffff',
  playerMaxHealth: 3,
  invincibilityDuration: 1000, // ms

  // Enemies
  enemySpeed: 1.5,
  enemySize: 22,
  enemyColor: '#e74c3c',
  enemySpawnIntervalStart: 2000, // ms at game start
  enemySpawnIntervalEnd: 400,    // ms at game end (ramps down)

  // Weapons
  projectileSpeed: 7,
  projectileSize: 6,
  projectileColor: '#ffffff',
  fireRateCooldown: 250, // ms between shots

  // Ice physics
  iceAccel: 0.08,       // how quickly you build up speed (lower = more slippery)
  enemyIceAccel: 0.06,  // enemies are even slidier

  // Game
  gameDuration: 60, // seconds
  arenaBackground: '#b8d4e2',

  // HUD
  heartColor: '#e74c3c',
  timerColor: '#f1c40f',
  hudFontSize: 24,
};
