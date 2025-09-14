import { Tile } from './Tile';
import { TILE } from '../GameConstants';
import { playDiamondFallSound } from '../GameUtils';

/**
 * Diamond Tile - collectible treasure
 */
export class DiamondTile extends Tile {
  constructor(x, y) {
    super(x, y, 'diamond');
    // Use position-based phase so it's consistent across frames
    this.sparklePhase = (x * 0.7 + y * 0.5) % (Math.PI * 2);
    this.isFalling = false;
  }

  animate(deltaTime, gameState) {
    super.animate(deltaTime, gameState);
    // No animation needed - we'll use time directly in draw
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    // Use gameState time directly since tiles are recreated each frame
    const currentTime = gameState || 0;
    // Moderate speed for nice sparkle effect
    const slowTime = currentTime / 1000; // Faster than 5000, but still slower than original
    
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
    
    // Enhanced sparkle effects using slow time - random sparkles + bright beams
    const baseSparkle = Math.sin(slowTime + this.sparklePhase);
    const sparkleIntensity = Math.max(0, baseSparkle * baseSparkle); // Square for more natural fade
    const sparkle2 = Math.max(0, Math.sin(slowTime * 1.3 + this.sparklePhase + Math.PI * 0.7) * 0.8);
    const beamSparkle = Math.max(0, Math.sin(slowTime * 0.9 + this.sparklePhase + Math.PI * 0.3));
    
    // Bright beam sparkles (classic diamond effect) with random starting positions
    if (beamSparkle > 0.2) {
      const beamAlpha = beamSparkle * 0.9;
      ctx.fillStyle = `rgba(255, 255, 255, ${beamAlpha})`;
      
      // Random beam center positions (different for each diamond)
      const beamCenterX = centerX + (((mapX * 19 + mapY * 27) % 100) / 100 - 0.5) * halfSize * 0.4;
      const beamCenterY = centerY + (((mapX * 23 + mapY * 31) % 100) / 100 - 0.5) * halfSize * 0.4;
      
      // Random beam angles (slight variation from perfect cross)
      const angleOffset1 = (((mapX * 13 + mapY * 17) % 100) / 100 - 0.5) * 0.3; // ±0.15 radians
      const angleOffset2 = (((mapX * 29 + mapY * 37) % 100) / 100 - 0.5) * 0.3;
      
      const beamWidth = 1 + beamSparkle * 1.5;
      
      // Main beams with slight angle variations
      ctx.save();
      ctx.translate(beamCenterX, beamCenterY);
      
      // First beam (mostly vertical with slight angle)
      ctx.rotate(angleOffset1);
      ctx.fillRect(-beamWidth/2, -halfSize * 0.8, beamWidth, halfSize * 1.6);
      ctx.rotate(-angleOffset1); // Reset rotation
      
      // Second beam (mostly horizontal with slight angle)
      ctx.rotate(Math.PI/2 + angleOffset2);
      ctx.fillRect(-beamWidth/2, -halfSize * 0.8, beamWidth, halfSize * 1.6);
      ctx.rotate(-Math.PI/2 - angleOffset2); // Reset rotation
      
      // Diagonal beams when very bright (also with random center and angles)
      if (beamSparkle > 0.6) {
        const diagAngle1 = Math.PI/4 + (((mapX * 41 + mapY * 43) % 100) / 100 - 0.5) * 0.2;
        const diagAngle2 = -Math.PI/4 + (((mapX * 47 + mapY * 53) % 100) / 100 - 0.5) * 0.2;
        
        ctx.rotate(diagAngle1);
        ctx.fillRect(-beamWidth/2, -halfSize * 0.6, beamWidth, halfSize * 1.2);
        ctx.rotate(-diagAngle1);
        
        ctx.rotate(diagAngle2);
        ctx.fillRect(-beamWidth/2, -halfSize * 0.6, beamWidth, halfSize * 1.2);
        ctx.rotate(-diagAngle2);
      }
      
      ctx.restore();
    }
    
    // Random sparkles within diamond (for variety)
    if (sparkleIntensity > 0.1) {
      const alpha = sparkleIntensity * 0.6;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      
      // Create 2-3 random sparkles within the diamond shape
      const numMainSparkles = Math.floor(sparkleIntensity * 2) + 1;
      for (let i = 0; i < numMainSparkles; i++) {
        // Use position and time to create "random" but consistent positions
        const seedX = (mapX * 17 + mapY * 23 + i * 13) % 100;
        const seedY = (mapX * 31 + mapY * 37 + i * 19) % 100;
        
        // Convert to diamond-relative coordinates
        const relX = (seedX / 100 - 0.5) * 0.6; // Smaller area to avoid beam overlap
        const relY = (seedY / 100 - 0.5) * 0.6;
        
        // Ensure point is within diamond shape bounds
        if (Math.abs(relX) + Math.abs(relY) < 0.5) {
          const sparkleX = centerX + relX * halfSize + Math.sin(slowTime * 2.1 + i + this.sparklePhase) * 2;
          const sparkleY = centerY + relY * halfSize + Math.cos(slowTime * 1.7 + i + this.sparklePhase) * 2;
          
          // Variable sparkle sizes
          const sparkleSize = (0.5 + Math.sin(slowTime * 3 + i) * 0.3) * sparkleIntensity + 0.3;
          
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // Secondary quick twinkles
    if (sparkle2 > 0.4) {
      ctx.fillStyle = `rgba(255, 255, 255, ${sparkle2 * 0.4})`;
      
      // Quick twinkling points
      const numSecondary = Math.floor(sparkle2 * 2);
      for (let i = 0; i < numSecondary; i++) {
        const seedX = (mapX * 41 + mapY * 43 + i * 29 + Math.floor(slowTime * 8)) % 100;
        const seedY = (mapX * 47 + mapY * 53 + i * 31 + Math.floor(slowTime * 6)) % 100;
        
        const relX = (seedX / 100 - 0.5) * 0.4;
        const relY = (seedY / 100 - 0.5) * 0.4;
        
        if (Math.abs(relX) + Math.abs(relY) < 0.3) {
          const sparkleX = centerX + relX * halfSize;
          const sparkleY = centerY + relY * halfSize;
          const sparkleSize = sparkle2 * 0.6 + 0.2;
          
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    
    // Subtle edge highlights
    const edgeHighlight = Math.sin(slowTime * 0.8 + this.sparklePhase) * 0.3 + 0.7;
    ctx.save();
    ctx.translate(centerX, centerY);
    
    ctx.strokeStyle = `rgba(255, 255, 255, ${edgeHighlight * 0.15})`;
    ctx.lineWidth = 0.5 + edgeHighlight * 0.3;
    ctx.beginPath();
    ctx.moveTo(0, -halfSize * 0.9);
    ctx.lineTo(halfSize * 0.9, 0);
    ctx.lineTo(0, halfSize * 0.9);
    ctx.lineTo(-halfSize * 0.9, 0);
    ctx.closePath();
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

  /**
   * Update physics for diamond tile - handles falling and rolling (same as rock)
   * @param {number} deltaTime - Time since last update
   * @param {Array} grid - The game grid
   * @param {number} cols - Number of columns
   * @param {number} rows - Number of rows
   * @param {Object} gameState - Current game state
   * @returns {Object|null} Physics update result
   */
  updatePhysics(deltaTime, grid, cols, rows, gameState) {
    // Don't start new movement if already moving smoothly
    if (this.isMoving) {
      return null;
    }
    
    // PRIORITY 1: Fall straight down if space is empty
    if (this.canFallDown(grid, cols, rows)) {
      const targetY = this.y + 1;
      
      // Start smooth movement instead of instant grid change
      this.startSmoothMovement(this.x, targetY, 120); // 120ms smooth fall (faster than rocks)
      
      const result = {
        from: { x: this.x, y: this.y },
        to: { x: this.x, y: targetY },
        smoothMovement: true
      };
      
      // Check if will hit something next turn and play sound
      if (targetY + 1 < rows && grid[(targetY + 1) * cols + this.x] !== TILE.EMPTY) {
        result.sound = 'diamondfall';
      }
      
      // Check if player is crushed
      if (this.wouldKillPlayer(this.x, targetY, grid, cols, rows)) {
        result.killPlayer = true;
      }
      
      this.isFalling = true;
      return result;
    }
    
    // PRIORITY 2: Try to roll left (only if can't fall straight)
    if (this.canRollLeft(grid, cols, rows)) {
      const targetX = this.x - 1;
      const targetY = this.y + 1;
      
      // Start smooth diagonal movement
      this.startSmoothMovement(targetX, targetY, 150); // 150ms for diagonal roll
      
      const result = {
        from: { x: this.x, y: this.y },
        to: { x: targetX, y: targetY },
        sound: 'diamondfall',
        smoothMovement: true
      };
      
      // Check if player is crushed
      if (this.wouldKillPlayer(targetX, targetY, grid, cols, rows)) {
        result.killPlayer = true;
      }
      
      this.isFalling = true;
      return result;
    }
    
    // PRIORITY 3: Try to roll right (only if can't fall straight or left)
    if (this.canRollRight(grid, cols, rows)) {
      const targetX = this.x + 1;
      const targetY = this.y + 1;
      
      // Start smooth diagonal movement
      this.startSmoothMovement(targetX, targetY, 150); // 150ms for diagonal roll
      
      const result = {
        from: { x: this.x, y: this.y },
        to: { x: targetX, y: targetY },
        sound: 'diamondfall',
        smoothMovement: true
      };
      
      // Check if player is crushed
      if (this.wouldKillPlayer(targetX, targetY, grid, cols, rows)) {
        result.killPlayer = true;
      }
      
      this.isFalling = true;
      return result;
    }
    
    // No movement possible - stop falling animation
    this.isFalling = false;
    return null;
  }

  /**
   * Override base canRollLeft to add diamond-specific logic
   */
  canRollLeft(grid, cols, rows) {
    if (this.x - 1 < 0 || this.y + 1 >= rows) return false;
    
    const belowIndex = (this.y + 1) * cols + this.x;
    const leftIndex = this.y * cols + (this.x - 1);
    const leftBelowIndex = (this.y + 1) * cols + (this.x - 1);
    
    // Can roll left if: space to left is empty, space below-left is empty,
    // there's something solid below current position, and it's not the player
    return grid[leftIndex] === TILE.EMPTY && 
           grid[leftBelowIndex] === TILE.EMPTY && 
           (grid[belowIndex] === TILE.ROCK || grid[belowIndex] === TILE.DIAMOND) &&
           grid[belowIndex] !== TILE.PLAYER;
  }

  /**
   * Override base canRollRight to add diamond-specific logic
   */
  canRollRight(grid, cols, rows) {
    if (this.x + 1 >= cols || this.y + 1 >= rows) return false;
    
    const belowIndex = (this.y + 1) * cols + this.x;
    const rightIndex = this.y * cols + (this.x + 1);
    const rightBelowIndex = (this.y + 1) * cols + (this.x + 1);
    
    // Can roll right if: space to right is empty, space below-right is empty,
    // there's something solid below current position, and it's not the player
    return grid[rightIndex] === TILE.EMPTY && 
           grid[rightBelowIndex] === TILE.EMPTY && 
           (grid[belowIndex] === TILE.ROCK || grid[belowIndex] === TILE.DIAMOND) &&
           grid[belowIndex] !== TILE.PLAYER;
  }

  getBaseColor() {
    return '#00FFFF';
  }
}