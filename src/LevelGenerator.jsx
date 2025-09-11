import { TILE, GAME_CONFIG } from './GameConstants';
import { index, markDirty } from './GameUtils';

const { cols, rows } = GAME_CONFIG;

export function createLevel(dirtyTilesRef) {
  const grid = new Array(cols * rows).fill(TILE.DIRT);
  
  // Create border walls
  for (let x = 0; x < cols; x++) {
    grid[index(x, 0)] = TILE.WALL;
    grid[index(x, rows - 1)] = TILE.WALL;
  }
  
  for (let y = 0; y < rows; y++) {
    grid[index(0, y)] = TILE.WALL;
    grid[index(cols - 1, y)] = TILE.WALL;
  }
  
  // Fill interior with random elements
  for (let y = 2; y < rows - 2; y++) {
    for (let x = 2; x < cols - 2; x++) {
      grid[index(x, y)] = Math.random() < 0.12 ? TILE.EMPTY : TILE.DIRT;
      
      if (Math.random() < 0.08) {
        grid[index(x, y)] = TILE.ROCK;
      }
      
      if (Math.random() < 0.11) {
        grid[index(x, y)] = TILE.DIAMOND;
      }
    }
  }
  
  // Add random walls
  for (let i = 0; i < 10; i++) {
    const wx = 4 + Math.floor(Math.random() * (cols - 8));
    const wy = 3 + Math.floor(Math.random() * (rows - 6));
    grid[index(wx, wy)] = TILE.WALL;
  }
  
  // Place player at starting position
  const playerPos = { x: 2, y: 2 };
  grid[index(playerPos.x, playerPos.y)] = TILE.PLAYER;
  
  // Mark all tiles as dirty for initial render
  dirtyTilesRef.current.clear();
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      markDirty(x, y, dirtyTilesRef);
    }
  }
  
  return { grid, playerPos };
}