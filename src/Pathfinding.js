// Pathfinding.js
import { T } from './GameGrid';
export function aStar(grid, start, goal) {
  const W = grid[0].length;
  const H = grid.length;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const pass = (x, y) => grid[y][x] !== T.WALL && grid[y][x] !== T.BOULDER;
  const h = (x, y) => Math.abs(x - goal.x) + Math.abs(y - goal.y);
  const key = (x, y) => `${x},${y}`;
  const open = new Set([key(start.x, start.y)]);
  const came = new Map();
  const gScore = new Map([[key(start.x, start.y), 0]]);
  const fScore = new Map([[key(start.x, start.y), h(start.x, start.y)]]);
  while (open.size) {
    let currentKey = "";
    let bestF = Infinity;
    for (const k of open) {
      const f = fScore.get(k) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        currentKey = k;
      }
    }
    const [cx, cy] = currentKey.split(",").map(Number);
    if (cx === goal.x && cy === goal.y) {
      const path = [];
      let ck = currentKey;
      while (ck !== key(start.x, start.y)) {
        const [px, py] = ck.split(",").map(Number);
        path.push({ x: px, y: py });
        ck = came.get(ck);
      }
      path.reverse();
      return path;
    }
    open.delete(currentKey);
    const dirs = [ [1,0], [-1,0], [0,1], [0,-1] ];
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!inb(nx, ny) || !pass(nx, ny)) continue;
      const nk = key(nx, ny);
      const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;
      if (tentativeG < (gScore.get(nk) ?? Infinity)) {
        came.set(nk, currentKey);
        gScore.set(nk, tentativeG);
        fScore.set(nk, tentativeG + h(nx, ny));
        open.add(nk);
      }
    }
  }
  return null;
}
