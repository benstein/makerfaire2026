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

// Keyboard fallback — only when no gamepad connected
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

function pollKeyboard() {
  state.stickX = (keys['d'] || keys['ArrowRight'] ? 1 : 0) - (keys['a'] || keys['ArrowLeft'] ? 1 : 0);
  state.stickY = (keys['s'] || keys['ArrowDown'] ? 1 : 0) - (keys['w'] || keys['ArrowUp'] ? 1 : 0);

  const fireNow = keys[' '] || false;
  state.fire = fireNow && !prevFire;
  state.fireHeld = fireNow;
  prevFire = fireNow;

  const startNow = keys['Enter'] || false;
  state.start = startNow && !prevStart;
  state.startHeld = startNow;
  prevStart = startNow;
}

export function pollInput() {
  const gamepads = navigator.getGamepads();
  const gp = gamepads[0];

  if (!gp) {
    pollKeyboard();
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
