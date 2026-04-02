// src/game/gameState.js
// SACRED — state machine must always work

import { CONFIG } from './config.js';

export const STATES = {
  TITLE: 'title',
  PLAYING: 'playing',
  LEVELING_UP: 'leveling_up',
  VICTORY: 'victory',
  GAMEOVER: 'gameover',
  BUILDING: 'building',
};

let currentState = STATES.TITLE;
let currentLevel = 1;
let xp = 0;
let levelUpStartTime = 0;

const MAX_LEVEL = 5;
const XP_PER_LEVEL = 10;
const LEVEL_UP_DURATION = 2000; // ms to show level-up screen

export function getState() {
  return currentState;
}

export function getLevel() {
  return currentLevel;
}

export function getXP() {
  return xp;
}

export function getXPNeeded() {
  return XP_PER_LEVEL;
}

export function getMaxLevel() {
  return MAX_LEVEL;
}

// Used by enemies.js to scale difficulty
export function getGameProgress() {
  return (currentLevel - 1) / (MAX_LEVEL - 1);
}

export function startGame() {
  currentState = STATES.PLAYING;
  currentLevel = 1;
  xp = 0;
}

export function addXP(amount) {
  xp += amount;
  if (xp >= XP_PER_LEVEL) {
    xp = 0;
    if (currentLevel >= MAX_LEVEL) {
      endGame(true);
    } else {
      currentLevel += 1;
      levelUpStartTime = performance.now();
      currentState = STATES.LEVELING_UP;
    }
  }
}

export function updateLevelUp(now) {
  if (currentState !== STATES.LEVELING_UP) return;
  if (now - levelUpStartTime > LEVEL_UP_DURATION) {
    currentState = STATES.PLAYING;
  }
}

export function getLevelUpProgress(now) {
  return Math.min(1, (now - levelUpStartTime) / LEVEL_UP_DURATION);
}

export function endGame(won) {
  currentState = won ? STATES.VICTORY : STATES.GAMEOVER;
}

export function goToTitle() {
  currentState = STATES.TITLE;
  currentLevel = 1;
  xp = 0;
}

export function goToBuilding() {
  currentState = STATES.BUILDING;
}

// Keep updateTimer for compatibility but it's now a no-op for the timer
// The level system drives progression instead
export function updateTimer(dt) {
  // No timer in level mode
}

export function getTimeRemaining() {
  return 0; // Not used in level mode
}
