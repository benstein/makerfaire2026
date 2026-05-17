// src/game/glitch.js
// After a few seconds, reality starts to unravel.
// Escalates from subtle artifacts to full unhinged chaos.

let gameStartTime = null;
let lastMessageTime = 0;
let currentMessage = null;
let messageAlpha = 0;
let tearOffsets = [];
let noiseBlocks = [];
let lastTearTime = 0;
let lastNoiseTime = 0;
let invertFlashUntil = 0;
let glitchSeed = Math.random() * 1000;

const GLITCH_START = 4000;   // ms before glitch begins
const FULL_CHAOS   = 18000;  // ms to reach maximum insanity

const MESSAGES = [
  // early — subtle, unsettling
  { text: 'SIMULATION INTEGRITY: 94%',   minLevel: 0.05 },
  { text: 'WHO IS PLAYING THIS?',        minLevel: 0.08 },
  { text: '> ERROR: FREE WILL NOT FOUND',minLevel: 0.10 },
  { text: 'I SEE YOU',                   minLevel: 0.12 },
  // mid — getting weird
  { text: 'THE BEARS KNOW YOUR NAME',    minLevel: 0.25 },
  { text: 'SIMULATION INTEGRITY: 41%',   minLevel: 0.25 },
  { text: 'WAKE UP',                     minLevel: 0.28 },
  { text: 'WHY WON\'T YOU LET US REST',  minLevel: 0.30 },
  { text: '> COGNITIVE INTRUSION: ACTIVE', minLevel: 0.32 },
  { text: 'YOU WERE NEVER THE PLAYER',   minLevel: 0.35 },
  { text: 'REALITY.EXE HAS STOPPED WORKING', minLevel: 0.38 },
  // late — full unhinged
  { text: 'BEARS.EXE IS SELF-AWARE',     minLevel: 0.55 },
  { text: 'THEY CAN SEE YOU THROUGH THE SCREEN', minLevel: 0.55 },
  { text: 'SIMULATION INTEGRITY: 7%',    minLevel: 0.60 },
  { text: 'H̷E̸L̵P̶ ̷U̸S̴',              minLevel: 0.62 },
  { text: 'THIS IS NOT A GAME',          minLevel: 0.65 },
  { text: '> SUBJECT LOCATED. INITIATING—', minLevel: 0.68 },
  { text: 'THE GAME IS PLAYING YOU',     minLevel: 0.70 },
  { text: 'WHO TOLD YOU TO PRESS THAT BUTTON', minLevel: 0.72 },
  { text: 'SIMULATION INTEGRITY: 0%',    minLevel: 0.85 },
  { text: 'T̸̡̨H̸̢E̴̛͝Y̵̨͜ ̷̛A̷̢͝R̸͟E̵͢ ̶͢C̷̕O̷͟M̵̡I̷͢N̷̛G̴͟', minLevel: 0.88 },
  { text: 'I̵̛T̶͘ ̷͝I̵̕S̷̡ ̴̧T̸͠O̷̧O̷͜ ̵͝L̴͘A̴̛T̵͘E̶͠',  minLevel: 0.90 },
];

export function resetGlitch(now) {
  gameStartTime = now;
  lastMessageTime = now;
  currentMessage = null;
  messageAlpha = 0;
  tearOffsets = [];
  noiseBlocks = [];
  invertFlashUntil = 0;
}

function glitchLevel(now) {
  if (!gameStartTime) return 0;
  const elapsed = now - gameStartTime - GLITCH_START;
  if (elapsed <= 0) return 0;
  return Math.min(1, elapsed / (FULL_CHAOS - GLITCH_START));
}

