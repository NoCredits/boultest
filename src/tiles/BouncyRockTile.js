import { RockTile } from './RockTile';

/**
 * Bouncy Rock - bounces when it hits something
 */
export class BouncyRockTile extends RockTile {
  constructor(x, y) {
    super(x, y);
    this.type = 'bouncy_rock';
    this.properties.bounces = true;
    this.bouncePhase = 0;
  }

  animate(deltaTime, gameState) {
    super.animate(deltaTime, gameState);
    if (this.properties.bouncing) {
      this.bouncePhase += deltaTime * 0.02;
      this.properties.bounceOffset = Math.abs(Math.sin(this.bouncePhase)) * 5;
    }
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    // Colorful, rubbery rock
    const bounceOffset = this.properties.bounceOffset || 0;
    
    ctx.fillStyle = '#FF69B4';
    ctx.fillRect(pixelX + 2, pixelY + 2 - bounceOffset, tileSize - 4, tileSize - 4);
    
    // Add bounce highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(pixelX + 4, pixelY + 4 - bounceOffset, tileSize - 12, 3);
  }
}