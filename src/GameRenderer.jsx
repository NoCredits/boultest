// Camera object should support fractional position and target position for smooth scrolling
// Example cameraRef.current = { x: float, y: float, targetX: float, targetY: float, speed: float }
import { TILE, TILE_COLORS, GAME_CONFIG } from './GameConstants';
import { seededRandom } from './GameUtils';

// Cache for static tiles to avoid re-rendering
// Removed tileCache and caching logic

export function drawGame(canvasRef, gridRef, cameraRef, pathRef, time = performance.now()) {
  const { tileSize, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, cols, rows } = GAME_CONFIG;
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const grid = gridRef.current;
  const path = pathRef.current || [];
  const cam = cameraRef.current;
  
  // Clear the canvas first
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Calculate viewport bounds with some padding for smooth scrolling
  const startX = Math.floor(cam.x);
  const startY = Math.floor(cam.y);
  const endX = Math.min(startX + VIEWPORT_WIDTH + 2, cols);
  const endY = Math.min(startY + VIEWPORT_HEIGHT + 2, rows);

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
          screenX > canvas.width || screenY > canvas.height) continue;

      //drawTileOptimized(ctx, tile, screenX, screenY, grid, time, tileSize, cols, mapX, mapY);
      drawTileToCanvas(ctx, tile, screenX, screenY, grid, time, tileSize, cols, mapX, mapY);
    }
  }

  // Draw path overlay only for tiles inside viewport
  ctx.fillStyle = 'rgba(255,255,0,0.3)';
  for (const p of path) {
    if (p.x >= cam.x - 1 && p.y >= cam.y - 1 &&
        p.x < cam.x + VIEWPORT_WIDTH + 1 && p.y < cam.y + VIEWPORT_HEIGHT + 1) {
      const screenX = (p.x - cam.x) * tileSize;
      const screenY = (p.y - cam.y) * tileSize;
      ctx.fillRect(screenX, screenY, tileSize, tileSize);
    }
  }
}

// function drawTileOptimized(ctx, tile, px, py, grid, time, tileSize, cols, mapX, mapY) {
//   // For static tiles (walls, dirt), use caching
//   // Draw all tiles dynamically every frame
//   drawTileToCanvas(ctx, tile, px, py, grid, time, tileSize, cols, mapX, mapY);
// }

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

  // Animated sparkles - this is why diamonds can't be cached
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

  // Use map coordinates for consistent seeding
  const baseSeed = mapX * 73856093 + mapY * 19349663;
  for (let i = 0; i < 12; i++) {
    const spotSeed = baseSeed + i * 83492791;
    const rx = px + 3 + seededRandom(spotSeed) * (tileSize - 6);
    const ry = py + 3 + seededRandom(spotSeed + 1) * (tileSize - 6);
    ctx.save();
    ctx.beginPath();
    const r = 1.1 + seededRandom(spotSeed + 2) * 1.5;
    ctx.arc(rx, ry, r, 0, 2 * Math.PI);
    ctx.fillStyle = i % 3 === 0 ? '#c9a070' : (i % 3 === 1 ? '#7a5c36' : '#b08b5a');
    ctx.globalAlpha = 0.65 + seededRandom(spotSeed + 3) * 0.35;
    ctx.fill();
    ctx.restore();
  }
}

