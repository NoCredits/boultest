import { TILE, GAME_CONFIG } from './GameConstants';
import { index, inBounds } from './GameUtils';
import { bfsPath, bfsMultiplePaths, bfsAlternatePaths, bfsRandomizedPaths } from './PathFinding';
import { updateRocks } from './GamePhysics';

const { tileSize } = GAME_CONFIG;

export function handleCanvasClick(
  e, 
  canvasRef, 
  gridRef, 
  playerRef, 
  pathRef, 
  selectedDestRef, 
  isPathActiveRef, 
  rockFallCooldownRef,
  onPlayerDie,
  onDraw,
  cameraRef,
  selectedPathIndexRef = { current: 0 }, // Add ref to track which path is selected
  pathfindingMode = 'multiple', // 'single', 'multiple', 'alternate', 'randomized'
  clearPath = null // Function to clear paths when clicking on unreachable areas
) {
  e.preventDefault();
  
  // Right-click always clears paths (for desktop)
  if (e.button === 2 && clearPath) {
    clearPath();
    return;
  }
  
  // Track double-tap for touch devices
  const currentTime = Date.now();
  if (!window.lastClickTime) window.lastClickTime = 0;
  if (!window.lastClickPos) window.lastClickPos = { x: -1, y: -1 };
  
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();

  
// Screen-space position
const screenX = e.clientX - rect.left;
const screenY = e.clientY - rect.top;

// Convert to tile coords in viewport
const tileX = Math.floor(screenX / GAME_CONFIG.tileSize);
const tileY = Math.floor(screenY / GAME_CONFIG.tileSize);

// Convert to world coords by adding camera offset, then floor
//const worldX = Math.floor(cameraRef.current.x + tileX);
//const worldY = Math.floor(cameraRef.current.y + tileY);
//const worldX = Math.floor(cameraRef.current.x) + tileX;
//const worldY = Math.floor(cameraRef.current.y) + tileY;
const worldX = Math.floor(cameraRef.current.x + screenX / GAME_CONFIG.tileSize);
const worldY = Math.floor(cameraRef.current.y + screenY / GAME_CONFIG.tileSize);
      // const gx = Math.floor((e.clientX - rect.left) / tileSize);
      // const gy = Math.floor((e.clientY - rect.top) / tileSize); 

  // Double-tap detection for touch devices (only when paths exist and not activating)
  const timeSinceLastClick = currentTime - window.lastClickTime;
  const samePosition = (window.lastClickPos.x === worldX && window.lastClickPos.y === worldY);
  
  // Only clear on double-tap if we're not trying to activate a destination
  const isDestinationActivation = selectedDestRef.current && 
    selectedDestRef.current.x === worldX && selectedDestRef.current.y === worldY;
  
  if (timeSinceLastClick < 500 && samePosition && clearPath && !isDestinationActivation) {
    // Double-tap detected - clear paths (but not when activating destination)
    clearPath();
    return;
  }
  
  // Update click tracking
  window.lastClickTime = currentTime;
  window.lastClickPos = { x: worldX, y: worldY };

  if (!inBounds(worldX, worldY)) return;
  
  const clickedTile = gridRef.current[index(worldX, worldY)];
  const player = playerRef.current;

  // Clear paths if clicking on the player character (universal escape mechanism)
  if (worldX === player.x && worldY === player.y && clearPath) {
    clearPath();
    return;
  }

  // Handle rock pushing
  if (clickedTile === TILE.ROCK) {
    const dx = worldX - player.x;
    const dy = worldY - player.y;
    
    // Check if rock is adjacent to player
    if ((Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0)) {
      const pushX = worldX + dx;
      const pushY = worldY + dy;
      
      // Check if we can push the rock
      if (inBounds(pushX, pushY) && gridRef.current[index(pushX, pushY)] === TILE.EMPTY) {
        gridRef.current[index(pushX, pushY)] = TILE.ROCK;
        gridRef.current[index(worldX, worldY)] = TILE.EMPTY;
        updateRocks(0, rockFallCooldownRef, gridRef, onPlayerDie);
        onDraw();
      }
    }
  } else {
    // Check if clicking on an existing path to select it
    const clickedPathIndex = getClickedPathIndex(worldX, worldY, pathRef);
    
    // Handle pathfinding
    console.log('Click at:', worldX, worldY, 'Destination:', selectedDestRef.current);
    
    if (selectedDestRef.current && selectedDestRef.current.x === worldX && selectedDestRef.current.y === worldY) {
      // Clicking on destination: Always activate a path
      console.log('Destination match! Activating path');
      isPathActiveRef.current = true;
      selectedDestRef.current = null;
      
      // For multiple paths, use the selected one OR default to path 0
      if (pathRef.current && pathRef.current.length > 1) {
        // Use selectedPathIndexRef if it's valid, otherwise default to 0
        const pathIndex = (selectedPathIndexRef.current >= 0 && selectedPathIndexRef.current < pathRef.current.length) 
          ? selectedPathIndexRef.current 
          : 0;
        
        const selectedPath = pathRef.current[pathIndex] || pathRef.current[0] || [];
        pathRef.current = selectedPath.length > 0 ? [selectedPath] : [];
        selectedPathIndexRef.current = 0;
      }
      // For single path, just activate it directly
      
      onDraw();
      return;
    }
    
    if (clickedPathIndex >= 0 && pathRef.current && pathRef.current.length > 1) {
      // Click on path: Select that path (but don't activate yet)
      selectedPathIndexRef.current = clickedPathIndex;
      onDraw();
      return;
    } else {
      // First click: Preview multiple paths
      console.log('Generating paths for destination:', worldX, worldY);
      const destination = { x: worldX, y: worldY };
      let paths = [];
      
      // Choose pathfinding method based on mode
      switch (pathfindingMode) {
        case 'multiple':
          paths = bfsMultiplePaths(playerRef.current, destination, gridRef, 3);
          break;
        case 'alternate':
          paths = bfsAlternatePaths(playerRef.current, destination, gridRef, 3);
          break;
        case 'randomized':
          paths = bfsRandomizedPaths(playerRef.current, destination, gridRef, 3);
          break;
        case 'single':
        default:
          const singlePath = bfsPath(playerRef.current, destination, gridRef);
          paths = singlePath.length > 0 ? [singlePath] : [];
          break;
      }
      
      console.log('Generated', paths.length, 'paths');
      
      // Store all paths and IMMEDIATELY set selected path index to 0
      pathRef.current = paths;
      isPathActiveRef.current = false;
      
      // CRITICAL: Set the selected path index IMMEDIATELY and synchronously
      selectedPathIndexRef.current = 0;
      
      // CRITICAL: Set destination IMMEDIATELY and synchronously BEFORE onDraw
      selectedDestRef.current = { x: worldX, y: worldY };
      console.log('Set destination to:', selectedDestRef.current);
      
      // If no valid paths found, clear existing paths
      if (paths.length === 0 && clearPath) {
        clearPath();
        return;
      }
      
      onDraw();
    }
  }
}

