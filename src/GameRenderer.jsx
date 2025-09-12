import { TILE, TILE_COLORS, GAME_CONFIG } from './GameConstants';
import { seededRandom } from './GameUtils';
//const { tileSize, cols, rows } = GAME_CONFIG;
//const { tileSize, VIEWPORT_WIDTH, VIEWPORT_HEIGHT, cols, rows } = GAME_CONFIG;

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


  // // Always render all tiles
  // for (let i = 0; i < cols * rows; i++) {
  //   const x = i % cols;
  //   const y = Math.floor(i / cols);
  //   const tile = grid[i];
  //   const px = x * tileSize;
  //   const py = y * tileSize;
  //   drawTile(ctx, tile, px, py, grid, time);
  // }
 
   // Draw only tiles in viewport
  for (let y = 0; y < VIEWPORT_HEIGHT; y++) {
    for (let x = 0; x < VIEWPORT_WIDTH; x++) {
      const mapX = cam.x + x;
      const mapY = cam.y + y;

      // Skip if out of map bounds
      if (mapX < 0 || mapY < 0 || mapX >= cols || mapY >= rows) continue;

      const i = mapY * cols + mapX;
      const tile = grid[i];

      // On-screen pixel coordinates
      const px = x * tileSize;
      const py = y * tileSize;

      //drawTile(ctx, tile, px, py, grid, time);
      drawTile(ctx, tile, px, py, grid, time, tileSize, cols);
    }
  }

  // Draw path overlay
  // ctx.fillStyle = 'rgba(255,255,0,0.3)';
  // for (const p of path) {
  //   ctx.fillRect(p.x * tileSize, p.y * tileSize, tileSize, tileSize);
  // }


  // Draw path overlay only for tiles inside viewport
  ctx.fillStyle = 'rgba(255,255,0,0.3)';
  for (const p of path) {
    if (
      p.x >= cam.x &&
      p.y >= cam.y &&
      p.x < cam.x + VIEWPORT_WIDTH &&
      p.y < cam.y + VIEWPORT_HEIGHT
    ) {
      const screenX = (p.x - cam.x) * tileSize;
      const screenY = (p.y - cam.y) * tileSize;
      ctx.fillRect(screenX, screenY, tileSize, tileSize);
    }
  }
}
function drawTile(ctx, tile, px, py, grid, time, tileSize, cols) {
  switch (tile) {
    case TILE.ROCK:
      drawRock(ctx, px, py, tileSize, time);
      break;
    case TILE.DIAMOND:
      drawDiamond(ctx, px, py, tileSize, time);
      break;
    case TILE.DIRT:
      drawDirt(ctx, px, py, tileSize, time);
      break;
    case TILE.PLAYER:
      drawPlayer(ctx, px, py, tileSize, time);
      break;
    case TILE.WALL:
      drawWall(ctx, px, py, grid, tileSize, cols, time);
      break;
    default:
      drawDefault(ctx, tile, px, py, tileSize, time);
      break;
  }
}


function drawRock(ctx, px, py, tileSize, time) {
  // Black background
  // ctx.fillStyle = '#000';
  // ctx.fillRect(px, py, tileSize, tileSize);
  drawDefault(ctx, TILE.EMPTY, px, py, tileSize, time);
  // 3D rock effect
  ctx.save();
  ctx.beginPath();
  // Make rock larger: reduce margin to tile borders
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
  
  // Highlight (adjusted for larger rock)
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.arc(px + tileSize / 2 - 6, py + tileSize / 2 - 6, 6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

function drawDiamond(ctx, px, py, tileSize, time) {
  // Draw starry background first
  drawDefault(ctx, TILE.EMPTY, px, py, tileSize, time);

  // Draw diamond shape only (no square background)
  const grad = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize);
  grad.addColorStop(0, '#0ff');
  grad.addColorStop(1, '#08f');
  ctx.fillStyle = grad;

  // Make diamond larger to fill tile
  const margin = tileSize * 0.06; // minimal space to avoid touching borders
  ctx.beginPath();
  ctx.moveTo(px + tileSize / 2, py + margin); // Top
  ctx.lineTo(px + tileSize - margin, py + tileSize / 2); // Right
  ctx.lineTo(px + tileSize / 2, py + tileSize - margin); // Bottom
  ctx.lineTo(px + margin, py + tileSize / 2); // Left
  ctx.closePath();
  ctx.fill();

  // Unique phase per diamond based on position
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
    0,
    2 * Math.PI
  );
  ctx.fill();

  // Second sparkle: slower, random offset and twinkle
  const twinklePhase = (px * 17 + py * 23) % 1000;
  const twinkle = 0.5 + 0.5 * Math.sin((time + twinklePhase) / 700);
  ctx.globalAlpha = twinkle * 0.6;
  ctx.beginPath();
  ctx.arc(
    px + tileSize / 2 + tileSize * 0.14 * Math.sin((time + phase) / 900),
    py + tileSize / 2 - tileSize * 0.11 * Math.cos((time + twinklePhase) / 800),
    tileSize * (0.06 + 0.06 * twinkle),
    0,
    2 * Math.PI
  );
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1.0;
}

