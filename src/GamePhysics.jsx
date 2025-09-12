import { TILE, GAME_CONFIG } from './GameConstants';
import { index, playRockFallSound, playDiamondFallSound } from './GameUtils';

const { cols, rows } = GAME_CONFIG;

export function updateRocks(dt, rockFallCooldownRef, gridRef,  onPlayerDie) {
  rockFallCooldownRef.current -= dt;
  if (rockFallCooldownRef.current > 0) return;
  
  rockFallCooldownRef.current = GAME_CONFIG.ROCK_FALL_INTERVAL;
  const grid = gridRef.current;
  
  // Process from bottom to top to avoid processing same rock multiple times
  for (let y = rows - 2; y >= 1; y--) {
    for (let x = 1; x < cols - 1; x++) {
      const id = index(x, y);
      

      // Only process rocks and diamonds
      if (grid[id] !== TILE.ROCK && grid[id] !== TILE.DIAMOND) continue;
      
      const belowId = index(x, y + 1);
      const belowBelowId = index(x, y + 2);
      
      // PRIORITY 1: Fall straight down if space is empty
      if (grid[belowId] === TILE.EMPTY) {
        grid[belowId] = grid[id];
        grid[id] = TILE.EMPTY;
        
        // Play sound if it will hit something
        if (y + 2 < rows && grid[belowBelowId] !== TILE.EMPTY) {
          if (grid[belowId] === TILE.ROCK) playRockFallSound();
          if (grid[belowId] === TILE.DIAMOND) playDiamondFallSound();
        }
        
        // Check if player is crushed
        if (y + 2 < rows && grid[belowBelowId] === TILE.PLAYER) {
          onPlayerDie();
        }
        continue;
      }
      
      // PRIORITY 2: Try to roll left (only if can't fall straight)
      if (canRollLeft(x, y, grid)) {
        grid[index(x - 1, y + 1)] = grid[id];
        grid[id] = TILE.EMPTY;
        
        // Play sound
        if (grid[index(x - 1, y + 1)] === TILE.ROCK) playRockFallSound();
        if (grid[index(x - 1, y + 1)] === TILE.DIAMOND) playDiamondFallSound();
        
        // Check if player is crushed
        if (y + 2 < rows && x - 1 >= 0 && grid[index(x - 1, y + 2)] === TILE.PLAYER) {
          onPlayerDie();
        }
        continue;
      }
      
      // PRIORITY 3: Try to roll right (only if can't fall straight or left)
      if (canRollRight(x, y, grid)) {
        // Move the rock/diamond to the right and down
        grid[index(x + 1, y + 1)] = grid[id];
        grid[id] = TILE.EMPTY;

        // Play sound for falling rock/diamond
        if (grid[index(x + 1, y + 1)] === TILE.ROCK) playRockFallSound();
        if (grid[index(x + 1, y + 1)] === TILE.DIAMOND) playDiamondFallSound();

        // Check if player is crushed by rolling right
        if (y + 2 < rows && x + 1 < cols && grid[index(x + 1, y + 2)] === TILE.PLAYER) {
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
    x - 1 >= 0 && // Bounds check
    grid[index(x - 1, y)] === TILE.EMPTY &&
    grid[index(x - 1, y + 1)] === TILE.EMPTY &&
    (grid[belowId] === TILE.ROCK || grid[belowId] === TILE.DIAMOND) &&
    grid[belowId] !== TILE.PLAYER
  );
}

function canRollRight(x, y, grid) {
  const belowId = index(x, y + 1);
  return (
    x + 1 < cols && // Bounds check
    grid[index(x + 1, y)] === TILE.EMPTY &&
    grid[index(x + 1, y + 1)] === TILE.EMPTY &&
    (grid[belowId] === TILE.ROCK || grid[belowId] === TILE.DIAMOND) &&
    grid[belowId] !== TILE.PLAYER
  );
} 