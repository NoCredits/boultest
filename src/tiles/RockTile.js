import { Tile } from './Tile';

/**
 * Rock Tile - falls when unsupported
 */
export class RockTile extends Tile {
  constructor(x, y) {
    super(x, y, 'rock');
    this.isFalling = false;
  }

  animate(deltaTime, gameState) {
    super.animate(deltaTime, gameState);
    // Add subtle bobbing when falling
    if (this.isFalling) {
      this.properties.fallOffset = Math.sin(this.animationTime * 0.01) * 2;
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

  getBaseColor() {
    return '#888888';
  }
}