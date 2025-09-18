import { TILE, GAME_CONFIG } from './GameConstants';
import { playRockFallSound, playDiamondFallSound } from './GameUtils';
import { 
  EmptyTile, WallTile, DirtTile, RockTile, DiamondTile, PlayerTile,
  HeavyRockTile, BouncyRockTile, BalloonTile, LavaTile, 
  RubyCrystalTile, EmeraldCrystalTile, ExplosionDiamondTile
} from './tiles';

const { cols, rows } = GAME_CONFIG;

/**
 * PhysicsManager - Coordinates physics updates across all tiles
 */
export class PhysicsManager {
  constructor() {
    this.rockFallCooldown = 0;
    this.balloonFloatCooldown = 0;
    this.tileInstanceMap = new Map(); // Cache tile instances by grid position
    this.balloonStates = new Map(); // Track balloon movement states across frames
  }

  /**
   * Create a tile instance for the given tile type and position
   * @param {number} tileType - The tile type constant
   * @param {number} x - X position
   * @param {number} y - Y position
   * @returns {Tile} Tile instance
   */
  createTileInstance(tileType, x, y) {
    const key = `${x},${y},${tileType}`;
    
    // Return cached instance if it exists and hasn't changed type
    if (this.tileInstanceMap.has(key)) {
      return this.tileInstanceMap.get(key);
    }

    let tile;
    switch (tileType) {
      case TILE.EMPTY: tile = new EmptyTile(x, y); break;
      case TILE.WALL: tile = new WallTile(x, y); break;
      case TILE.DIRT: tile = new DirtTile(x, y); break;
      case TILE.ROCK: tile = new RockTile(x, y); break;
      case TILE.DIAMOND: tile = new DiamondTile(x, y); break;
      case TILE.PLAYER: tile = new PlayerTile(x, y); break;
      case TILE.BALLOON: 
        tile = new BalloonTile(x, y); 
        // Restore balloon state from previous frame
        const balloonKey = `${x},${y}`;
        const balloonState = this.balloonStates.get(balloonKey);
        if (balloonState) {
          tile.justMoved = balloonState.justMoved;
        }
        break;
      case TILE.EXPLOSION_DIAMOND: tile = new ExplosionDiamondTile(x, y); break;
      case TILE.LAVA: tile = new LavaTile(x, y); break;
      default: tile = new EmptyTile(x, y); break;
    }

    this.tileInstanceMap.set(key, tile);
    return tile;
  }

  /**
   * Update physics for all tiles that have physics behavior
   * @param {number} deltaTime - Time since last update
   * @param {Object} gridRef - Reference to game grid
   * @param {Function} onPlayerDie - Callback when player dies
   */
  updatePhysics(deltaTime, gridRef, onPlayerDie) {
    // Update rock/diamond physics
    this.updateFallingTiles(deltaTime, gridRef, onPlayerDie);
    
    // Update balloon physics
    this.updateFloatingTiles(deltaTime, gridRef, onPlayerDie);
  }

  /**
   * Update physics for rocks and diamonds (falling/rolling tiles)
   */
  updateFallingTiles(deltaTime, gridRef, onPlayerDie) {
    this.rockFallCooldown -= deltaTime;
    if (this.rockFallCooldown > 0) return;
    
    this.rockFallCooldown = GAME_CONFIG.ROCK_FALL_INTERVAL;
    const grid = gridRef.current;
    
    // Process from bottom to top to avoid processing same tile multiple times
    for (let y = rows - 2; y >= 1; y--) {
      for (let x = 1; x < cols - 1; x++) {
        const id = y * cols + x;
        const tileType = grid[id];
        
        // Only process rocks and diamonds
        if (tileType !== TILE.ROCK && tileType !== TILE.DIAMOND) continue;
        
        const tile = this.createTileInstance(tileType, x, y);
        const physicsResult = tile.updatePhysics(deltaTime, grid, cols, rows, {});
        
        if (physicsResult) {
          // Apply the physics movement
          this.applyPhysicsResult(physicsResult, grid, onPlayerDie);
        }
      }
    }
  }

