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

  // Game — level-based progression
  arenaBackground: '#1a1a2e',
  // Arena colors per level (5 levels)
  levelBackgrounds: ['#1a1a2e', '#1a2e1a', '#2e1a1a', '#1a1a3e', '#2e0a0a'],
  levelNames: ['The Depths', 'Poison Swamp', 'Crimson Halls', 'Void Realm', 'Final Arena'],

  // HUD
  heartColor: '#e74c3c',
  timerColor: '#f1c40f',
  hudFontSize: 24,
};
