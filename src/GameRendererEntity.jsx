// Enhanced GameRenderer with Entity System Support
import { TILE, TILE_COLORS, GAME_CONFIG } from './GameConstants';
import { seededRandom } from './GameUtils';
import { EntityManager } from './entities/EntityManager.jsx';

// Hybrid rendering function that can use either entity system or legacy grid
export function drawGame(canvasRef, gridRef, cameraRef, pathRef, selectedPathIndexRef, playerRef, isPathActiveRef, entityManagerRef = null, time = performance.now()) {
  const { tileSize, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, cols, rows } = GAME_CONFIG;
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const paths = pathRef.current || [];
  const cam = cameraRef.current;
  
  // Clear the canvas first
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Use entity system if available, otherwise fall back to legacy grid
  if (entityManagerRef?.current) {
    renderWithEntities(ctx, entityManagerRef.current, cam, tileSize, time, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  } else {
    renderWithGrid(ctx, gridRef.current, cam, tileSize, time, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, cols, rows);
  }

  // Render paths and UI (same as before)
  renderPaths(ctx, paths, cam, tileSize, selectedPathIndexRef, isPathActiveRef, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
}

/**
 * Render using the new entity system
 */
function renderWithEntities(ctx, entityManager, cam, tileSize, time, viewportWidth, viewportHeight) {
  // Use EntityManager's optimized rendering
  entityManager.render(ctx, cam, tileSize, time);
}

/**
 * Legacy rendering using grid (for backward compatibility)
 */
function renderWithGrid(ctx, grid, cam, tileSize, time, viewportWidth, viewportHeight, cols, rows) {
  // Calculate viewport bounds with some padding for smooth scrolling
  const startX = Math.floor(cam.x);
  const startY = Math.floor(cam.y);
  const endX = Math.min(startX + viewportWidth + 2, cols);
  const endY = Math.min(startY + viewportHeight + 2, rows);

  // Draw only tiles in viewport, supporting fractional camera
  for (let mapY = Math.max(0, startY); mapY < endY; mapY++) {
    for (let mapX = Math.max(0, startX); mapX < endX; mapX++) {
      const i = mapY * cols + mapX;
      const tile = grid[i];
      
      // Calculate screen position
      const screenX = (mapX - cam.x) * tileSize;
      const screenY = (mapY - cam.y) * tileSize;
      
      // Skip tiles that are completely off-screen
      if (screenX < -tileSize || screenY < -tileSize || 
          screenX > ctx.canvas.width || screenY > ctx.canvas.height) continue;

      drawTileToCanvas(ctx, tile, screenX, screenY, grid, time, tileSize, cols, mapX, mapY);
    }
  }
}

/**
 * Render path overlays and UI
 */
function renderPaths(ctx, paths, cam, tileSize, selectedPathIndexRef, isPathActiveRef, viewportWidth, viewportHeight) {
  const isPathActive = isPathActiveRef?.current;

  // Draw multiple path overlays with different colors and opacity
  if (paths.length > 0 && !isPathActive) {
    // Define colors for different paths
    const pathColors = [
      'rgba(255,255,0,0.5)',   // Yellow - primary/selected path
      'rgba(0,255,255,0.3)',   // Cyan - alternate path 1
      'rgba(255,0,255,0.3)',   // Magenta - alternate path 2
      'rgba(0,255,0,0.3)',     // Green - alternate path 3
      'rgba(255,165,0,0.3)'    // Orange - alternate path 4
    ];

    for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
      const path = paths[pathIndex];
      const isSelected = selectedPathIndexRef && selectedPathIndexRef.current === pathIndex;
      const color = isSelected ? pathColors[0] : pathColors[(pathIndex + 1) % pathColors.length];

      ctx.fillStyle = color;
      
      for (const step of path) {
        // Only draw if step is in viewport
        if (step.x >= cam.x - 1 && step.y >= cam.y - 1 &&
            step.x < cam.x + viewportWidth + 1 && step.y < cam.y + viewportHeight + 1) {
          const screenX = (step.x - cam.x) * tileSize;
          const screenY = (step.y - cam.y) * tileSize;
          
          // Create a subtle path overlay
          if (isSelected) {
            // Draw selected path with pulsing animation
            const pulseAlpha = 0.3 + 0.2 * Math.sin(performance.now() / 300);
            ctx.globalAlpha = pulseAlpha;
            ctx.fillRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
            ctx.globalAlpha = 1;
          } else {
            ctx.fillRect(screenX + 4, screenY + 4, tileSize - 8, tileSize - 8);
          }
        }
      }
    }
    
    // Draw path numbers/indicators for multiple paths
    if (paths.length > 1 && !isPathActive) {
      ctx.font = `${Math.floor(tileSize * 0.4)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Group paths by their starting position to handle overlapping numbers
      const pathsByPosition = new Map();
      
      for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
        const path = paths[pathIndex];
        if (path.length > 0) {
          const firstStep = path[0];
          const posKey = `${firstStep.x},${firstStep.y}`;
          
          if (!pathsByPosition.has(posKey)) {
            pathsByPosition.set(posKey, []);
          }
          pathsByPosition.get(posKey).push({ pathIndex, firstStep });
        }
      }
      
      // Draw numbers for each position group
      for (const [posKey, pathGroup] of pathsByPosition) {
        const basePosition = pathGroup[0].firstStep;
        
        // Only draw if position is in viewport
        if (basePosition.x >= cam.x - 1 && basePosition.y >= cam.y - 1 &&
            basePosition.x < cam.x + viewportWidth + 1 && basePosition.y < cam.y + viewportHeight + 1) {
          
          const baseScreenX = (basePosition.x - cam.x) * tileSize;
          const baseScreenY = (basePosition.y - cam.y) * tileSize;
          
          // If multiple paths start from same position, arrange numbers in a circle
          if (pathGroup.length > 1) {
            const radius = tileSize * 0.4; // Distance from center
            const angleStep = (2 * Math.PI) / pathGroup.length;
            
            for (let i = 0; i < pathGroup.length; i++) {
              const { pathIndex } = pathGroup[i];
              const angle = i * angleStep - Math.PI / 2; // Start from top
              const offsetX = Math.cos(angle) * radius;
              const offsetY = Math.sin(angle) * radius;
              
              const screenX = baseScreenX + tileSize / 2 + offsetX;
              const screenY = baseScreenY + tileSize / 2 + offsetY;
              
              const isSelected = selectedPathIndexRef && selectedPathIndexRef.current === pathIndex;
              
              // Background circle
              ctx.fillStyle = isSelected ? 'rgba(255,255,0,0.9)' : 'rgba(0,0,0,0.7)';
              ctx.beginPath();
              ctx.arc(screenX, screenY, tileSize * 0.2, 0, 2 * Math.PI);
              ctx.fill();
              
              // Path number
              ctx.fillStyle = isSelected ? 'black' : 'white';
              ctx.fillText((pathIndex + 1).toString(), screenX, screenY);
            }
          } else {
            // Single path at this position - draw normally in center
            const { pathIndex } = pathGroup[0];
            const screenX = baseScreenX + tileSize / 2;
            const screenY = baseScreenY + tileSize / 2;
            
            const isSelected = selectedPathIndexRef && selectedPathIndexRef.current === pathIndex;
            
            // Background circle
            ctx.fillStyle = isSelected ? 'rgba(255,255,0,0.9)' : 'rgba(0,0,0,0.7)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, tileSize * 0.25, 0, 2 * Math.PI);
            ctx.fill();
            
            // Path number
            ctx.fillStyle = isSelected ? 'black' : 'white';
            ctx.fillText((pathIndex + 1).toString(), screenX, screenY);
          }
        }
      }
      
      // Add instruction text at the top
      ctx.font = `${Math.floor(tileSize * 0.3)}px Arial`;
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('Click on a path to select it', 10, 20);
    }
  }
}

// Legacy tile drawing functions (kept for backward compatibility and entity fallback)
function drawTileToCanvas(ctx, tile, px, py, grid, time, tileSize, cols, mapX, mapY) {
  switch (tile) {
    case TILE.ROCK:
      drawRock(ctx, px, py, tileSize, time);
      break;
    case TILE.DIAMOND:
      drawDiamond(ctx, px, py, tileSize, time);
      break;
    case TILE.DIRT:
      drawDirt(ctx, px, py, tileSize, mapX, mapY);
      break;
    case TILE.PLAYER:
      drawPlayer(ctx, px, py, tileSize, time);
      break;
    case TILE.WALL:
      drawWall(ctx, px, py, grid, tileSize, cols, mapX, mapY);
      break;
    default:
      drawDefault(ctx, tile, px, py, tileSize, mapX, mapY);
      break;
  }
}

function drawRock(ctx, px, py, tileSize, time) {
  drawDefault(ctx, TILE.EMPTY, px, py, tileSize, 0, 0);
  
  ctx.save();
  ctx.beginPath();
  ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize / 2 - 1.5, 0, 2 * Math.PI);
  ctx.closePath();

  const grad = ctx.createRadialGradient(
    px + tileSize / 2, py + tileSize / 2, 6,
    px + tileSize / 2, py + tileSize / 2, tileSize / 2 - 1.5
  );
  grad.addColorStop(0, '#bbb');
  grad.addColorStop(1, TILE_COLORS[TILE.ROCK]);
  ctx.fillStyle = grad;
  ctx.fill();
  
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.arc(px + tileSize / 2 - 6, py + tileSize / 2 - 6, 6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

function drawDiamond(ctx, px, py, tileSize, time) {
  drawDefault(ctx, TILE.EMPTY, px, py, tileSize, 0, 0);

  const grad = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize);
  grad.addColorStop(0, '#0ff');
  grad.addColorStop(1, '#08f');
  ctx.fillStyle = grad;

  const margin = tileSize * 0.06;
  ctx.beginPath();
  ctx.moveTo(px + tileSize / 2, py + margin);
  ctx.lineTo(px + tileSize - margin, py + tileSize / 2);
  ctx.lineTo(px + tileSize / 2, py + tileSize - margin);
  ctx.lineTo(px + margin, py + tileSize / 2);
  ctx.closePath();
  ctx.fill();

  // Animated sparkles
  const phase = (px * 13 + py * 7) % 1000;
  const sparkleAlpha = 0.6 + 0.4 * Math.sin((time + phase) / 400);
  ctx.save();
  ctx.fillStyle = 'white';
  ctx.globalAlpha = sparkleAlpha;
  ctx.beginPath();
  ctx.arc(
    px + tileSize / 2,
    py + tileSize / 2,
    tileSize * (0.12 + 0.06 * Math.abs(Math.sin((time + phase) / 600))),
    0, 2 * Math.PI
  );
  ctx.fill();

  const twinklePhase = (px * 17 + py * 23) % 1000;
  const twinkle = 0.5 + 0.5 * Math.sin((time + twinklePhase) / 700);
  ctx.globalAlpha = twinkle * 0.6;
  ctx.beginPath();
  ctx.arc(
    px + tileSize / 2 + tileSize * 0.14 * Math.sin((time + phase) / 900),
    py + tileSize / 2 - tileSize * 0.11 * Math.cos((time + twinklePhase) / 800),
    tileSize * (0.06 + 0.06 * twinkle),
    0, 2 * Math.PI
  );
  ctx.fill();
  ctx.restore();
}

function drawDirt(ctx, px, py, tileSize, mapX, mapY) {
  drawDefault(ctx, TILE.DIRT, px, py, tileSize, mapX, mapY);

  const grad = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize);
  grad.addColorStop(0, '#a97c50');
  grad.addColorStop(1, TILE_COLORS[TILE.DIRT]);
  ctx.fillStyle = grad;
  ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

  // Add dirt particles for texture
  ctx.fillStyle = '#654321';
  const seed = mapX * 73 + mapY * 37;
  const rng = seededRandom(seed);
  for (let i = 0; i < 8; i++) {
    const dotX = px + 4 + rng() * (tileSize - 8);
    const dotY = py + 4 + rng() * (tileSize - 8);
    ctx.fillRect(dotX, dotY, 1, 1);
  }
}

function drawPlayer(ctx, px, py, tileSize, time) {
  drawDefault(ctx, TILE.EMPTY, px, py, tileSize, 0, 0);

  const centerX = px + tileSize / 2;
  const centerY = py + tileSize / 2;
  const radius = tileSize * 0.35;

  const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  grad.addColorStop(0, '#ff6');
  grad.addColorStop(1, TILE_COLORS[TILE.PLAYER]);
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fill();

  // Eyes
  ctx.fillStyle = 'black';
  ctx.fillRect(centerX - 8, centerY - 6, 4, 4);
  ctx.fillRect(centerX + 4, centerY - 6, 4, 4);
  
  // Mouth
  ctx.beginPath();
  ctx.arc(centerX, centerY + 2, 6, 0, Math.PI);
  ctx.stroke();
}

function drawWall(ctx, px, py, grid, tileSize, cols, mapX, mapY) {
  drawDefault(ctx, TILE.WALL, px, py, tileSize, mapX, mapY);

  const grad = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize);
  grad.addColorStop(0, '#666');
  grad.addColorStop(1, TILE_COLORS[TILE.WALL]);
  ctx.fillStyle = grad;
  ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);

  // Add highlight for 3D effect
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(px + 1, py + 1, tileSize - 2, 3);
  ctx.fillRect(px + 1, py + 1, 3, tileSize - 2);
}

function drawDefault(ctx, tile, px, py, tileSize, mapX, mapY) {
  if (tile === TILE.EMPTY) return;
  
  ctx.fillStyle = TILE_COLORS[tile] || '#f0f';
  ctx.fillRect(px, py, tileSize, tileSize);
}

/**
 * Helper function to initialize entity system from existing game
 */
export function initializeEntitySystem(gridRef, cols, rows) {
  const entityManager = new EntityManager(cols, rows);
  if (gridRef.current) {
    entityManager.loadFromGrid(gridRef.current);
  }
  return entityManager;
}

/**
 * Helper function to convert entity system back to grid for compatibility
 */
export function entitySystemToGrid(entityManager) {
  return entityManager.toGrid();
}