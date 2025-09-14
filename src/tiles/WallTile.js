import { Tile } from './Tile';
import { seededRandom } from '../GameUtils';

/**
 * Wall Tile - solid, unbreakable barrier with brick structure and vegetation
 */
export class WallTile extends Tile {
  constructor(x, y) {
    super(x, y, 'wall');
  }

  draw(ctx, pixelX, pixelY, tileSize, gameState, grid, cols, mapX, mapY) {
    // Base wall
    ctx.fillStyle = '#333';
    ctx.fillRect(pixelX, pixelY, tileSize, tileSize);

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
      const lineY = pixelY + y * brickHeight;
      const lineSeed = baseSeed + y * 12345;
      if (seededRandom(lineSeed) > 0.18) {
        ctx.beginPath();
        ctx.moveTo(pixelX, lineY);
        ctx.lineTo(pixelX + tileSize, lineY);
        ctx.stroke();
      }
    }

    // Vertical lines with offset pattern for realistic bricks
    for (let row = 0; row < brickRows; row++) {
      let offset = (row % 2 === 0) ? brickWidth / 2 : 0;
      for (let x = offset; x < tileSize; x += brickWidth) {
        const vlineSeed = baseSeed + row * 54321 + x * 9876;
        if (seededRandom(vlineSeed) > 0.22) {
          ctx.beginPath();
          ctx.moveTo(pixelX + x, pixelY + row * brickHeight);
          ctx.lineTo(pixelX + x, pixelY + (row + 1) * brickHeight);
          ctx.stroke();
        }
      }
    }

    // Top highlight (check if wall above using map coordinates)
    let drawHighlight = true;
    if (mapY > 0 && grid && cols) {
      const aboveIndex = (mapY - 1) * cols + mapX;
      if (aboveIndex >= 0 && aboveIndex < grid.length && grid[aboveIndex] === 1) { // 1 = WALL
        drawHighlight = false;
      }
    }
    if (drawHighlight) {
      ctx.fillStyle = '#666';
      ctx.fillRect(pixelX, pixelY, tileSize, Math.max(6, tileSize * 0.13));
    }

    // Moss and decorations
    for (let i = 0; i < 3; i++) {
      const spotSeed = baseSeed + i * 83492791;
      const rx = pixelX + tileSize * 0.08 + seededRandom(spotSeed) * (tileSize * 0.84);
      const ry = pixelY + tileSize * 0.08 + seededRandom(spotSeed + 1) * (tileSize * 0.84);
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

  isBlocking() {
    return true;
  }

  getBaseColor() {
    return '#444444';
  }
}