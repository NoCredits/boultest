/**
 * Base Tile Class
 * All game tiles inherit from this class to ensure consistent interface
 * Provides foundation for animate() and draw() methods
 */
export class Tile {
  constructor(x, y, type) {
    this.x = x;           // Grid position X
    this.y = y;           // Grid position Y
    this.type = type;     // Tile type identifier
    this.animationTime = 0;
    this.properties = {}; // Extensible properties for different tile variants
    
    // Smooth movement properties
    this.currentX = x;    // Current interpolated X position (can be fractional)
    this.currentY = y;    // Current interpolated Y position (can be fractional)
    this.targetX = x;     // Target grid X position
    this.targetY = y;     // Target grid Y position
    this.moveProgress = 1.0; // Movement progress (0.0 = at start, 1.0 = at target)
    this.moveDuration = 50; // Duration of movement animation in milliseconds
    this.isMoving = false;   // Whether tile is currently moving
  }

  /**
   * Update tile animation state
   * Override in subclasses for custom animations
   * @param {number} deltaTime - Time since last update
   * @param {Object} gameState - Current game state for context
   */
  animate(deltaTime, gameState) {
    this.animationTime += deltaTime;
    
    // Update smooth movement
    this.updateSmoothMovement(deltaTime);
  }

  /**
   * Update smooth movement interpolation
   * @param {number} deltaTime - Time since last update
   */
  updateSmoothMovement(deltaTime) {
    if (!this.isMoving) return;
    
    // Update movement progress
    this.moveProgress += deltaTime / this.moveDuration;
    
    if (this.moveProgress >= 1.0) {
      // Movement complete
      this.moveProgress = 1.0;
      this.currentX = this.targetX;
      this.currentY = this.targetY;
      this.x = this.targetX;
      this.y = this.targetY;
      this.isMoving = false;
    } else {
      // Interpolate position using easing function
      const easeProgress = this.easeInOutQuad(this.moveProgress);
      const startX = this.x;
      const startY = this.y;
      
      this.currentX = startX + (this.targetX - startX) * easeProgress;
      this.currentY = startY + (this.targetY - startY) * easeProgress;
    }
  }

  /**
   * Start smooth movement to target position
   * @param {number} targetX - Target grid X position
   * @param {number} targetY - Target grid Y position
   * @param {number} duration - Movement duration in milliseconds (optional)
   */
  startSmoothMovement(targetX, targetY, duration = 200) {
    if (this.isMoving) {
      // If already moving, start from current interpolated position
      this.x = Math.round(this.currentX);
      this.y = Math.round(this.currentY);
    }
    
    this.targetX = targetX;
    this.targetY = targetY;
    this.moveDuration = duration;
    this.moveProgress = 0.0;
    this.isMoving = true;
  }

  /**
   * Easing function for smooth movement
   * @param {number} t - Progress value (0-1)
   * @returns {number} Eased progress value
   */
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  /**
   * Get current visual position for rendering
   * @returns {Object} {x, y} current position including smooth movement
   */
  getVisualPosition() {
    return {
      x: this.currentX,
      y: this.currentY
    };
  }

