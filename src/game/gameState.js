// src/game/gameState.js
// SACRED — state machine and timer must always work

import { CONFIG } from './config.js';

export const STATES = {
  TITLE: 'title',
  PLAYING: 'playing',
  VICTORY: 'victory',
  GAMEOVER: 'gameover',
  BUILDING: 'building',
};

let currentState = STATES.TITLE;
let timeRemaining = CONFIG.gameDuration;
let elapsedMs = 0;

export function getState() {
  return currentState;
}

export function getTimeRemaining() {
  return Math.ceil(timeRemaining);
}

export function getElapsedMs() {
  return elapsedMs;
}

export function getGameProgress() {
  return Math.min(1, elapsedMs / (CONFIG.gameDuration * 1000));
}

export function startGame() {
  currentState = STATES.PLAYING;
  timeRemaining = CONFIG.gameDuration;
  elapsedMs = 0;
}

export function endGame(won) {
  currentState = won ? STATES.VICTORY : STATES.GAMEOVER;
}

export function goToTitle() {
  currentState = STATES.TITLE;
  timeRemaining = CONFIG.gameDuration;
  elapsedMs = 0;
}

export function goToBuilding() {
  currentState = STATES.BUILDING;
}

export function updateTimer(dt) {
  if (currentState !== STATES.PLAYING) return;
  elapsedMs += dt;
  timeRemaining -= dt / 1000;
  if (timeRemaining <= 0) {
    timeRemaining = 0;
    endGame(false); // time's up without killing the boss → loss
  }
}
