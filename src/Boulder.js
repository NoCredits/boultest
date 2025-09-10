// Boulder.js
import { T } from './GameGrid';
export function applyGravity(grid, player) {
  let tempGrid = grid.map(row => [...row]);
  let playerWillBeCrushed = false;
  for (let y = tempGrid.length - 2; y >= 1; y--) {
    for (let x = 1; x < tempGrid[0].length - 1; x++) {
      if (grid[y][x] === T.BOULDER) {
        if (grid[y + 1][x] === T.EMPTY && !(player.x === x && player.y === y + 1)) {
          tempGrid[y][x] = T.EMPTY;
          tempGrid[y + 1][x] = T.BOULDER;
        }
        if (grid[y + 1][x] === T.EMPTY && player.x === x && player.y === y + 1) {
          playerWillBeCrushed = true;
        }
      }
    }
  }
  return { grid: tempGrid, crushed: playerWillBeCrushed };
}
