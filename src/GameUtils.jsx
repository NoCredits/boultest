import { GAME_CONFIG } from './GameConstants';
import { MOVESOUND, DIAMONDSOUND, ROCKFALLSOUND, DIAMONDFALLSOUND } from './GameConstants';

// Global audio unlock flag
export let audioUnlocked = false;
export function unlockAudio() {
  audioUnlocked = true;
}

const { cols, rows } = GAME_CONFIG;

// Utility functions for grid operations
export function index(x, y) { 
  return y * cols + x; 
}

export function inBounds(x, y) { 
  return x >= 0 && y >= 0 && x < cols && y < rows; 
}

export function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function coordsFromIndex(idx) {
  return {
    x: idx % cols,
    y: Math.floor(idx / cols)
  };
}

export function playMoveSound() {
  if (audioUnlocked) {
    MOVESOUND.currentTime = 0;
    DIAMONDSOUND.volume = 0.5;
    MOVESOUND.play();
  }
}

export function playDiamondSound() {
  if (audioUnlocked) {
    DIAMONDSOUND.currentTime = 0;
    DIAMONDSOUND.volume = 0.5;
    DIAMONDSOUND.play();
  }
}

export function playRockFallSound() {
  if (audioUnlocked) {
    ROCKFALLSOUND.currentTime = 0;
    ROCKFALLSOUND.play();
  }       
}

export function playDiamondFallSound() {
  if (audioUnlocked) {
    DIAMONDFALLSOUND.currentTime = 0;
    DIAMONDFALLSOUND.play();
  }
}
