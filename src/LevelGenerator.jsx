import { TILE, GAME_CONFIG } from './GameConstants';
import { index } from './GameUtils';

const { cols, rows } = GAME_CONFIG;

export function createLevel() {
  const grid = new Array(cols * rows).fill(TILE.EMPTY);
  
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
  // for (let y = 2; y < rows - 2; y++) {
  //   for (let x = 2; x < cols - 2; x++) {
  //     if (x === 2 && y === 2) continue; // Leave player start empty
  //     grid[index(x, y)] = Math.random() < 0.18 ? TILE.EMPTY : TILE.DIRT;
      
  //     if (Math.random() < 0.08) {
  //       grid[index(x, y)] = TILE.ROCK;
  //     } else if (Math.random() < 0.11) {
  //       grid[index(x, y)] = TILE.DIAMOND;
  //     } else if (Math.random() < 0.07) {
  //       grid[index(x, y)] = TILE.WALL;
  //     }
  //   }
  // }

  
  // Place player at starting position
  const playerPos = { x: 2, y: 2 };
  grid[index(playerPos.x, playerPos.y)] = TILE.PLAYER;

  for (let y = 1; y < rows - 1; y++) {
  for (let x = 1; x < cols - 1; x++) {

    if (x === playerPos.x && y === playerPos.y) continue; // Leave player start empty
    
    const rand = Math.random();
    
    if (rand < 0.08) {
      grid[index(x, y)] = TILE.ROCK;
    } else if (rand < 0.19) { // 0.08 + 0.11
      grid[index(x, y)] = TILE.DIAMOND;
    } else if (rand < 0.26) { // 0.19 + 0.07
      grid[index(x, y)] = TILE.WALL;
    } else if (rand < 0.90) { 
      grid[index(x, y)] = TILE.DIRT;
    } 
  }
}
  
  
  return { grid, playerPos };
}