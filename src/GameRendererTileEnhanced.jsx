import { GAME_CONFIG } from './GameConstants';
import { TileFactory } from './tiles/TileFactory';

const { tileSize } = GAME_CONFIG;

// Tile cache for performance
const tileCache = new Map();
let tileFactory = null;

// Initialize tile factory
export function initializeTileRenderer() {
  if (!tileFactory) {
    tileFactory = new TileFactory();
    console.log('🏭 Tile factory initialized for enhanced renderer');
    
    // Test tile creation
    try {
      const testTile = tileFactory.createTile('wall', 0, 0);
      console.log('✅ Test tile created successfully:', testTile);
    } catch (error) {
      console.error('❌ Error creating test tile:', error);
    }
  }
}

// Get or create tile instance for a grid position
function getTileInstance(tileType, x, y) {
  const key = `${tileType}-${x}-${y}`;
  
  if (!tileCache.has(key)) {
    // Only log first few tile creations to avoid spam
    if (tileCache.size < 10) {
      console.log(`🆕 Creating new tile: ${tileType} at (${x}, ${y})`);
    }
    const tile = tileFactory.createTile(tileType, x, y);
    if (tileCache.size < 5) {
      console.log(`✅ Tile created:`, tile);
    }
    tileCache.set(key, tile);
  }
  
  return tileCache.get(key);
}

// Clear tile cache when level changes
export function clearTileCache() {
  tileCache.clear();
  console.log('🧹 Tile cache cleared');
}

// Enhanced tile-based game renderer
export function drawTileEnhancedGame(ctx, grid, gameState) {
  if (!ctx || !grid || grid.length === 0) {
    console.warn('⚠️ Invalid renderer parameters:', { ctx: !!ctx, grid: !!grid, gridLength: grid?.length });
    return;
  }

  // Initialize tile factory if needed
  if (!tileFactory) {
    initializeTileRenderer();
  }

  const { playerX, playerY, cameraX, cameraY, currentPath } = gameState;
  const canvas = ctx.canvas;

  // Debug: Log key values (occasionally to avoid spam)
  if (Math.random() < 0.01) {
    console.log('🎨 Rendering frame:', {
      gridSize: `${grid.length}x${grid[0]?.length}`,
      playerPos: `(${playerX}, ${playerY})`,
      camera: `(${cameraX}, ${cameraY})`,
      canvasSize: `${canvas.width}x${canvas.height}`
    });
  }

  // Clear canvas 
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Calculate visible area
  const startX = Math.floor(cameraX / tileSize);
  const startY = Math.floor(cameraY / tileSize);
  const endX = Math.min(grid[0].length, startX + Math.ceil(canvas.width / tileSize) + 1);
  const endY = Math.min(grid.length, startY + Math.ceil(canvas.height / tileSize) + 1);

  let tilesDrawn = 0;
  let tilesSkipped = 0;

  // Draw tiles using tile system
  for (let y = Math.max(0, startY); y < endY; y++) {
    for (let x = Math.max(0, startX); x < endX; x++) {
      const tileValue = grid[y][x];
      const pixelX = x * tileSize - cameraX;
      const pixelY = y * tileSize - cameraY;

      // Skip empty tiles (value 0) as they should be transparent
      if (tileValue === 0) {
        tilesSkipped++;
        continue;
      }

      tilesDrawn++;
      
      // Debug first few tiles (only once to avoid spam)
      if (tilesDrawn <= 3 && Math.random() < 0.01) {
        console.log(`🧱 Drawing tile ${tilesDrawn}: value=${tileValue} at (${x},${y}) -> (${pixelX},${pixelY})`);
      }

      // Map grid values to tile types
      let tileType = 'empty';
      switch (tileValue) {
        case 1: tileType = 'wall'; break;
        case 2: tileType = 'dirt'; break;
        case 3: tileType = 'rock'; break;
        case 4: tileType = 'diamond'; break;
        case 5: tileType = 'player'; break;
        default: tileType = 'empty'; break;
      }

      // Get tile instance and draw it
      try {
        const tile = getTileInstance(tileType, x, y);
        if (tile && tile.draw) {
          // Debug tile drawing (occasionally)
          if (tilesDrawn <= 3 && Math.random() < 0.01) {
            console.log(`🎨 Drawing tile:`, tile, `at (${pixelX}, ${pixelY})`);
          }
          tile.draw(ctx, pixelX, pixelY, tileSize, gameState);
        } else {
          console.warn(`⚠️ Tile missing draw method:`, tile);
          // Fallback to simple rendering if tile system fails
          ctx.fillStyle = getTileColor(tileValue);
          ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
          
          // Add border for better visibility
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1;
          ctx.strokeRect(pixelX, pixelY, tileSize, tileSize);
        }
      } catch (error) {
        console.warn(`⚠️ Error drawing tile at (${x}, ${y}):`, error);
        
        // Fallback to simple rendering
        ctx.fillStyle = getTileColor(tileValue);
        ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
        
        // Add border for debugging
        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 1;
        ctx.strokeRect(pixelX, pixelY, tileSize, tileSize);
      }
    }
  }

  // Only log stats occasionally to avoid spam
  if (Math.random() < 0.01) {
    console.log(`📊 Tiles drawn: ${tilesDrawn}, skipped: ${tilesSkipped}`);
  }

  // Draw path overlay if exists
  if (currentPath && currentPath.length > 0) {
    drawPath(ctx, currentPath, cameraX, cameraY);
  }

  // Optional: Draw grid lines for debugging
  if (GAME_CONFIG.DEBUG_GRID) {
    drawGridLines(ctx, canvas, cameraX, cameraY);
  }
}

