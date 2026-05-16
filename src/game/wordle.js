// src/game/wordle.js
// Wordle rendered in the center of the arena while the game is playing.
// Letter keys type (yes, WASD too — chaos is the point).
// Tab submits a guess (Enter is reserved for game restart).
// Resets automatically 3 seconds after win or loss.

const WORDS = [
  'BEARS', 'CHASE', 'DODGE', 'POWER', 'FIGHT', 'BLAST', 'BRAVE', 'QUICK',
  'SCORE', 'LASER', 'MAGIC', 'FLAME', 'STORM', 'SPEED', 'FORCE', 'DREAM',
  'GIANT', 'PIXEL', 'BONUS', 'SUPER', 'LIGHT', 'NIGHT', 'SPACE', 'HEART',
  'PLANT', 'STONE', 'BLACK', 'CLEAN', 'CLOCK', 'CLOUD', 'FLOOR', 'FRESH',
  'FRONT', 'GHOST', 'GLASS', 'GLOBE', 'GRACE', 'GRAIN', 'GRASS', 'GREAT',
  'GREEN', 'GROAN', 'GROUP', 'GROWL', 'GROWN', 'GUESS', 'GUIDE', 'HAPPY',
  'HEAVY', 'HONEY', 'HORSE', 'HOUSE', 'HUMAN', 'MAPLE', 'MARCH', 'METAL',
  'MIGHT', 'MODEL', 'MONEY', 'MONTH', 'MOUSE', 'MOUTH', 'MUSIC', 'OCEAN',
  'PAPER', 'PARTY', 'PEACE', 'PLACE', 'PLAIN', 'PLANE', 'PLANK', 'PLATE',
  'RADAR', 'RAISE', 'RANCH', 'RANGE', 'RAPID', 'READY', 'REALM', 'REBEL',
  'RIDER', 'RISKY', 'RIVER', 'ROBOT', 'ROCKY', 'ROUND', 'ROYAL', 'RULER',
  'RUSTY', 'SAINT', 'SANDY', 'SAUCE', 'SCALE', 'SCARY', 'SEVEN', 'SHADE',
  'SHAKE', 'SHALL', 'SHAME', 'SHAPE', 'SHARE', 'SHARK', 'SHARP', 'SHAVE',
  'SHEEP', 'SHEER', 'SHELF', 'SHELL', 'SHIFT', 'SHINE', 'SHINY', 'SHIRT',
  'SHOCK', 'SHORE', 'SHORT', 'SHOUT', 'SHOWN', 'SIGHT', 'SILLY', 'SINCE',
  'SIXTH', 'SIXTY', 'SIZED', 'SKILL', 'SKULL', 'SLAIN', 'SLANT', 'SLASH',
  'SLAVE', 'SLEEK', 'SLEET', 'SLEPT', 'SLICE', 'SLIDE', 'SLIME', 'SLING',
  'SLOPE', 'SLOTH', 'SLUMP', 'SMART', 'SMASH', 'SMELL', 'SMILE', 'SMOKE',
  'SNACK', 'SNAIL', 'SNAKE', 'SNARE', 'SNEAK', 'SNORE', 'SOLAR', 'SOLID',
  'SOLVE', 'SOUTH', 'SPADE', 'SPARK', 'SPEAK', 'SPEAR', 'SPELL', 'SPEND',
  'SPICE', 'SPILL', 'SPINE', 'SPOIL', 'SPOON', 'SPORT', 'SPRAY', 'SQUAD',
  'SQUID', 'STAFF', 'STAGE', 'STAIN', 'STAIR', 'STALE', 'STALL', 'STAMP',
  'STAND', 'STANK', 'STARK', 'START', 'STASH', 'STATE', 'STAYS', 'STEAK',
  'STEAL', 'STEAM', 'STEEL', 'STEEP', 'STEER', 'STERN', 'STICK', 'STIFF',
  'STILL', 'STING', 'STOCK', 'STOMP', 'STORK', 'STORY', 'STOUT', 'STOVE',
  'STRAP', 'STRAW', 'STRAY', 'STRIP', 'STRUT', 'STUCK', 'STUDY', 'STUFF',
  'STUMP', 'STUNG', 'STUNK', 'STUNT', 'SUGAR', 'SUITE', 'SULKY', 'SULLY',
  'SUNNY', 'SURGE', 'SWAMP', 'SWEAR', 'SWEAT', 'SWEEP', 'SWEET', 'SWEPT',
  'SWIFT', 'SWIPE', 'SWIRL', 'SWORD', 'SWORE', 'SWORN', 'TABLE', 'TAUNT',
  'TEACH', 'TEASE', 'TEETH', 'TENSE', 'TENTH', 'TEPID', 'THANK', 'THEFT',
  'THEIR', 'THEME', 'THERE', 'THICK', 'THING', 'THINK', 'THIRD', 'THORN',
  'THOSE', 'THREE', 'THREW', 'TIGER', 'TIGHT', 'TIMER', 'TIRED', 'TITLE',
  'TODAY', 'TOTAL', 'TOUCH', 'TOUGH', 'TOWEL', 'TOWER', 'TOXIC', 'TRACK',
  'TRADE', 'TRAIL', 'TRAIN', 'TRAIT', 'TRAMP', 'TRASH', 'TREAT', 'TREND',
  'TRICK', 'TRIED', 'TROOP', 'TROUT', 'TRUCK', 'TRULY', 'TRUMP', 'TRUNK',
  'TRUST', 'TRUTH', 'TUBER', 'TULIP', 'TUMOR', 'TUNER', 'TUXEDO', 'TWICE',
  'TWIRL', 'TWIST', 'UNCLE', 'UNDER', 'UNIFY', 'UNION', 'UNITY', 'UNTIL',
  'UPPER', 'UPSET', 'URBAN', 'USAGE', 'USHER', 'USUAL', 'UTTER', 'VALID',
  'VALUE', 'VALVE', 'VAPOR', 'VAULT', 'VENOM', 'VERSE', 'VIDEO', 'VIGOR',
  'VIRAL', 'VISIT', 'VITAL', 'VIVID', 'VOCAL', 'VOICE', 'VOTER', 'VAGUE',
  'WAIST', 'WALTZ', 'WASTE', 'WATER', 'WEARY', 'WEAVE', 'WEDGE', 'WEIGH',
  'WEIRD', 'WHALE', 'WHEAT', 'WHEEL', 'WHERE', 'WHICH', 'WHILE', 'WHITE',
  'WHOLE', 'WHOSE', 'WOMAN', 'WORLD', 'WORRY', 'WORSE', 'WORST', 'WORTH',
  'WOULD', 'WOUND', 'WRATH', 'WRIST', 'WRITE', 'WRONG', 'YACHT', 'YEARN',
  'YIELD', 'YOUNG', 'YOURS', 'YOUTH', 'ZEBRA', 'ZONAL',
].filter(w => w.length === 5);

