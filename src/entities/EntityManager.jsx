import { TILE } from '../GameConstants.jsx';
import { 
  EmptyEntity, 
  WallEntity, 
  DirtEntity, 
  RockEntity, 
  DiamondEntity, 
  PlayerEntity 
} from './TileEntities.jsx';

/**
 * Factory for creating entities based on tile type
 */
export class EntityFactory {
  static createEntity(x, y, tileType) {
    switch (tileType) {
      case TILE.EMPTY:
        return new EmptyEntity(x, y);
      case TILE.WALL:
        return new WallEntity(x, y);
      case TILE.DIRT:
        return new DirtEntity(x, y);
      case TILE.ROCK:
        return new RockEntity(x, y);
      case TILE.DIAMOND:
        return new DiamondEntity(x, y);
      case TILE.PLAYER:
        return new PlayerEntity(x, y);
      default:
        return new EmptyEntity(x, y);
    }
  }

  /**
   * Convert old grid format to entities
   */
  static gridToEntities(grid, cols, rows) {
    const entities = new Map();
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const index = y * cols + x;
        const tileType = grid[index];
        const entity = EntityFactory.createEntity(x, y, tileType);
        entities.set(`${x},${y}`, entity);
      }
    }
    
    return entities;
  }

  /**
   * Convert entities back to grid format for compatibility
   */
  static entitiesToGrid(entities, cols, rows) {
    const grid = new Array(cols * rows).fill(TILE.EMPTY);
    
    for (const [posKey, entity] of entities) {
      const [x, y] = posKey.split(',').map(Number);
      const index = y * cols + x;
      if (index >= 0 && index < grid.length) {
        grid[index] = entity.type;
      }
    }
    
    return grid;
  }
}

/**
 * Manages all entities in the game
 */
