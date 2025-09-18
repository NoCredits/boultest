import { physicsManager } from './PhysicsManager';
import { TILE, GAME_CONFIG } from './GameConstants';
import { index, fromIndex, inBounds } from './GameUtils';

const { rows, cols } = GAME_CONFIG;

export function updateRocks(dt, rockFallCooldownRef, gridRef, onPlayerDie) {
  // Delegate to PhysicsManager for falling tiles (rocks and diamonds)
  physicsManager.updatePhysics(dt, gridRef, onPlayerDie);
}  