// src/game/config.js
// All tunable game values live here.
// Many kid requests ("make enemies faster") are just config changes.

export const CONFIG = {
  // Player
  playerSpeed: 4,
  playerSize: 28,
  playerColor: '#6B9C55', // artichoke green
  playerMaxHealth: 3,
  invincibilityDuration: 1000, // ms

  // Enemies
  enemySpeed: 1.5,
  enemySize: 22,
  enemyColor: '#8B3A5C', // angry artichoke purple
  enemySpawnIntervalStart: 2000, // ms at game start
  enemySpawnIntervalEnd: 400,    // ms at game end (ramps down)

  // Weapons
  projectileSpeed: 7,
  projectileSize: 6,
  projectileColor: '#A8D84E', // bright leaf green
  fireRateCooldown: 250, // ms between shots

  // Game
  gameDuration: 60, // seconds
  arenaBackground: '#1a2e1a', // dark garden green

  // HUD
  heartColor: '#C94070', // artichoke heart pink
  timerColor: '#f1c40f',
  hudFontSize: 24,
};
