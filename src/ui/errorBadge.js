// src/ui/errorBadge.js
// Friendly "glitchy" warning badge — drawn on top of everything when the
// game has caught any errors. Helps operators spot busted kid builds fast.

export function drawErrorBadge(ctx, errorCount, lastError, now) {
  if (errorCount === 0) return;

  const x = 10;
  const y = 10;
  const w = 320;
  const h = 50;

  const pulse = 0.75 + Math.sin(now / 400) * 0.15;
  ctx.fillStyle = `rgba(200, 40, 0, ${pulse})`;
  ctx.strokeStyle = '#ffaa44';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();

  // Warning triangle (drawn as a path, not an emoji)
  const tx = x + 22;
  const ty = y + 27;
  const tr = 12;
  ctx.fillStyle = '#ffd700';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tx, ty - tr);
  ctx.lineTo(tx + tr, ty + tr * 0.85);
  ctx.lineTo(tx - tr, ty + tr * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Exclamation mark inside the triangle
  ctx.fillStyle = '#000';
  ctx.fillRect(tx - 1.5, ty - 7, 3, 9);
  ctx.beginPath();
  ctx.arc(tx, ty + 6, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Headline
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'left';
  const label = `glitchy (${errorCount} error${errorCount === 1 ? '' : 's'})`;
  ctx.fillText(label, x + 44, y + 22);

  // Truncated error message
  if (lastError) {
    ctx.font = '11px monospace';
    const msg = String(lastError);
    const truncated = msg.length > 42 ? msg.slice(0, 42) + '...' : msg;
    ctx.fillText(truncated, x + 44, y + 38);
  }

  ctx.textAlign = 'left';
}
