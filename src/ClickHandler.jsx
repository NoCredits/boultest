import { TILE, GAME_CONFIG } from './GameConstants';
import { index, inBounds, markDirty } from './GameUtils';
import { bfsPath } from './PathFinding';
import { updateRocks } from './GamePhysics';

const { tileSize } = GAME_CONFIG;

export function handleCanvasClick(
  e, 
  canvasRef, 
  gridRef, 
  playerRef, 
  pathRef, 
  selectedDestRef, 
  isPathActiveRef, 
  dirtyTilesRef, 
  rockFallCooldownRef,
  onPlayerDie,
  onDraw
) {
  e.preventDefault();
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();
  const gx = Math.floor((e.clientX - rect.left) / tileSize);
  const gy = Math.floor((e.clientY - rect.top) / tileSize);
  
  if (!inBounds(gx, gy)) return;
  
  const clickedTile = gridRef.current[index(gx, gy)];
  const player = playerRef.current;

  // Handle rock pushing
  if (clickedTile === TILE.ROCK) {
    const dx = gx - player.x;
    const dy = gy - player.y;
    
    // Check if rock is adjacent to player
    if ((Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0)) {
      const pushX = gx + dx;
      const pushY = gy + dy;
      
      // Check if we can push the rock
      if (inBounds(pushX, pushY) && gridRef.current[index(pushX, pushY)] === TILE.EMPTY) {
        gridRef.current[index(pushX, pushY)] = TILE.ROCK;
        gridRef.current[index(gx, gy)] = TILE.EMPTY;
        markDirty(gx, gy, dirtyTilesRef);
        markDirty(pushX, pushY, dirtyTilesRef);
        updateRocks(0, rockFallCooldownRef, gridRef, dirtyTilesRef, onPlayerDie);
        onDraw();
      }
    }
  } else {
    // Handle pathfinding
    if (selectedDestRef.current && selectedDestRef.current.x === gx && selectedDestRef.current.y === gy) {
      // Second click: Activate path following
      isPathActiveRef.current = true;
      selectedDestRef.current = null;
    } else {
      // First click: Preview the path
      const destination = { x: gx, y: gy };
      pathRef.current = bfsPath(playerRef.current, destination, gridRef);
      isPathActiveRef.current = false;
      selectedDestRef.current = { x: gx, y: gy };
      onDraw();
    }
  }
}