import { Tile } from './Tile';
import { GAME_CONFIG } from '../GameConstants';
import { seededRandom } from '../GameUtils';

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

/**
 * Wall Tile - solid, unbreakable barrier with brick structure and vegetation
 */
export class WallTile extends Tile {
  constructor(x, y) {
    super(x, y, 'wall');
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    // Base wall
    ctx.fillStyle = '#333';
    ctx.fillRect(pixelX, pixelY, tileSize, tileSize);

    ctx.strokeStyle = '#444';
    ctx.lineWidth = Math.max(2, tileSize * 0.06);
    const brickRows = 3;
    const brickCols = 3;
    const brickHeight = tileSize / brickRows;
    const brickWidth = tileSize / brickCols;

    // Use map coordinates for consistent seeding
    const baseSeed = mapX * 73856093 + mapY * 19349663;

    // Horizontal lines
    for (let y = 0; y < brickRows; y++) {
      const lineY = pixelY + y * brickHeight;
      const lineSeed = baseSeed + y * 12345;
      if (seededRandom(lineSeed) > 0.18) {
        ctx.beginPath();
        ctx.moveTo(pixelX, lineY);
        ctx.lineTo(pixelX + tileSize, lineY);
        ctx.stroke();
      }
    }

    // Vertical lines with offset pattern for realistic bricks
    for (let row = 0; row < brickRows; row++) {
      let offset = (row % 2 === 0) ? brickWidth / 2 : 0;
      for (let x = offset; x < tileSize; x += brickWidth) {
        const vlineSeed = baseSeed + row * 54321 + x * 9876;
        if (seededRandom(vlineSeed) > 0.22) {
          ctx.beginPath();
          ctx.moveTo(pixelX + x, pixelY + row * brickHeight);
          ctx.lineTo(pixelX + x, pixelY + (row + 1) * brickHeight);
          ctx.stroke();
        }
      }
    }

    // Top highlight (check if wall above using map coordinates)
    let drawHighlight = true;
    if (mapY > 0 && grid && cols) {
      const aboveIndex = (mapY - 1) * cols + mapX;
      if (aboveIndex >= 0 && aboveIndex < grid.length && grid[aboveIndex] === 1) { // 1 = WALL
        drawHighlight = false;
      }
    }
    if (drawHighlight) {
      ctx.fillStyle = '#666';
      ctx.fillRect(pixelX, pixelY, tileSize, Math.max(6, tileSize * 0.13));
    }

    // Moss and decorations
    for (let i = 0; i < 3; i++) {
      const spotSeed = baseSeed + i * 83492791;
      const rx = pixelX + tileSize * 0.08 + seededRandom(spotSeed) * (tileSize * 0.84);
      const ry = pixelY + tileSize * 0.08 + seededRandom(spotSeed + 1) * (tileSize * 0.84);
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      for (let j = 0; j < 5; j++) {
        const angle = (Math.PI * 2 * j) / 5;
        const r = tileSize * 0.08 + seededRandom(spotSeed + 10 * j) * tileSize * 0.11;
        const nx = rx + Math.cos(angle) * r;
        const ny = ry + Math.sin(angle) * r;
        ctx.lineTo(nx, ny);
      }
      ctx.closePath();
      ctx.fillStyle = seededRandom(spotSeed + 3) > 0.5 ? '#3fa34d' : '#6bbf59';
      ctx.globalAlpha = 0.5 + seededRandom(spotSeed + 4) * 0.4;
      ctx.fill();
      ctx.restore();

      // Leaves
      if (seededRandom(spotSeed + 5) > 0.6) {
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(
          rx + seededRandom(spotSeed + 6) * tileSize * 0.13 - tileSize * 0.065,
          ry + seededRandom(spotSeed + 7) * tileSize * 0.13 - tileSize * 0.065,
          tileSize * 0.04, tileSize * 0.02,
          seededRandom(spotSeed + 8) * Math.PI,
          0, 2 * Math.PI
        );
        ctx.fillStyle = '#4caf50';
        ctx.globalAlpha = 0.6;
        ctx.fill();
        ctx.restore();
      }

      // Berries
      if (seededRandom(spotSeed + 20) > 0.95) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          rx + seededRandom(spotSeed + 21) * tileSize * 0.13 - tileSize * 0.065,
          ry + seededRandom(spotSeed + 22) * tileSize * 0.13 - tileSize * 0.065,
          tileSize * 0.03 + seededRandom(spotSeed + 23) * tileSize * 0.02,
          0, 2 * Math.PI
        );
        ctx.fillStyle = '#c62828';
        ctx.globalAlpha = 0.85;
        ctx.fill();
        ctx.restore();
      }
    }
  }

  isBlocking() {
    return true;
  }

  getBaseColor() {
    return '#444444';
  }
}

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

