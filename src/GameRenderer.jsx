import { TILE, TILE_COLORS, GAME_CONFIG } from './GameConstants';

const { tileSize, cols, rows } = GAME_CONFIG;

export function drawGame(canvasRef, gridRef, pathRef, dirtyTilesRef) {

    // dirtyTilesRef.current.clear();
    // for (let y = 0; y < rows; y++) {
    //   for (let x = 0; x < cols; x++) {
    //     dirtyTilesRef.current.add( y * cols + x );
    //   }
    // }
    
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
    
    // // Draw grid lines
    // ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    // ctx.strokeRect(px, py, tileSize, tileSize);
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
  ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize / 2.2, 0, 2 * Math.PI);
  ctx.closePath();
  
  const grad = ctx.createRadialGradient(
    px + tileSize / 2, py + tileSize / 2, 4,
    px + tileSize / 2, py + tileSize / 2, tileSize / 2.2
  );
  grad.addColorStop(0, '#bbb');
  grad.addColorStop(1, TILE_COLORS[TILE.ROCK]);
  ctx.fillStyle = grad;
  ctx.fill();
  
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(px + tileSize / 2 - 5, py + tileSize / 2 - 5, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

function drawDiamond(ctx, px, py) {
  drawDefault(ctx, TILE.DIAMOND, px, py);
  
  const grad = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize);
  grad.addColorStop(0, '#0ff');
  grad.addColorStop(1, '#08f');
  ctx.fillStyle = grad;
  
  ctx.beginPath();
  ctx.moveTo(px + tileSize / 2, py + 4);
  ctx.lineTo(px + tileSize - 4, py + tileSize / 2);
  ctx.lineTo(px + tileSize / 2, py + tileSize - 4);
  ctx.lineTo(px + 4, py + tileSize / 2);
  ctx.closePath();
  ctx.fill();
  
  // Sparkle effect
  ctx.fillStyle = 'white';
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(px + tileSize / 2, py + tileSize / 2, 3, 0, 2 * Math.PI);
  ctx.fill();
  ctx.globalAlpha = 1.0;
}

function drawDirt(ctx, px, py) {
  drawDefault(ctx, TILE.DIRT, px, py);
  
  const grad = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize);
  grad.addColorStop(0, '#a97c50');
  grad.addColorStop(1, TILE_COLORS[TILE.DIRT]);
  ctx.fillStyle = grad;
  ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
}

function drawPlayer(ctx, px, py) {
  drawDefault(ctx, TILE.PLAYER, px, py);
  
  ctx.save();
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 12;
  
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
  
  // Arms
  ctx.strokeStyle = '#ff9800';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(px + tileSize / 2 - 4, py + tileSize / 2 + 4);
  ctx.lineTo(px + tileSize / 2 - 10, py + tileSize / 2 + 10);
  ctx.moveTo(px + tileSize / 2 + 4, py + tileSize / 2 + 4);
  ctx.lineTo(px + tileSize / 2 + 10, py + tileSize / 2 + 10);
  ctx.stroke();
  
  // Legs
  ctx.strokeStyle = '#1565c0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(px + tileSize / 2 - 2, py + tileSize / 2 + 10);
  ctx.lineTo(px + tileSize / 2 - 4, py + tileSize / 2 + 18);
  ctx.moveTo(px + tileSize / 2 + 2, py + tileSize / 2 + 10);
  ctx.lineTo(px + tileSize / 2 + 4, py + tileSize / 2 + 18);
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
  // }
}