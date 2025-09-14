// Game constants and configurations
export const TILE = { 
  EMPTY: 0, 
  WALL: 1, 
  DIRT: 2, 
  ROCK: 3, 
  DIAMOND: 4, 
  PLAYER: 5,
  BALLOON: 6,
  EXPLOSION_DIAMOND: 7
};

export const TILE_COLORS = {
  [TILE.EMPTY]: '#000',
  [TILE.WALL]: '#444',
  [TILE.DIRT]: '#8b5a2b',
  [TILE.ROCK]: '#888',
  [TILE.DIAMOND]: '#0ff',
  [TILE.PLAYER]: '#ff0',
  [TILE.BALLOON]: '#ff0080',
  [TILE.EXPLOSION_DIAMOND]: '#ff6600'
};

export const GAME_CONFIG = {
  tileSize: 40,
  cols: 25,
  rows: 24,
  ROCK_FALL_INTERVAL: 100,
  REPEAT_INITIAL_DELAY: 150,
  REPEAT_INTERVAL: 120,
  PLAYER_MOVE_COOLDOWN: 180,
   VIEWPORT_WIDTH: 15,  // number of tiles visible horizontally
  VIEWPORT_HEIGHT: 10, // number of tiles visible vertically
  MAX_VIEWPORT_TILES_X: 15, // maximum tiles visible horizontally
  MAX_VIEWPORT_TILES_Y: 15, // can be adjusted dynamically, based on window aspect ratio
};

export const MOVESOUND = new Audio('/sounds/move.mp3');
export const DIAMONDSOUND = new Audio('/sounds/diamond.mp3');
export const ROCKFALLSOUND = new Audio('/sounds/rockfall.mp3');
export const DIAMONDFALLSOUND = new Audio('/sounds/diamondfall.mp3');
export let audioUnlocked = false; // Flag to track if audio is unlocked

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