  /**
   * Update physics for balloons (floating tiles)
   */
  updateFloatingTiles(deltaTime, gridRef, onPlayerDie) {
  this.balloonFloatCooldown -= deltaTime;
  if (this.balloonFloatCooldown > 0) return;
  // Slow-motion: set to 1200ms for testing
  //this.balloonFloatCooldown = 200;
  this.balloonFloatCooldown = GAME_CONFIG.ROCK_FALL_INTERVAL;
    const grid = gridRef.current;
    
    // Process from top to bottom for balloons (they float upward)
    // Include all rows since balloons can be at edges
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const id = y * cols + x;
        const tileType = grid[id];
        
        // Only process balloons
        if (tileType !== TILE.BALLOON) continue;
        
        const tile = this.createTileInstance(tileType, x, y);
        const physicsResult = tile.updatePhysics(deltaTime, grid, cols, rows, {});
        
        if (physicsResult) {
          // Apply the physics movement
          this.applyPhysicsResult(physicsResult, grid, onPlayerDie);
        } else {
          // Balloon didn't move this frame - clear its justMoved state
          const balloonKey = `${x},${y}`;
          this.balloonStates.set(balloonKey, { justMoved: false });
        }
      }
    }
  }

  /**
   * Apply physics result to the game grid
   * @param {Object} result - Physics result from tile
   * @param {Array} grid - Game grid
   * @param {Function} onPlayerDie - Player death callback
   */
  applyPhysicsResult(result, grid, onPlayerDie) {
    const { from, to, sound, killPlayer, explode, smoothMovement } = result;
    const fromId = from.y * cols + from.x;
    const toId = to.y * cols + to.x;
    
    if (explode) {
      // Balloon explosion
      grid[fromId] = TILE.EXPLOSION_DIAMOND;
      // Remove balloon state
      this.balloonStates.delete(`${from.x},${from.y}`);
    } 
    // else if (smoothMovement) {
    //   // For smooth movement, only update grid when movement is complete
    //   // The tile instance handles visual interpolation
    //   // Grid changes will be applied when movement finishes
    //   grid[toId] = grid[fromId];
    //   grid[fromId] = TILE.EMPTY;
      
    //   // Update balloon state tracking for movement
    //   if (grid[toId] === TILE.BALLOON) {
    //     this.balloonStates.delete(`${from.x},${from.y}`);
    //     this.balloonStates.set(`${to.x},${to.y}`, { justMoved: true });
    //   }
    // } 
    else {
      // Instant movement (legacy behavior)
      grid[toId] = grid[fromId];
      grid[fromId] = TILE.EMPTY;
      
      // Update balloon state tracking for movement
      if (grid[toId] === TILE.BALLOON) {
        this.balloonStates.delete(`${from.x},${from.y}`);
        this.balloonStates.set(`${to.x},${to.y}`, { justMoved: true });
      }
    }
    
    // Play sound if specified
    if (sound === 'rockfall') {
      playRockFallSound();
    } else if (sound === 'diamondfall') {
      playDiamondFallSound();
    }
    
    // Handle player death
    if (killPlayer && onPlayerDie) {
      onPlayerDie();
    }
    
    // Clear cached tile instances for moved positions
    this.clearTileCache(from.x, from.y);
    if (from.x !== to.x || from.y !== to.y) {
      this.clearTileCache(to.x, to.y);
    }
  }

  /**
   * Clear cached tile instance for a position
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  clearTileCache(x, y) {
    // Clear all cached instances at this position (different tile types)
    const keysToDelete = [];
    for (const key of this.tileInstanceMap.keys()) {
      if (key.startsWith(`${x},${y},`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.tileInstanceMap.delete(key));
  }

  /**
   * Clear all cached tile instances (call when grid resets)
   */
  clearAllCache() {
    this.tileInstanceMap.clear();
  }
}

// Export singleton instance
export const physicsManager = new PhysicsManager();