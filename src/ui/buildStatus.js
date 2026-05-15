// src/ui/buildStatus.js
// Polls public/building.json and manages BUILDING state transitions.
// No DOM rendering — the canvas build screen handles visuals.

import { getState, goToBuilding, goToTitle, STATES } from '../game/gameState.js';

const POLL_INTERVAL = 1000; // ms

let pollTimer = null;
let buildData = null;
let wasBuilding = false;

export function initBuildStatus() {
  poll(); // check immediately on boot
  pollTimer = setInterval(poll, POLL_INTERVAL);
}

export function getBuildData() {
  return buildData;
}

async function poll() {
  try {
    const resp = await fetch('/building.json?t=' + Date.now());
    const data = await resp.json();

    if (data.building) {
      buildData = data;
      wasBuilding = true;

      // Enter BUILDING state if not already there
      if (getState() !== STATES.BUILDING) {
        goToBuilding();
      }
    } else {
      buildData = null;

      // If we were building and now we're not, go to title
      if (wasBuilding) {
        wasBuilding = false;
        if (getState() === STATES.BUILDING) {
          goToTitle();
        }
      }
    }
  } catch {
    // File missing or malformed — keep last known state
  }
}

// Clean up on HMR
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clearInterval(pollTimer);
  });
}
