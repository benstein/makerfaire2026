// src/game/nuke.js
// One-per-game nuke: press B to wipe the entire screen.

const BLAST_DURATION = 1600; // ms

let nukeUsed    = false;
let blastActive = false;
let blastStart  = 0;

export function resetNuke() {
  nukeUsed    = false;
  blastActive = false;
  blastStart  = 0;
}

export function canNuke()     { return !nukeUsed; }
export function isBlasting()  { return blastActive; }

// Call when player presses B. Returns true if the nuke fired.
export function triggerNuke(now) {
  if (nukeUsed) return false;
  nukeUsed    = true;
  blastActive = true;
  blastStart  = now;
  return true;
}

export function updateNuke(now) {
  if (blastActive && now - blastStart > BLAST_DURATION) {
    blastActive = false;
  }
}

export function drawNuke(ctx, width, height, now) {
  if (!blastActive) return;
  const t = Math.min(1, (now - blastStart) / BLAST_DURATION);

  // Phase 1 (0–0.3): white flash
  if (t < 0.3) {
    const alpha = 1 - t / 0.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(0, 0, width, height);
  }

  // Phase 2 (0.1–0.7): expanding orange shockwave rings
  const cx = width / 2, cy = height / 2;
  const maxR = Math.sqrt(cx * cx + cy * cy) * 1.2;
  for (let ring = 0; ring < 3; ring++) {
    const offset = ring / 3;
    const rt = Math.max(0, (t - offset * 0.1));
    const r  = maxR * Math.pow(rt, 0.5);
    const alpha = Math.max(0, 1 - rt * 1.4);
    ctx.strokeStyle = `rgba(255, ${Math.round(160 - ring * 40)}, 0, ${alpha})`;
    ctx.lineWidth = 18 - ring * 4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Phase 3 (0.05–0.55): "NUKE!" text slams in
  if (t < 0.55) {
    const textAlpha = t < 0.4 ? 1 : 1 - (t - 0.4) / 0.15;
    const scale = Math.min(1, t / 0.1);
    ctx.save();
    ctx.globalAlpha = Math.max(0, textAlpha);
    ctx.font = `bold ${Math.round(96 * scale)}px monospace`;
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#7b0000';
    ctx.lineWidth = 8;
    ctx.strokeText('NUKE!', cx, cy + 16);
    ctx.fillStyle = '#ff4400';
    ctx.fillText('NUKE!', cx, cy + 16);
    ctx.restore();
  }
}

// HUD indicator — show whether nuke is available
export function drawNukeHUD(ctx, canvasWidth, canvasHeight) {
  const label = nukeUsed ? 'NUKE: USED' : 'NUKE: B';
  const x = canvasWidth / 2;
  const y = canvasHeight - 18;
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 4;
  ctx.lineJoin = 'round';
  ctx.strokeText(label, x, y);
  ctx.fillStyle = nukeUsed ? '#555' : '#ff4400';
  ctx.fillText(label, x, y);
  ctx.textAlign = 'left';
}