let targetWord = '';
let guesses    = [];  // [{word, colors:[]}]
let current    = '';
let done       = false;
let flash      = '';
let flashUntil = 0;
let shakeUntil = 0;
let shakeRow   = -1;
let resetAt    = 0;   // when to auto-reset after win/loss

// Win rewards — persist across rounds within one game session
let winCount          = 0;
let firstWinPending   = false;  // signals main.js to clear bears
let goToBedUntil      = 0;      // timestamp for GO TO BED overlay

export function resetWordle() {
  targetWord      = WORDS[Math.floor(Math.random() * WORDS.length)];
  guesses         = [];
  current         = '';
  done            = false;
  flash           = '';
  flashUntil      = 0;
  shakeUntil      = 0;
  shakeRow        = -1;
  resetAt         = 0;
  winCount        = 0;
  firstWinPending = false;
  goToBedUntil    = 0;
}

function resetRound() {
  targetWord = WORDS[Math.floor(Math.random() * WORDS.length)];
  guesses    = [];
  current    = '';
  done       = false;
  flash      = '';
  flashUntil = 0;
  shakeUntil = 0;
  shakeRow   = -1;
  resetAt    = 0;
}

// Called by main.js — returns true once after first win, then clears the flag
export function consumeFirstWinReward() {
  if (!firstWinPending) return false;
  firstWinPending = false;
  return true;
}

function showFlash(msg, ms = 1800) {
  flash      = msg;
  flashUntil = performance.now() + ms;
}

function submit() {
  if (done) return;
  if (current.length < 5) {
    showFlash('Need 5 letters!', 1200);
    shakeRow   = guesses.length;
    shakeUntil = performance.now() + 400;
    return;
  }

  const word   = current;
  const target = targetWord.split('');
  const colors = Array(5).fill('absent');
  const wArr   = word.split('');

  // Correct positions first
  for (let i = 0; i < 5; i++) {
    if (wArr[i] === target[i]) {
      colors[i] = 'correct';
      target[i] = null;
      wArr[i]   = null;
    }
  }
  // Present but wrong position
  for (let i = 0; i < 5; i++) {
    if (wArr[i]) {
      const j = target.indexOf(wArr[i]);
      if (j !== -1) { colors[i] = 'present'; target[j] = null; }
    }
  }

  guesses.push({ word, colors });
  current = '';

  if (word === targetWord) {
    winCount++;
    if (winCount === 1) {
      firstWinPending = true;
      showFlash('BEARS GONE!', 3000);
    } else if (winCount === 2) {
      goToBedUntil = performance.now() + 10000;
      showFlash('GO TO BED!!!', 3000);
    } else {
      const msgs = ['NICE!', 'YES!', 'GOT IT!', 'WORDLE!'];
      showFlash(msgs[Math.floor(Math.random() * msgs.length)], 3000);
    }
    done    = true;
    resetAt = performance.now() + 3500;
  } else if (guesses.length >= 6) {
    showFlash(targetWord, 3500);
    done    = true;
    resetAt = performance.now() + 4000;
  }
}