  /**
   * Draw the tile to canvas
   * Override in subclasses for custom rendering
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} pixelX - Screen pixel X position
   * @param {number} pixelY - Screen pixel Y position
   * @param {number} tileSize - Size of tile in pixels
   * @param {Object} gameState - Current game state for context
   * @param {Array} grid - Game grid for checking adjacent tiles (optional)
   * @param {number} cols - Number of columns in grid (optional)
   * @param {number} mapX - Map X coordinate (optional)
   * @param {number} mapY - Map Y coordinate (optional)
   */
  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    // Base implementation - draw simple colored square
    ctx.fillStyle = this.getBaseColor();
    ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
  }

  /**
   * Get base color for this tile type
   * Override in subclasses
   */
  getBaseColor() {
    return '#888888'; // Default gray
  }

  /**
   * Check if this tile blocks movement
   * Override in subclasses
   */
  isBlocking() {
    return false;
  }

  /**
   * Check if this tile can fall/move
   * Override in subclasses
   */
  canMove() {
    return false;
  }

  // ========== PHYSICS METHODS ==========
  
  /**
   * Check if this tile can fall straight down
   * @param {Array} grid - The game grid
   * @param {number} cols - Number of columns
   * @param {number} rows - Number of rows
   * @returns {boolean} True if can fall down
   */
  canFallDown(grid, cols, rows) {
    if (this.y + 1 >= rows) return false;
    const belowIndex = (this.y + 1) * cols + this.x;
    return grid[belowIndex] === 0; // TILE.EMPTY = 0
  }

  /**
   * Check if this tile can roll left
   * @param {Array} grid - The game grid
   * @param {number} cols - Number of columns
   * @param {number} rows - Number of rows
   * @returns {boolean} True if can roll left
   */
  canRollLeft(grid, cols, rows) {
    if (this.x - 1 < 0 || this.y + 1 >= rows) return false;
    
    const belowIndex = (this.y + 1) * cols + this.x;
    const leftIndex = this.y * cols + (this.x - 1);
    const leftBelowIndex = (this.y + 1) * cols + (this.x - 1);
    
    // Can roll left if: space to left is empty, space below-left is empty, 
    // and there's something solid below current position
    return grid[leftIndex] === 0 && 
           grid[leftBelowIndex] === 0 && 
           (grid[belowIndex] === 3 || grid[belowIndex] === 4); // ROCK or DIAMOND
  }

  /**
   * Check if this tile can roll right
   * @param {Array} grid - The game grid
   * @param {number} cols - Number of columns
   * @param {number} rows - Number of rows
   * @returns {boolean} True if can roll right
   */
  canRollRight(grid, cols, rows) {
    if (this.x + 1 >= cols || this.y + 1 >= rows) return false;
    
    const belowIndex = (this.y + 1) * cols + this.x;
    const rightIndex = this.y * cols + (this.x + 1);
    const rightBelowIndex = (this.y + 1) * cols + (this.x + 1);
    
    // Can roll right if: space to right is empty, space below-right is empty, 
    // and there's something solid below current position
    return grid[rightIndex] === 0 && 
           grid[rightBelowIndex] === 0 && 
           (grid[belowIndex] === 3 || grid[belowIndex] === 4); // ROCK or DIAMOND
  }

  /**
   * Update physics for this tile
   * Override in subclasses to implement specific physics behavior
   * @param {number} deltaTime - Time since last update
   * @param {Array} grid - The game grid
   * @param {number} cols - Number of columns
   * @param {number} rows - Number of rows
   * @param {Object} gameState - Current game state
   * @returns {Object|null} Physics update result {from: {x, y}, to: {x, y}, sound?: string, killPlayer?: boolean}
   */
  updatePhysics(deltaTime, grid, cols, rows, gameState) {
    // Base implementation: no physics
    return null;
  }

  /**
   * Check if moving this tile would kill the player
   * @param {number} toX - Target X position
   * @param {number} toY - Target Y position
   * @param {Array} grid - The game grid
   * @param {number} cols - Number of columns
   * @param {number} rows - Number of rows
   * @returns {boolean} True if player would be killed
   */
  wouldKillPlayer(toX, toY, grid, cols, rows) {
    if (toY + 1 >= rows) return false;
    const belowTargetIndex = (toY + 1) * cols + toX;
    return grid[belowTargetIndex] === 5; // TILE.PLAYER = 5
  }

  /**
   * Get tile properties for game logic
   * Override in subclasses to add custom behavior
   */
  getProperties() {
    return {
      type: this.type,
      blocking: this.isBlocking(),
      movable: this.canMove(),
      ...this.properties
    };
  }

  /**
   * Clone this tile (useful for creating variants)
   */
  clone() {
    const cloned = new this.constructor(this.x, this.y, this.type);
    cloned.properties = { ...this.properties };
    return cloned;
  }
}