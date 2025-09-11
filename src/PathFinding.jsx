import { inBounds, index } from './GameUtils';
import { TILE } from './GameConstants';

// Get valid neighbors for pathfinding
function neighbors(node, gridRef) {
  const n = [];
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  
  for (const d of dirs) {
    const nx = node.x + d[0];
    const ny = node.y + d[1];
    
    if (!inBounds(nx, ny)) continue;
    
    const t = gridRef.current[index(nx, ny)];
    if (t !== TILE.WALL && t !== TILE.ROCK) {
      n.push({ x: nx, y: ny });
    }
  }
  return n;
}

// BFS pathfinding algorithm
export function bfsPath(start, goal, gridRef) {
  const queue = [start];
  const key = p => p.x + "," + p.y;
  const parent = new Map();
  parent.set(key(start), null);
  
  while (queue.length) {
    const current = queue.shift();
    
    if (current.x === goal.x && current.y === goal.y) break;
    
    for (const neighbor of neighbors(current, gridRef)) {
      const k = key(neighbor);
      if (!parent.has(k)) {
        parent.set(k, current);
        queue.push(neighbor);
      }
    }
  }
  
  const goalKey = key(goal);
  if (!parent.has(goalKey)) return [];
  
  const path = [];
  let currentKey = goalKey;
  let current = goal;
  
  while (current) {
    path.push({ x: current.x, y: current.y });
    current = parent.get(currentKey);
    if (current) currentKey = current.x + "," + current.y;
  }
  
  path.reverse();
  
  // Remove start position from path
  if (path.length > 0 && path[0].x === start.x && path[0].y === start.y) {
    path.shift();
  }
  
  return path;
}