function drawPlayer(ctx, px, py, tileSize, time) {
  drawDefault(ctx, TILE.PLAYER, px, py, tileSize, 0, 0);

  ctx.save();
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = tileSize * 0.18;

  const phase = Math.sin(time / 180);

  // Head
  const headRadius = tileSize * 0.18;
  const headOffsetY = tileSize * 0.13;
  ctx.fillStyle = '#ffea00';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = Math.max(2, tileSize * 0.04);
  ctx.beginPath();
  ctx.arc(px + tileSize / 2, py + tileSize / 2 - headOffsetY, headRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Body
  const bodyWidth = tileSize * 0.26;
  const bodyHeight = tileSize * 0.32;
  ctx.fillStyle = '#ff9800';
  ctx.fillRect(px + tileSize / 2 - bodyWidth / 2, py + tileSize / 2, bodyWidth, bodyHeight);
  ctx.strokeRect(px + tileSize / 2 - bodyWidth / 2, py + tileSize / 2, bodyWidth, bodyHeight);

  // Arms
  ctx.strokeStyle = '#ff9800';
  ctx.lineWidth = Math.max(4, tileSize * 0.08);
  const armStartY = py + tileSize / 2 + bodyHeight * 0.18;
  const armLength = tileSize * 0.22;
  ctx.beginPath();
  ctx.moveTo(px + tileSize / 2 - bodyWidth / 2, armStartY);
  ctx.lineTo(px + tileSize / 2 - bodyWidth / 2 - armLength * 0.5, armStartY + armLength * 0.5 + armLength * 0.3 * phase);
  ctx.moveTo(px + tileSize / 2 + bodyWidth / 2, armStartY);
  ctx.lineTo(px + tileSize / 2 + bodyWidth / 2 + armLength * 0.5, armStartY + armLength * 0.5 - armLength * 0.3 * phase);
  ctx.stroke();

  // Legs
  ctx.strokeStyle = '#1565c0';
  const legStartY = py + tileSize / 2 + bodyHeight;
  const legLength = tileSize * 0.26;
  const legSwing = legLength * 0.38;
  ctx.beginPath();
  ctx.moveTo(px + tileSize / 2 - bodyWidth * 0.18, legStartY);
  ctx.lineTo(px + tileSize / 2 - bodyWidth * 0.32, legStartY + legLength + legSwing * phase);
  ctx.moveTo(px + tileSize / 2 + bodyWidth * 0.18, legStartY);
  ctx.lineTo(px + tileSize / 2 + bodyWidth * 0.32, legStartY + legLength - legSwing * phase);
  ctx.stroke();

  ctx.restore();
}

function drawWall(ctx, px, py, grid, tileSize, cols, mapX, mapY) {
  // Base wall
  ctx.fillStyle = '#333';
  ctx.fillRect(px, py, tileSize, tileSize);

  ctx.strokeStyle = '#444';
  ctx.lineWidth = Math.max(2, tileSize * 0.06);
  const brickRows = 3;
  const brickCols = 3;
  const brickHeight = tileSize / brickRows;
  const brickWidth = tileSize / brickCols;

  // Use map coordinates for consistent seeding
  const baseSeed = mapX * 73856093 + mapY * 19349663;

  // Horizontal lines
  for (let y = 0; y < brickRows; y++) {
    const lineY = py + y * brickHeight;
    const lineSeed = baseSeed + y * 12345;
    if (seededRandom(lineSeed) > 0.18) {
      ctx.beginPath();
      ctx.moveTo(px, lineY);
      ctx.lineTo(px + tileSize, lineY);
      ctx.stroke();
    }
  }

  // Vertical lines
  for (let row = 0; row < brickRows; row++) {
    let offset = (row % 2 === 0) ? brickWidth / 2 : 0;
    for (let x = offset; x < tileSize; x += brickWidth) {
      const vlineSeed = baseSeed + row * 54321 + x * 9876;
      if (seededRandom(vlineSeed) > 0.22) {
        ctx.beginPath();
        ctx.moveTo(px + x, py + row * brickHeight);
        ctx.lineTo(px + x, py + (row + 1) * brickHeight);
        ctx.stroke();
      }
    }
  }

  // Top highlight (check if wall above using map coordinates)
  let drawHighlight = true;
  if (mapY > 0 && grid) {
    const aboveIndex = (mapY - 1) * cols + mapX;
    if (aboveIndex >= 0 && aboveIndex < grid.length && grid[aboveIndex] === TILE.WALL) {
      drawHighlight = false;
    }
  }
  if (drawHighlight) {
    ctx.fillStyle = '#666';
    ctx.fillRect(px, py, tileSize, Math.max(6, tileSize * 0.13));
  }

  // Moss and decorations
  for (let i = 0; i < 3; i++) {
    const spotSeed = baseSeed + i * 83492791;
    const rx = px + tileSize * 0.08 + seededRandom(spotSeed) * (tileSize * 0.84);
    const ry = py + tileSize * 0.08 + seededRandom(spotSeed + 1) * (tileSize * 0.84);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    for (let j = 0; j < 5; j++) {
      const angle = (Math.PI * 2 * j) / 5;
      const r = tileSize * 0.08 + seededRandom(spotSeed + 10 * j) * tileSize * 0.11;
      const nx = rx + Math.cos(angle) * r;
      const ny = ry + Math.sin(angle) * r;
      ctx.lineTo(nx, ny);
    }
    ctx.closePath();
    ctx.fillStyle = seededRandom(spotSeed + 3) > 0.5 ? '#3fa34d' : '#6bbf59';
    ctx.globalAlpha = 0.5 + seededRandom(spotSeed + 4) * 0.4;
    ctx.fill();
    ctx.restore();

    // Leaves
    if (seededRandom(spotSeed + 5) > 0.6) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        rx + seededRandom(spotSeed + 6) * tileSize * 0.13 - tileSize * 0.065,
        ry + seededRandom(spotSeed + 7) * tileSize * 0.13 - tileSize * 0.065,
        tileSize * 0.04, tileSize * 0.02,
        seededRandom(spotSeed + 8) * Math.PI,
        0, 2 * Math.PI
      );
      ctx.fillStyle = '#4caf50';
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.restore();
    }

    // Berries
    if (seededRandom(spotSeed + 20) > 0.95) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        rx + seededRandom(spotSeed + 21) * tileSize * 0.13 - tileSize * 0.065,
        ry + seededRandom(spotSeed + 22) * tileSize * 0.13 - tileSize * 0.065,
        tileSize * 0.03 + seededRandom(spotSeed + 23) * tileSize * 0.02,
        0, 2 * Math.PI
      );
      ctx.fillStyle = '#c62828';
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.restore();
    }
  }
}