// Function to cycle through available paths
export function selectNextPath(pathRef, selectedPathIndexRef, onDraw) {
  if (pathRef.current && pathRef.current.length > 1) {
    selectedPathIndexRef.current = (selectedPathIndexRef.current + 1) % pathRef.current.length;
    onDraw();
  }
}

// Function to select a specific path by index
export function selectPath(pathRef, selectedPathIndexRef, pathIndex, onDraw) {
  if (pathRef.current && pathIndex >= 0 && pathIndex < pathRef.current.length) {
    selectedPathIndexRef.current = pathIndex;
    onDraw();
  }
}

// Get the currently selected path
export function getCurrentPath(pathRef, selectedPathIndexRef) {
  if (!pathRef.current || pathRef.current.length === 0) return [];
  if (pathRef.current.length === 1) return pathRef.current[0];
  return pathRef.current[selectedPathIndexRef.current] || [];
}

// Handle mouse movement for cursor feedback over paths
export function handleCanvasMouseMove(
  e,
  canvasRef,
  pathRef,
  cameraRef
) {
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  const rect = canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;
  
  // Convert to world coordinates
  const worldX = Math.floor(cameraRef.current.x + screenX / GAME_CONFIG.tileSize);
  const worldY = Math.floor(cameraRef.current.y + screenY / GAME_CONFIG.tileSize);
  
  // Check if hovering over a clickable path
  const clickedPathIndex = getClickedPathIndex(worldX, worldY, pathRef);
  const hasMultiplePaths = pathRef.current && pathRef.current.length > 1;
  
  // Set cursor style based on what's under the mouse
  if (clickedPathIndex >= 0 && hasMultiplePaths) {
    canvas.style.cursor = 'pointer';
  } else {
    canvas.style.cursor = 'default';
  }
}

// Check if a clicked position matches any path and return the path index
export function getClickedPathIndex(worldX, worldY, pathRef) {
  if (!pathRef.current || !Array.isArray(pathRef.current)) return -1;
  
  for (let pathIndex = 0; pathIndex < pathRef.current.length; pathIndex++) {
    const path = pathRef.current[pathIndex];
    for (const pathTile of path) {
      if (pathTile.x === worldX && pathTile.y === worldY) {
        return pathIndex;
      }
    }
  }
  return -1;
}