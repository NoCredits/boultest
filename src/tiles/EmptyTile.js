import { Tile } from './Tile';

/**
 * Empty/Air Tile - passable space
 */
export class EmptyTile extends Tile {
  constructor(x, y) {
    super(x, y, 'empty');
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    // Draw nothing for empty space - just clear background
    ctx.fillStyle = '#000000';
    ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
  }

  getBaseColor() {
    return '#000000';
  }
}