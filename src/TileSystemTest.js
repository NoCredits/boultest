import { tileFactory, TileGridUtils } from './tiles';

/**
 * Simple test to verify tile system works
 */
export function testTileSystem() {
  console.log('🧪 Testing Tile System...');
  
  // Test 1: Create basic tiles
  console.log('Creating basic tiles...');
  const wall = tileFactory.createTile('wall', 0, 0);
  const rock = tileFactory.createTile('rock', 1, 0);
  const diamond = tileFactory.createTile('diamond', 2, 0);
  const player = tileFactory.createTile('player', 3, 0);
  
  console.log(`✅ Wall: ${wall.type}, Blocking: ${wall.isBlocking()}`);
  console.log(`✅ Rock: ${rock.type}, Can Move: ${rock.canMove()}`);
  console.log(`✅ Diamond: ${diamond.type}, Base Color: ${diamond.getBaseColor()}`);
  console.log(`✅ Player: ${player.type}, Base Color: ${player.getBaseColor()}`);
  
  // Test 2: Create special tiles
  console.log('Creating special tiles...');
  const lava = tileFactory.createTile('lava', 0, 1);
  const balloon = tileFactory.createTile('balloon', 1, 1, { 
    properties: { color: '#00FF00' } 
  });
  const ruby = tileFactory.createTile('ruby_crystal', 2, 1);
  
  console.log(`✅ Lava: ${lava.type}, Properties:`, lava.properties);
  console.log(`✅ Balloon: ${balloon.type}, Color: ${balloon.properties.color}`);
  console.log(`✅ Ruby: ${ruby.type}, Value: ${ruby.properties.value}`);
  
  // Test 3: Create grid from legacy format
  console.log('Testing grid conversion...');
  const legacyGrid = [
    [1, 1, 1, 1, 1],
    [1, 0, 2, 4, 1],
    [1, 3, 0, 0, 1],
    [1, 5, 2, 3, 1],
    [1, 1, 1, 1, 1]
  ];
  
  const tileGrid = tileFactory.createTileGrid(legacyGrid);
  console.log(`✅ Grid created: ${tileGrid.length}x${tileGrid[0].length}`);
  console.log(`✅ Player at (1,3): ${tileGrid[3][1].type}`);
  console.log(`✅ Diamond at (3,1): ${tileGrid[1][3].type}`);
  
  // Test 4: Test animation
  console.log('Testing animation...');
  lava.animate(16.67, {}); // Simulate 60fps frame
  balloon.animate(16.67, {});
  console.log(`✅ Lava animated, wave phase: ${lava.wavePhase.toFixed(2)}`);
  console.log(`✅ Balloon animated, float offset: ${balloon.properties.floatOffset?.toFixed(2) || 0}`);
  
  // Test 5: Available types
  console.log('Available tile types:');
  const availableTypes = tileFactory.getAvailableTypes();
  console.log(`✅ ${availableTypes.length} tile types: ${availableTypes.join(', ')}`);
  
  console.log('🎉 Tile System Test Complete!');
  
  return {
    success: true,
    tileGrid,
    availableTypes,
    specialTiles: { lava, balloon, ruby }
  };
}

/**
 * Test drawing functionality (requires canvas context)
 */
export function testTileDrawing(canvas) {
  if (!canvas) {
    console.log('⚠️ No canvas provided for drawing test');
    return;
  }
  
  const ctx = canvas.getContext('2d');
  const tileSize = 32;
  
  console.log('🎨 Testing tile drawing...');
  
  // Create test tiles
  const testTiles = [
    tileFactory.createTile('wall', 0, 0),
    tileFactory.createTile('dirt', 1, 0),
    tileFactory.createTile('rock', 2, 0),
    tileFactory.createTile('diamond', 3, 0),
    tileFactory.createTile('player', 4, 0),
    tileFactory.createTile('lava', 0, 1),
    tileFactory.createTile('balloon', 1, 1),
    tileFactory.createTile('ruby_crystal', 2, 1)
  ];
  
  // Draw tiles
  testTiles.forEach(tile => {
    const pixelX = tile.x * tileSize;
    const pixelY = tile.y * tileSize;
    tile.draw(ctx, pixelX, pixelY, tileSize, {});
  });
  
  console.log('✅ Drawing test complete');
}