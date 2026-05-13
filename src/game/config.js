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

  // Enemies — HUGE (Arin's change)
  enemySpeed: 0.9,
  enemySize: 140,
  enemyColor: '#e74c3c',
  enemySpawnIntervalStart: 3500, // ms at game start (giants need more space)
  enemySpawnIntervalEnd: 1200,   // ms at game end

  // Weapons
  projectileSpeed: 7,
  projectileSize: 6,
  projectileColor: '#ffffff',
  fireRateCooldown: 250, // ms between shots

  // Game
  gameDuration: 60, // seconds
  arenaBackground: '#1a1a2e',

  // HUD
  heartColor: '#e74c3c',
  timerColor: '#f1c40f',
  hudFontSize: 24,
};
