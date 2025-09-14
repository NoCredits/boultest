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
  }

  /**
   * Update tile animation state
   * Override in subclasses for custom animations
   * @param {number} deltaTime - Time since last update
   * @param {Object} gameState - Current game state for context
   */
  animate(deltaTime, gameState) {
    this.animationTime += deltaTime;
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