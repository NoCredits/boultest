import { Tile } from './Tile';
import { TILE } from '../GameConstants';

/**
 * Balloon - floats upward instead of falling
 */
export class BalloonTile extends Tile {
  constructor(x, y, color = '#FF0000') {
    super(x, y, 'balloon');
    this.properties.floats = true;
    this.properties.color = color;
    this.floatPhase = Math.random() * Math.PI * 2;
    this.justMoved = false; // Track if balloon moved in previous frame
  }

  animate(deltaTime, gameState) {
    super.animate(deltaTime, gameState);
    this.floatPhase += deltaTime * 0.002;
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    // Use interpolated position for smooth movement
    let drawX = pixelX + tileSize / 2;
    let drawY = pixelY + tileSize / 2;
    if (this.isMoving) {
      // Interpolate position between grid cells
      drawX = (this.currentX * tileSize) + tileSize / 2;
      drawY = (this.currentY * tileSize) + tileSize / 2;
    }
    const floatOffset = Math.sin(this.floatPhase) * 2;

    // Balloon body
    ctx.fillStyle = this.properties.color;
    ctx.beginPath();
    ctx.arc(drawX, drawY + floatOffset, tileSize * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Balloon highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(drawX - 3, drawY - 3 + floatOffset, tileSize * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // String
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(drawX, drawY + tileSize * 0.35 + floatOffset);
    ctx.lineTo(drawX, drawY + tileSize * 0.5 + floatOffset);
    ctx.stroke();
  }

  canMove() {
    return true;
  }

  /**
   * Update physics for balloon tile - handles floating upward and explosions
   * @param {number} deltaTime - Time since last update
   * @param {Array} grid - The game grid
   * @param {number} cols - Number of columns
   * @param {number} rows - Number of rows
   * @param {Object} gameState - Current game state
   * @returns {Object|null} Physics update result
   */
  updatePhysics(deltaTime, grid, cols, rows, gameState) {
    // Don't start new movement if already moving smoothly
    if (this.isMoving) {
      return null;
    }
    
    // Check if we're at the top edge
    if (this.y - 1 < 0) {
      // Hit top of map - explode if moved last frame
      if (this.justMoved) {
        const result = {
          from: { x: this.x, y: this.y },
          to: { x: this.x, y: this.y },
          explode: true
        };
        this.justMoved = false;
        return result;
      } else {
        this.justMoved = false;
        return null;
      }
    }
    
    const aboveIndex = (this.y - 1) * cols + this.x;
    const aboveTile = grid[aboveIndex];
    
    // Try to float upward
    if (aboveTile === TILE.EMPTY) {
      const targetY = this.y - 1;
      
  // Start slow-motion upward movement for testing
  this.startSmoothMovement(this.x, targetY, 200); // 1200ms slow float
      
      const result = {
        from: { x: this.x, y: this.y },
        to: { x: this.x, y: targetY },
        smoothMovement: true
      };
      
      this.justMoved = true;
      return result;
    }
    
    // If balloon hits dirt, just stop (no explosion, no movement)
    if (aboveTile === TILE.DIRT) {
      this.justMoved = false;
      return null;
    }
    
    // Only explode if balloon moved in previous frame and now hits solid obstacle
    if (this.justMoved && (aboveTile === TILE.WALL || aboveTile === TILE.ROCK || 
        aboveTile === TILE.DIAMOND || aboveTile === TILE.PLAYER ||
        aboveTile === TILE.EXPLOSION_DIAMOND || aboveTile === TILE.BALLOON)) {
      
      const result = {
        from: { x: this.x, y: this.y },
        to: { x: this.x, y: this.y }, // Stay in same position but change type
        explode: true // Signal to change to EXPLOSION_DIAMOND
      };
      
      this.justMoved = false;
      return result;
    }
    
    // If balloon didn't move in previous frame, it stays stationary (no explosion)
    this.justMoved = false;
    return null;
  }

  /**
   * Check if this balloon can float upward
   * @param {Array} grid - The game grid
   * @param {number} cols - Number of columns
   * @param {number} rows - Number of rows
   * @returns {boolean} True if can float up
   */
  canFloatUp(grid, cols, rows) {
    if (this.y - 1 < 0) return false;
    const aboveIndex = (this.y - 1) * cols + this.x;
    return grid[aboveIndex] === TILE.EMPTY;
  }

  getBaseColor() {
    return this.properties.color;
  }
}