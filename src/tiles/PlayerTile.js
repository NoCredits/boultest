import { Tile } from './Tile';

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