// Game constants and configurations
export const TILE = { 
  EMPTY: 0, 
  WALL: 1, 
  DIRT: 2, 
  ROCK: 3, 
  DIAMOND: 4, 
  PLAYER: 5,
  BALLOON: 6,
  EXPLOSION_DIAMOND: 7,
  LAVA: 8
};

export const TILE_COLORS = {
  [TILE.EMPTY]: '#000',
  [TILE.WALL]: '#444',
  [TILE.DIRT]: '#8b5a2b',
  [TILE.ROCK]: '#888',
  [TILE.DIAMOND]: '#0ff',
  [TILE.PLAYER]: '#ff0',
  [TILE.BALLOON]: '#ff0080',
  [TILE.EXPLOSION_DIAMOND]: '#ff6600',
  [TILE.LAVA]: '#FF4500'
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

// Animation timing constants - easy to adjust animation speeds
export const ANIMATION_SPEEDS = {
  DIAMOND_SPARKLE_CYCLE: 1000,    // 1 second for diamond sparkle cycle
  BALLOON_FLOAT_CYCLE: 6000,      // 6 seconds for balloon floating animation  
  ROCK_FALL_BOBBING_CYCLE: 4000,  // 4 seconds for rock fall bobbing
  DIRT_PARTICLE_CYCLE: 2000,      // 2 seconds for dirt particle movement
  LAVA_WAVE_CYCLE: 3000,          // 3 seconds for lava wave animation
  PLAYER_WALK_CYCLE: 800,         // 0.8 seconds for player walk cycle
  EXPLOSION_PULSE_CYCLE: 1500,    // 1.5 seconds for explosion diamond pulsing
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