// Attach once at module load
window.addEventListener('keydown', (e) => {
  if (done) return;
  const key = e.key.toUpperCase();
  if (key.length === 1 && key >= 'A' && key <= 'Z') {
    if (current.length < 5) current += key;
  } else if (e.key === 'Backspace') {
    current = current.slice(0, -1);
  } else if (e.key === 'Tab') {
    e.preventDefault();
    submit();
  }
});

// ── Rendering ─────────────────────────────────────────────────────────────

const TILE = 48;
const GAP  = 4;
const GW   = 5 * TILE + 4 * GAP;  // grid width
const GH   = 6 * TILE + 5 * GAP;  // grid height
const PAD  = 14;

const COL = {
  correct: '#6aaa64',
  present: '#c9b458',
  absent:  '#787c7e',
  filled:  '#ffffff',
  empty:   '#ffffff',
};
const BORDER = {
  correct: '#6aaa64',
  present: '#c9b458',
  absent:  '#787c7e',
  filled:  '#878a8c',
  empty:   '#d3d6da',
};

// Disco: each tile gets a unique phase offset for independent flashing
const TILE_PHASES = Array.from({ length: 30 }, () => Math.random() * Math.PI * 2);
const DISCO_COLORS = [
  '#ff0080', '#ff4000', '#ffcc00', '#00ff80', '#00ccff',
  '#8800ff', '#ff00ff', '#ff6600', '#00ff00', '#0080ff',
];

function getDiscoColor(tileIndex, now) {
  const phase = TILE_PHASES[tileIndex];
  const t = (now / 400 + phase) % (DISCO_COLORS.length);
  const i = Math.floor(t) % DISCO_COLORS.length;
  return DISCO_COLORS[i];
}

function drawDiscoBall(ctx, cx, cy, radius, now) {
  // Ball body with metallic sheen
  const grad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.05, cx, cy, radius);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.3, '#cccccc');
  grad.addColorStop(1, '#555555');
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Mirror facets — grid of small squares clipped to the ball
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  const facetSize = Math.max(4, radius / 4);
  for (let fx = cx - radius; fx < cx + radius; fx += facetSize) {
    for (let fy = cy - radius; fy < cy + radius; fy += facetSize) {
      const colorIdx = Math.floor((fx + fy + now / 200)) % DISCO_COLORS.length;
      const col = DISCO_COLORS[((colorIdx % DISCO_COLORS.length) + DISCO_COLORS.length) % DISCO_COLORS.length];
      ctx.fillStyle = col + 'aa';
      ctx.fillRect(fx + 0.5, fy + 0.5, facetSize - 1, facetSize - 1);
    }
  }
  ctx.restore();

  // Rotating shine spot
  const shineAngle = now / 1000;
  ctx.beginPath();
  ctx.arc(
    cx + Math.cos(shineAngle) * radius * 0.25,
    cy + Math.sin(shineAngle) * radius * 0.25,
    radius * 0.18, 0, Math.PI * 2
  );
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();

  // String hanging from top
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx, cy - radius - 20);
  ctx.stroke();
}

function drawLightBeams(ctx, W, H, cx, cy, now) {
  const numBeams = 6;
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < numBeams; i++) {
    const angle = (now / 1800 + (i / numBeams) * Math.PI * 2);
    const col = DISCO_COLORS[(i + Math.floor(now / 500)) % DISCO_COLORS.length];
    const bx = cx + Math.cos(angle) * 2000;
    const by = cy + Math.sin(angle) * 2000;
    const grad = ctx.createLinearGradient(cx, cy, bx, by);
    grad.addColorStop(0, col);
    grad.addColorStop(1, col + '00');
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    // Wide beam
    const perp = angle + Math.PI / 2;
    const spread = 30;
    ctx.moveTo(cx + Math.cos(perp) * spread, cy + Math.sin(perp) * spread);
    ctx.lineTo(bx + Math.cos(perp) * spread * 8, by + Math.sin(perp) * spread * 8);
    ctx.lineTo(bx - Math.cos(perp) * spread * 8, by - Math.sin(perp) * spread * 8);
    ctx.lineTo(cx - Math.cos(perp) * spread, cy - Math.sin(perp) * spread);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.restore();
}