function drawDirt(ctx, px, py, tileSize, time) {
  drawDefault(ctx, TILE.DIRT, px, py, tileSize, time);

  // Gradient base
  const grad = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize);
  grad.addColorStop(0, '#a97c50');
  grad.addColorStop(1, TILE_COLORS[TILE.DIRT]);
  ctx.fillStyle = grad;
  ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);


  // Use tile position as seed
  const baseSeed = px * 73856093 + py * 19349663;
  for (let i = 0; i < 12; i++) {
    // Unique seed per spot
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
  drawDefault(ctx, TILE.PLAYER, px, py, tileSize, time);

  ctx.save();
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = tileSize * 0.18;

  // Animation phase
  const phase = Math.sin(time / 180);

  // Head (scaled)
  const headRadius = tileSize * 0.18;
  const headOffsetY = tileSize * 0.13;
  ctx.fillStyle = '#ffea00';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = Math.max(2, tileSize * 0.04);
  ctx.beginPath();
  ctx.arc(px + tileSize / 2, py + tileSize / 2 - headOffsetY, headRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Body (scaled)
  const bodyWidth = tileSize * 0.26;
  const bodyHeight = tileSize * 0.32;
  const bodyOffsetY = tileSize * 0.18;
  ctx.fillStyle = '#ff9800';
  ctx.fillRect(px + tileSize / 2 - bodyWidth / 2, py + tileSize / 2, bodyWidth, bodyHeight);
  ctx.strokeRect(px + tileSize / 2 - bodyWidth / 2, py + tileSize / 2, bodyWidth, bodyHeight);

  // Arms (animated swing, scaled)
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

  // Legs (animated walk, scaled, increased amplitude)
  ctx.strokeStyle = '#1565c0';
  ctx.lineWidth = Math.max(4, tileSize * 0.08);
  const legStartY = py + tileSize / 2 + bodyHeight;
  const legLength = tileSize * 0.26;
  const legSwing = legLength * 0.38; // increased amplitude
  ctx.beginPath();
  ctx.moveTo(px + tileSize / 2 - bodyWidth * 0.18, legStartY);
  ctx.lineTo(px + tileSize / 2 - bodyWidth * 0.32, legStartY + legLength + legSwing * phase);
  ctx.moveTo(px + tileSize / 2 + bodyWidth * 0.18, legStartY);
  ctx.lineTo(px + tileSize / 2 + bodyWidth * 0.32, legStartY + legLength - legSwing * phase);
  ctx.stroke();

  ctx.restore();
}

function drawWall(ctx, px, py, grid, tileSize,time, cols) {
  // Draw base wall (no inset, fills tile)
  ctx.fillStyle = '#333';
  ctx.fillRect(px, py, tileSize, tileSize);

  // Brick line thickness scales with tileSize
  ctx.strokeStyle = '#444';
  ctx.lineWidth = Math.max(2, tileSize * 0.06);
  const brickRows = 3;
  const brickCols = 3;
  const brickHeight = tileSize / brickRows;
  const brickWidth = tileSize / brickCols;

  // Draw horizontal brick lines, randomly skip some for rugged look
  for (let y = 0; y < brickRows; y++) {
    const lineY = py + y * brickHeight;
    const lineSeed = px * 73856093 + py * 19349663 + y * 12345;
    if (seededRandom(lineSeed) > 0.18) {
      ctx.beginPath();
      ctx.moveTo(px, lineY);
      ctx.lineTo(px + tileSize, lineY);
      ctx.stroke();
    }
  }

  // Draw vertical brick lines, randomly skip some for rugged look
  for (let row = 0; row < brickRows; row++) {
    let offset = (row % 2 === 0) ? brickWidth / 2 : 0;
    for (let x = offset; x < tileSize; x += brickWidth) {
      const vlineSeed = px * 73856093 + py * 19349663 + row * 54321 + x * 9876;
      if (seededRandom(vlineSeed) > 0.22) {
        ctx.beginPath();
        ctx.moveTo(px + x, py + row * brickHeight);
        ctx.lineTo(px + x, py + (row + 1) * brickHeight);
        ctx.stroke();
      }
    }
  }

  // Top highlight only if no wall directly above
  const col = Math.floor(px / tileSize);
  const row = Math.floor(py / tileSize);
  let drawHighlight = true;
  if (row > 0 && grid) {
    const aboveIndex = (row - 1) * cols + col;
    if (aboveIndex >= 0 && aboveIndex < grid.length && grid[aboveIndex] === TILE.WALL) {
      drawHighlight = false;
    }
  }
  if (drawHighlight) {
    ctx.fillStyle = '#666';
    ctx.fillRect(px, py, tileSize, Math.max(6, tileSize * 0.13));
  }

  // Moss, leaves, berries scale with tileSize
  const mossSeed = px * 73856093 + py * 19349663;
  for (let i = 0; i < 3; i++) {
    const spotSeed = mossSeed + i * 83492791;
    const rx = px + tileSize * 0.08 + seededRandom(spotSeed) * (tileSize * 0.84);
    const ry = py + tileSize * 0.08 + seededRandom(spotSeed + 1) * (tileSize * 0.84);
    ctx.save();
    ctx.beginPath();
    // Draw an irregular blob using Bezier curves
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

    // Optionally, add a few leaf shapes
    if (seededRandom(spotSeed + 5) > 0.6) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        rx + seededRandom(spotSeed + 6) * tileSize * 0.13 - tileSize * 0.065,
        ry + seededRandom(spotSeed + 7) * tileSize * 0.13 - tileSize * 0.065,
        tileSize * 0.04,
        tileSize * 0.02,
        seededRandom(spotSeed + 8) * Math.PI,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = '#4caf50';
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.restore();
    }
    // Rare berries
    if (seededRandom(spotSeed + 20) > 0.95) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(
        rx + seededRandom(spotSeed + 21) * tileSize * 0.13 - tileSize * 0.065,
        ry + seededRandom(spotSeed + 22) * tileSize * 0.13 - tileSize * 0.065,
        tileSize * 0.03 + seededRandom(spotSeed + 23) * tileSize * 0.02,
        0,
        2 * Math.PI
      );
      ctx.fillStyle = '#c62828';
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawDefault(ctx, tile, px, py, tileSize, time) {
  // if (tile === TILE.ROCK) {
  //   ctx.fillStyle = '#000';
  //   ctx.fillRect(px, py, tileSize, tileSize);
  // } else {
    if (tile === TILE.EMPTY) {
      // Night sky background
      ctx.fillStyle = '#07071a';
      ctx.fillRect(px, py, tileSize, tileSize);

      const baseSeed = px * 73856093 + py * 19349663;
      // Fewer stars, some random blinking
      //const time = performance.now();
      for (let i = 0; i < 3; i++) {
        const starSeed = baseSeed + i * 83492791;
        const rx = px + 4 + seededRandom(starSeed) * (tileSize - 8);
        const ry = py + 4 + seededRandom(starSeed + 1) * (tileSize - 8);
        ctx.save();
        ctx.beginPath();
        ctx.arc(rx, ry, 0.7 + seededRandom(starSeed + 2) * 1.1, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        // Blinking: each star has its own phase, blinks rarely
        const blinkPhase = Math.abs(Math.sin((time / 1200) + starSeed)) + seededRandom(starSeed + 4);
        let alpha = 0.7 + seededRandom(starSeed + 3) * 0.3;
        if (blinkPhase > 1.85) {
          alpha *= 0.2 + seededRandom(starSeed + 5) * 0.3; // occasional dim blink
        }
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.restore();
      }
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
  // }
}