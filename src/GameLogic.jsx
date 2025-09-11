import { TILE, GAME_CONFIG } from './GameConstants';
import { getDirection } from './GameConstants';
import { index, inBounds, markDirty } from './GameUtils';

const { cols, rows } = GAME_CONFIG;

export function doMove(key, playerRef, gridRef, dirtyTilesRef, onScoreUpdate, onLevelComplete, updateRocks) {
  const player = playerRef.current;
  const dir = getDirection(key);
  if (!dir) return;

  const tx = player.x + dir.x;
  const ty = player.y + dir.y;
  if (!inBounds(tx, ty)) return;

  const targetTile = gridRef.current[index(tx, ty)];
  
  // Handle wall or rock collision
  if (targetTile === TILE.WALL || targetTile === TILE.ROCK) {
    if (targetTile === TILE.ROCK && dir.x !== 0 && dir.y === 0) {
      // Try to push rock horizontally
      const pushX = tx + dir.x;
      const pushY = ty;
      if (inBounds(pushX, pushY) && gridRef.current[index(pushX, pushY)] === TILE.EMPTY) {
        // Move rock and player
        gridRef.current[index(pushX, pushY)] = TILE.ROCK;
        gridRef.current[index(tx, ty)] = TILE.EMPTY;
        gridRef.current[index(player.x, player.y)] = TILE.EMPTY;
        
        player.x = tx;
        player.y = ty;
        gridRef.current[index(player.x, player.y)] = TILE.PLAYER;
        
        markDirty(pushX, pushY, dirtyTilesRef);
        markDirty(tx, ty, dirtyTilesRef);
        markDirty(player.x - dir.x, player.y, dirtyTilesRef);
        
        updateRocks(0);
      }
    }
    return;
  }

  // Handle diamond collection
  if (targetTile === TILE.DIAMOND) {
    onScoreUpdate(prevScore => {
      const newScore = prevScore + 1;
      
      // Check if all diamonds collected
      const remainingDiamonds = gridRef.current.filter(tile => tile === TILE.DIAMOND).length - 1;
      if (remainingDiamonds === 0) {
        onLevelComplete(newScore);
      }
      
      return newScore;
    });
  }

  // Execute move
  gridRef.current[index(player.x, player.y)] = TILE.EMPTY;
  markDirty(player.x, player.y, dirtyTilesRef);
  
  player.x = tx;
  player.y = ty;
  gridRef.current[index(player.x, player.y)] = TILE.PLAYER;
  markDirty(player.x, player.y, dirtyTilesRef);
}

export function stepPlayerAlongPath(pathRef, playerRef, gridRef, dirtyTilesRef, onScoreUpdate, onLevelComplete, onPathComplete) {
  if (pathRef.current.length === 0) {
    onPathComplete();
    return;
  }

  const next = pathRef.current.shift();
  const grid = gridRef.current;
  const t = grid[index(next.x, next.y)];

  // Check if path is blocked
  if (t === TILE.WALL || t === TILE.ROCK) {
    pathRef.current = [];
    onPathComplete();
    return;
  }

  // Handle diamond collection
  if (t === TILE.DIAMOND) {
    onScoreUpdate(s => s + 1);
    
    // Check if level complete
    if (!grid.includes(TILE.DIAMOND)) {
      pathRef.current = [];
      onPathComplete();
      onLevelComplete();
      return;
    }
  }

  // Move player
  grid[index(playerRef.current.x, playerRef.current.y)] = TILE.EMPTY;
  markDirty(playerRef.current.x, playerRef.current.y, dirtyTilesRef);
  
  playerRef.current.x = next.x;
  playerRef.current.y = next.y;
  grid[index(playerRef.current.x, playerRef.current.y)] = TILE.PLAYER;
  markDirty(playerRef.current.x, playerRef.current.y, dirtyTilesRef);
}

export function handlePlayerDeath(playerRef, gridRef, dirtyTilesRef, onLifeLost, onPathClear) {
  // Find empty space for respawn
  let respawnX = 2;
  let respawnY = 2;
  const grid = gridRef.current;
  
  // Find first available empty space
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (grid[index(x, y)] === TILE.EMPTY) {
        respawnX = x;
        respawnY = y;
        y = rows; // Break outer loop
        break;
      }
    }
  }
  
  // Remove player from current position
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === TILE.PLAYER) {
      grid[i] = TILE.EMPTY;
      markDirty(i % cols, Math.floor(i / cols), dirtyTilesRef);
    }
  }
  
  // Place player at respawn position
  playerRef.current.x = respawnX;
  playerRef.current.y = respawnY;
  grid[index(playerRef.current.x, playerRef.current.y)] = TILE.PLAYER;
  markDirty(playerRef.current.x, playerRef.current.y, dirtyTilesRef);
  
  // Clear any active paths
  onPathClear();
  
  // Update lives
  onLifeLost();
}