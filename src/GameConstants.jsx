// Game constants and configurations
export const TILE = { 
  EMPTY: 0, 
  WALL: 1, 
  DIRT: 2, 
  ROCK: 3, 
  DIAMOND: 4, 
  PLAYER: 5 
};

export const TILE_COLORS = {
  [TILE.EMPTY]: '#000',
  [TILE.WALL]: '#444',
  [TILE.DIRT]: '#8b5a2b',
  [TILE.ROCK]: '#888',
  [TILE.DIAMOND]: '#0ff',
  [TILE.PLAYER]: '#ff0'
};

export const GAME_CONFIG = {
  tileSize: 40,
  cols: 15,
  rows: 24,
  ROCK_FALL_INTERVAL: 100,
  REPEAT_INITIAL_DELAY: 0,
  REPEAT_INTERVAL: 80,
  PLAYER_MOVE_COOLDOWN: 120
};

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 }
};

export function getDirection(key) {
  switch (key) {
    case 'ArrowUp':
    case 'w':
    case 'W': return DIRECTIONS.UP;
    case 'ArrowDown':
    case 's':
    case 'S': return DIRECTIONS.DOWN;
    case 'ArrowLeft':
    case 'a':
    case 'A': return DIRECTIONS.LEFT;
    case 'ArrowRight':
    case 'd':
    case 'D': return DIRECTIONS.RIGHT;
    default: return null;
  }
}