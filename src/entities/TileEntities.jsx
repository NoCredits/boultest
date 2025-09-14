import { Entity } from './Entity.jsx';
import { TILE, TILE_COLORS } from '../GameConstants.jsx';

/**
 * Empty space - can be moved through
 */
export class EmptyEntity extends Entity {
  constructor(x, y) {
    super(x, y, TILE.EMPTY);
  }

  getColor() {
    return TILE_COLORS[TILE.EMPTY];
  }

  isPassable() {
    return true;
  }

  render(ctx, screenX, screenY, tileSize, time) {
    // Empty tiles are usually not rendered (transparent)
    // But we can add subtle grid lines or background texture here if needed
  }
}

/**
 * Wall - solid barrier
 */
export class WallEntity extends Entity {
  constructor(x, y) {
    super(x, y, TILE.WALL);
  }

  getColor() {
    return TILE_COLORS[TILE.WALL];
  }

  render(ctx, screenX, screenY, tileSize, time) {
    // Draw wall with a slightly 3D effect
    ctx.fillStyle = this.getColor();
    ctx.fillRect(screenX, screenY, tileSize, tileSize);
    
    // Add highlight for 3D effect
    ctx.fillStyle = '#666';
    ctx.fillRect(screenX, screenY, tileSize, 2);
    ctx.fillRect(screenX, screenY, 2, tileSize);
    
    // Add shadow
    ctx.fillStyle = '#222';
    ctx.fillRect(screenX, screenY + tileSize - 2, tileSize, 2);
    ctx.fillRect(screenX + tileSize - 2, screenY, 2, tileSize);
  }
}

/**
 * Dirt - can be dug through by player
 */
export class DirtEntity extends Entity {
  constructor(x, y) {
    super(x, y, TILE.DIRT);
  }

  getColor() {
    return TILE_COLORS[TILE.DIRT];
  }

  onPlayerInteraction(player, gameState) {
    // Dirt gets removed when player moves through it
    return new EmptyEntity(this.x, this.y);
  }

  render(ctx, screenX, screenY, tileSize, time) {
    ctx.fillStyle = this.getColor();
    ctx.fillRect(screenX, screenY, tileSize, tileSize);
    
    // Add some texture dots for dirt
    ctx.fillStyle = '#654321';
    const dotSize = 2;
    for (let i = 0; i < 4; i++) {
      const dotX = screenX + (i % 2) * tileSize * 0.3 + tileSize * 0.2;
      const dotY = screenY + Math.floor(i / 2) * tileSize * 0.3 + tileSize * 0.2;
      ctx.fillRect(dotX, dotY, dotSize, dotSize);
    }
  }
}

/**
 * Rock - falls when not supported
 */
export class RockEntity extends Entity {
  constructor(x, y) {
    super(x, y, TILE.ROCK);
    this.isFalling = false;
    this.fallSpeed = 0;
  }

  getColor() {
    return TILE_COLORS[TILE.ROCK];
  }

  canFall() {
    return true;
  }

  update(deltaTime, gameState) {
    super.update(deltaTime, gameState);
    
    // Check if rock should start falling
    const belowEntity = gameState.getEntityAt(this.x, this.y + 1);
    if (belowEntity && belowEntity.isPassable()) {
      this.isFalling = true;
      this.fallSpeed += deltaTime * 0.01; // Gravity
    } else {
      this.isFalling = false;
      this.fallSpeed = 0;
    }
  }

  render(ctx, screenX, screenY, tileSize, time) {
    ctx.fillStyle = this.getColor();
    ctx.fillRect(screenX, screenY, tileSize, tileSize);
    
    // Add highlight for 3D rock effect
    ctx.fillStyle = '#aaa';
    ctx.fillRect(screenX + 2, screenY + 2, tileSize - 8, tileSize - 8);
    
    ctx.fillStyle = '#999';
    ctx.fillRect(screenX + 4, screenY + 4, tileSize - 12, tileSize - 12);
  }

  onCollision(other, gameState) {
    // Rock crushes player if falling
    if (this.isFalling && other.type === TILE.PLAYER) {
      return { playerDeath: true };
    }
  }
}

/**
 * Diamond - collectible, falls like rocks
 */
export class DiamondEntity extends Entity {
  constructor(x, y) {
    super(x, y, TILE.DIAMOND);
    this.isFalling = false;
    this.collectSound = null; // Will be set later
  }

  getColor() {
    return TILE_COLORS[TILE.DIAMOND];
  }

  canFall() {
    return true;
  }

  update(deltaTime, gameState) {
    super.update(deltaTime, gameState);
    
    // Check if diamond should start falling
    const belowEntity = gameState.getEntityAt(this.x, this.y + 1);
    if (belowEntity && belowEntity.isPassable()) {
      this.isFalling = true;
    } else {
      this.isFalling = false;
    }
  }

  onPlayerInteraction(player, gameState) {
    // Diamond gets collected
    if (gameState.sounds?.diamond) {
      gameState.sounds.diamond.play();
    }
    gameState.score += 100;
    gameState.diamondsCollected++;
    
    return new EmptyEntity(this.x, this.y);
  }

  render(ctx, screenX, screenY, tileSize, time) {
    // Animated sparkling diamond
    const sparkle = Math.sin(time * 0.005) * 0.3 + 0.7;
    const color = `hsl(180, 100%, ${50 + sparkle * 30}%)`;
    
    ctx.fillStyle = color;
    
    // Diamond shape
    const centerX = screenX + tileSize / 2;
    const centerY = screenY + tileSize / 2;
    const size = tileSize * 0.3;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - size);
    ctx.lineTo(centerX + size * 0.6, centerY - size * 0.3);
    ctx.lineTo(centerX + size * 0.6, centerY + size * 0.3);
    ctx.lineTo(centerX, centerY + size);
    ctx.lineTo(centerX - size * 0.6, centerY + size * 0.3);
    ctx.lineTo(centerX - size * 0.6, centerY - size * 0.3);
    ctx.closePath();
    ctx.fill();
    
    // Add inner sparkle
    ctx.fillStyle = 'white';
    ctx.fillRect(centerX - 1, centerY - size * 0.5, 2, 4);
    ctx.fillRect(centerX - size * 0.3, centerY - 1, 4, 2);
  }
}

/**
 * Player entity
 */
export class PlayerEntity extends Entity {
  constructor(x, y) {
    super(x, y, TILE.PLAYER);
    this.facingDirection = 'right';
    this.animationState = 'idle';
    this.lastMoveTime = 0;
  }

  getColor() {
    return TILE_COLORS[TILE.PLAYER];
  }

  isPassable() {
    return false; // Player blocks other entities
  }

  render(ctx, screenX, screenY, tileSize, time) {
    // Simple player representation - can be enhanced with sprites
    ctx.fillStyle = this.getColor();
    
    const centerX = screenX + tileSize / 2;
    const centerY = screenY + tileSize / 2;
    const radius = tileSize * 0.3;
    
    // Draw player as circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Add eyes
    ctx.fillStyle = 'black';
    const eyeOffset = radius * 0.3;
    ctx.fillRect(centerX - eyeOffset, centerY - eyeOffset, 3, 3);
    ctx.fillRect(centerX + eyeOffset - 3, centerY - eyeOffset, 3, 3);
  }

  moveTo(x, y) {
    super.moveTo(x, y);
    this.lastMoveTime = performance.now();
    this.animationState = 'moving';
  }
}