/**
 * Rock Tile - falls when unsupported
 */
export class RockTile extends Tile {
  constructor(x, y) {
    super(x, y, 'rock');
    this.isFalling = false;
  }

  animate(deltaTime, gameState) {
    super.animate(deltaTime, gameState);
    // Add subtle bobbing when falling
    if (this.isFalling) {
      this.properties.fallOffset = Math.sin(this.animationTime * 0.01) * 2;
    }
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    // Round rock that fills the tile completely (touches edges)
    const centerX = pixelX + tileSize / 2;
    const centerY = pixelY + tileSize / 2;
    const radius = tileSize / 2; // Full radius to touch all edges
    
    const fallOffset = this.properties.fallOffset || 0;
    const adjustedCenterY = centerY + fallOffset;
    
    // Create radial gradient for 3D effect
    const gradient = ctx.createRadialGradient(
      centerX - radius * 0.3, adjustedCenterY - radius * 0.3, 0,
      centerX, adjustedCenterY, radius
    );
    gradient.addColorStop(0, '#EEEEEE');  // Light highlight
    gradient.addColorStop(0.3, '#CCCCCC'); // Main surface
    gradient.addColorStop(0.7, '#999999'); // Mid tone
    gradient.addColorStop(1, '#555555');   // Dark shadow
    
    // Draw main rock circle (full size)
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, adjustedCenterY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Add bright highlight spot for glossy effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.3, adjustedCenterY - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add subtle border (optional since it touches edges)
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, adjustedCenterY, radius - 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }

  isBlocking() {
    return true;
  }

  canMove() {
    return true;
  }

  getBaseColor() {
    return '#888888';
  }
}

/**
 * Diamond Tile - collectible treasure
 */
export class DiamondTile extends Tile {
  constructor(x, y) {
    super(x, y, 'diamond');
    this.sparklePhase = Math.random() * Math.PI * 2;
  }

