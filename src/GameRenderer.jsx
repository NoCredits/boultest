import { TILE, TILE_COLORS, GAME_CONFIG } from './GameConstants';

const { tileSize, cols, rows } = GAME_CONFIG;

export function drawGame(canvasRef, gridRef, pathRef, dirtyTilesRef) {

      // Mark all tiles as dirty for initial render
  
   
  const canvas = canvasRef.current;
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const grid = gridRef.current;
  const dirtyTiles = dirtyTilesRef.current;
  const path = pathRef.current || [];

  //ctx.clearRect(0, 0, canvas.width, canvas.height);

  const tilesToDraw = dirtyTiles.size > 0 ? dirtyTiles : new Set([...Array(cols * rows).keys()]);
  
  tilesToDraw.forEach(i => {
    const x = i % cols;
    const y = Math.floor(i / cols);
    const tile = grid[i];
    const px = x * tileSize;
    const py = y * tileSize;
    
    drawTile(ctx, tile, px, py);

  });

  // Draw path overlay
  ctx.fillStyle = 'rgba(255,255,0,0.3)';
  for (const p of path) {
    ctx.fillRect(p.x * tileSize, p.y * tileSize, tileSize, tileSize);
  }
  
  // Clear dirty tiles after rendering
  dirtyTilesRef.current.clear();
}

function drawTile(ctx, tile, px, py) {
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
      drawWall(ctx, px, py);
      break;
    default:
      drawDefault(ctx, tile, px, py);
      break;
  }
}

function drawRock(ctx, px, py) {
  // Black background
  ctx.fillStyle = '#000';
  ctx.fillRect(px, py, tileSize, tileSize);
  
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

function drawWall(ctx, px, py) {
  ctx.fillStyle = '#333';
  ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
  ctx.fillStyle = '#666';
  ctx.fillRect(px + 1, py + 1, tileSize - 2, 6);
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