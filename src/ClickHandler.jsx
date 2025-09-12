import { TILE, GAME_CONFIG } from './GameConstants';
import { index, inBounds } from './GameUtils';
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
    rockFallCooldownRef,
  onPlayerDie,
  onDraw,
  cameraRef
) {
  e.preventDefault();
  const canvas = canvasRef.current;
  const rect = canvas.getBoundingClientRect();

  
// Screen-space position
const screenX = e.clientX - rect.left;
const screenY = e.clientY - rect.top;

// Convert to tile coords in viewport
const tileX = Math.floor(screenX / GAME_CONFIG.tileSize);
const tileY = Math.floor(screenY / GAME_CONFIG.tileSize);

// Convert to world coords by adding camera offset, then floor
//const worldX = Math.floor(cameraRef.current.x + tileX);
//const worldY = Math.floor(cameraRef.current.y + tileY);
//const worldX = Math.floor(cameraRef.current.x) + tileX;
//const worldY = Math.floor(cameraRef.current.y) + tileY;
const worldX = Math.floor(cameraRef.current.x + screenX / GAME_CONFIG.tileSize);
const worldY = Math.floor(cameraRef.current.y + screenY / GAME_CONFIG.tileSize);
      // const gx = Math.floor((e.clientX - rect.left) / tileSize);
      // const gy = Math.floor((e.clientY - rect.top) / tileSize); 

  if (!inBounds(worldX, worldY)) return;
  
  const clickedTile = gridRef.current[index(worldX, worldY)];
  const player = playerRef.current;

  // Handle rock pushing
  if (clickedTile === TILE.ROCK) {
    const dx = worldX - player.x;
    const dy = worldY - player.y;
    
    // Check if rock is adjacent to player
    if ((Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0)) {
      const pushX = worldX + dx;
      const pushY = worldY + dy;
      
      // Check if we can push the rock
      if (inBounds(pushX, pushY) && gridRef.current[index(pushX, pushY)] === TILE.EMPTY) {
        gridRef.current[index(pushX, pushY)] = TILE.ROCK;
        gridRef.current[index(worldX, worldY)] = TILE.EMPTY;
        updateRocks(0, rockFallCooldownRef, gridRef, onPlayerDie);
        onDraw();
      }
    }
  } else {
    // Handle pathfinding
    if (selectedDestRef.current && selectedDestRef.current.x === worldX && selectedDestRef.current.y === worldY) {
      // Second click: Activate path following
      isPathActiveRef.current = true;
      selectedDestRef.current = null;
    } else {
      // First click: Preview the path
      const destination = { x: worldX, y: worldY };
      pathRef.current = bfsPath(playerRef.current, destination, gridRef);
      isPathActiveRef.current = false;
      selectedDestRef.current = { x: worldX, y: worldY };
      onDraw();
    }
  }
}