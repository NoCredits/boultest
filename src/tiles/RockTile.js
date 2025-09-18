import { Tile } from './Tile';
import { TILE, ANIMATION_SPEEDS } from '../GameConstants';
import { playRockFallSound } from '../GameUtils';

/**
 * Rock Tile - falls when unsupported
 */
export class RockTile extends Tile {
  constructor(x, y) {
    super(x, y, 'rock');
    this.isFalling = false;
    this.fallCooldown = 0; // Custom fall timing for rocks
  }

  animate(deltaTime, gameState) {
    super.animate(deltaTime, gameState);
    // Add subtle bobbing when falling
    if (this.isFalling) {
      // Use consistent animationTime with proper frequency calculation
      const fallFrequency = 1000 / ANIMATION_SPEEDS.ROCK_FALL_BOBBING_CYCLE; // 0.25 Hz for 4000ms cycle
      const fallTime = this.animationTime * fallFrequency / 1000; // Scale to reasonable animation range
      this.properties.fallOffset = Math.sin(fallTime) * 2;
    }
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    // Round rock that fills the tile completely (touches edges)
    const centerX = pixelX + tileSize / 2;
    const centerY = pixelY + tileSize / 2;
    const radius = tileSize / 2; // Full radius to touch all edges
    
    const fallOffset = this.properties.fallOffset || 0;
    const adjustedCenterY = centerY + fallOffset;
    
    // Create radial gradient for 3D effect
    const gradient = ctx.createRadialGradient(
      centerX - radius * 0.3, adjustedCenterY - radius * 0.3, 0,
      centerX, adjustedCenterY, radius
    );
    gradient.addColorStop(0, '#EEEEEE');  // Light highlight
    gradient.addColorStop(0.3, '#CCCCCC'); // Main surface
    gradient.addColorStop(0.7, '#999999'); // Mid tone
    gradient.addColorStop(1, '#555555');   // Dark shadow
    
    // Draw main rock circle (full size)
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, adjustedCenterY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add bright highlight spot for glossy effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.3, adjustedCenterY - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add subtle border (optional since it touches edges)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, adjustedCenterY, radius - 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  isBlocking() {
    return true;
  }

  canMove() {
    return true;
  }

  /**
   * Update physics for rock tile - handles falling and rolling
   * Rocks fall slower than diamonds to demonstrate customizable physics
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
    
    // Custom timing: Rocks fall 2x slower than normal physics interval
    this.fallCooldown -= deltaTime;
    if (this.fallCooldown > 0) {
      return null; // Still cooling down, don't move yet
    }
    
    // Reset cooldown to make rocks fall slower (double the normal interval)
    this.fallCooldown = 10; // 2x slower than GAME_CONFIG.ROCK_FALL_INTERVAL (100ms)
    
    // PRIORITY 1: Fall straight down if space is empty
    if (this.canFallDown(grid, cols, rows)) {
      const targetY = this.y + 1;
      
      // Start smooth movement instead of instant grid change
      this.startSmoothMovement(this.x, targetY, 150); // 150ms smooth fall
      
      const result = {
        from: { x: this.x, y: this.y },
        to: { x: this.x, y: targetY },
        smoothMovement: true // Flag to indicate smooth movement
      };
      
      // Check if will hit something next turn and play sound
      if (targetY + 1 < rows && grid[(targetY + 1) * cols + this.x] !== TILE.EMPTY) {
        result.sound = 'rockfall';
      }
      
      // Check if player is crushed
      if (this.wouldKillPlayer(this.x, targetY, grid, cols, rows)) {
        result.killPlayer = true;
      }
      
      this.isFalling = true;
      return result;
    }
    
    // PRIORITY 2: Try to roll left (only if can't fall straight)
    if (this.canRollLeft(grid, cols, rows)) {
      const targetX = this.x - 1;
      const targetY = this.y + 1;
      
      // Start smooth diagonal movement
      this.startSmoothMovement(targetX, targetY, 180); // 180ms for diagonal roll
      
      const result = {
        from: { x: this.x, y: this.y },
        to: { x: targetX, y: targetY },
        sound: 'rockfall',
        smoothMovement: true
      };
      
      // Check if player is crushed
      if (this.wouldKillPlayer(targetX, targetY, grid, cols, rows)) {
        result.killPlayer = true;
      }
      
      this.isFalling = true;
      return result;
    }
    
    // PRIORITY 3: Try to roll right (only if can't fall straight or left)
    if (this.canRollRight(grid, cols, rows)) {
      const targetX = this.x + 1;
      const targetY = this.y + 1;
      
      // Start smooth diagonal movement
      this.startSmoothMovement(targetX, targetY, 180); // 180ms for diagonal roll
      
      const result = {
        from: { x: this.x, y: this.y },
        to: { x: targetX, y: targetY },
        sound: 'rockfall',
        smoothMovement: true
      };
      
      // Check if player is crushed
      if (this.wouldKillPlayer(targetX, targetY, grid, cols, rows)) {
        result.killPlayer = true;
      }
      
      this.isFalling = true;
      return result;
    }
    
    // No movement possible - stop falling animation
    this.isFalling = false;
    return null;
  }

  /**
   * Override base canRollLeft to add rock-specific logic
   */
  canRollLeft(grid, cols, rows) {
    if (this.x - 1 < 0 || this.y + 1 >= rows) return false;
    
    const belowIndex = (this.y + 1) * cols + this.x;
    const leftIndex = this.y * cols + (this.x - 1);
    const leftBelowIndex = (this.y + 1) * cols + (this.x - 1);
    
    // Can roll left if: space to left is empty, space below-left is empty,
    // there's something solid below current position, and it's not the player
    return grid[leftIndex] === TILE.EMPTY && 
           grid[leftBelowIndex] === TILE.EMPTY && 
           (grid[belowIndex] === TILE.ROCK || grid[belowIndex] === TILE.DIAMOND) &&
           grid[belowIndex] !== TILE.PLAYER;
  }

  /**
   * Override base canRollRight to add rock-specific logic
   */
  canRollRight(grid, cols, rows) {
    if (this.x + 1 >= cols || this.y + 1 >= rows) return false;
    
    const belowIndex = (this.y + 1) * cols + this.x;
    const rightIndex = this.y * cols + (this.x + 1);
    const rightBelowIndex = (this.y + 1) * cols + (this.x + 1);
    
    // Can roll right if: space to right is empty, space below-right is empty,
    // there's something solid below current position, and it's not the player
    return grid[rightIndex] === TILE.EMPTY && 
           grid[rightBelowIndex] === TILE.EMPTY && 
           (grid[belowIndex] === TILE.ROCK || grid[belowIndex] === TILE.DIAMOND) &&
           grid[belowIndex] !== TILE.PLAYER;
  }

  getBaseColor() {
    return '#888888';
  }
}