// src/game/leaderboard.js
// Leaderboard for the title and game over screens.
// Elle is always #1 with 1,000,000,000 points.
// Everyone else gets a deterministic score 100–1000 derived from their name.

let entries = [];

function nameScore(name) {
  let h = 0;
  for (const c of name) h = ((h * 37 + c.charCodeAt(0)) >>> 0);
  return 100 + (h % 901);
}

export function fmtScore(n) {
  return n.toLocaleString('en-US');
}

export async function initLeaderboard() {
  try {
    const res = await fetch('/changelog.json');
    const changelog = await res.json();

    const seen = new Set(['Baseline', 'Elle']);
    const others = [];
    for (const entry of changelog) {
      if (!seen.has(entry.name)) {
        seen.add(entry.name);
        others.push(entry.name);
      }
    }

    const ranked = others
      .map(name => ({ name, score: nameScore(name) }))
      .sort((a, b) => b.score - a.score);

    entries = [
      { rank: 1, name: 'Elle', score: 1_000_000_000 },
      ...ranked.map((e, i) => ({ rank: i + 2, ...e })),
    ];
  } catch {
    entries = [{ rank: 1, name: 'Elle', score: 1_000_000_000 }];
  }
}

export function getLeaderboard() { return entries; }
