// src/game/ad.js
// Every 15 seconds a Safeway advertisement interrupts the game for 3 seconds.

const AD_INTERVAL = 15000; // ms between ads
const AD_DURATION =  3000; // ms the ad stays visible

let nextAd   = 0;
let adStart  = -1;   // -1 = not showing

export function resetAd(now) {
  nextAd  = now + AD_INTERVAL;
  adStart = -1;
}

export function updateAd(now) {
  if (adStart === -1 && now >= nextAd) {
    adStart = now;
  }
  if (adStart !== -1 && now - adStart >= AD_DURATION) {
    adStart = -1;
    nextAd  = now + AD_INTERVAL;
  }
}

export function isAdShowing() { return adStart !== -1; }

export function drawAd(ctx, width, height, now) {
  if (adStart === -1) return;

  const elapsed  = now - adStart;
  const fadeIn   = Math.min(1, elapsed / 120);
  const fadeOut  = elapsed > AD_DURATION - 200 ? Math.max(0, (AD_DURATION - elapsed) / 200) : 1;
  const alpha    = fadeIn * fadeOut;

  ctx.save();
  ctx.globalAlpha = alpha;

  // ── Dark backdrop ──────────────────────────────────────────
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, width, height);

  // ── Ad panel ──────────────────────────────────────────────
  const pw = Math.min(620, width  * 0.82);
  const ph = Math.min(400, height * 0.72);
  const px = (width  - pw) / 2;
  const py = (height - ph) / 2;

  // Drop shadow
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur  = 24;
  ctx.fillStyle   = '#ffffff';
  ctx.fillRect(px, py, pw, ph);
  ctx.shadowBlur  = 0;

  // ── Red header strip ──────────────────────────────────────
  const headerH = ph * 0.28;
  ctx.fillStyle = '#e31837';  // Safeway red
  ctx.fillRect(px, py, pw, headerH);

  // "S" logo circle (left side of header)
  const logoCx = px + headerH * 0.55;
  const logoCy = py + headerH / 2;
  const logoR  = headerH * 0.38;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(logoCx, logoCy, logoR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e31837';
  ctx.font = `bold ${logoR * 1.35}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', logoCx, logoCy + 1);
  ctx.textBaseline = 'alphabetic';

  // "SAFEWAY" wordmark
  ctx.fillStyle = '#ffffff';
  ctx.font      = `bold ${headerH * 0.46}px Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('SAFEWAY', px + headerH * 1.12, py + headerH * 0.63);

  // Tagline in header
  ctx.font      = `${headerH * 0.18}px Arial, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fillText('OPEN DAILY 6AM–11PM  •  FRESH. LOCAL. SAVINGS.', px + headerH * 1.12, py + headerH * 0.84);

  // ── Deals grid ────────────────────────────────────────────
  const deals = [
    { name: 'Organic Bananas',  unit: '3 lb bag',      price: '$1.29' },
    { name: 'Sourdough Bread',  unit: '24 oz loaf',     price: '2 for $5' },
    { name: 'Whole Milk',       unit: '1 gallon',       price: '$2.99' },
    { name: 'Store Brand Chips',unit: 'BOGO FREE',      price: '$4.49 ea' },
  ];

  const dealY  = py + headerH + 12;
  const dealH  = (ph - headerH - 48) / 2;
  const dealW  = pw / 2 - 16;

  deals.forEach((deal, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const dx  = px + 12 + col * (dealW + 8);
    const dy  = dealY + row * (dealH + 8);

    // Card background
    ctx.fillStyle = row === 0 && col === 0 ? '#fff8e1' : '#f5f9ff';
    ctx.beginPath(); ctx.roundRect(dx, dy, dealW, dealH, 6); ctx.fill();
    ctx.strokeStyle = '#dde3ea'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(dx, dy, dealW, dealH, 6); ctx.stroke();

    // Product name
    ctx.fillStyle = '#222';
    ctx.font      = `bold ${dealH * 0.24}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillText(deal.name, dx + 12, dy + dealH * 0.34);

    // Unit
    ctx.fillStyle = '#666';
    ctx.font      = `${dealH * 0.18}px Arial, sans-serif`;
    ctx.fillText(deal.unit, dx + 12, dy + dealH * 0.56);

    // Price — big red
    ctx.fillStyle = '#e31837';
    ctx.font      = `bold ${dealH * 0.36}px Arial, sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(deal.price, dx + dealW - 12, dy + dealH * 0.78);

    // "SALE" starburst on first item
    if (i === 0) {
      const sx = dx + dealW - 22, sy = dy + 22, sr = 18;
      ctx.fillStyle = '#e31837';
      ctx.beginPath();
      for (let p = 0; p < 8; p++) {
        const a = (p / 8) * Math.PI * 2 - Math.PI / 2;
        const r2 = p % 2 === 0 ? sr : sr * 0.62;
        p === 0 ? ctx.moveTo(sx + Math.cos(a) * r2, sy + Math.sin(a) * r2)
                : ctx.lineTo(sx + Math.cos(a) * r2, sy + Math.sin(a) * r2);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold ${sr * 0.55}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('SALE', sx, sy + sr * 0.2);
    }
  });

  // ── Footer strip ──────────────────────────────────────────
  ctx.fillStyle = '#e31837';
  ctx.fillRect(px, py + ph - 28, pw, 28);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font      = `${10}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(
    'Prices valid through end of game. While supplies last. We reserve the right to limit quantities.',
    px + pw / 2, py + ph - 10
  );

  // ── "SKIP AD" label (non-functional, for comedy) ──────────
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font      = 'bold 13px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('SKIP AD (unavailable)', px + pw - 12, py + ph + 20);

  ctx.textAlign   = 'left';
  ctx.globalAlpha = 1;
  ctx.restore();
}
