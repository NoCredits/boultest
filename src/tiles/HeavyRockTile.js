import { RockTile } from './RockTile';

/**
 * Heavy Rock - falls faster, breaks things below
 */
export class HeavyRockTile extends RockTile {
  constructor(x, y) {
    super(x, y);
    this.type = 'heavy_rock';
    this.properties.weight = 'heavy';
    this.properties.fallSpeed = 2;
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    // Darker, more imposing rock
    const gradient = ctx.createRadialGradient(
      pixelX + tileSize * 0.3, pixelY + tileSize * 0.3, 0,
      pixelX + tileSize * 0.5, pixelY + tileSize * 0.5, tileSize * 0.7
    );
    gradient.addColorStop(0, '#666666');
    gradient.addColorStop(0.7, '#333333');
    gradient.addColorStop(1, '#111111');
    
    const fallOffset = this.properties.fallOffset || 0;
    
    ctx.fillStyle = gradient;
    ctx.fillRect(pixelX, pixelY + fallOffset, tileSize, tileSize);
    
    // Add metallic shine
    ctx.fillStyle = 'rgba(200, 200, 255, 0.4)';
    ctx.fillRect(pixelX + 2, pixelY + 2 + fallOffset, tileSize - 8, 3);
  }
}