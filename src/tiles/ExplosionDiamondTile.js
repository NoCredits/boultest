import { DiamondTile } from './DiamondTile';

/**
 * Explosion Diamond - special diamond from balloon explosions with high value and animated colors
 */
export class ExplosionDiamondTile extends DiamondTile {
  constructor(x, y) {
    super(x, y);
    this.type = 'explosion_diamond';
    this.properties.value = 100; // Very high value since they come from balloon explosions
    this.explosionPhase = 0;
    this.explosionPulse = Math.random() * Math.PI * 2; // Start at random phase
  }

  animate(deltaTime, gameState) {
    super.animate(deltaTime, gameState);
    this.explosionPhase += deltaTime * 0.01;
    this.explosionPulse += deltaTime * 0.015;
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    const centerX = pixelX + tileSize / 2;
    const centerY = pixelY + tileSize / 2;
    const baseSize = tileSize * 0.6;
    
    // Pulsing size effect
    const pulseScale = 1 + Math.sin(this.explosionPulse) * 0.2;
    const size = baseSize * pulseScale;
    
    // Multi-colored explosive diamond - cycles through warm colors
    const hue = (this.explosionPhase * 50) % 360;
    const saturation = 90 + Math.sin(this.explosionPhase * 3) * 10;
    const lightness = 60 + Math.sin(this.explosionPhase * 2) * 15;
    
    ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    
    // Draw diamond shape
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - size/2);
    ctx.lineTo(centerX + size/3, centerY - size/4);
    ctx.lineTo(centerX + size/2, centerY + size/2);
    ctx.lineTo(centerX, centerY + size/3);
    ctx.lineTo(centerX - size/2, centerY + size/2);
    ctx.lineTo(centerX - size/3, centerY - size/4);
    ctx.closePath();
    ctx.fill();
    
    // Explosion sparkles - multiple cross patterns
    const sparkleIntensity = (Math.sin(this.sparklePhase) + 1) / 2;
    const explosionSparkle = (Math.sin(this.explosionPulse * 2) + 1) / 2;
    
    // Main cross
    ctx.fillStyle = `rgba(255, 255, 100, ${sparkleIntensity * 0.9})`;
    ctx.fillRect(centerX - 1, centerY - size/3, 2, size*2/3);
    ctx.fillRect(centerX - size/3, centerY - 1, size*2/3, 2);
    
    // Secondary diagonal cross
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = `rgba(255, 200, 100, ${explosionSparkle * 0.7})`;
    ctx.fillRect(-1, -size/4, 2, size/2);
    ctx.fillRect(-size/4, -1, size/2, 2);
    ctx.restore();
    
    // Outer glow effect
    ctx.fillStyle = `rgba(255, 150, 50, ${explosionSparkle * 0.3})`;
    ctx.fillRect(pixelX + 1, pixelY + 1, tileSize - 2, tileSize - 2);
  }
}