// Fallback tile colors for error cases
function getTileColor(tileValue) {
  switch (tileValue) {
    case 0: return '#000000'; // Empty
    case 1: return '#666666'; // Wall
    case 2: return '#8B4513'; // Dirt
    case 3: return '#999999'; // Rock
    case 4: return '#00FFFF'; // Diamond
    case 5: return '#FFD700'; // Player
    default: return '#FF00FF'; // Error (magenta)
  }
}

// Draw path overlay
function drawPath(ctx, path, cameraX, cameraY) {
  if (!path || path.length === 0) return;

  ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let i = 0; i < path.length; i++) {
    const { x, y } = path[i];
    const pathX = x * tileSize + tileSize / 2 - cameraX;
    const pathY = y * tileSize + tileSize / 2 - cameraY;

    if (i === 0) {
      ctx.moveTo(pathX, pathY);
    } else {
      ctx.lineTo(pathX, pathY);
    }
  }

  ctx.stroke();

  // Draw path points
  ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
  for (const { x, y } of path) {
    const pathX = x * tileSize + tileSize / 2 - cameraX;
    const pathY = y * tileSize + tileSize / 2 - cameraY;

    ctx.beginPath();
    ctx.arc(pathX, pathY, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Debug grid lines
function drawGridLines(ctx, canvas, cameraX, cameraY) {
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;

  // Vertical lines
  for (let x = 0; x < canvas.width + tileSize; x += tileSize) {
    const adjustedX = x - (cameraX % tileSize);
    ctx.beginPath();
    ctx.moveTo(adjustedX, 0);
    ctx.lineTo(adjustedX, canvas.height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y < canvas.height + tileSize; y += tileSize) {
    const adjustedY = y - (cameraY % tileSize);
    ctx.beginPath();
    ctx.moveTo(0, adjustedY);
    ctx.lineTo(canvas.width, adjustedY);
    ctx.stroke();
  }
}

// Update tile animations
export function updateTileAnimations(deltaTime) {
  if (!tileFactory) return;

  // Update all cached tiles
  for (const tile of tileCache.values()) {
    if (tile && tile.animate) {
      tile.animate(deltaTime);
    }
  }
}

// Get tile stats for debugging
export function getTileStats() {
  return {
    cachedTiles: tileCache.size,
    factoryInitialized: !!tileFactory
  };
}