export function drawWordle(ctx, W, H, now) {
  // Auto-reset round (not the full game — winCount persists)
  if (resetAt > 0 && now >= resetAt) { resetAt = 0; resetRound(); }

  const gx = Math.round(W / 2 - GW / 2);
  const gy = Math.round(H / 2 - GH / 2) - 8;

  // Disco ball above the board
  const ballRadius = 28;
  const ballCx = W / 2;
  const ballCy = gy - PAD - 26 - ballRadius - 24;

  // Light beams emanate from disco ball
  drawLightBeams(ctx, W, H, ballCx, ballCy, now);

  // Panel background — dark for disco vibes
  ctx.save();
  ctx.shadowBlur = 18;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.fillStyle = 'rgba(10,10,20,0.92)';
  ctx.beginPath();
  ctx.roundRect(gx - PAD, gy - PAD - 26, GW + PAD * 2, GH + PAD * 2 + 26, 10);
  ctx.fill();
  ctx.restore();
  // Animated rainbow border
  const borderHue = (now / 20) % 360;
  ctx.strokeStyle = `hsl(${borderHue},100%,60%)`;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(gx - PAD, gy - PAD - 26, GW + PAD * 2, GH + PAD * 2 + 26, 10);
  ctx.stroke();

  // Disco ball drawn on top of panel
  drawDiscoBall(ctx, ballCx, ballCy, ballRadius, now);

  // Header — rainbow letters
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '4px';
  const headerHue = (now / 15) % 360;
  ctx.fillStyle = `hsl(${headerHue},100%,65%)`;
  ctx.fillText('WORDLE', W / 2, gy - 6);
  ctx.letterSpacing = '0px';

  // Flash message (above header)
  if (flash && now < flashUntil) {
    const alpha = Math.min(1, (flashUntil - now) / 300);
    ctx.font = 'bold 15px Arial, sans-serif';
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillText(flash, W / 2, gy - PAD - 12);
  }

  // Grid
  const isShaking = now < shakeUntil;
  for (let row = 0; row < 6; row++) {
    const dx = (isShaking && row === shakeRow) ? Math.sin(now / 25) * 5 : 0;

    for (let col = 0; col < 5; col++) {
      const tx = gx + col * (TILE + GAP) + dx;
      const ty = gy + row * (TILE + GAP);

      let letter = '';
      let state  = 'empty';

      if (row < guesses.length) {
        letter = guesses[row].word[col];
        state  = guesses[row].colors[col];
      } else if (row === guesses.length && !done) {
        if (col < current.length) { letter = current[col]; state = 'filled'; }
      }

      const tileIndex = row * 5 + col;
      let tileFill, tileBorder;
      if (state === 'empty' || state === 'filled') {
        // Disco dance floor: each empty/filled tile flashes its own color
        const discoCol = getDiscoColor(tileIndex, now);
        tileFill   = discoCol + 'cc';
        tileBorder = discoCol;
      } else {
        tileFill   = COL[state] ?? '#fff';
        tileBorder = BORDER[state] ?? '#d3d6da';
      }

      ctx.fillStyle   = tileFill;
      ctx.strokeStyle = tileBorder;
      ctx.lineWidth   = 2.5;
      ctx.beginPath();
      ctx.roundRect(tx, ty, TILE, TILE, 3);
      ctx.fill();
      ctx.stroke();

      if (letter) {
        ctx.font      = `bold ${Math.round(TILE * 0.52)}px Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(letter, tx + TILE / 2, ty + TILE * 0.68);
      }
    }
  }

  // Hint
  ctx.font      = '11px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(200,200,200,0.65)';
  ctx.fillText('Tab to submit  ·  Backspace to delete', W / 2, gy + GH + PAD + 6);

  ctx.textAlign = 'left';

  // GO TO BED overlay — 10 seconds of flashing red shame
  if (goToBedUntil > 0 && now < goToBedUntil) {
    const remaining = goToBedUntil - now;
    const flash = Math.sin(now / 180) > 0;  // flashes ~2.8x per second
    if (flash) {
      ctx.save();
      ctx.fillStyle = 'rgba(180, 0, 0, 0.18)';
      ctx.fillRect(0, 0, W, H);

      const fontSize = Math.round(Math.min(W, H) * 0.16);
      ctx.font      = `bold ${fontSize}px Arial Black, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Shadow for drama
      ctx.fillStyle   = 'rgba(0,0,0,0.5)';
      ctx.fillText('GO TO BED', W / 2 + 6, H / 2 + 6);

      ctx.fillStyle = '#ff0000';
      ctx.fillText('GO TO BED', W / 2, H / 2);

      ctx.textBaseline = 'alphabetic';
      ctx.restore();
    }
  }
}
