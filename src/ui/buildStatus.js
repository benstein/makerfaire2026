// src/ui/buildStatus.js
// Polls public/building.json and manages BUILDING state transitions.
// No DOM rendering — the canvas build screen handles visuals.

import { getState, goToBuilding, goToTitle, STATES } from '../game/gameState.js';

const POLL_INTERVAL = 1000; // ms
const FAIL_THRESHOLD = 3;   // 3 * 1000ms = 3s of consecutive failures before we
                            // bail out of a stuck BUILDING state (e.g. missing
                            // building.json on a laptop that pulled in a build
                            // without running the post-commit hook).

let pollTimer = null;
let buildData = null;
let wasBuilding = false;
let failCount = 0;

export function initBuildStatus() {
  poll(); // check immediately on boot
  pollTimer = setInterval(poll, POLL_INTERVAL);
}

export function getBuildData() {
  return buildData;
}

function exitBuilding() {
  buildData = null;
  wasBuilding = false;
  if (getState() === STATES.BUILDING) {
    goToTitle();
  }
}

async function poll() {
  try {
    const resp = await fetch('/building.json?t=' + Date.now());
    const data = await resp.json();
    failCount = 0;

    if (data.building) {
      buildData = data;
      wasBuilding = true;

      // Enter BUILDING state if not already there
      if (getState() !== STATES.BUILDING) {
        goToBuilding();
      }
    } else if (wasBuilding) {
      exitBuilding();
    }
  } catch {
    // File missing or malformed. Tolerate a few transient failures (e.g. during
    // a write), but bail out after FAIL_THRESHOLD so we can't get pinned in
    // BUILDING state indefinitely if building.json never comes back.
    failCount++;
    if (failCount >= FAIL_THRESHOLD && wasBuilding) {
      exitBuilding();
    }
  }
}

// Clean up on HMR
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clearInterval(pollTimer);
  });
}
