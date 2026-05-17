// src/game/mapGen.js
// 100 procedurally generated maps with unique colors, enemy types, and names

// Seeded random for consistent maps
function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const MAP_COUNT = 100;

const BIOME_NAMES = [
  'Depths', 'Cavern', 'Wasteland', 'Swamp', 'Ruins',
  'Tundra', 'Volcano', 'Forest', 'Abyss', 'Sanctum',
  'Crypt', 'Marsh', 'Dunes', 'Rift', 'Hollow',
  'Glacier', 'Inferno', 'Grove', 'Void', 'Citadel',
];

const ADJECTIVES = [
  'Cursed', 'Frozen', 'Burning', 'Ancient', 'Twisted',
  'Silent', 'Crimson', 'Shadow', 'Crystal', 'Toxic',
  'Golden', 'Emerald', 'Iron', 'Obsidian', 'Phantom',
  'Thunder', 'Bone', 'Storm', 'Blood', 'Spirit',
];

const ENEMY_TYPES = [
  { name: 'Slimes',     color: '#2ecc71', speed: 0.8,  hp: 1, size: 18, spawnRate: 1.0 },
  { name: 'Goblins',    color: '#27ae60', speed: 1.8,  hp: 1, size: 20, spawnRate: 1.2 },
  { name: 'Skeletons',  color: '#ecf0f1', speed: 1.2,  hp: 2, size: 22, spawnRate: 0.9 },
  { name: 'Demons',     color: '#e74c3c', speed: 1.5,  hp: 2, size: 24, spawnRate: 0.8 },
  { name: 'Ghosts',     color: '#9b59b6', speed: 2.0,  hp: 1, size: 18, spawnRate: 1.5 },
  { name: 'Golems',     color: '#95a5a6', speed: 0.6,  hp: 4, size: 30, spawnRate: 0.5 },
  { name: 'Bats',       color: '#2c3e50', speed: 2.5,  hp: 1, size: 16, spawnRate: 1.8 },
  { name: 'Ogres',      color: '#d35400', speed: 0.9,  hp: 3, size: 28, spawnRate: 0.6 },
  { name: 'Wraiths',    color: '#8e44ad', speed: 1.7,  hp: 2, size: 20, spawnRate: 1.0 },
  { name: 'Dragons',    color: '#c0392b', speed: 1.3,  hp: 5, size: 32, spawnRate: 0.4 },
  { name: 'Spiders',    color: '#1abc9c', speed: 2.2,  hp: 1, size: 17, spawnRate: 1.6 },
  { name: 'Trolls',     color: '#16a085', speed: 0.7,  hp: 3, size: 26, spawnRate: 0.7 },
];

let maps = [];
let currentMapIndex = 0;
let mapsVisited = 0;

export function generateAllMaps() {
  maps = [];
  for (let i = 0; i < MAP_COUNT; i++) {
    const rng = seededRandom(i * 7919 + 42);

    // Pick background color — hue-shifted dark tones
    const hue = Math.floor(rng() * 360);
    const sat = 20 + Math.floor(rng() * 30);
    const light = 8 + Math.floor(rng() * 10);
    const bg = `hsl(${hue}, ${sat}%, ${light}%)`;

    // Pick enemy type
    const enemyType = ENEMY_TYPES[Math.floor(rng() * ENEMY_TYPES.length)];

    // Difficulty scaling: some maps are easy, some hard
    const difficulty = 0.5 + rng() * 1.5; // 0.5 to 2.0

    // Map name
    const adj = ADJECTIVES[Math.floor(rng() * ADJECTIVES.length)];
    const biome = BIOME_NAMES[Math.floor(rng() * BIOME_NAMES.length)];

    maps.push({
      id: i + 1,
      name: `${adj} ${biome}`,
      bg,
      enemy: {
        name: enemyType.name,
        color: enemyType.color,
        speed: enemyType.speed * difficulty,
        hp: Math.max(1, Math.round(enemyType.hp * difficulty)),
        size: enemyType.size,
        spawnRate: enemyType.spawnRate / difficulty, // harder = faster spawns
      },
      // Accent color for UI elements on this map
      accent: `hsl(${(hue + 180) % 360}, 60%, 60%)`,
    });
  }
}

export function resetMapState() {
  currentMapIndex = Math.floor(Math.random() * MAP_COUNT);
  mapsVisited = 1;
}

export function getCurrentMap() {
  return maps[currentMapIndex];
}

export function getMapNumber() {
  return currentMapIndex + 1;
}

export function getMapsVisited() {
  return mapsVisited;
}

export function warpToRandomMap() {
  let next;
  do {
    next = Math.floor(Math.random() * MAP_COUNT);
  } while (next === currentMapIndex && MAP_COUNT > 1);
  currentMapIndex = next;
  mapsVisited++;
  return maps[currentMapIndex];
}
