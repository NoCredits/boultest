import { Tile } from './Tile';

/**
 * Balloon - floats upward instead of falling
 */
export class BalloonTile extends Tile {
  constructor(x, y, color = '#FF0000') {
    super(x, y, 'balloon');
    this.properties.floats = true;
    this.properties.color = color;
    this.floatPhase = Math.random() * Math.PI * 2;
  }

  animate(deltaTime, gameState) {
    super.animate(deltaTime, gameState);
    this.floatPhase += deltaTime * 0.003;
    this.properties.floatOffset = Math.sin(this.floatPhase) * 2;
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    const centerX = pixelX + tileSize / 2;
    const centerY = pixelY + tileSize / 2;
    const floatOffset = this.properties.floatOffset || 0;
    
    // Balloon body
    ctx.fillStyle = this.properties.color;
    ctx.beginPath();
    ctx.arc(centerX, centerY + floatOffset, tileSize * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Balloon highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(centerX - 3, centerY - 3 + floatOffset, tileSize * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // String
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY + tileSize * 0.35 + floatOffset);
    ctx.lineTo(centerX, centerY + tileSize * 0.5 + floatOffset);
    ctx.stroke();
  }

  canMove() {
    return true;
  }

  getBaseColor() {
    return this.properties.color;
  }
}