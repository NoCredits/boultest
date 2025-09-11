import { GAME_CONFIG } from './GameConstants';

const { cols, rows } = GAME_CONFIG;

// Utility functions for grid operations
export function index(x, y) { 
  return y * cols + x; 
}

export function inBounds(x, y) { 
  return x >= 0 && y >= 0 && x < cols && y < rows; 
}

export function markDirty(x, y, dirtyTilesRef) { 
  if (inBounds(x, y)) {
    dirtyTilesRef.current.add(index(x, y)); 
  }
}

export function coordsFromIndex(idx) {
  return {
    x: idx % cols,
    y: Math.floor(idx / cols)
  };
}