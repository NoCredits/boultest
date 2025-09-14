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

// Create paths with intentional detours using waypoints and scenic routes
export function bfsDetourPaths(start, goal, gridRef, maxPaths = 3) {
  const paths = [];
  
  // First, get the direct path
  const directPath = bfsPath(start, goal, gridRef);
  if (directPath.length === 0) return [];
  
  paths.push(directPath);
  if (maxPaths === 1) return paths;
  
  // Only create detours for longer distances where they make sense
  const totalDistance = Math.abs(goal.x - start.x) + Math.abs(goal.y - start.y);
  if (totalDistance < 8) {
    // For short distances, try a simple alternate route instead
    const alternatePath = bfsAlternatePaths(start, goal, gridRef, 2);
    if (alternatePath.length > 1) {
      paths.push(alternatePath[1]); // Add the second path from alternate algorithm
    }
    return paths;
  }
  
  // For longer distances, try more conservative detour strategies
  const conservativeStrategies = [
    'side_step',     // Small side steps to avoid direct obstacles  
    'corner_cut',    // Take advantage of corner-cutting opportunities
  ];
  
  // Try conservative strategies first
  for (const strategy of conservativeStrategies) {
    if (paths.length >= maxPaths) break;
    
    const detourPath = createConservativeDetour(start, goal, gridRef, strategy, directPath);
    if (detourPath.length > 0 && 
        !pathExists(detourPath, paths) && 
        isValidDetourPath(detourPath, directPath)) {
      paths.push(detourPath);
    }
  }
  
  // Only if we still need more paths and the distance is very long, try wider detours
  if (paths.length < maxPaths && totalDistance > 12) {
    const wideDetourPath = createCircumnavigationPath(start, goal, gridRef, directPath);
    if (wideDetourPath.length > 0 && 
        !pathExists(wideDetourPath, paths) && 
        isValidDetourPath(wideDetourPath, directPath)) {
      paths.push(wideDetourPath);
    }
  }
  
  return paths;
}

// Create conservative detours that stay close to the optimal route
function createConservativeDetour(start, goal, gridRef, strategy, directPath) {
  switch (strategy) {
    case 'side_step':
      return createSideStepPath(start, goal, gridRef, directPath);
    case 'corner_cut':
      return createCornerCutPath(start, goal, gridRef, directPath);
    default:
      return [];
  }
}

// Create a path that takes small side steps to avoid obstacles
function createSideStepPath(start, goal, gridRef, directPath) {
  // Find a point about 1/3 along the direct path
  const oneThirdIndex = Math.floor(directPath.length / 3);
  if (oneThirdIndex === 0) return [];
  
  const pivotPoint = directPath[oneThirdIndex];
  
  // Try small side steps (1-2 tiles) from the pivot point
  const sideSteps = [
    { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 },
    { x: 2, y: 0 }, { x: -2, y: 0 }, { x: 0, y: 2 }, { x: 0, y: -2 }
  ];
  
  for (const step of sideSteps) {
    const sidePoint = { x: pivotPoint.x + step.x, y: pivotPoint.y + step.y };
    
    if (inBounds(sidePoint.x, sidePoint.y) && 
        gridRef.current[index(sidePoint.x, sidePoint.y)] !== TILE.WALL &&
        gridRef.current[index(sidePoint.x, sidePoint.y)] !== TILE.ROCK) {
      
      // Create path: start -> side point -> goal
      const path1 = bfsPath(start, sidePoint, gridRef);
      const path2 = bfsPath(sidePoint, goal, gridRef);
      
      if (path1.length > 0 && path2.length > 0) {
        const combinedPath = [...path1, ...path2];
        // Only accept if it's a modest detour (max 30% longer)
        if (combinedPath.length <= directPath.length * 1.3) {
          return combinedPath;
        }
      }
    }
  }
  
  return [];
}

// Create a path that cuts corners more aggressively than the direct route
function createCornerCutPath(start, goal, gridRef, directPath) {
  // This tries to find a more "straight-line" path by using A* with Manhattan distance
  return bfsPathWithHeuristic(start, goal, gridRef);
}

