
import { EmptyTile, WallTile, DirtTile, RockTile, DiamondTile, PlayerTile,  HeavyRockTile, 
  BouncyRockTile, 
  BalloonTile, 
  LavaTile, 
  RubyCrystalTile, 
  EmeraldCrystalTile,
  ExplosionDiamondTile
 } from './GameTiles';
/**
 * Tile Factory - Creates and manages all tile types
 * Provides easy extensibility for new tile types
 */
export class TileFactory {
  constructor() {
    // Registry of all available tile types
    this.tileRegistry = new Map([
      // Basic tiles
      ['empty', EmptyTile],
      ['wall', WallTile],
      ['dirt', DirtTile],
      ['rock', RockTile],
      ['diamond', DiamondTile],
      ['player', PlayerTile],
      
      // Special tiles
      ['heavy_rock', HeavyRockTile],
      ['bouncy_rock', BouncyRockTile],
      ['balloon', BalloonTile],
      ['lava', LavaTile],
      ['ruby_crystal', RubyCrystalTile],
      ['emerald_crystal', EmeraldCrystalTile],
      ['explosion_diamond', ExplosionDiamondTile]
    ]);
  }

  /**
   * Create a tile of specified type
   * @param {string} type - Tile type identifier
   * @param {number} x - Grid X position
   * @param {number} y - Grid Y position
   * @param {Object} options - Additional options for tile creation
   * @returns {Tile} Created tile instance
   */
  createTile(type, x, y, options = {}) {
    const TileClass = this.tileRegistry.get(type);
    
    if (!TileClass) {
      console.warn(`Unknown tile type: ${type}. Creating empty tile.`);
      return new EmptyTile(x, y);
    }

    const tile = new TileClass(x, y);
    
    // Apply any additional options
    if (options.properties) {
      Object.assign(tile.properties, options.properties);
    }
    
    return tile;
  }

  /**
   * Register a new tile type
   * @param {string} type - Tile type identifier
   * @param {Class} TileClass - Tile class constructor
   */
  registerTile(type, TileClass) {
    this.tileRegistry.set(type, TileClass);
  }

  /**
   * Get all available tile types
   * @returns {Array<string>} Array of tile type names
   */
  getAvailableTypes() {
    return Array.from(this.tileRegistry.keys());
  }

  /**
   * Create tiles from game grid (converts simple numbers/strings to tile objects)
   * @param {Array<Array>} grid - 2D array of tile identifiers
   * @returns {Array<Array<Tile>>} 2D array of tile objects
   */
  createTileGrid(grid) {
    const tileGrid = [];
    
    for (let y = 0; y < grid.length; y++) {
      tileGrid[y] = [];
      for (let x = 0; x < grid[y].length; x++) {
        const tileType = this.mapLegacyTileType(grid[y][x]);
        tileGrid[y][x] = this.createTile(tileType, x, y);
      }
    }
    
    return tileGrid;
  }

  /**
   * Map legacy tile numbers/characters to new tile types
   * @param {number|string} legacyType - Old tile identifier
   * @returns {string} New tile type string
   */
  mapLegacyTileType(legacyType) {
    const mapping = {
      0: 'empty',
      1: 'wall',
      2: 'dirt',
      3: 'rock',
      4: 'diamond',
      5: 'player',
      'E': 'empty',
      'W': 'wall',
      'D': 'dirt',
      'R': 'rock',
      'C': 'diamond', // Crystal
      'P': 'player'
    };
    
    return mapping[legacyType] || 'empty';
  }

  /**
   * Create specialized tile collections for levels
   */
  createSpecialLevel(levelType) {
    switch (levelType) {
      case 'crystal_cavern':
        return {
          diamonds: ['ruby_crystal', 'emerald_crystal', 'diamond'],
          rocks: ['rock', 'heavy_rock'],
          specialElements: ['balloon']
        };
        
      case 'lava_level':
        return {
          hazards: ['lava'],
          rocks: ['bouncy_rock'],
          specialElements: ['balloon']
        };
        
      default:
        return {
          diamonds: ['diamond'],
          rocks: ['rock'],
          specialElements: []
        };
    }
  }
}

// Export singleton instance
export const tileFactory = new TileFactory();

/**
 * Utility functions for working with tile grids
 */
export class TileGridUtils {
  /**
   * Animate all tiles in a grid
   * @param {Array<Array<Tile>>} tileGrid - 2D array of tiles
   * @param {number} deltaTime - Time since last update
   * @param {Object} gameState - Current game state
   */
  static animateGrid(tileGrid, deltaTime, gameState) {
    for (let y = 0; y < tileGrid.length; y++) {
      for (let x = 0; x < tileGrid[y].length; x++) {
        if (tileGrid[y][x]) {
          tileGrid[y][x].animate(deltaTime, gameState);
        }
      }
    }
  }

  /**
   * Draw all tiles in a grid
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array<Array<Tile>>} tileGrid - 2D array of tiles
   * @param {number} tileSize - Size of each tile
   * @param {number} offsetX - Camera offset X
   * @param {number} offsetY - Camera offset Y
   * @param {Object} gameState - Current game state
   */
  static drawGrid(ctx, tileGrid, tileSize, offsetX, offsetY, gameState) {
    for (let y = 0; y < tileGrid.length; y++) {
      for (let x = 0; x < tileGrid[y].length; x++) {
        if (tileGrid[y][x]) {
          const pixelX = x * tileSize - offsetX;
          const pixelY = y * tileSize - offsetY;
          
          // Only draw tiles that are visible
          if (pixelX > -tileSize && pixelX < ctx.canvas.width &&
              pixelY > -tileSize && pixelY < ctx.canvas.height) {
            tileGrid[y][x].draw(ctx, pixelX, pixelY, tileSize, gameState);
          }
        }
      }
    }
  }

  /**
   * Find all tiles of a specific type in grid
   * @param {Array<Array<Tile>>} tileGrid - 2D array of tiles
   * @param {string} tileType - Type to search for
   * @returns {Array<{x: number, y: number, tile: Tile}>} Found tiles with positions
   */
  static findTilesOfType(tileGrid, tileType) {
    const found = [];
    
    for (let y = 0; y < tileGrid.length; y++) {
      for (let x = 0; x < tileGrid[y].length; x++) {
        if (tileGrid[y][x] && tileGrid[y][x].type === tileType) {
          found.push({ x, y, tile: tileGrid[y][x] });
        }
      }
    }
    
    return found;
  }
}