/**
 * Base Entity class - all game entities inherit from this
 */
export class Entity {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.isVisible = true;
    this.isDirty = true; // Flag to indicate if entity needs re-rendering
    this.lastUpdateTime = 0;
    this.animationFrame = 0;
  }

  /**
   * Update entity logic - override in subclasses
   * @param {number} deltaTime - Time since last update
   * @param {Object} gameState - Current game state
   */
  update(deltaTime, gameState) {
    this.lastUpdateTime += deltaTime;
  }

  /**
   * Render the entity - override in subclasses
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   * @param {number} tileSize - Size of each tile
   * @param {number} time - Current game time for animations
   */
  render(ctx, screenX, screenY, tileSize, time) {
    // Base implementation - override in subclasses
    this.renderBase(ctx, screenX, screenY, tileSize);
  }

  /**
   * Basic rendering - draws a colored rectangle
   */
  renderBase(ctx, screenX, screenY, tileSize) {
    ctx.fillStyle = this.getColor();
    ctx.fillRect(screenX, screenY, tileSize, tileSize);
  }

  /**
   * Get the color for this entity - override in subclasses
   */
  getColor() {
    return '#ff00ff'; // Magenta default for debugging
  }

  /**
   * Check if this entity can be moved into
   */
  isPassable() {
    return false;
  }

  /**
   * Check if this entity can fall
   */
  canFall() {
    return false;
  }

  /**
   * Handle collision with another entity
   */
  onCollision(other, gameState) {
    // Override in subclasses
  }

  /**
   * Handle player interaction
   */
  onPlayerInteraction(player, gameState) {
    // Override in subclasses
  }

  /**
   * Get position as a key for maps
   */
  getPositionKey() {
    return `${this.x},${this.y}`;
  }

  /**
   * Move entity to new position
   */
  moveTo(x, y) {
    this.x = x;
    this.y = y;
    this.isDirty = true;
  }

  /**
   * Check if entity is at specific position
   */
  isAt(x, y) {
    return this.x === x && this.y === y;
  }

  /**
   * Get distance to another entity or position
   */
  distanceTo(x, y) {
    return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
  }

  /**
   * Clone this entity
   */
  clone() {
    return new Entity(this.x, this.y, this.type);
  }
}