// BFS with Manhattan distance heuristic to prefer more direct routes
function bfsPathWithHeuristic(start, goal, gridRef) {
  const queue = [{ node: start, cost: 0 }];
  const key = p => p.x + "," + p.y;
  const parent = new Map();
  const visited = new Set();
  parent.set(key(start), null);
  
  while (queue.length) {
    // Sort by cost + heuristic (Manhattan distance to goal)
    queue.sort((a, b) => {
      const aCost = a.cost + Math.abs(a.node.x - goal.x) + Math.abs(a.node.y - goal.y);
      const bCost = b.cost + Math.abs(b.node.x - goal.x) + Math.abs(b.node.y - goal.y);
      return aCost - bCost;
    });
    
    const current = queue.shift();
    const currentKey = key(current.node);
    
    if (visited.has(currentKey)) continue;
    visited.add(currentKey);
    
    if (current.node.x === goal.x && current.node.y === goal.y) break;
    
    for (const neighbor of neighbors(current.node, gridRef)) {
      const k = key(neighbor);
      if (!visited.has(k) && !parent.has(k)) {
        parent.set(k, current.node);
        queue.push({ node: neighbor, cost: current.cost + 1 });
      }
    }
  }
  
  // Reconstruct path
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

// Validate that a detour path is meaningful (no excessive backtracking or dead ends)
function isValidDetourPath(detourPath, directPath) {
  if (detourPath.length === 0 || directPath.length === 0) return false;
  
  // Path shouldn't be more than double the direct path length
  if (detourPath.length > directPath.length * 2.2) return false;
  
  // Check for excessive backtracking by measuring progress towards goal
  const start = directPath[0] || { x: detourPath[0].x, y: detourPath[0].y };
  const goal = directPath[directPath.length - 1] || detourPath[detourPath.length - 1];
  
  let progressMade = 0;
  let backtrackCount = 0;
  let lastDistanceToGoal = Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y);
  
  for (let i = 1; i < detourPath.length; i++) {
    const currentPos = detourPath[i];
    const currentDistanceToGoal = Math.abs(currentPos.x - goal.x) + Math.abs(currentPos.y - goal.y);
    
    if (currentDistanceToGoal < lastDistanceToGoal) {
      progressMade++;
    } else if (currentDistanceToGoal > lastDistanceToGoal + 1) {
      backtrackCount++;
    }
    
    lastDistanceToGoal = currentDistanceToGoal;
  }
  
  // Reject paths with too much backtracking relative to progress
  const backtrackRatio = backtrackCount / Math.max(progressMade, 1);
  if (backtrackRatio > 0.6) return false;
  
  return true;
}

// Create a path with intentional detours using different strategies
function createDetourPath(start, goal, gridRef, strategy, directPath) {
  switch (strategy) {
    case 'circumnavigate':
      return createCircumnavigationPath(start, goal, gridRef, directPath);
    case 'zigzag':
      return createZigzagPath(start, goal, gridRef);
    case 'perimeter':
      return createPerimeterPath(start, goal, gridRef);
    case 'diagonal':
      return createDiagonalStylePath(start, goal, gridRef);
    default:
      return [];
  }
}

// Create a path that goes around obstacles in a wide arc
function createCircumnavigationPath(start, goal, gridRef, directPath) {
  // Find the midpoint of the direct path
  const midIndex = Math.floor(directPath.length / 2);
  if (midIndex === 0) return [];
  
  const midPoint = directPath[midIndex];
  
  // Try to find a detour point offset from the midpoint
  // Use larger offsets and ensure the detour point makes sense geometrically
  const offsets = [
    { x: 4, y: 0 }, { x: -4, y: 0 }, { x: 0, y: 4 }, { x: 0, y: -4 },
    { x: 3, y: 3 }, { x: -3, y: 3 }, { x: 3, y: -3 }, { x: -3, y: -3 }
  ];
  
  for (const offset of offsets) {
    const detourPoint = { x: midPoint.x + offset.x, y: midPoint.y + offset.y };
    
    if (inBounds(detourPoint.x, detourPoint.y) && 
        gridRef.current[index(detourPoint.x, detourPoint.y)] !== TILE.WALL &&
        gridRef.current[index(detourPoint.x, detourPoint.y)] !== TILE.ROCK) {
      
      // Validate that this detour point creates a meaningful path
      // Check if the detour point is roughly "between" start and goal in a useful way
      const detourToGoalDist = Math.abs(detourPoint.x - goal.x) + Math.abs(detourPoint.y - goal.y);
      const startToGoalDist = Math.abs(start.x - goal.x) + Math.abs(start.y - goal.y);
      
      // Only use detour if it doesn't add too much extra distance (max 50% longer)
      if (detourToGoalDist <= startToGoalDist * 1.5) {
        // Create path: start -> detour point -> goal
        const path1 = bfsPath(start, detourPoint, gridRef);
        const path2 = bfsPath(detourPoint, goal, gridRef);
        
        if (path1.length > 0 && path2.length > 0) {
          const combinedPath = [...path1, ...path2];
          // Ensure the combined path is not too much longer than direct path
          if (combinedPath.length <= directPath.length * 1.8) {
            return combinedPath;
          }
        }
      }
    }
  }
  
  return [];
}

