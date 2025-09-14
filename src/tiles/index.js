// Tile System Exports
// Import this file to get access to the complete tile system

export { Tile } from './Tile';
export { 
  EmptyTile, 
  WallTile, 
  DirtTile, 
  RockTile, 
  DiamondTile, 
  PlayerTile 
} from './GameTiles';
export { 
  HeavyRockTile, 
  BouncyRockTile, 
  BalloonTile, 
  LavaTile, 
  RubyCrystalTile, 
  EmeraldCrystalTile 
} from './SpecialTiles';
export { TileFactory, tileFactory, TileGridUtils } from './TileFactory';

// Quick start example:
/*
import { tileFactory } from './tiles';

// Create individual tiles
const wall = tileFactory.createTile('wall', 0, 0);
const lava = tileFactory.createTile('lava', 1, 0);
const balloon = tileFactory.createTile('balloon', 2, 0, { 
  properties: { color: '#00FF00' } 
});

// Convert existing grid
const gameGrid = [
  [1, 1, 1, 1],
  [1, 0, 4, 1],
  [1, 2, 3, 1],
  [1, 1, 1, 1]
];

const tileGrid = tileFactory.createTileGrid(gameGrid);

// Animate and draw
TileGridUtils.animateGrid(tileGrid, deltaTime, gameState);
TileGridUtils.drawGrid(ctx, tileGrid, tileSize, offsetX, offsetY, gameState);
*/