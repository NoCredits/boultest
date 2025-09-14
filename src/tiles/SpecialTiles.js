import { RockTile, DiamondTile } from './GameTiles';
import { Tile } from './Tile';

/**
 * Specialized Rock Variants
 * Examples of how to extend base tiles for new behaviors
 */

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

/**
 * Moving Lava - animated liquid that spreads
 */
export class LavaTile extends Tile {
  constructor(x, y) {
    super(x, y, 'lava');
    this.properties.spreads = true;
    this.properties.deadly = true;
    this.wavePhase = Math.random() * Math.PI * 2;
  }

  animate(deltaTime, gameState) {
    super.animate(deltaTime, gameState);
    this.wavePhase += deltaTime * 0.008;
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    // Animated lava with flowing effect
    const wave1 = Math.sin(this.wavePhase) * 3;
    const wave2 = Math.sin(this.wavePhase + Math.PI/3) * 2;
    
    // Base lava
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
    
    // Flowing layers
    ctx.fillStyle = '#FF6347';
    ctx.fillRect(pixelX, pixelY + wave1, tileSize, tileSize/3);
    
    ctx.fillStyle = '#FF8C00';
    ctx.fillRect(pixelX, pixelY + tileSize/2 + wave2, tileSize, tileSize/4);
    
    // Hot spots
    ctx.fillStyle = '#FFFF00';
    const hotX = pixelX + Math.sin(this.wavePhase * 2) * 5 + tileSize/2;
    const hotY = pixelY + Math.cos(this.wavePhase * 2) * 3 + tileSize/2;
    ctx.fillRect(hotX - 1, hotY - 1, 2, 2);
  }

  isBlocking() {
    return false; // Can move through but deadly
  }

  getBaseColor() {
    return '#FF4500';
  }
}

/**
 * Multi-colored Diamond variants
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

export class EmeraldCrystalTile extends DiamondTile {
  constructor(x, y) {
    super(x, y);
    this.type = 'emerald_crystal';
    this.properties.value = 75; // Even higher value
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    const centerX = pixelX + tileSize / 2;
    const centerY = pixelY + tileSize / 2;
    const size = tileSize * 0.6;
    
    // Emerald green diamond
    ctx.fillStyle = '#50C878';
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
    ctx.fillStyle = `rgba(200, 255, 200, ${sparkleIntensity * 0.8})`;
    ctx.fillRect(centerX - 1, centerY - size/4, 2, size/2);
    ctx.fillRect(centerX - size/4, centerY - 1, size/2, 2);
  }
}

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
