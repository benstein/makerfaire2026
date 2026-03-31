// src/game/input.js
// SACRED — do not modify unless explicitly told "modify controls"

const state = {
  stickX: 0,
  stickY: 0,
  fire: false,
  start: false,
  fireHeld: false,
  startHeld: false,
};

let prevFire = false;
let prevStart = false;

const DEADZONE = 0.2;

export function pollInput() {
  const gamepads = navigator.getGamepads();
  const gp = gamepads[0];

  if (!gp) {
    state.stickX = 0;
    state.stickY = 0;
    state.fire = false;
    state.start = false;
    state.fireHeld = false;
    state.startHeld = false;
    return state;
  }

  const rawX = gp.axes[0];
  const rawY = gp.axes[1];
  state.stickX = Math.abs(rawX) > DEADZONE ? rawX : 0;
  state.stickY = Math.abs(rawY) > DEADZONE ? rawY : 0;

  const fireNow = gp.buttons[0]?.pressed ?? false;
  state.fire = fireNow && !prevFire;
  state.fireHeld = fireNow;
  prevFire = fireNow;

  const startNow = gp.buttons[9]?.pressed ?? false;
  state.start = startNow && !prevStart;
  state.startHeld = startNow;
  prevStart = startNow;

  return state;
}

export function getInput() {
  return state;
}
