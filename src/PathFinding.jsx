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

// BFS pathfinding algorithm - single path
export function bfsPath(start, goal, gridRef) {
  const paths = bfsMultiplePaths(start, goal, gridRef, 1);
  return paths.length > 0 ? paths[0] : [];
}

// Find multiple paths using modified BFS
export function bfsMultiplePaths(start, goal, gridRef, maxPaths = 3) {
  const queue = [{ node: start, path: [start] }];
  const key = p => p.x + "," + p.y;
  const visited = new Set();
  const foundPaths = [];
  const pathsByLength = new Map();
  
  while (queue.length && foundPaths.length < maxPaths) {
    const { node: current, path } = queue.shift();
    const currentKey = key(current);
    
    // If we reached the goal, save this path
    if (current.x === goal.x && current.y === goal.y) {
      const pathLength = path.length;
      if (!pathsByLength.has(pathLength)) {
        pathsByLength.set(pathLength, []);
      }
      pathsByLength.get(pathLength).push([...path]);
      continue;
    }
    
    // Skip if we've been here with a shorter or equal path
    if (visited.has(currentKey)) continue;
    visited.add(currentKey);
    
    for (const neighbor of neighbors(current, gridRef)) {
      const neighborKey = key(neighbor);
      if (!path.some(p => key(p) === neighborKey)) { // Avoid cycles
        queue.push({
          node: neighbor,
          path: [...path, neighbor]
        });
      }
    }
  }
  
  // Sort paths by length and return up to maxPaths
  const allPaths = [];
  for (const [length, paths] of [...pathsByLength.entries()].sort((a, b) => a[0] - b[0])) {
    allPaths.push(...paths);
    if (allPaths.length >= maxPaths) break;
  }
  
  return allPaths.slice(0, maxPaths).map(path => {
    // Remove start position from each path
    const cleanPath = path.slice(1);
    return cleanPath;
  });
}

// Alternative approach: Find paths by temporarily blocking nodes
export function bfsAlternatePaths(start, goal, gridRef, maxPaths = 3) {
  const paths = [];
  const originalPath = bfsPath(start, goal, gridRef);
  
  if (originalPath.length === 0) return [];
  paths.push(originalPath);
  
  // Try blocking each node in the original path and find alternatives
  for (let i = 1; i < originalPath.length - 1 && paths.length < maxPaths; i++) {
    const blockNode = originalPath[i];
    const originalTile = gridRef.current[index(blockNode.x, blockNode.y)];
    
    // Temporarily block this node
    gridRef.current[index(blockNode.x, blockNode.y)] = TILE.WALL;
    
    const alternatePath = bfsPath(start, goal, gridRef);
    if (alternatePath.length > 0 && !pathExists(alternatePath, paths)) {
      paths.push(alternatePath);
    }
    
    // Restore original tile
    gridRef.current[index(blockNode.x, blockNode.y)] = originalTile;
  }
  
  return paths;
}

// Check if a path already exists in the paths array
function pathExists(newPath, existingPaths) {
  return existingPaths.some(path => {
    if (path.length !== newPath.length) return false;
    return path.every((node, i) => 
      node.x === newPath[i].x && node.y === newPath[i].y
    );
  });
}

// Weighted pathfinding - adds randomness to create different paths
export function bfsRandomizedPaths(start, goal, gridRef, maxPaths = 3) {
  const paths = [];
  
  for (let attempt = 0; attempt < maxPaths * 3 && paths.length < maxPaths; attempt++) {
    const path = bfsPathWithRandomization(start, goal, gridRef, 0.1 + (attempt * 0.05));
    if (path.length > 0 && !pathExists(path, paths)) {
      paths.push(path);
    }
  }
  
  return paths;
}

// BFS with slight randomization in neighbor selection
function bfsPathWithRandomization(start, goal, gridRef, randomFactor = 0.1) {
  const queue = [start];
  const key = p => p.x + "," + p.y;
  const parent = new Map();
  parent.set(key(start), null);
  
  while (queue.length) {
    const current = queue.shift();
    
    if (current.x === goal.x && current.y === goal.y) break;
    
    const neighborList = neighbors(current, gridRef);
    
    // Add slight randomization to neighbor order
    if (Math.random() < randomFactor) {
      neighborList.sort(() => Math.random() - 0.5);
    }
    
    for (const neighbor of neighborList) {
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