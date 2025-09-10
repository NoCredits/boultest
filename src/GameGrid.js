// GameGrid.js
export const T = {
  EMPTY: 0,
  DIRT: 1,
  WALL: 2,
  BOULDER: 3,
};

export function cloneGrid(g) {
  return g.map(row => row.slice());
}

export function makeLevel(seed, GRID_W, GRID_H, randInt, mulberry32) {
  if (seed !== undefined) Math.random = mulberry32(seed);
  let g = Array.from({ length: GRID_H }, () => Array.from({ length: GRID_W }, () => T.DIRT));
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (x === 0 || y === 0 || x === GRID_W - 1 || y === GRID_H - 1) g[y][x] = T.WALL;
    }
  }
  for (let i = 0; i < 6; i++) {
    let x = randInt(2, GRID_W - 3);
    let y = randInt(2, GRID_H - 3);
    const steps = randInt(80, 140);
    for (let s = 0; s < steps; s++) {
      g[y][x] = T.EMPTY;
      const dir = randInt(0, 3);
      if (dir === 0 && x < GRID_W - 2) x++;
      if (dir === 1 && x > 1) x--;
      if (dir === 2 && y < GRID_H - 2) y++;
      if (dir === 3 && y > 1) y--;
    }
  }
  for (let y = 1; y < GRID_H - 1; y++) {
    for (let x = 1; x < GRID_W - 1; x++) {
      if (g[y][x] === T.DIRT && Math.random() < 0.12) g[y][x] = T.BOULDER;
    }
  }
  const spawn = { x: 2, y: 2 };
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      g[spawn.y + dy][spawn.x + dx] = T.EMPTY;
    }
  }
  return { grid: g, spawn };
}
