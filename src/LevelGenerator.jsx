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
    } else if (rand < 0.28) { // 0.26 + 0.02 - rare balloons
      grid[index(x, y)] = TILE.BALLOON;
    } else if (rand < 0.90) { 
      grid[index(x, y)] = TILE.DIRT;
    } 
  }
}
  
  
  return { grid, playerPos };
}

export function createClassicBoulderDashLevel() {
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

  // Fill with dirt as base (like the screenshot)
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      grid[index(x, y)] = TILE.DIRT;
    }
  }

  // Create the horizontal clear passages (blue outlined areas in original)
  // Top passage (around row 4-5)
  const topPassageY = 4;
  for (let x = 2; x < cols - 2; x++) {
    grid[index(x, topPassageY)] = TILE.EMPTY;
    grid[index(x, topPassageY + 1)] = TILE.EMPTY;
  }

  // Bottom passage (around row 12-13)  
  const bottomPassageY = 12;
  for (let x = 2; x < cols - 2; x++) {
    grid[index(x, bottomPassageY)] = TILE.EMPTY;
    grid[index(x, bottomPassageY + 1)] = TILE.EMPTY;
  }

  // Add walls to outline the passages (like the blue borders in original)
  for (let x = 1; x < cols - 1; x++) {
    grid[index(x, topPassageY - 1)] = TILE.WALL;
    grid[index(x, topPassageY + 2)] = TILE.WALL;
    grid[index(x, bottomPassageY - 1)] = TILE.WALL;
    grid[index(x, bottomPassageY + 2)] = TILE.WALL;
  }

  // Add rock clusters matching the screenshot pattern
  // Upper area rocks (scattered throughout dirt)
  const upperRocks = [
    {x: 4, y: 2}, {x: 5, y: 2}, {x: 7, y: 2}, {x: 9, y: 2}, {x: 11, y: 2},
    {x: 13, y: 2}, {x: 15, y: 2}, {x: 17, y: 2}, {x: 19, y: 2},
    {x: 3, y: 3}, {x: 6, y: 3}, {x: 8, y: 3}, {x: 12, y: 3}, {x: 16, y: 3}, {x: 18, y: 3},
  ];

  // Middle area rocks (between passages)
  const middleRocks = [
    {x: 3, y: 7}, {x: 5, y: 7}, {x: 7, y: 7}, {x: 9, y: 7}, {x: 11, y: 7},
    {x: 13, y: 7}, {x: 15, y: 7}, {x: 17, y: 7}, {x: 19, y: 7},
    {x: 4, y: 8}, {x: 6, y: 8}, {x: 8, y: 8}, {x: 10, y: 8}, {x: 14, y: 8}, {x: 18, y: 8},
    {x: 3, y: 9}, {x: 7, y: 9}, {x: 11, y: 9}, {x: 15, y: 9}, {x: 19, y: 9},
    {x: 5, y: 10}, {x: 9, y: 10}, {x: 13, y: 10}, {x: 17, y: 10},
  ];

  // Lower area rocks
  const lowerRocks = [
    {x: 4, y: 16}, {x: 6, y: 16}, {x: 8, y: 16}, {x: 10, y: 16}, {x: 12, y: 16},
    {x: 14, y: 16}, {x: 16, y: 16}, {x: 18, y: 16},
    {x: 3, y: 17}, {x: 7, y: 17}, {x: 11, y: 17}, {x: 15, y: 17}, {x: 19, y: 17},
  ];

  // Place all rocks
  [...upperRocks, ...middleRocks, ...lowerRocks].forEach(pos => {
    if (pos.x < cols - 1 && pos.y < rows - 1) {
      grid[index(pos.x, pos.y)] = TILE.ROCK;
    }
  });

  // Add diamonds scattered among the rocks (like in screenshot)
  const diamonds = [
    {x: 6, y: 2}, {x: 10, y: 2}, {x: 14, y: 2}, {x: 18, y: 2},
    {x: 4, y: 3}, {x: 9, y: 3}, {x: 13, y: 3}, {x: 17, y: 3},
    {x: 6, y: 7}, {x: 10, y: 7}, {x: 16, y: 7},
    {x: 5, y: 8}, {x: 12, y: 8}, {x: 16, y: 8},
    {x: 4, y: 9}, {x: 8, y: 9}, {x: 12, y: 9}, {x: 16, y: 9},
    {x: 7, y: 10}, {x: 11, y: 10}, {x: 15, y: 10},
    {x: 5, y: 16}, {x: 9, y: 16}, {x: 13, y: 16}, {x: 17, y: 16},
    {x: 5, y: 17}, {x: 9, y: 17}, {x: 13, y: 17}, {x: 17, y: 17},
  ];

  diamonds.forEach(pos => {
    if (pos.x < cols - 1 && pos.y < rows - 1) {
      grid[index(pos.x, pos.y)] = TILE.DIAMOND;
    }
  });

  // Add some lava pools for danger
  const lavaPools = [
    // Small lava pool in upper area
    {x: 8, y: 6}, {x: 9, y: 6},
    {x: 8, y: 5}, {x: 9, y: 5},
    
    // Lava pool in middle area
    {x: 14, y: 9}, {x: 15, y: 9}, {x: 16, y: 9},
    {x: 14, y: 10}, {x: 15, y: 10}, {x: 16, y: 10},
    
    // Small lava pool in lower area
    {x: 6, y: 15}, {x: 7, y: 15},
  ];

  lavaPools.forEach(pos => {
    if (pos.x < cols - 1 && pos.y < rows - 1) {
      grid[index(pos.x, pos.y)] = TILE.LAVA;
    }
  });

  // Place player at starting position (top-left, like in original)
  const playerPos = { x: 2, y: 2 };
  grid[index(playerPos.x, playerPos.y)] = TILE.PLAYER;
  
  // Clear small area around player start
  grid[index(playerPos.x + 1, playerPos.y)] = TILE.EMPTY;
  grid[index(playerPos.x, playerPos.y + 1)] = TILE.EMPTY;
  
  return { grid, playerPos };
}