function drawAnimatedStars(ctx, px, py, tileSize, time, mapX, mapY) {
  // Use map coordinates for consistent star positions
  const baseSeed = mapX * 73856093 + mapY * 19349663;
  for (let i = 0; i < 3; i++) {
    const starSeed = baseSeed + i * 83492791;
    const rx = px + 4 + seededRandom(starSeed) * (tileSize - 8);
    const ry = py + 4 + seededRandom(starSeed + 1) * (tileSize - 8);
    ctx.save();
    ctx.beginPath();
    ctx.arc(rx, ry, 0.7 + seededRandom(starSeed + 2) * 1.1, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    
    // Individual random blinking: each star has its own unique timing
    const uniquePhase = starSeed * 0.001; // Convert seed to unique phase offset
//    const blinkSpeed = 800 + (starSeed % 800); // Different blink speed per star
//    const blinkThreshold = 1.7 + seededRandom(starSeed + 6) * 0.3; // Different threshold per star
    const blinkThreshold = seededRandom(starSeed + 6); // 0 → 1

 //   const blinkPhase = Math.abs(Math.sin((time / blinkSpeed) + uniquePhase));

    const phaseOffset = (starSeed % 1000) / 1000 * Math.PI * 2; // unique per star
const blinkSpeed = 1200 + (starSeed % 1000); // slower per star
const blinkPhase = Math.abs(Math.sin(time / blinkSpeed + phaseOffset));

    
    let alpha = 0.7 + seededRandom(starSeed + 3) * 0.3;
    if (blinkPhase > blinkThreshold) {
      alpha *= 0.1 + seededRandom(starSeed + 5) * 0.4; // dim blink with random intensity
    }
    ctx.globalAlpha = alpha;
    ctx.fill();
    ctx.restore();
  }
}

function drawDefault(ctx, tile, px, py, tileSize, mapX, mapY) {
  if (tile === TILE.EMPTY) {
    // This should not be called directly for EMPTY tiles now
    // as they are handled by the hybrid caching system
    ctx.fillStyle = '#07071a';
    ctx.fillRect(px, py, tileSize, tileSize);
    drawAnimatedStars(ctx, px, py, tileSize, performance.now(), mapX, mapY);
  } else {
    ctx.fillStyle = TILE_COLORS[tile] || '#f0f';
    ctx.beginPath();
    ctx.moveTo(px + 4, py);
    ctx.lineTo(px + tileSize - 4, py);
    ctx.quadraticCurveTo(px + tileSize, py, px + tileSize, py + 4);
    ctx.lineTo(px + tileSize, py + tileSize - 4);
    ctx.quadraticCurveTo(px + tileSize, py + tileSize, px + tileSize - 4, py + tileSize);
    ctx.lineTo(px + 4, py + tileSize);
    ctx.quadraticCurveTo(px, py + tileSize, px, py + tileSize - 4);
    ctx.lineTo(px, py + 4);
    ctx.quadraticCurveTo(px, py, px + 4, py);
    ctx.closePath();
    ctx.fill();
  }
}

// Export function to clear cache if needed (e.g., when tile size changes)
// Removed clearTileCache (no cache used)