export class EntityManager {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.entities = new Map(); // Map<"x,y", Entity>
    this.renderQueue = []; // Entities sorted by render priority
    this.updateQueue = []; // Entities that need updates
    this.gameState = {
      score: 0,
      diamondsCollected: 0,
      sounds: null // Will be set from game
    };
  }

  /**
   * Initialize from existing grid
   */
  loadFromGrid(grid) {
    this.entities.clear();
    this.entities = EntityFactory.gridToEntities(grid, this.cols, this.rows);
    this.rebuildQueues();
  }

  /**
   * Get entity at specific position
   */
  getEntityAt(x, y) {
    return this.entities.get(`${x},${y}`);
  }

  /**
   * Set entity at specific position
   */
  setEntityAt(x, y, entity) {
    const posKey = `${x},${y}`;
    
    // Remove old entity from update queue
    const oldEntity = this.entities.get(posKey);
    if (oldEntity) {
      this.removeFromUpdateQueue(oldEntity);
    }
    
    // Set new entity
    if (entity) {
      entity.x = x;
      entity.y = y;
      this.entities.set(posKey, entity);
      this.addToUpdateQueue(entity);
    } else {
      this.entities.delete(posKey);
    }
    
    this.rebuildRenderQueue();
  }

  /**
   * Move entity from one position to another
   */
  moveEntity(fromX, fromY, toX, toY) {
    const entity = this.getEntityAt(fromX, fromY);
    if (!entity) return false;

    // Check if destination is valid
    if (toX < 0 || toX >= this.cols || toY < 0 || toY >= this.rows) {
      return false;
    }

    const targetEntity = this.getEntityAt(toX, toY);
    if (targetEntity && !targetEntity.isPassable()) {
      return false;
    }

    // Remove from old position
    this.entities.delete(`${fromX},${fromY}`);
    
    // Handle interaction with target entity
    if (targetEntity) {
      const result = targetEntity.onPlayerInteraction?.(entity, this.gameState);
      if (result) {
        this.setEntityAt(toX, toY, result);
      }
    }

    // Move to new position
    entity.moveTo(toX, toY);
    this.entities.set(`${toX},${toY}`, entity);
    
    // Set old position to empty
    this.setEntityAt(fromX, fromY, new EmptyEntity(fromX, fromY));

    return true;
  }

  /**
   * Update all entities
   */
  update(deltaTime) {
    this.gameState.deltaTime = deltaTime;
    this.gameState.getEntityAt = this.getEntityAt.bind(this);
    
    // Update entities that need it
    for (const entity of this.updateQueue) {
      entity.update(deltaTime, this.gameState);
    }

    // Handle falling entities
    this.updateFallingEntities();
  }

  /**
   * Handle entities that can fall
   */
  updateFallingEntities() {
    const fallingEntities = [];
    
    // Collect all falling entities
    for (const entity of this.entities.values()) {
      if (entity.canFall?.()) {
        fallingEntities.push(entity);
      }
    }

    // Process from bottom to top to avoid conflicts
    fallingEntities.sort((a, b) => b.y - a.y);

    for (const entity of fallingEntities) {
      const belowY = entity.y + 1;
      if (belowY < this.rows) {
        const belowEntity = this.getEntityAt(entity.x, belowY);
        
        if (belowEntity && belowEntity.isPassable()) {
          // Move entity down
          this.moveEntity(entity.x, entity.y, entity.x, belowY);
        }
      }
    }
  }

  /**
   * Render all visible entities
   */
  render(ctx, camera, tileSize, time) {
    const { x: camX, y: camY } = camera;
    const viewportWidth = Math.ceil(ctx.canvas.width / tileSize) + 2;
    const viewportHeight = Math.ceil(ctx.canvas.height / tileSize) + 2;

    // Only render entities in viewport
    for (let y = Math.floor(camY); y < Math.floor(camY) + viewportHeight; y++) {
      for (let x = Math.floor(camX); x < Math.floor(camX) + viewportWidth; x++) {
        if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
          const entity = this.getEntityAt(x, y);
          if (entity && entity.isVisible) {
            const screenX = (x - camX) * tileSize;
            const screenY = (y - camY) * tileSize;
            
            entity.render(ctx, screenX, screenY, tileSize, time);
          }
        }
      }
    }
  }

  /**
   * Get current grid representation for compatibility
   */
  toGrid() {
    return EntityFactory.entitiesToGrid(this.entities, this.cols, this.rows);
  }

  /**
   * Find player entity
   */
  getPlayer() {
    for (const entity of this.entities.values()) {
      if (entity.type === TILE.PLAYER) {
        return entity;
      }
    }
    return null;
  }

  /**
   * Rebuild render queue with proper ordering
   */
  rebuildRenderQueue() {
    this.renderQueue = Array.from(this.entities.values())
      .filter(entity => entity.isVisible)
      .sort((a, b) => {
        // Render order: background -> foreground
        const typeOrder = {
          [TILE.EMPTY]: 0,
          [TILE.DIRT]: 1,
          [TILE.WALL]: 2,
          [TILE.ROCK]: 3,
          [TILE.DIAMOND]: 4,
          [TILE.PLAYER]: 5
        };
        return (typeOrder[a.type] || 0) - (typeOrder[b.type] || 0);
      });
  }

  /**
   * Rebuild update queue
   */
  rebuildQueues() {
    this.updateQueue = Array.from(this.entities.values())
      .filter(entity => entity.canFall?.() || entity.type === TILE.PLAYER);
    
    this.rebuildRenderQueue();
  }

  /**
   * Add entity to update queue
   */
  addToUpdateQueue(entity) {
    if (!this.updateQueue.includes(entity) && 
        (entity.canFall?.() || entity.type === TILE.PLAYER)) {
      this.updateQueue.push(entity);
    }
  }

  /**
   * Remove entity from update queue
   */
  removeFromUpdateQueue(entity) {
    const index = this.updateQueue.indexOf(entity);
    if (index !== -1) {
      this.updateQueue.splice(index, 1);
    }
  }

  /**
   * Set game sounds reference
   */
  setSounds(sounds) {
    this.gameState.sounds = sounds;
  }

  /**
   * Get game state for debugging
   */
  getGameState() {
    return {
      ...this.gameState,
      entityCount: this.entities.size,
      updateQueueSize: this.updateQueue.length,
      renderQueueSize: this.renderQueue.length
    };
  }
}

// Export as default
export default EntityManager;