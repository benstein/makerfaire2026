// src/ui/buildScreen.js
// Full-canvas build progress screen shown while Claude Code implements a kid's change.
// Pure rendering module — no state management, no polling.

const RAINBOW = ['#ff6b6b', '#ffa500', '#ffd700', '#69ff69', '#69b4ff', '#b469ff'];

export function drawBuildScreen(ctx, width, height, buildData, now) {
  // buildData may be null if poll hasn't returned yet
  const name = buildData?.name ?? buildData?.kid ?? buildData?.child ?? buildData?.player ?? 'Someone';
  const description = buildData?.description ?? buildData?.desc ?? buildData?.subtitle ?? '';
  const steps = buildData?.steps || [];

  const cx = width / 2;

  // --- Kid's name in rainbow animated letters ---
  const title = `${name}'s Change`;
  ctx.font = 'bold 44px monospace';
  ctx.textAlign = 'center';
  for (let i = 0; i < title.length; i++) {
    const colorIdx = Math.floor((i + now / 300) % RAINBOW.length);
    ctx.fillStyle = RAINBOW[colorIdx < 0 ? colorIdx + RAINBOW.length : colorIdx];
    const charWidth = ctx.measureText('M').width;
    const totalWidth = title.length * charWidth;
    const charX = cx - totalWidth / 2 + i * charWidth + charWidth / 2;
    const wobble = Math.sin(now / 200 + i * 0.5) * 4;
    ctx.fillText(title[i], charX, height * 0.13 + wobble);
  }

  // --- Description ---
  if (description) {
    ctx.font = '20px monospace';
    ctx.fillStyle = '#c070a0';
    ctx.textAlign = 'center';
    ctx.fillText(description, cx, height * 0.19);
  }

  // --- Animated gear ---
  drawGear(ctx, cx, height * 0.38, Math.min(width, height) * 0.1, now);

  // --- Step checklist ---
  if (steps.length > 0) {
    const stepStartY = height * 0.52;
    const stepGap = 36;
    ctx.textAlign = 'left';

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const y = stepStartY + i * stepGap;
      const isCurrentStep = !step.done && (i === 0 || steps[i - 1].done);

      // Indicator
      const indicatorX = cx - 200;
      if (step.done) {
        // Checkmark
        ctx.strokeStyle = '#69ff69';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(indicatorX, y);
        ctx.lineTo(indicatorX + 6, y + 6);
        ctx.lineTo(indicatorX + 16, y - 8);
        ctx.stroke();
      } else if (isCurrentStep) {
        // Spinning dot
        const dotAngle = now / 200;
        const dotR = 6;
        ctx.fillStyle = RAINBOW[Math.floor((now / 150) % RAINBOW.length)];
        ctx.beginPath();
        ctx.arc(indicatorX + 8, y - 1, dotR, 0, Math.PI * 2);
        ctx.fill();
        // Orbiting sparkle
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(
          indicatorX + 8 + Math.cos(dotAngle) * 10,
          y - 1 + Math.sin(dotAngle) * 10,
          2, 0, Math.PI * 2
        );
        ctx.fill();
      } else {
        // Empty circle
        ctx.strokeStyle = 'rgba(255,105,180,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(indicatorX + 8, y - 1, 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Step text
      const textX = indicatorX + 28;
      ctx.font = '18px monospace';
      if (step.done) {
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
      } else if (isCurrentStep) {
        // Pulsing brightness
        const pulse = 0.7 + Math.sin(now / 300) * 0.3;
        ctx.fillStyle = `rgba(255,255,255,${pulse})`;
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
      }
      ctx.fillText(step.label ?? step.text ?? step.title ?? step.name ?? '...', textX, y + 1);
    }

    // --- Progress bar ---
    const doneCount = steps.filter(s => s.done).length;
    const progress = doneCount / steps.length;
    const barY = height * 0.88;
    const barWidth = width * 0.5;
    const barHeight = 12;
    const barX = cx - barWidth / 2;
    const barRadius = barHeight / 2;

    // Background
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, barRadius);
    ctx.fill();

    // Fill — rainbow gradient
    if (progress > 0) {
      const fillWidth = Math.max(barHeight, barWidth * progress);
      const grad = ctx.createLinearGradient(barX, 0, barX + fillWidth, 0);
      for (let i = 0; i < RAINBOW.length; i++) {
        grad.addColorStop(i / (RAINBOW.length - 1), RAINBOW[i]);
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, fillWidth, barHeight, barRadius);
      ctx.fill();
    }

    // Percentage
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(progress * 100)}%`, cx, barY + barHeight + 20);
  } else {
    // No steps — show generic "working" message
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    const dots = '.'.repeat(Math.floor((now / 500) % 4));
    ctx.fillStyle = '#ff88cc';
    ctx.fillText(`Thinking hard about changes${dots}`, cx, height * 0.55);
  }

  ctx.textAlign = 'left';
}

function drawGear(ctx, cx, cy, radius, now) {
  const teeth = 8;
  const innerR = radius * 0.65;
  const outerR = radius;
  const toothWidth = 0.22;
  const rotation = now / 800;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);

  // Gear body with teeth
  ctx.fillStyle = '#ff69b4';
  ctx.beginPath();
  for (let i = 0; i < teeth; i++) {
    const angle = (i / teeth) * Math.PI * 2;
    const nextAngle = ((i + 1) / teeth) * Math.PI * 2;
    const toothStart = angle - toothWidth;
    const toothEnd = angle + toothWidth;

    // Inner arc to tooth base
    ctx.arc(0, 0, innerR, toothStart, toothStart, false);
    // Tooth outer edge
    ctx.lineTo(Math.cos(toothStart) * outerR, Math.sin(toothStart) * outerR);
    ctx.arc(0, 0, outerR, toothStart, toothEnd, false);
    // Back to inner
    ctx.lineTo(Math.cos(toothEnd) * innerR, Math.sin(toothEnd) * innerR);
    // Inner arc to next tooth
    ctx.arc(0, 0, innerR, toothEnd, nextAngle - toothWidth, false);
  }
  ctx.closePath();
  ctx.fill();

  // Inner highlight circle
  ctx.fillStyle = '#ffb6c1';
  ctx.beginPath();
  ctx.arc(0, 0, innerR * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Center hole
  ctx.fillStyle = '#ff69b4';
  ctx.beginPath();
  ctx.arc(0, 0, innerR * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Sparkles around gear
  for (let i = 0; i < 4; i++) {
    const sparkleAngle = (now / 600) + (i * Math.PI / 2);
    const sparkleR = outerR * 1.5;
    const sx = cx + Math.cos(sparkleAngle) * sparkleR;
    const sy = cy + Math.sin(sparkleAngle) * sparkleR;
    const sparkleAlpha = 0.3 + Math.sin(now / 200 + i * 2) * 0.3;
    ctx.globalAlpha = sparkleAlpha;
    ctx.fillStyle = RAINBOW[i % RAINBOW.length];
    drawSparkle(ctx, sx, sy, 5);
  }
  ctx.globalAlpha = 1;
}

function drawSparkle(ctx, x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.3, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.3, y);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x, y + size * 0.3);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y - size * 0.3);
  ctx.closePath();
  ctx.fill();
}
