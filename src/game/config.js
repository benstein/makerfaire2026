// src/game/config.js
// All tunable game values live here.
// Many kid requests ("make enemies faster") are just config changes.

export const CONFIG = {
  // Player
  playerSpeed: 4,
  playerSize: 28,
  playerColor: '#E52521', // Mario red
  playerMaxHealth: 3,
  invincibilityDuration: 1000, // ms

  // Enemies
  enemySpeed: 2,
  enemySize: 22,
  enemyColor: '#e74c3c',
  enemyHP: 2,              // hits to kill a Goomba
  enemySpawnIntervalStart: 3000, // ms at game start (slower spawns)
  enemySpawnIntervalEnd: 700,    // ms at game end (ramps down)
  heartDropChance: 0.1,          // 10% chance to drop a heart on death

  // Weapons
  projectileSpeed: 7,
  projectileSize: 8,
  projectileColor: '#FF6600', // Mario fireball orange
  fireRateCooldown: 400, // ms between shots (slower fire rate)

  // Game
  gameDuration: 60, // seconds
  arenaBackground: '#5C94FC', // Mario sky blue

  // HUD
  heartColor: '#E52521', // Mario red
  timerColor: '#f1c40f',
  hudFontSize: 24,
};
