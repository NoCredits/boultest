import { physicsManager } from './PhysicsManager';
import { TILE, GAME_CONFIG } from './GameConstants';
import { index, fromIndex, inBounds } from './GameUtils';

const { rows, cols } = GAME_CONFIG;

export function updateRocks(dt, rockFallCooldownRef, gridRef, onPlayerDie) {
  // Delegate to PhysicsManager for falling tiles (rocks and diamonds)
  physicsManager.updatePhysics(dt, gridRef, onPlayerDie);
}

export function updateBalloons(dt, balloonFloatCooldownRef, gridRef) {
  balloonFloatCooldownRef.current -= dt;
  if (balloonFloatCooldownRef.current > 0) return;
  balloonFloatCooldownRef.current = GAME_CONFIG.ROCK_FALL_INTERVAL; // Same timing as rocks
  // Debug: print each balloon's position and state
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const currentIndex = index(x, y);
      const tileType = grid[currentIndex];
      if (tileType === TILE.BALLOON) {
        const balloonKey = `${x},${y}`;
        const balloonState = window.balloonStates.get(balloonKey);
        console.log(`[Balloon] At (${x},${y}) state:`, balloonState);
      }
    }
  }
  // Debug: log entry and balloon count
  let balloonCount = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (gridRef.current[index(x, y)] === TILE.BALLOON) balloonCount++;
    }
  }
  console.log(`[updateBalloons] Called. Balloons on map: ${balloonCount}`);
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
          console.debug(`[Balloon] (${x},${y}) floats to (${x},${targetY})`);
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
          console.debug(`[Balloon] (${x},${y}) stops on dirt`);
          window.balloonStates.set(balloonKey, { justMoved: false });
        } else {
          // Hit obstacle (wall, rock, diamond, etc.)
          // Only explode if balloon moved in previous frame
          if (balloonState.justMoved) {
            console.debug(`[Balloon] (${x},${y}) explodes on obstacle (${targetTile})`);
            movements.push({
              from: currentIndex,
              to: currentIndex, // Stay in same place but change type
              tileType: TILE.EXPLOSION_DIAMOND,
              explode: true,
              balloonKey: balloonKey
            });
          } else {
            // Balloon was already stopped, keep it stopped
            console.debug(`[Balloon] (${x},${y}) hits obstacle (${targetTile}) but does not explode (justMoved: false)`);
            window.balloonStates.set(balloonKey, { justMoved: false });
          }
        }
      } else {
        // Hit top of map - explode if moved last frame
        if (balloonState.justMoved) {
          console.debug(`[Balloon] (${x},${y}) explodes at top of map`);
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
      console.debug(`[Balloon] Explosion at (${fromIndex(move.from).x},${fromIndex(move.from).y})`);
      grid[move.from] = TILE.EXPLOSION_DIAMOND;
      window.balloonStates.delete(move.balloonKey);
    } else {
      // Normal movement
      console.debug(`[Balloon] Move from (${fromIndex(move.from).x},${fromIndex(move.from).y}) to (${fromIndex(move.to).x},${fromIndex(move.to).y})`);
      grid[move.from] = TILE.EMPTY;
      grid[move.to] = move.tileType;
      // Update balloon state tracking
      window.balloonStates.delete(move.balloonKey);
      window.balloonStates.set(move.newKey, { justMoved: true });
    }
  });
} 