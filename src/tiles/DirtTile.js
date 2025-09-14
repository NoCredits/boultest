import { Tile } from './Tile';

/**
 * Dirt Tile - can be dug through by player
 */
export class DirtTile extends Tile {
  constructor(x, y) {
    super(x, y, 'dirt');
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    // Brown dirt with better contrast
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
    
    // Add dirt texture dots
    ctx.fillStyle = '#654321';
    for (let i = 0; i < 4; i++) {
      const dotX = pixelX + (i % 2) * (tileSize / 2) + Math.sin(this.animationTime * 0.001 + i) * 3 + tileSize/4;
      const dotY = pixelY + Math.floor(i / 2) * (tileSize / 2) + Math.cos(this.animationTime * 0.001 + i) * 2 + tileSize/4;
      ctx.fillRect(dotX - 1, dotY - 1, 3, 3);
    }
    
    // Add border for definition
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 1;
    ctx.strokeRect(pixelX, pixelY, tileSize, tileSize);
  }

  getBaseColor() {
    return '#8B4513';
  }
}