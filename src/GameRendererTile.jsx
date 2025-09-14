import { TileFactory, tileFactory, TileGridUtils } from './tiles';
import { GAME_CONFIG } from './GameConstants.jsx';

// Create backup factory if needed
const backupFactory = tileFactory || new TileFactory();

/**
 * Tile-based Game Renderer
 * Replaces legacy grid renderer with tile class system
 */

const { tileSize } = GAME_CONFIG;

/**
 * Convert legacy game grid to tile objects
 * @param {Array<Array<number>>} gameGrid - Legacy grid with numbers
 * @returns {Array<Array<Tile>>} Grid of tile objects
 */
export function createTileGrid(gameGrid) {
  try {
    if (!backupFactory || typeof backupFactory.createTileGrid !== 'function') {
      console.log('🔄 Using manual tile grid creation');
      return createManualTileGrid(gameGrid);
    }
    
    const result = backupFactory.createTileGrid(gameGrid);
    console.log('✅ Tile grid created with tile classes');
    return result;
  } catch (error) {
    console.error('❌ Error creating tile grid:', error);
    console.log('🔄 Falling back to manual grid creation');
    return createManualTileGrid(gameGrid);
  }
}

/**
 * Fallback manual tile grid creation
 */
function createManualTileGrid(gameGrid) {
  const tileGrid = [];
  
  for (let y = 0; y < gameGrid.length; y++) {
    tileGrid[y] = [];
    for (let x = 0; x < gameGrid[y].length; x++) {
      const tileType = mapLegacyTileType(gameGrid[y][x]);
      // Create a simple tile object with enhanced visibility
      tileGrid[y][x] = {
        x, y, type: tileType,
        animate: () => {},
        draw: (ctx, pixelX, pixelY, tileSize) => {
          // Enhanced fallback rendering with much better visibility
          switch(tileType) {
            case 'wall':
              ctx.fillStyle = '#666666';
              ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
              ctx.strokeStyle = '#888888';
              ctx.lineWidth = 2;
              ctx.strokeRect(pixelX, pixelY, tileSize, tileSize);
              // Add brick pattern
              ctx.strokeStyle = '#444444';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(pixelX, pixelY + tileSize/2);
              ctx.lineTo(pixelX + tileSize, pixelY + tileSize/2);
              ctx.stroke();
              break;
              
            case 'dirt':
              ctx.fillStyle = '#8B4513';
              ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
              ctx.strokeStyle = '#654321';
              ctx.lineWidth = 2;
              ctx.strokeRect(pixelX, pixelY, tileSize, tileSize);
              // Add dirt dots
              ctx.fillStyle = '#654321';
              for(let i = 0; i < 4; i++) {
                const dotX = pixelX + (i % 2) * (tileSize/2) + tileSize/4;
                const dotY = pixelY + Math.floor(i/2) * (tileSize/2) + tileSize/4;
                ctx.fillRect(dotX-2, dotY-2, 4, 4);
              }
              break;
              
            case 'rock':
              const gradient = ctx.createRadialGradient(
                pixelX + tileSize/3, pixelY + tileSize/3, 0,
                pixelX + tileSize/2, pixelY + tileSize/2, tileSize/2
              );
              gradient.addColorStop(0, '#CCCCCC');
              gradient.addColorStop(1, '#666666');
              ctx.fillStyle = gradient;
              ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
              ctx.strokeStyle = '#888888';
              ctx.lineWidth = 2;
              ctx.strokeRect(pixelX, pixelY, tileSize, tileSize);
              break;
              
            case 'diamond':
              ctx.fillStyle = '#00FFFF';
              const centerX = pixelX + tileSize/2;
              const centerY = pixelY + tileSize/2;
              const size = tileSize * 0.6;
              ctx.beginPath();
              ctx.moveTo(centerX, centerY - size/2);
              ctx.lineTo(centerX + size/3, centerY - size/4);
              ctx.lineTo(centerX + size/2, centerY + size/2);
              ctx.lineTo(centerX, centerY + size/3);
              ctx.lineTo(centerX - size/2, centerY + size/2);
              ctx.lineTo(centerX - size/3, centerY - size/4);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#00CCCC';
              ctx.lineWidth = 2;
              ctx.stroke();
              break;
              
            case 'player':
              ctx.fillStyle = '#FFD700';
              const playerX = pixelX + tileSize/2;
              const playerY = pixelY + tileSize/2;
              ctx.beginPath();
              ctx.arc(playerX, playerY, tileSize * 0.35, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#FFA500';
              ctx.lineWidth = 3;
              ctx.stroke();
              // Eyes
              ctx.fillStyle = '#000000';
              ctx.fillRect(playerX - 6, playerY - 4, 4, 4);
              ctx.fillRect(playerX + 2, playerY - 4, 4, 4);
              break;
              
            case 'empty':
            default:
              ctx.fillStyle = '#000000';
              ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
              break;
          }
        }
      };
    }
  }
  
  return tileGrid;
}

/**
 * Update tile grid when game state changes
 * @param {Array<Array<Tile>>} tileGrid - Current tile grid
 * @param {Array<Array<number>>} gameGrid - Updated game grid
 * @param {number} playerX - Player X position
 * @param {number} playerY - Player Y position
 */
export function updateTileGrid(tileGrid, gameGrid, playerX, playerY) {
  for (let y = 0; y < gameGrid.length; y++) {
    for (let x = 0; x < gameGrid[y].length; x++) {
      const currentType = gameGrid[y][x];
      const tileType = mapLegacyTileType(currentType);
      
      // Only update if tile type changed
      if (!tileGrid[y][x] || tileGrid[y][x].type !== tileType) {
        tileGrid[y][x] = tileFactory.createTile(tileType, x, y);
      } else {
        // Update position (in case tile moved)
        tileGrid[y][x].x = x;
        tileGrid[y][x].y = y;
      }
    }
  }
  
  // Update player tile direction and movement state if it exists
  if (tileGrid[playerY] && tileGrid[playerY][playerX] && tileGrid[playerY][playerX].type === 'player') {
    const playerTile = tileGrid[playerY][playerX];
    if (playerTile.setMoving && playerTile.setDirection) {
      // These will be set by the game logic
      playerTile.setMoving(false); // Will be updated by movement system
    }
  }
}

/**
 * Map legacy tile numbers/characters to new tile types
 * @param {number|string} legacyType - Old tile identifier
 * @returns {string} New tile type string
 */
function mapLegacyTileType(legacyType) {
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
 * Main tile-based draw function
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array<Array<Tile>>} tileGrid - Grid of tile objects
 * @param {Object} gameState - Current game state
 * @param {number} deltaTime - Time since last frame for animations
 */
export function drawTileGame(ctx, tileGrid, gameState, deltaTime = 16.67) {
  const { 
    playerX, 
    playerY, 
    cameraX, 
    cameraY, 
    viewportWidth, 
    viewportHeight,
    currentPath 
  } = gameState;

  // Clear canvas with black background
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Animate all tiles
  TileGridUtils.animateGrid(tileGrid, deltaTime, gameState);

  // Draw all tiles (render entire visible area)
  const startX = Math.max(0, Math.floor(cameraX / tileSize));
  const endX = Math.min(tileGrid[0]?.length || 0, Math.ceil((cameraX + viewportWidth) / tileSize) + 1);
  const startY = Math.max(0, Math.floor(cameraY / tileSize));
  const endY = Math.min(tileGrid.length, Math.ceil((cameraY + viewportHeight) / tileSize) + 1);

  // Draw tiles
  for (let y = startY; y < endY; y++) {
    for (let x = startX; x < endX; x++) {
      if (tileGrid[y] && tileGrid[y][x]) {
        const pixelX = x * tileSize - cameraX;
        const pixelY = y * tileSize - cameraY;
        
        // Draw tile
        tileGrid[y][x].draw(ctx, pixelX, pixelY, tileSize, gameState);
      }
    }
  }

  // Draw path overlay (if exists)
  if (currentPath && currentPath.length > 0) {
    drawPath(ctx, currentPath, cameraX, cameraY);
  }

  // Draw player highlight
  if (playerX >= 0 && playerY >= 0) {
    drawPlayerHighlight(ctx, playerX, playerY, cameraX, cameraY);
  }
}

/**
 * Draw path overlay
 */
function drawPath(ctx, path, cameraX, cameraY) {
  ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  
  ctx.beginPath();
  for (let i = 0; i < path.length; i++) {
    const { x, y } = path[i];
    const pixelX = x * tileSize + tileSize / 2 - cameraX;
    const pixelY = y * tileSize + tileSize / 2 - cameraY;
    
    if (i === 0) {
      ctx.moveTo(pixelX, pixelY);
    } else {
      ctx.lineTo(pixelX, pixelY);
    }
  }
  ctx.stroke();

  // Draw path dots
  ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
  for (let i = 0; i < path.length; i++) {
    const { x, y } = path[i];
    const pixelX = x * tileSize + tileSize / 2 - cameraX;
    const pixelY = y * tileSize + tileSize / 2 - cameraY;
    
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Draw player highlight
 */
function drawPlayerHighlight(ctx, playerX, playerY, cameraX, cameraY) {
  const pixelX = playerX * tileSize - cameraX;
  const pixelY = playerY * tileSize - cameraY;
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  
  ctx.beginPath();
  ctx.rect(pixelX, pixelY, tileSize, tileSize);
  ctx.stroke();
  
  ctx.setLineDash([]); // Reset line dash
}

/**
 * Get tile at screen coordinates (for click handling)
 * @param {number} screenX - Screen X coordinate
 * @param {number} screenY - Screen Y coordinate  
 * @param {number} cameraX - Camera X offset
 * @param {number} cameraY - Camera Y offset
 * @returns {Object} {x, y} grid coordinates
 */
export function screenToGrid(screenX, screenY, cameraX, cameraY) {
  const gridX = Math.floor((screenX + cameraX) / tileSize);
  const gridY = Math.floor((screenY + cameraY) / tileSize);
  return { x: gridX, y: gridY };
}

/**
 * Backwards compatibility function - mimics original drawGame
 * @param {CanvasRenderingContext2D} ctx 
 * @param {Array<Array<number>>} gameGrid 
 * @param {Object} gameState 
 * @param {Array<Array<Tile>>} tileGrid - Pre-created tile grid
 */
export function drawGame(ctx, gameGrid, gameState, tileGrid) {
  // Update tile grid to match current game grid
  updateTileGrid(tileGrid, gameGrid, gameState.playerX, gameState.playerY);
  
  // Draw using tile system
  drawTileGame(ctx, tileGrid, gameState);
}