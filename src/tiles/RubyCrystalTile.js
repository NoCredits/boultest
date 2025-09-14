import { DiamondTile } from './DiamondTile';

/**
 * Ruby Crystal - red diamond variant with higher value
 */
export class RubyCrystalTile extends DiamondTile {
  constructor(x, y) {
    super(x, y);
    this.type = 'ruby_crystal';
    this.properties.value = 50; // Higher value than normal diamond
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    const centerX = pixelX + tileSize / 2;
    const centerY = pixelY + tileSize / 2;
    const size = tileSize * 0.6;
    
    // Ruby red diamond
    ctx.fillStyle = '#DC143C';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - size/2);
    ctx.lineTo(centerX + size/3, centerY - size/4);
    ctx.lineTo(centerX + size/2, centerY + size/2);
    ctx.lineTo(centerX, centerY + size/3);
    ctx.lineTo(centerX - size/2, centerY + size/2);
    ctx.lineTo(centerX - size/3, centerY - size/4);
    ctx.closePath();
    ctx.fill();
    
    // Sparkle effect
    const sparkleIntensity = (Math.sin(this.sparklePhase) + 1) / 2;
    ctx.fillStyle = `rgba(255, 200, 200, ${sparkleIntensity * 0.8})`;
    ctx.fillRect(centerX - 1, centerY - size/4, 2, size/2);
    ctx.fillRect(centerX - size/4, centerY - 1, size/2, 2);
  }
}