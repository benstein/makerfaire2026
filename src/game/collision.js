// src/game/collision.js
// SACRED — collision detection must always function

// Axis-Aligned Bounding Box collision
// Each rect: { x, y, w, h } where x,y is top-left
export function aabb(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}
