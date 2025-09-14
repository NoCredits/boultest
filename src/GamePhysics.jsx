import { physicsManager } from './PhysicsManager';

export function updateRocks(dt, rockFallCooldownRef, gridRef, onPlayerDie) {
  // Delegate to PhysicsManager for falling tiles (rocks and diamonds)
  physicsManager.updatePhysics(dt, gridRef, onPlayerDie);
}

export function updateBalloons(dt, balloonFloatCooldownRef, gridRef) {
  // Balloon physics are now handled by PhysicsManager.updatePhysics()
  // This function kept for compatibility but logic moved to tile-based system
} 