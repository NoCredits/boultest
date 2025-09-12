import { TILE, TILE_COLORS, GAME_CONFIG } from './GameConstants';

const { tileSize, cols, rows } = GAME_CONFIG;

export function drawGame(canvasRef, gridRef, pathRef) {

  
   
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const grid = gridRef.current;
  const path = pathRef.current || [];

  // Always render all tiles
  for (let i = 0; i < cols * rows; i++) {
    const x = i % cols;
    const y = Math.floor(i / cols);
    const tile = grid[i];
    const px = x * tileSize;
    const py = y * tileSize;
    drawTile(ctx, tile, px, py, grid);
  }

  // Draw path overlay
  ctx.fillStyle = 'rgba(255,255,0,0.3)';
  for (const p of path) {
    ctx.fillRect(p.x * tileSize, p.y * tileSize, tileSize, tileSize);
  }
}

function drawTile(ctx, tile, px, py, grid) {
  switch (tile) {
    case TILE.ROCK:
      drawRock(ctx, px, py);
      break;
    case TILE.DIAMOND:
      drawDiamond(ctx, px, py);
      break;
    case TILE.DIRT:
      drawDirt(ctx, px, py);
      break;
    case TILE.PLAYER:
      drawPlayer(ctx, px, py);
      break;
    case TILE.WALL:
      drawWall(ctx, px, py, grid);
      break;
    default:
      drawDefault(ctx, tile, px, py);
      break;
  }
}

function drawRock(ctx, px, py) {
  // Black background
  // ctx.fillStyle = '#000';
  // ctx.fillRect(px, py, tileSize, tileSize);
  drawDefault(ctx, TILE.EMPTY, px, py);
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

function drawDiamond(ctx, px, py) {
  // Draw starry background first
  drawDefault(ctx, TILE.EMPTY, px, py);

  // Draw diamond shape only (no square background)
  const grad = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize);
  grad.addColorStop(0, '#0ff');
  grad.addColorStop(1, '#08f');
  ctx.fillStyle = grad;

  // Make diamond larger to fill tile
  const margin = 1.5; // minimal space to avoid touching borders
  ctx.beginPath();
  ctx.moveTo(px + tileSize / 2, py + margin); // Top
  ctx.lineTo(px + tileSize - margin, py + tileSize / 2); // Right
  ctx.lineTo(px + tileSize / 2, py + tileSize - margin); // Bottom
  ctx.lineTo(px + margin, py + tileSize / 2); // Left
  ctx.closePath();
  ctx.fill();

  // Slower, more random sparkle animation
  const time = performance.now();
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
    4 + 2 * Math.abs(Math.sin((time + phase) / 600)),
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
    px + tileSize / 2 + 6 * Math.sin((time + phase) / 900),
    py + tileSize / 2 - 5 * Math.cos((time + twinklePhase) / 800),
    2 + twinkle,
    0,
    2 * Math.PI
  );
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1.0;
}

function drawDirt(ctx, px, py) {
  drawDefault(ctx, TILE.DIRT, px, py);

  // Gradient base
  const grad = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize);
  grad.addColorStop(0, '#a97c50');
  grad.addColorStop(1, TILE_COLORS[TILE.DIRT]);
  ctx.fillStyle = grad;
  ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);

  // Persistent pebbles and texture dots using seeded RNG
  function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

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

function drawPlayer(ctx, px, py) {
  drawDefault(ctx, TILE.PLAYER, px, py);

  ctx.save();
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 12;

  // Animation phase
  const time = performance.now();
  const phase = Math.sin(time / 180);

  // Head
  ctx.fillStyle = '#ffea00';
  ctx.strokeStyle = '#222';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px + tileSize / 2, py + tileSize / 2 - 4, tileSize / 6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Body
  ctx.fillStyle = '#ff9800';
  ctx.fillRect(px + tileSize / 2 - 4, py + tileSize / 2, 8, 10);
  ctx.strokeRect(px + tileSize / 2 - 4, py + tileSize / 2, 8, 10);

  // Arms (animated swing)
  ctx.strokeStyle = '#ff9800';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(px + tileSize / 2 - 4, py + tileSize / 2 + 4);
  ctx.lineTo(px + tileSize / 2 - 10, py + tileSize / 2 + 10 + 6 * phase);
  ctx.moveTo(px + tileSize / 2 + 4, py + tileSize / 2 + 4);
  ctx.lineTo(px + tileSize / 2 + 10, py + tileSize / 2 + 10 - 6 * phase);
  ctx.stroke();

  // Legs (animated walk)
  ctx.strokeStyle = '#1565c0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(px + tileSize / 2 - 2, py + tileSize / 2 + 10);
  ctx.lineTo(px + tileSize / 2 - 4, py + tileSize / 2 + 18 + 4 * phase);
  ctx.moveTo(px + tileSize / 2 + 2, py + tileSize / 2 + 10);
  ctx.lineTo(px + tileSize / 2 + 4, py + tileSize / 2 + 18 - 4 * phase);
  ctx.stroke();

  ctx.restore();
}

