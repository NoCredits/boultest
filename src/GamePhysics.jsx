import { physicsManager } from './PhysicsManager';
import { TILE, GAME_CONFIG } from './GameConstants';
import { index } from './GameUtils';

const { rows, cols } = GAME_CONFIG;

export function updateRocks(dt, rockFallCooldownRef, gridRef, onPlayerDie) {
  // Delegate to PhysicsManager for falling tiles (rocks and diamonds)
  physicsManager.updatePhysics(dt, gridRef, onPlayerDie);
}

export function updateBalloons(dt, balloonFloatCooldownRef, gridRef) {
  balloonFloatCooldownRef.current -= dt;
  if (balloonFloatCooldownRef.current > 0) return;
  
  balloonFloatCooldownRef.current = GAME_CONFIG.ROCK_FALL_INTERVAL; // Same timing as rocks
  
  const grid = gridRef.current;
  const movements = [];
  
  // First pass: track which balloons moved in the previous frame
  // We need to store this state somewhere - for now, let's use a simple approach
  if (!window.balloonStates) window.balloonStates = new Map();
  
  // Process from top to bottom for balloons (they float upward)
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const currentIndex = index(x, y);
      const tileType = grid[currentIndex];
      
      // Only process balloons
      if (tileType !== TILE.BALLOON) continue;
      
      const balloonKey = `${x},${y}`;
      const balloonState = window.balloonStates.get(balloonKey) || { justMoved: false };
      
      // Try to float upward
      const targetY = y - 1;
      
      if (targetY >= 0) {
        const targetIndex = index(x, targetY);
        const targetTile = grid[targetIndex];
        
        if (targetTile === TILE.EMPTY) {
          // Can float upward - move the balloon
          movements.push({
            from: currentIndex,
            to: targetIndex,
            tileType: TILE.BALLOON,
            balloonKey: balloonKey,
            newKey: `${x},${targetY}`,
            justMoved: true
          });
        } else if (targetTile === TILE.DIRT) {
          // Hit dirt - balloon stops peacefully (no explosion)
          window.balloonStates.set(balloonKey, { justMoved: false });
        } else {
          // Hit obstacle (wall, rock, diamond, etc.)
          // Only explode if balloon moved in previous frame
          if (balloonState.justMoved) {
            movements.push({
              from: currentIndex,
              to: currentIndex, // Stay in same place but change type
              tileType: TILE.EXPLOSION_DIAMOND,
              explode: true,
              balloonKey: balloonKey
            });
          } else {
            // Balloon was already stopped, keep it stopped
            window.balloonStates.set(balloonKey, { justMoved: false });
          }
        }
      } else {
        // Hit top of map - explode if moved last frame
        if (balloonState.justMoved) {
          movements.push({
            from: currentIndex,
            to: currentIndex,
            tileType: TILE.EXPLOSION_DIAMOND,
            explode: true,
            balloonKey: balloonKey
          });
        }
      }
    }
  }
  
  // Apply all movements and update balloon states
  movements.forEach(move => {
    if (move.explode) {
      // Balloon explosion - change to explosion diamond
      grid[move.from] = TILE.EXPLOSION_DIAMOND;
      window.balloonStates.delete(move.balloonKey);
    } else {
      // Normal movement
      grid[move.from] = TILE.EMPTY;
      grid[move.to] = move.tileType;
      
      // Update balloon state tracking
      window.balloonStates.delete(move.balloonKey);
      window.balloonStates.set(move.newKey, { justMoved: move.justMoved });
    }
  });
} 