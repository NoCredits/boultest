import { TILE, GAME_CONFIG } from './GameConstants';
import { index, markDirty } from './GameUtils';

const { cols, rows } = GAME_CONFIG;

export function updateRocks(dt, rockFallCooldownRef, gridRef, dirtyTilesRef, onPlayerDie) {
  rockFallCooldownRef.current -= dt;
  if (rockFallCooldownRef.current > 0) return;
  
  rockFallCooldownRef.current = GAME_CONFIG.ROCK_FALL_INTERVAL;
  const grid = gridRef.current;
  
  // Process from bottom to top to avoid processing same rock multiple times
  for (let y = rows - 2; y >= 1; y--) {
    for (let x = 1; x < cols - 1; x++) {
      const id = index(x, y);
      if (grid[id] !== TILE.ROCK && grid[id] !== TILE.DIAMOND) continue;
      
      const belowId = index(x, y + 1);
      const belowBelowId = index(x, y + 2);
      
      // Fall straight down if space is empty
      if (grid[belowId] === TILE.EMPTY) {
        grid[belowId] = grid[id];
        grid[id] = TILE.EMPTY;
        markDirty(x, y, dirtyTilesRef);
        markDirty(x, y + 1, dirtyTilesRef);
        
        // Check if player is crushed
        if (grid[belowBelowId] === TILE.PLAYER) {
          onPlayerDie();
        }
        continue;
      }
      
      // Try to roll left
      if (canRollLeft(x, y, grid)) {
        grid[index(x - 1, y + 1)] = grid[id];
        grid[id] = TILE.EMPTY;
        markDirty(x, y, dirtyTilesRef);
        markDirty(x - 1, y + 1, dirtyTilesRef);
        
        // Check if player is crushed
        if (grid[index(x - 1, y + 2)] === TILE.PLAYER) {
          onPlayerDie();
        }
        continue;
      }
      
      // Try to roll right
      if (canRollRight(x, y, grid)) {
        grid[index(x + 1, y + 1)] = grid[id];
        grid[id] = TILE.EMPTY;
        markDirty(x, y, dirtyTilesRef);
        markDirty(x + 1, y + 1, dirtyTilesRef);
        
        // Check if player is crushed
        if (grid[index(x + 1, y + 2)] === TILE.PLAYER) {
          onPlayerDie();
        }
        continue;
      }
    }
  }
}

function canRollLeft(x, y, grid) {
  const belowId = index(x, y + 1);
  return (
    grid[index(x - 1, y)] === TILE.EMPTY &&
    grid[index(x - 1, y + 1)] === TILE.EMPTY &&
    (grid[belowId] === TILE.ROCK || grid[belowId] === TILE.DIAMOND) &&
    grid[belowId] !== TILE.PLAYER
  );
}

function canRollRight(x, y, grid) {
  const belowId = index(x, y + 1);
  return (
    grid[index(x + 1, y)] === TILE.EMPTY &&
    grid[index(x + 1, y + 1)] === TILE.EMPTY &&
    (grid[belowId] === TILE.ROCK || grid[belowId] === TILE.DIAMOND) &&
    grid[belowId] !== TILE.PLAYER
  );
}