// Create a zigzag path by introducing artificial waypoints
function createZigzagPath(start, goal, gridRef) {
  const dx = goal.x - start.x;
  const dy = goal.y - start.y;
  const totalDistance = Math.abs(dx) + Math.abs(dy);
  
  // Don't create zigzag for very short distances
  if (totalDistance < 6) return [];
  
  // Create fewer, more meaningful zigzag waypoints
  const waypoints = [];
  const steps = Math.min(3, Math.floor(totalDistance / 4)); // Fewer waypoints
  
  for (let i = 1; i < steps; i++) {
    const progress = i / steps;
    let zigzagX = start.x + Math.floor(dx * progress);
    let zigzagY = start.y + Math.floor(dy * progress);
    
    // Add moderate zigzag offset that makes geometric sense
    const zigzagOffset = (i % 2 === 0 ? 2 : -2);
    if (Math.abs(dx) > Math.abs(dy)) {
      zigzagY += zigzagOffset;
    } else {
      zigzagX += zigzagOffset;
    }
    
    // Validate waypoint doesn't create excessive detours
    const waypointToGoalDist = Math.abs(zigzagX - goal.x) + Math.abs(zigzagY - goal.y);
    const directDistFromHere = Math.abs(start.x + Math.floor(dx * progress) - goal.x) + 
                               Math.abs(start.y + Math.floor(dy * progress) - goal.y);
    
    // Only use waypoint if it doesn't add too much extra distance
    if (waypointToGoalDist <= directDistFromHere + 3 &&
        inBounds(zigzagX, zigzagY) &&
        gridRef.current[index(zigzagX, zigzagY)] !== TILE.WALL &&
        gridRef.current[index(zigzagX, zigzagY)] !== TILE.ROCK) {
      waypoints.push({ x: zigzagX, y: zigzagY });
    }
  }
  
  // Need at least one waypoint for a meaningful zigzag
  if (waypoints.length === 0) return [];
  
  // Build path through waypoints
  let fullPath = [];
  let currentStart = start;
  
  for (const waypoint of waypoints) {
    const segmentPath = bfsPath(currentStart, waypoint, gridRef);
    if (segmentPath.length === 0) return []; // Failed to reach waypoint
    fullPath = [...fullPath, ...segmentPath];
    currentStart = waypoint;
  }
  
  // Final segment to goal
  const finalPath = bfsPath(currentStart, goal, gridRef);
  if (finalPath.length === 0) return [];
  
  const completePath = [...fullPath, ...finalPath];
  
  // Validate final path isn't excessively long
  const directPathLength = Math.abs(dx) + Math.abs(dy);
  if (completePath.length > directPathLength * 2) return [];
  
  return completePath;
}

// Create a path that follows perimeters/edges when possible
function createPerimeterPath(start, goal, gridRef) {
  // Only create perimeter path if there's enough distance to make it meaningful
  const distance = Math.abs(goal.x - start.x) + Math.abs(goal.y - start.y);
  if (distance < 8) return [];
  
  const perimeterPath = bfsPathWithBias(start, goal, gridRef, 'perimeter');
  
  // Validate that perimeter path is not too much longer than direct path
  const directPath = bfsPath(start, goal, gridRef);
  if (directPath.length === 0) return [];
  
  if (perimeterPath.length > directPath.length * 1.6) return [];
  
  return perimeterPath;
}

// Create a path that prefers diagonal-like movements
function createDiagonalStylePath(start, goal, gridRef) {
  const dx = goal.x - start.x;
  const dy = goal.y - start.y;
  
  // Only useful if we actually have diagonal-style movement potential
  if (Math.abs(dx) < 3 || Math.abs(dy) < 3) return [];
  
  const diagonalPath = bfsPathWithBias(start, goal, gridRef, 'diagonal');
  
  // Validate path efficiency
  const directPath = bfsPath(start, goal, gridRef);
  if (directPath.length === 0) return [];
  
  if (diagonalPath.length > directPath.length * 1.4) return [];
  
  return diagonalPath;
}

// BFS with directional bias for creating different path styles
function bfsPathWithBias(start, goal, gridRef, biasType) {
  const queue = [start];
  const key = p => p.x + "," + p.y;
  const parent = new Map();
  parent.set(key(start), null);
  
  while (queue.length) {
    const current = queue.shift();
    
    if (current.x === goal.x && current.y === goal.y) break;
    
    const neighborList = neighbors(current, gridRef);
    
    // Apply bias to neighbor ordering
    if (biasType === 'perimeter') {
      // Prefer neighbors next to walls/obstacles
      neighborList.sort((a, b) => {
        const aWallCount = countAdjacentWalls(a, gridRef);
        const bWallCount = countAdjacentWalls(b, gridRef);
        return bWallCount - aWallCount; // Prefer higher wall count
      });
    } else if (biasType === 'diagonal') {
      // Prefer movements that are more diagonal-like
      neighborList.sort((a, b) => {
        const aDiagScore = Math.abs(a.x - current.x) + Math.abs(a.y - current.y);
        const bDiagScore = Math.abs(b.x - current.x) + Math.abs(b.y - current.y);
        return bDiagScore - aDiagScore;
      });
    }
    
    for (const neighbor of neighborList) {
      const k = key(neighbor);
      if (!parent.has(k)) {
        parent.set(k, current);
        queue.push(neighbor);
      }
    }
  }
  
  // Reconstruct path
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

// Count adjacent walls for perimeter bias
function countAdjacentWalls(node, gridRef) {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let wallCount = 0;
  
  for (const d of dirs) {
    const nx = node.x + d[0];
    const ny = node.y + d[1];
    
    if (!inBounds(nx, ny) || 
        gridRef.current[index(nx, ny)] === TILE.WALL ||
        gridRef.current[index(nx, ny)] === TILE.ROCK) {
      wallCount++;
    }
  }
  
  return wallCount;
}