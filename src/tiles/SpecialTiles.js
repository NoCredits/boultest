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

// Global slow time counter for lava animation
let lavaSlowTime = 0;
let lastLavaUpdate = Date.now();

/**
 * Moving Lava - animated liquid that spreads
 */
export class LavaTile extends Tile {
  constructor(x, y) {
    super(x, y, 'lava');
    this.properties.spreads = true;
    this.properties.deadly = true;
    // Use position-based phases so they're consistent across frames
    this.wavePhase = (x * 0.5 + y * 0.3) % (Math.PI * 2);
    this.wavePhase2 = (x * 0.7 + y * 0.4) % (Math.PI * 2);
    this.wavePhase3 = (x * 0.3 + y * 0.6) % (Math.PI * 2);
  }

  animate(deltaTime, gameState) {
    super.animate(deltaTime, gameState);
    // No animation needed - we'll use static phases
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    // Update global slow time only every 3 seconds
    const now = Date.now();
    if (now - lastLavaUpdate > 3000) {
      lavaSlowTime += 0.1;
      lastLavaUpdate = now;
    }
    
    // Add the slow time to the static phases
    const wave1 = Math.sin(this.wavePhase + lavaSlowTime) * 0.3;
    const wave2 = Math.sin(this.wavePhase2 + lavaSlowTime * 0.7 + Math.PI/3) * 0.25;
    const wave3 = Math.sin(this.wavePhase3 + lavaSlowTime * 1.3 + Math.PI/2) * 0.2;
    
    // Check neighboring tiles for lava connections
    const neighbors = {
      top: mapY > 0 && grid[(mapY - 1) * cols + mapX] === 8, // TILE.LAVA = 8
      right: mapX < cols - 1 && grid[mapY * cols + (mapX + 1)] === 8,
      bottom: mapY < grid.length / cols - 1 && grid[(mapY + 1) * cols + mapX] === 8,
      left: mapX > 0 && grid[mapY * cols + (mapX - 1)] === 8
    };
    
    // Create irregular organic shape that connects to neighbors
    ctx.save();
    ctx.beginPath();
    
    const points = 32; // More points for smoother connections
    const centerX = pixelX + tileSize / 2;
    const centerY = pixelY + tileSize / 2;
    const baseRadius = tileSize * 0.5; // Larger base size for better connections
    
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2;
      let radiusMultiplier = 1.0;
      
      // Extend radius towards neighboring lava tiles - make extensions bigger
      const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      
      // Top connection (angle around 3π/2 or 270°)
      if (neighbors.top && normalizedAngle >= Math.PI * 1.25 && normalizedAngle <= Math.PI * 1.75) {
        radiusMultiplier = 1.8; // Increased from 1.4
      }
      
      // Right connection (angle around 0 or 360°)
      if (neighbors.right && (normalizedAngle >= Math.PI * 1.75 || normalizedAngle <= Math.PI * 0.25)) {
        radiusMultiplier = 1.8; // Increased from 1.4
      }
      
      // Bottom connection (angle around π/2 or 90°)
      if (neighbors.bottom && normalizedAngle >= Math.PI * 0.25 && normalizedAngle <= Math.PI * 0.75) {
        radiusMultiplier = 1.8; // Increased from 1.4
      }
      
      // Left connection (angle around π or 180°)
      if (neighbors.left && normalizedAngle >= Math.PI * 0.75 && normalizedAngle <= Math.PI * 1.25) {
        radiusMultiplier = 1.8; // Increased from 1.4
      }
      
      // Reduce organic variation when connecting to preserve connections
      const organicVariation = radiusMultiplier > 1.0 ? 
        Math.sin(angle * 3 + lavaSlowTime) * 1 : // Less variation when connecting
        Math.sin(angle * 3 + lavaSlowTime) * 2 + 
        Math.sin(angle * 5 + lavaSlowTime * 1.5) * 1.5 +
        Math.sin(angle * 7 + this.wavePhase) * 1;
      
      const radius = baseRadius * radiusMultiplier + organicVariation;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.closePath();
    ctx.clip(); // Use this shape as a mask for the lava texture
    
    // Create pulsating lava effect with multiple intensity layers
    const pulseIntensity = Math.sin(lavaSlowTime * 2) * 0.3 + 0.7; // Pulse between 0.4 and 1.0
    const heatPulse = Math.sin(lavaSlowTime * 3 + this.wavePhase) * 0.2 + 0.8;
    
    // Draw multiple pulsating layers from dark to bright
    const layers = [
      { color: '#2B0000', alpha: 1.0, pulse: 1.0 }, // Very dark red base (always visible)
      { color: '#4B0000', alpha: 0.9 * pulseIntensity, pulse: pulseIntensity }, // Dark red
      { color: '#8B0000', alpha: 0.8 * pulseIntensity, pulse: pulseIntensity }, // Darker red
      { color: '#B22222', alpha: 0.7 * heatPulse, pulse: heatPulse }, // Fire brick (pulses)
      { color: '#DC143C', alpha: 0.6 * heatPulse, pulse: heatPulse }, // Crimson (pulses)
      { color: '#FF4500', alpha: 0.5 * pulseIntensity, pulse: pulseIntensity }, // Orange red (pulses)
      { color: '#FF6347', alpha: 0.4 * heatPulse, pulse: heatPulse }, // Tomato (bright pulse)
      { color: '#FF7F50', alpha: 0.3 * heatPulse, pulse: heatPulse }, // Coral (bright pulse)
      { color: '#FFA500', alpha: 0.2 * heatPulse, pulse: heatPulse }, // Orange (hottest pulse)
    ];
    
    // Draw pulsating organic blob shapes instead of circles
    layers.forEach((layer, index) => {
      ctx.globalAlpha = layer.alpha;
      ctx.fillStyle = layer.color;
      
      // Create irregular blob shape for each layer
      const centerX = pixelX + tileSize / 2;
      const centerY = pixelY + tileSize / 2;
      const baseRadius = (tileSize * 0.7) * (1 - index * 0.08) * layer.pulse;
      
      // Add organic distortion
      const distortionX = Math.sin(lavaSlowTime + index + this.wavePhase) * 2;
      const distortionY = Math.cos(lavaSlowTime * 1.3 + index + this.wavePhase2) * 2;
      
      // Create blob shape with irregular edges
      ctx.beginPath();
      const blobPoints = 8 + index; // More points for outer layers
      for (let i = 0; i <= blobPoints; i++) {
        const angle = (i / blobPoints) * Math.PI * 2;
        
        // Create irregular radius variation for blobby effect
        const radiusVariation = Math.sin(angle * 3 + lavaSlowTime + index) * 0.2 +
                               Math.sin(angle * 5 + lavaSlowTime * 1.5) * 0.15 +
                               Math.sin(angle * 7 + this.wavePhase + index) * 0.1;
        
        const radius = baseRadius * (0.8 + radiusVariation);
        const x = centerX + distortionX + Math.cos(angle) * radius;
        const y = centerY + distortionY + Math.sin(angle) * radius;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
    });
    
    // Add hot spots that pulse intensely with irregular shapes
    const hotSpotCount = 3;
    for (let i = 0; i < hotSpotCount; i++) {
      const hotPulse = Math.sin(lavaSlowTime * 4 + i * Math.PI * 0.7) * 0.5 + 0.5;
      const hotSpotX = pixelX + tileSize * (0.3 + i * 0.2) + Math.sin(lavaSlowTime + i) * 3;
      const hotSpotY = pixelY + tileSize * (0.3 + i * 0.2) + Math.cos(lavaSlowTime + i) * 3;
      const hotSize = hotPulse * 3 + 1;
      
      // Create irregular hot spots instead of perfect circles
      ctx.globalAlpha = 0.7 * hotPulse;
      ctx.fillStyle = '#FFFF00'; // Bright yellow hot spots
      ctx.beginPath();
      
      const hotBlobPoints = 5;
      for (let j = 0; j <= hotBlobPoints; j++) {
        const angle = (j / hotBlobPoints) * Math.PI * 2;
        const radiusVar = Math.sin(angle * 4 + lavaSlowTime * 2 + i) * 0.3 + 0.7;
        const radius = hotSize * radiusVar;
        const x = hotSpotX + Math.cos(angle) * radius;
        const y = hotSpotY + Math.sin(angle) * radius;
        
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
      
      // Add white hot core with irregular shape
      ctx.globalAlpha = 0.4 * hotPulse;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      
      const corePoints = 4;
      for (let j = 0; j <= corePoints; j++) {
        const angle = (j / corePoints) * Math.PI * 2;
        const radiusVar = Math.sin(angle * 6 + lavaSlowTime * 3 + i) * 0.2 + 0.8;
        const radius = hotSize * 0.4 * radiusVar;
        const x = hotSpotX + Math.cos(angle) * radius;
        const y = hotSpotY + Math.sin(angle) * radius;
        
        if (j === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();
    }
    
    // Reset alpha
    ctx.globalAlpha = 1.0;
    
    // Draw bright connection areas where lava tiles touch
    const connectionBrightness = Math.sin(lavaSlowTime * 2.5 + this.wavePhase) * 0.3 + 0.7;
    
    if (neighbors.top || neighbors.right || neighbors.bottom || neighbors.left) {
      ctx.globalAlpha = 0.8 * connectionBrightness;
      
      // Draw bright connecting bridges
      if (neighbors.top) {
        // Bright connection to top
        ctx.fillStyle = '#FF6347'; // Bright tomato red
        ctx.fillRect(pixelX + tileSize * 0.3, pixelY - tileSize * 0.1, tileSize * 0.4, tileSize * 0.3);
        ctx.fillStyle = '#FFA500'; // Bright orange core
        ctx.fillRect(pixelX + tileSize * 0.35, pixelY - tileSize * 0.05, tileSize * 0.3, tileSize * 0.2);
      }
      
      if (neighbors.right) {
        // Bright connection to right
        ctx.fillStyle = '#FF6347';
        ctx.fillRect(pixelX + tileSize * 0.8, pixelY + tileSize * 0.3, tileSize * 0.3, tileSize * 0.4);
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(pixelX + tileSize * 0.85, pixelY + tileSize * 0.35, tileSize * 0.2, tileSize * 0.3);
      }
      
      if (neighbors.bottom) {
        // Bright connection to bottom
        ctx.fillStyle = '#FF6347';
        ctx.fillRect(pixelX + tileSize * 0.3, pixelY + tileSize * 0.8, tileSize * 0.4, tileSize * 0.3);
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(pixelX + tileSize * 0.35, pixelY + tileSize * 0.85, tileSize * 0.3, tileSize * 0.2);
      }
      
      if (neighbors.left) {
        // Bright connection to left
        ctx.fillStyle = '#FF6347';
        ctx.fillRect(pixelX - tileSize * 0.1, pixelY + tileSize * 0.3, tileSize * 0.3, tileSize * 0.4);
        ctx.fillStyle = '#FFA500';
        ctx.fillRect(pixelX - tileSize * 0.05, pixelY + tileSize * 0.35, tileSize * 0.2, tileSize * 0.3);
      }
    }
    
    ctx.globalAlpha = 1.0;
    
    ctx.restore(); // Restore the clip mask
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
