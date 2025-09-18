import { Tile } from './Tile';
import { ANIMATION_SPEEDS } from '../GameConstants';

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
    const dirtFrequency = 1000 / ANIMATION_SPEEDS.DIRT_PARTICLE_CYCLE; // 0.5 Hz for 2000ms cycle
    const dirtTime = this.animationTime * dirtFrequency / 1000; // Scale to reasonable animation range
    for (let i = 0; i < 4; i++) {
      const dotX = pixelX + (i % 2) * (tileSize / 2) + Math.sin(dirtTime + i) * 3 + tileSize/4;
      const dotY = pixelY + Math.floor(i / 2) * (tileSize / 2) + Math.cos(dirtTime + i) * 2 + tileSize/4;
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