function drawWall(ctx, px, py, grid) {
  // Draw base wall (no inset, fills tile)
  ctx.fillStyle = '#333';
  ctx.fillRect(px, py, tileSize, tileSize);

  // Draw horizontal brick lines, randomly skip some for rugged look
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  for (let y = 0; y < tileSize; y += tileSize / 3) {
    const lineSeed = px * 73856093 + py * 19349663 + y * 12345;
    if (seededRandom(lineSeed) > 0.18) { // ~82% chance to draw
      ctx.beginPath();
      ctx.moveTo(px, py + y);
      ctx.lineTo(px + tileSize, py + y);
      ctx.stroke();
    }
  }

  // Draw vertical brick lines, randomly skip some for rugged look
  for (let row = 0; row < 3; row++) {
    let offset = (row % 2 === 0) ? tileSize / 3 / 2 : 0;
    for (let x = offset; x < tileSize; x += tileSize / 3) {
      const vlineSeed = px * 73856093 + py * 19349663 + row * 54321 + x * 9876;
      if (seededRandom(vlineSeed) > 0.22) { // ~78% chance to draw
        ctx.beginPath();
        ctx.moveTo(px + x, py + row * tileSize / 3);
        ctx.lineTo(px + x, py + (row + 1) * tileSize / 3);
        ctx.stroke();
      }
    }
  }

  // Top highlight only if no wall above
  const col = Math.round(px / tileSize);
  const row = Math.round(py / tileSize);
  const aboveIndex = (row - 1) * cols + col;
  if (row > 0 && grid && grid[aboveIndex] !== TILE.WALL) {
    ctx.fillStyle = '#666';
    ctx.fillRect(px, py, tileSize, 6);
  }

  // Add random moss/leaves as irregular blobs
  function seededRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }
  const mossSeed = px * 73856093 + py * 19349663;
  for (let i = 0; i < 3; i++) {
    const spotSeed = mossSeed + i * 83492791;
    const rx = px + 4 + seededRandom(spotSeed) * (tileSize - 8);
    const ry = py + 4 + seededRandom(spotSeed + 1) * (tileSize - 8);
    ctx.save();
    ctx.beginPath();
    // Draw an irregular blob using Bezier curves
    ctx.moveTo(rx, ry);
    for (let j = 0; j < 5; j++) {
      const angle = (Math.PI * 2 * j) / 5;
      const r = 3 + seededRandom(spotSeed + 10 * j) * 4;
      const nx = rx + Math.cos(angle) * r;
      const ny = ry + Math.sin(angle) * r;
      ctx.lineTo(nx, ny);
    }
    ctx.closePath();
    ctx.fillStyle = seededRandom(spotSeed + 3) > 0.5 ? '#3fa34d' : '#6bbf59'; // moss/leaf green
    ctx.globalAlpha = 0.5 + seededRandom(spotSeed + 4) * 0.4;
    ctx.fill();
    ctx.restore();

    // Optionally, add a few leaf shapes
    if (seededRandom(spotSeed + 5) > 0.6) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(rx + seededRandom(spotSeed + 6) * 6 - 3, ry + seededRandom(spotSeed + 7) * 6 - 3, 2.5, 1.2, seededRandom(spotSeed + 8) * Math.PI, 0, 2 * Math.PI);
      ctx.fillStyle = '#4caf50';
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.restore();
    }
    // Rare berries
    if (seededRandom(spotSeed + 20) > 0.95) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(rx + seededRandom(spotSeed + 21) * 6 - 3, ry + seededRandom(spotSeed + 22) * 6 - 3, 2.2 + seededRandom(spotSeed + 23) * 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#c62828'; // berry red
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.restore();
    }
  }
}

function drawDefault(ctx, tile, px, py) {
  // if (tile === TILE.ROCK) {
  //   ctx.fillStyle = '#000';
  //   ctx.fillRect(px, py, tileSize, tileSize);
  // } else {
    if (tile === TILE.EMPTY) {
      // Night sky background
      ctx.fillStyle = '#07071a';
      ctx.fillRect(px, py, tileSize, tileSize);

      // Persistent stars using seeded RNG
      function seededRandom(seed) {
        let x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
      }
      const baseSeed = px * 73856093 + py * 19349663;
      // Fewer stars, some random blinking
      const time = performance.now();
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