  animate(deltaTime, gameState) {
    super.animate(deltaTime, gameState);
    this.sparklePhase += deltaTime * 0.005;
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    // Perfect math diamond shape (♦) that touches edges
    const centerX = pixelX + tileSize / 2;
    const centerY = pixelY + tileSize / 2;
    const halfSize = tileSize / 2; // Touch all edges
    
    // Create gradient for brilliant effect
    const gradient = ctx.createLinearGradient(
      pixelX, pixelY, pixelX + tileSize, pixelY + tileSize
    );
    gradient.addColorStop(0, '#FFFFFF');   // Bright white
    gradient.addColorStop(0.3, '#80FFFF'); // Light cyan
    gradient.addColorStop(0.7, '#00FFFF'); // Main cyan
    gradient.addColorStop(1, '#0080FF');   // Deep blue
    
    // Perfect diamond shape (♦) - 4 equal triangular faces
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(centerX, pixelY);              // Top point (touches top edge)
    ctx.lineTo(pixelX + tileSize, centerY);   // Right point (touches right edge)
    ctx.lineTo(centerX, pixelY + tileSize);   // Bottom point (touches bottom edge)
    ctx.lineTo(pixelX, centerY);              // Left point (touches left edge)
    ctx.closePath();
    ctx.fill();
    
    // Enhanced sparkle effects
    const sparkleIntensity = (Math.sin(this.sparklePhase) + 1) / 2;
    const sparkle2 = (Math.sin(this.sparklePhase * 1.5 + Math.PI) + 1) / 2;
    
    // Main cross sparkle (vertical and horizontal)
    ctx.fillStyle = `rgba(255, 255, 255, ${sparkleIntensity * 0.9})`;
    ctx.fillRect(centerX - 1, pixelY, 2, tileSize);        // Vertical line
    ctx.fillRect(pixelX, centerY - 1, tileSize, 2);        // Horizontal line
    
    // Secondary diagonal sparkles
    ctx.fillStyle = `rgba(255, 255, 255, ${sparkle2 * 0.6})`;
    
    // Draw diagonal sparkles
    ctx.save();
    ctx.translate(centerX, centerY);
    
    // Diagonal lines following the diamond edges
    ctx.beginPath();
    ctx.moveTo(-halfSize * 0.7, 0);
    ctx.lineTo(halfSize * 0.7, 0);
    ctx.moveTo(0, -halfSize * 0.7);
    ctx.lineTo(0, halfSize * 0.7);
    ctx.strokeStyle = `rgba(255, 255, 255, ${sparkle2 * 0.5})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    ctx.restore();
    
    // Add sharp border for definition
    ctx.strokeStyle = '#0080CC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, pixelY);
    ctx.lineTo(pixelX + tileSize, centerY);
    ctx.lineTo(centerX, pixelY + tileSize);
    ctx.lineTo(pixelX, centerY);
    ctx.closePath();
    ctx.stroke();
  }

  canMove() {
    return true;
  }

  getBaseColor() {
    return '#00FFFF';
  }
}

/**
 * Player Tile - the controllable character with directional animation
 */
export class PlayerTile extends Tile {
  constructor(x, y) {
    super(x, y, 'player');
    this.facingDirection = 'right';
    this.isMoving = false;
    this.walkCycle = 0;
    this.lastX = x;
    this.lastY = y;
  }

  animate(deltaTime, gameState) {
    super.animate(deltaTime, gameState);
    
    // Detect movement direction from position changes
    if (this.x !== this.lastX || this.y !== this.lastY) {
      this.isMoving = true;
      
      // Update facing direction based on movement
      if (this.x > this.lastX) {
        this.facingDirection = 'right';
      } else if (this.x < this.lastX) {
        this.facingDirection = 'left';
      } else if (this.y > this.lastY) {
        this.facingDirection = 'down';
      } else if (this.y < this.lastY) {
        this.facingDirection = 'up';
      }
      
      this.lastX = this.x;
      this.lastY = this.y;
    } else {
      this.isMoving = false;
    }
    
    if (this.isMoving) {
      // Walking animation
      this.walkCycle += deltaTime * 0.01;
      this.properties.walkBob = Math.sin(this.walkCycle) * 2;
      this.properties.eyeBlink = Math.sin(this.walkCycle * 2) * 0.5 + 0.5;
    } else {
      // Breathing animation when idle
      this.properties.breatheOffset = Math.sin(this.animationTime * 0.003) * 1;
      this.properties.eyeBlink = Math.sin(this.animationTime * 0.001) * 0.3 + 0.7;
    }
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    const centerX = pixelX + tileSize / 2;
    const centerY = pixelY + tileSize / 2;
    
    const walkBob = this.properties.walkBob || 0;
    const breatheOffset = this.properties.breatheOffset || 0;
    const eyeBlink = this.properties.eyeBlink || 1;
    
    const bodyOffsetY = this.isMoving ? walkBob : breatheOffset;
    const bodyY = centerY + bodyOffsetY;
    
    // Player body (larger, more visible circle)
    const gradient = ctx.createRadialGradient(
      centerX - tileSize * 0.1, bodyY - tileSize * 0.1, 0,
      centerX, bodyY, tileSize * 0.4
    );
    gradient.addColorStop(0, '#FFFF80');  // Bright highlight
    gradient.addColorStop(0.7, '#FFD700'); // Main gold
    gradient.addColorStop(1, '#FFA500');   // Darker edge
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, bodyY, tileSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Player eyes based on facing direction
    ctx.fillStyle = '#000000';
    let eyeSize = 3 * eyeBlink; // Blinking effect
    
    switch (this.facingDirection) {
      case 'right':
        // Eyes looking right
        ctx.fillRect(centerX + 2, bodyY - 6, eyeSize, eyeSize);
        ctx.fillRect(centerX + 2, bodyY - 2, eyeSize, eyeSize);
        break;
      case 'left':
        // Eyes looking left
        ctx.fillRect(centerX - 5, bodyY - 6, eyeSize, eyeSize);
        ctx.fillRect(centerX - 5, bodyY - 2, eyeSize, eyeSize);
        break;
      case 'up':
        // Eyes looking up
        ctx.fillRect(centerX - 4, bodyY - 8, eyeSize, eyeSize);
        ctx.fillRect(centerX + 1, bodyY - 8, eyeSize, eyeSize);
        break;
      case 'down':
        // Eyes looking down
        ctx.fillRect(centerX - 4, bodyY + 2, eyeSize, eyeSize);
        ctx.fillRect(centerX + 1, bodyY + 2, eyeSize, eyeSize);
        break;
    }
    
    // Add directional indicator (small arrow or line)
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    switch (this.facingDirection) {
      case 'right':
        // Arrow pointing right
        ctx.moveTo(centerX + tileSize * 0.3, bodyY);
        ctx.lineTo(centerX + tileSize * 0.4, bodyY - 3);
        ctx.moveTo(centerX + tileSize * 0.3, bodyY);
        ctx.lineTo(centerX + tileSize * 0.4, bodyY + 3);
        break;
      case 'left':
        // Arrow pointing left
        ctx.moveTo(centerX - tileSize * 0.3, bodyY);
        ctx.lineTo(centerX - tileSize * 0.4, bodyY - 3);
        ctx.moveTo(centerX - tileSize * 0.3, bodyY);
        ctx.lineTo(centerX - tileSize * 0.4, bodyY + 3);
        break;
      case 'up':
        // Arrow pointing up
        ctx.moveTo(centerX, bodyY - tileSize * 0.3);
        ctx.lineTo(centerX - 3, bodyY - tileSize * 0.4);
        ctx.moveTo(centerX, bodyY - tileSize * 0.3);
        ctx.lineTo(centerX + 3, bodyY - tileSize * 0.4);
        break;
      case 'down':
        // Arrow pointing down
        ctx.moveTo(centerX, bodyY + tileSize * 0.3);
        ctx.lineTo(centerX - 3, bodyY + tileSize * 0.4);
        ctx.moveTo(centerX, bodyY + tileSize * 0.3);
        ctx.lineTo(centerX + 3, bodyY + tileSize * 0.4);
        break;
    }
    ctx.stroke();
    
    // Player outline for better visibility with walking pulse
    const outlineWidth = this.isMoving ? 2 + Math.sin(this.walkCycle * 3) * 0.5 : 2;
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = outlineWidth;
    ctx.beginPath();
    ctx.arc(centerX, bodyY, tileSize * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    
    // Add moving sparkles when walking
    if (this.isMoving) {
      for (let i = 0; i < 3; i++) {
        const sparkleAngle = this.walkCycle + i * (Math.PI * 2 / 3);
        const sparkleRadius = tileSize * 0.5 + Math.sin(this.walkCycle * 2 + i) * tileSize * 0.1;
        const sparkleX = centerX + Math.cos(sparkleAngle) * sparkleRadius;
        const sparkleY = bodyY + Math.sin(sparkleAngle) * sparkleRadius;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.sin(this.walkCycle * 3 + i) * 0.3})`;
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  getBaseColor() {
    return '#FFD700';
  }

  // Player-specific methods
  setDirection(direction) {
    this.facingDirection = direction;
  }

  setMoving(moving) {
    this.isMoving = moving;
  }
  
  updatePosition(x, y) {
    this.lastX = this.x;
    this.lastY = this.y;
    this.x = x;
    this.y = y;
  }
}