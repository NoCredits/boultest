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
    this.lastDirectionChange = 0;
    this.lastInputTime = performance.now(); // Simple: last time user did ANYTHING
    this.sleepState = 'awake'; // 'awake' or 'sleeping'
  }

  animate(deltaTime, gameState) {
    super.animate(deltaTime, gameState);
    
    const currentTime = performance.now();
    
    // Use the smooth movement system's isMoving state instead of position checking
    // (The base class handles the smooth movement animation)

    // Simple idle calculation
    const idleTime = currentTime - this.lastInputTime;
    
    // Update sleep state (only transition to sleeping, never back to awake without input)
    if (idleTime > 30000 && this.sleepState === 'awake') {
      this.sleepState = 'sleeping';
    }
    
    // Animation based on movement state and sleep state
    if (this.sleepState === 'sleeping') {
      // Override everything when sleeping
      this.properties.expression = 'sleeping';
      this.properties.eyeBlink = 0.2; // Closed eyes
      this.properties.breatheOffset = Math.round(Math.sin(currentTime / 4000) * 0.3); // Gentle sleep breathing
    } else if (this.isMoving) {
      // Simple, nice walking animation
      const walkTime = currentTime / 2000; // 2 second walking cycle - nice pace
      this.properties.walkBob = Math.round(Math.sin(walkTime) * 1); // Simple 1 pixel bob
      
      // Single occasional blink while walking (every 4 seconds)
      const blinkTime = (currentTime % 4000) / 4000; // Reset every 4 seconds
      this.properties.eyeBlink = (blinkTime > 0.1 && blinkTime < 0.15) ? 0.2 : 1; // Single quick blink
      
      // Facial expressions while moving (less frequent)
      const expressionTime = (currentTime % 10000) / 10000; // Every 10 seconds
      if (expressionTime > 0.1 && expressionTime < 0.15) {
        this.properties.expression = 'thinking';
      } else if (expressionTime > 0.6 && expressionTime < 0.65) {
        this.properties.expression = 'happy';
      } else {
        this.properties.expression = 'normal';
      }
    } else {
      // Simple, calm idle animation (awake only)
      const breatheTime = currentTime / 4000; // 4 second breathing cycle
      const blinkTime = (currentTime % 5000) / 5000; // Reset every 5 seconds
      
      this.properties.breatheOffset = Math.round(Math.sin(breatheTime) * 0.5); // Gentle breathing
      // Single occasional blink when idle
      this.properties.eyeBlink = (blinkTime > 0.1 && blinkTime < 0.15) ? 0.2 : 1;
      
      // Normal idle expressions (awake)
      const expressionTime = (currentTime % 15000) / 15000; // Every 15 seconds
      if (expressionTime > 0.1 && expressionTime < 0.15) {
        this.properties.expression = 'thinking';
      } else if (expressionTime > 0.3 && expressionTime < 0.35) {
        this.properties.expression = 'happy';
      } else if (expressionTime > 0.6 && expressionTime < 0.65) {
        this.properties.expression = 'ashamed';
      } else {
        this.properties.expression = 'normal';
      }
    }
  }
  
  // Method to be called when user explicitly moves the player
  setDirection(direction) {
    if (['left', 'right', 'up', 'down'].includes(direction)) {
      this.facingDirection = direction;
    }
  }

  // Simple reset - called on ANY user input
  resetIdleTimer() {
    this.lastInputTime = performance.now();
    this.sleepState = 'awake'; // Wake up on any input
  }

  // Simple position update - no timer logic here
  updatePosition(x, y) {
    this.lastX = this.x;
    this.lastY = this.y;
    this.x = x;
    this.y = y;
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
    
    // Player eyes based on facing direction (Pac-Man ghost style)
    const expression = this.properties.expression || 'normal';
    const isBlinking = eyeBlink < 1;
    const isSleeping = expression === 'sleeping';
    
    // Define eye position constants
    const eyeRadius = 4;
    const eyeOffsetX = 6;
    const eyeOffsetY = 4;
    
    if (isSleeping) {
      // Draw closed eyes (horizontal lines)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      
      // Left closed eye
      ctx.beginPath();
      ctx.moveTo(centerX - eyeOffsetX - 3, bodyY - eyeOffsetY);
      ctx.lineTo(centerX - eyeOffsetX + 3, bodyY - eyeOffsetY);
      ctx.stroke();
      
      // Right closed eye
      ctx.beginPath();
      ctx.moveTo(centerX + eyeOffsetX - 3, bodyY - eyeOffsetY);
      ctx.lineTo(centerX + eyeOffsetX + 3, bodyY - eyeOffsetY);
      ctx.stroke();
    } else {
      // Normal eyes - yellow when blinking, white when normal
      ctx.fillStyle = isBlinking ? '#FFD700' : '#FFFFFF';
      
      // Left eye background
      ctx.beginPath();
      ctx.arc(centerX - eyeOffsetX, bodyY - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Right eye background  
      ctx.beginPath();
      ctx.arc(centerX + eyeOffsetX, bodyY - eyeOffsetY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw pupils only when not blinking
      if (!isBlinking) {
        ctx.fillStyle = '#000000';
        const pupilRadius = 2;
        let pupilOffsetX = 0;
        let pupilOffsetY = 0;
        
        switch (this.facingDirection) {
          case 'right':
            pupilOffsetX = 2;
            pupilOffsetY = 0;
            break;
          case 'left':
            pupilOffsetX = -2;
            pupilOffsetY = 0;
            break;
          case 'up':
            pupilOffsetX = 0;
            pupilOffsetY = -2;
            break;
          case 'down':
            pupilOffsetX = 0;
            pupilOffsetY = 2;
            break;
        }
        
        // Left pupil
        ctx.beginPath();
        ctx.arc(centerX - eyeOffsetX + pupilOffsetX, bodyY - eyeOffsetY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
        
        // Right pupil
        ctx.beginPath();
        ctx.arc(centerX + eyeOffsetX + pupilOffsetX, bodyY - eyeOffsetY + pupilOffsetY, pupilRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Draw mouth based on expression (expression already declared above)
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    switch (expression) {
      case 'happy':
        // Big cheerful smile
        ctx.arc(centerX, bodyY + 2, 9, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
        break;
      case 'thinking':
        // Thoughtful expression - small line mouth
        ctx.moveTo(centerX - 4, bodyY + 6);
        ctx.lineTo(centerX + 4, bodyY + 6);
        ctx.stroke();
        break;
      case 'ashamed':
        // Slightly sad/embarrassed - small downward curve
        ctx.arc(centerX, bodyY + 8, 4, 1.2 * Math.PI, 1.8 * Math.PI);
        ctx.stroke();
        break;
      case 'sleeping':
        // Sleeping - small open mouth with Zzz
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(centerX, bodyY + 6, 3, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw Zzz above head
        ctx.fillStyle = '#666666';
        ctx.font = '8px Arial';
        ctx.fillText('z', centerX + 8, bodyY - 8);
        ctx.fillText('z', centerX + 12, bodyY - 12);
        ctx.fillText('Z', centerX + 16, bodyY - 16);
        break;
      default: // normal
        // Regular friendly smile
        ctx.arc(centerX, bodyY + 4, 6, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        break;
    }
    
    // Player outline for better visibility with walking pulse
    const outlineWidth = this.isMoving ? 2 + Math.sin(this.walkCycle * 3) * 0.5 : 2;
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = outlineWidth;
    ctx.beginPath();
    ctx.arc(centerX, bodyY, tileSize * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    
    // Removed moving sparkles to eliminate flickering
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
}