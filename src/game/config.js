// src/game/config.js
// All tunable game values live here.
// Many kid requests ("make enemies faster") are just config changes.

export const CONFIG = {
  // Player (teddy bear!)
  playerSpeed: 4,
  playerSize: 34,
  playerColor: '#c8956c',
  playerMaxHealth: 3,
  invincibilityDuration: 1000, // ms

  // Enemies (unicorns!)
  enemySpeed: 2,
  enemySize: 26,
  enemyColor: '#e78de7',
  enemySpawnIntervalStart: 2000, // ms at game start
  enemySpawnIntervalEnd: 400,    // ms at game end (ramps down)

  // Weapons (love hearts!)
  projectileSpeed: 7,
  projectileSize: 8,
  projectileColor: '#ff69b4',
  fireRateCooldown: 250, // ms between shots

  // Game
  gameDuration: 30, // seconds
  arenaBackground: '#ffe0f0',

  // HUD
  heartColor: '#ff69b4',
  timerColor: '#ff88cc',
  hudFontSize: 24,
};