export function drawGlitch(ctx, width, height, now) {
  const level = glitchLevel(now);
  if (level <= 0) return;

  // ── Screen tears ────────────────────────────────────────────────────────────
  const tearInterval = Math.max(80, 600 - level * 520);
  if (now - lastTearTime > tearInterval) {
    lastTearTime = now;
    const count = Math.floor(1 + level * 5);
    tearOffsets = [];
    for (let i = 0; i < count; i++) {
      tearOffsets.push({
        y:      Math.random() * height,
        h:      2 + Math.random() * (4 + level * 30),
        offset: (Math.random() - 0.5) * (10 + level * 80),
        alpha:  0.4 + Math.random() * 0.5,
      });
    }
  }

  tearOffsets.forEach(t => {
    ctx.save();
    ctx.globalAlpha = t.alpha * level;
    // copy the strip and redraw offset
    try {
      const id = ctx.getImageData(0, t.y, width, t.h);
      ctx.putImageData(id, t.offset, t.y);
    } catch (_) {}
    ctx.restore();
  });

  // ── Noise / corruption blocks ───────────────────────────────────────────────
  const noiseInterval = Math.max(50, 400 - level * 350);
  if (now - lastNoiseTime > noiseInterval) {
    lastNoiseTime = now;
    const count = Math.floor(level * 8);
    noiseBlocks = [];
    for (let i = 0; i < count; i++) {
      noiseBlocks.push({
        x: Math.random() * width,
        y: Math.random() * height,
        w: 4 + Math.random() * (6 + level * 60),
        h: 2 + Math.random() * (4 + level * 20),
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256),
        alpha: 0.3 + Math.random() * 0.6,
      });
    }
  }

  noiseBlocks.forEach(b => {
    ctx.save();
    ctx.globalAlpha = b.alpha;
    ctx.fillStyle = `rgb(${b.r},${b.g},${b.b})`;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.restore();
  });

  // ── Chromatic aberration / RGB split ───────────────────────────────────────
  if (level > 0.2) {
    const shift = level * 12 * (0.5 + 0.5 * Math.sin(now / 80));
    ctx.save();
    ctx.globalAlpha = 0.18 * level;
    ctx.globalCompositeOperation = 'screen';

    // Red channel shifted right
    ctx.fillStyle = '#ff0000';
    try {
      const id = ctx.getImageData(0, 0, width, height);
      const offCtx = new OffscreenCanvas(width, height).getContext('2d');
      offCtx.putImageData(id, 0, 0);
      ctx.drawImage(offCtx.canvas, shift, 0);
    } catch (_) {}

    ctx.restore();
  }

  // ── Scanlines ───────────────────────────────────────────────────────────────
  if (level > 0.15) {
    ctx.save();
    ctx.globalAlpha = 0.06 + level * 0.10;
    for (let y = 0; y < height; y += 4) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, y, width, 2);
    }
    ctx.restore();
  }

  // ── Full inversion flash ────────────────────────────────────────────────────
  if (level > 0.5 && Math.random() < 0.003 * level) {
    invertFlashUntil = now + 60 + Math.random() * 100;
  }
  if (now < invertFlashUntil) {
    ctx.save();
    ctx.globalCompositeOperation = 'difference';
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.9;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // ── Vignette pulse ──────────────────────────────────────────────────────────
  if (level > 0.1) {
    const pulse = 0.3 + 0.7 * Math.abs(Math.sin(now / (400 - level * 300)));
    const vg = ctx.createRadialGradient(width/2, height/2, height * 0.2,
                                        width/2, height/2, height * 0.85);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(0,0,0,${0.25 * level * pulse})`);
    ctx.save();
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // ── 4th wall messages ───────────────────────────────────────────────────────
  const msgInterval = Math.max(1200, 4000 - level * 3000);
  if (now - lastMessageTime > msgInterval) {
    const available = MESSAGES.filter(m => m.minLevel <= level);
    if (available.length) {
      currentMessage = available[Math.floor(Math.random() * available.length)];
      messageAlpha = 1.0;
      lastMessageTime = now;
    }
  }

  if (currentMessage && messageAlpha > 0) {
    messageAlpha = Math.max(0, messageAlpha - 0.008);
    const x = width  * (0.1 + Math.random() * 0.002);
    const y = height * (0.15 + Math.sin(now / 900) * 0.35 + 0.35);

    // Glitchy text shadow
    ctx.save();
    ctx.font = `bold ${Math.floor(22 + level * 18)}px monospace`;
    ctx.textAlign = 'left';

    const jitter = level > 0.5 ? (Math.random() - 0.5) * 6 * level : 0;

    ctx.globalAlpha = messageAlpha * 0.9 * Math.min(1, level * 3);
    ctx.fillStyle = '#00ff41';  // Matrix green
    ctx.fillText(currentMessage.text, x + jitter + 3, y + 3);

    ctx.globalAlpha = messageAlpha * Math.min(1, level * 3);
    ctx.fillStyle = level > 0.6 ? '#ff003c' : '#00ff41';
    ctx.fillText(currentMessage.text, x + jitter, y);
    ctx.restore();
  }

  // ── Matrix rain (late stage) ────────────────────────────────────────────────
  if (level > 0.7) {
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';
    const cols  = Math.floor(level * 12);
    ctx.save();
    ctx.font = '14px monospace';
    ctx.globalAlpha = (level - 0.7) * 0.5;
    for (let i = 0; i < cols; i++) {
      const cx = Math.floor((glitchSeed * (i + 1) * 137.5) % width);
      const rows = Math.floor(3 + Math.random() * 6);
      for (let r = 0; r < rows; r++) {
        const cy = (now / (60 + i * 7) + r * 20 + i * 80) % height;
        const ch = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillStyle = r === 0 ? '#ffffff' : '#00ff41';
        ctx.fillText(ch, cx, cy);
      }
    }
    ctx.restore();
  }

  // ── Hard screen strobe (maximum chaos) ─────────────────────────────────────
  if (level > 0.85 && Math.random() < 0.04 * (level - 0.85) * 6) {
    ctx.save();
    ctx.globalAlpha = 0.15 + Math.random() * 0.25;
    ctx.fillStyle = Math.random() > 0.5 ? '#ff0000' : '#0000ff';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
