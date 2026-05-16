// src/game/input.js
// SACRED — do not modify unless explicitly told "modify controls"

const state = {
  stickX: 0,
  stickY: 0,
  fire: false,
  start: false,
  bomb: false,
  cartwheel: false,
  fireHeld: false,
  startHeld: false,
};

let prevFire = false;
let prevStart = false;
let prevBomb = false;
let prevCartwheel = false;

const DEADZONE = 0.2;

// Keyboard fallback — only when no gamepad connected
const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

export function pollInput() {
  const gamepads = navigator.getGamepads();
  const gp = Array.from(gamepads).find(g => g && g.connected);

  // Keyboard
  const kbX = (keys['d'] || keys['ArrowRight'] ? 1 : 0) - (keys['a'] || keys['ArrowLeft'] ? 1 : 0);
  const kbY = (keys['s'] || keys['ArrowDown'] ? 1 : 0) - (keys['w'] || keys['ArrowUp'] ? 1 : 0);
  const kbFire      = keys[' '] || false;
  const kbStart     = keys['Enter'] || false;
  const kbBomb      = keys['b'] || keys['B'] || false;
  const kbCartwheel = keys['x'] || keys['X'] || false;

  // Gamepad
  let gpX = 0, gpY = 0, gpFire = false, gpStart = false, gpBomb = false, gpCartwheel = false;
  if (gp) {
    const rawX = gp.axes[0];
    const rawY = gp.axes[1];
    const dpadX = (gp.buttons[15]?.pressed ? 1 : 0) - (gp.buttons[14]?.pressed ? 1 : 0);
    const dpadY = (gp.buttons[13]?.pressed ? 1 : 0) - (gp.buttons[12]?.pressed ? 1 : 0);
    gpX = dpadX !== 0 ? dpadX : (Math.abs(rawX) > DEADZONE ? rawX : 0);
    gpY = dpadY !== 0 ? dpadY : (Math.abs(rawY) > DEADZONE ? rawY : 0);
    gpFire      = gp.buttons[0]?.pressed ?? false; // A
    gpStart     = gp.buttons[9]?.pressed ?? false;
    gpBomb      = gp.buttons[1]?.pressed ?? false; // B
    gpCartwheel = gp.buttons[2]?.pressed ?? false; // X
  }

  // Gamepad takes priority for stick; either source works for buttons
  state.stickX = gpX !== 0 ? gpX : kbX;
  state.stickY = gpY !== 0 ? gpY : kbY;

  const fireNow = gpFire || kbFire;
  state.fire = fireNow && !prevFire;
  state.fireHeld = fireNow;
  prevFire = fireNow;

  const startNow = gpStart || kbStart;
  state.start = startNow && !prevStart;
  state.startHeld = startNow;
  prevStart = startNow;

  const bombNow = gpBomb || kbBomb;
  state.bomb = bombNow && !prevBomb;
  prevBomb = bombNow;

  const cartwheelNow = gpCartwheel || kbCartwheel;
  state.cartwheel = cartwheelNow && !prevCartwheel;
  prevCartwheel = cartwheelNow;

  return state;
}

export function getInput() {
  return state;
}
