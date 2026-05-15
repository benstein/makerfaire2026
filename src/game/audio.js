// src/game/audio.js
// Web Audio API — Tetris A-Type theme (Korobeiniki) + arcade sound effects.
// AudioContext is created on first call (after user gesture) to satisfy browser policy.

let actx = null;
let musicGain = null;
let sfxGain = null;
let musicRunning = false;
let noteIndex = 0;
let nextNoteAt = 0;
let schedTimer = null;

// ── Tetris A-Type (Korobeiniki) melody ─────────────────────────────────────
const BPM  = 158;
const BEAT = 60 / BPM; // seconds per quarter note

const F = {
  E4:330, F4:349, G4:392, A4:440, B4:494,
  C5:523, D5:587, E5:659, F5:698, G5:784, A5:880, C6:1047,
};

// [note, quarter-note-beats]
const MELODY = [
  // Part A
  [F.E5,1],[F.B4,.5],[F.C5,.5],[F.D5,1],[F.C5,.5],[F.B4,.5],
  [F.A4,1],[F.A4,.5],[F.C5,.5],[F.E5,1],[F.D5,.5],[F.C5,.5],
  [F.B4,1.5],[F.C5,.5],[F.D5,1],[F.E5,1],
  [F.C5,1],[F.A4,1],[F.A4,2],
  // Part B
  [F.D5,1.5],[F.F5,.5],[F.A5,1],[F.G5,.5],[F.F5,.5],
  [F.E5,1.5],[F.C5,.5],[F.E5,1],[F.D5,.5],[F.C5,.5],
  [F.B4,1.5],[F.C5,.5],[F.D5,1],[F.E5,1],
  [F.C5,1],[F.A4,1],[F.A4,2],
];

// ── Context creation ────────────────────────────────────────────────────────
function ctx() {
  if (!actx) {
    actx = new (window.AudioContext || window.webkitAudioContext)();
    musicGain = actx.createGain();
    musicGain.gain.value = 0.10;
    musicGain.connect(actx.destination);
    sfxGain = actx.createGain();
    sfxGain.gain.value = 0.55;
    sfxGain.connect(actx.destination);
  }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}

// ── Music ───────────────────────────────────────────────────────────────────
function scheduleNote(freq, start, dur) {
  const osc  = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = 'square';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.9,   start);
  gain.gain.setValueAtTime(0.65,  start + dur * 0.65);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur * 0.95);
  osc.connect(gain);
  gain.connect(musicGain);
  osc.start(start);
  osc.stop(start + dur);
}

function scheduleBatch() {
  if (!musicRunning) return;
  const c = ctx();
  const horizon = c.currentTime + 0.35;
  while (nextNoteAt < horizon) {
    const [freq, beats] = MELODY[noteIndex % MELODY.length];
    const dur = beats * BEAT;
    scheduleNote(freq, nextNoteAt, dur);
    nextNoteAt += dur;
    noteIndex++;
  }
  schedTimer = setTimeout(scheduleBatch, 120);
}

export function startMusic() {
  const c = ctx();
  if (musicRunning) return;
  musicRunning = true;
  noteIndex  = 0;
  nextNoteAt = c.currentTime + 0.05;
  scheduleBatch();
}

export function stopMusic() {
  musicRunning = false;
  clearTimeout(schedTimer);
}

// ── Sound effects ───────────────────────────────────────────────────────────
// Ring of fire fired — low whoosh sweeping up
export function sfxFire() {
  const c = ctx();
  const now = c.currentTime;
  const osc  = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, now);
  osc.frequency.exponentialRampToValueAtTime(520, now + 0.14);
  osc.frequency.exponentialRampToValueAtTime(260, now + 0.38);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.9, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.40);
  osc.connect(gain); gain.connect(sfxGain);
  osc.start(now); osc.stop(now + 0.40);
}

// Enemy destroyed — noise burst + punchy low thud
export function sfxExplosion() {
  const c = ctx();
  const now = c.currentTime;

  // White-noise burst
  const bufLen = Math.floor(c.sampleRate * 0.35);
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
  const noise = c.createBufferSource();
  noise.buffer = buf;
  const nFilt = c.createBiquadFilter();
  nFilt.type = 'bandpass';
  nFilt.frequency.setValueAtTime(700, now);
  nFilt.frequency.exponentialRampToValueAtTime(80, now + 0.3);
  nFilt.Q.value = 0.7;
  const nGain = c.createGain();
  nGain.gain.setValueAtTime(1.1, now);
  nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  noise.connect(nFilt); nFilt.connect(nGain); nGain.connect(sfxGain);
  noise.start(now); noise.stop(now + 0.35);

  // Low boom
  const osc  = c.createOscillator();
  const oGain = c.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(180, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.22);
  oGain.gain.setValueAtTime(0.7, now);
  oGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  osc.connect(oGain); oGain.connect(sfxGain);
  osc.start(now); osc.stop(now + 0.25);
}

// Player hit — classic 8-bit descending chirps
export function sfxHurt() {
  const c = ctx();
  const now = c.currentTime;
  [[440, 0], [330, 0.08], [220, 0.16]].forEach(([freq, t]) => {
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.7, now + t);
    gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.07);
    osc.connect(gain); gain.connect(sfxGain);
    osc.start(now + t); osc.stop(now + t + 0.08);
  });
}

// Lightning zap — sharp crack + crackling tail
export function sfxLightning() {
  const c = ctx();
  const now = c.currentTime;
  const bufLen = Math.floor(c.sampleRate * 0.45);
  const buf = c.createBuffer(1, bufLen, c.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 1.8);
  }
  const src  = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = 'highpass';
  filt.frequency.value = 1200;
  const gain = c.createGain();
  gain.gain.setValueAtTime(2.0, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
  src.connect(filt); filt.connect(gain); gain.connect(sfxGain);
  src.start(now); src.stop(now + 0.45);
}

// Game over — classic descending death jingle
export function sfxGameOver() {
  const c = ctx();
  const now = c.currentTime;
  stopMusic();
  [
    [F.E5,0],[F.D5,.18],[F.C5,.36],[F.B4,.54],
    [F.A4,.72],[F.G4,.95],[F.E4,1.20],
  ].forEach(([freq, t]) => {
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.65, now + t);
    gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.16);
    osc.connect(gain); gain.connect(sfxGain);
    osc.start(now + t); osc.stop(now + t + 0.18);
  });
}

// Victory — ascending fanfare
export function sfxVictory() {
  const c = ctx();
  const now = c.currentTime;
  stopMusic();
  [
    [F.C5,0,.12],[F.E5,.13,.12],[F.G5,.26,.12],
    [F.C6,.40,.30],[F.G5,.72,.12],[F.C6,.85,.50],
  ].forEach(([freq, t, dur]) => {
    const osc  = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.7, now + t);
    gain.gain.exponentialRampToValueAtTime(0.001, now + t + dur);
    osc.connect(gain); gain.connect(sfxGain);
    osc.start(now + t); osc.stop(now + t + dur + 0.01);
  });
}
