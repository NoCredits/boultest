import { TILE, GAME_CONFIG } from './GameConstants';
import { getDirection } from './GameConstants';
import { index, inBounds, playDiamondSound, playMoveSound, playRockFallSound } from './GameUtils';

const { cols, rows } = GAME_CONFIG;

export function doMove(key, playerRef, gridRef, onScoreUpdate, onLevelComplete, updateRocks, onPlayerDie) {
  const player = playerRef.current;

  const dir = getDirection(key);
  if (!dir) return;

  const tx = player.x + dir.x;
  const ty = player.y + dir.y;
  if (!inBounds(tx, ty)) return;

  const targetTile = gridRef.current[index(tx, ty)];


  // Handle wall or rock collision
  if (targetTile === TILE.WALL || targetTile === TILE.ROCK) {
    if (targetTile === TILE.ROCK && dir.x !== 0 && dir.y === 0) {
      // Try to push rock horizontally
      const pushX = tx + dir.x;
      const pushY = ty;
      if (inBounds(pushX, pushY) && gridRef.current[index(pushX, pushY)] === TILE.EMPTY) {
        // Move rock and player
        gridRef.current[index(pushX, pushY)] = TILE.ROCK;
        gridRef.current[index(tx, ty)] = TILE.EMPTY;
        gridRef.current[index(player.x, player.y)] = TILE.EMPTY;

        player.x = tx;
        player.y = ty;
        gridRef.current[index(player.x, player.y)] = TILE.PLAYER;

        updateRocks(0);

        // Play rock fall sound when rock moves horizontally (simulate falling)
        playRockFallSound();
      }
    }
    return;
  }

  // Handle balloon pushing (balloons can be pushed in any direction)
  if (targetTile === TILE.BALLOON) {
    const pushX = tx + dir.x;
    const pushY = ty + dir.y;
    if (inBounds(pushX, pushY) && gridRef.current[index(pushX, pushY)] === TILE.EMPTY) {
      // Move balloon and player
      gridRef.current[index(pushX, pushY)] = TILE.BALLOON;
      gridRef.current[index(tx, ty)] = TILE.EMPTY;
      gridRef.current[index(player.x, player.y)] = TILE.EMPTY;

      // Mark the pushed balloon as having just moved (so it will explode on collision)
      if (!window.balloonStates) window.balloonStates = new Map();
      // Remove old state
      window.balloonStates.delete(`${tx},${ty}`);
      // Set new state
      window.balloonStates.set(`${pushX},${pushY}`, { justMoved: true });

      player.x = tx;
      player.y = ty;
      gridRef.current[index(player.x, player.y)] = TILE.PLAYER;

      // Play move sound for balloon push
      playMoveSound();
    }
    return;
  }

  // Handle diamond collection
  if (targetTile === TILE.DIAMOND) {
    playDiamondSound();
    console.log('Diamond collected!');
    onScoreUpdate(prevScore => prevScore + 1);
  }

  // Handle explosion diamond collection (higher value)
  if (targetTile === TILE.EXPLOSION_DIAMOND) {
    playDiamondSound();
    console.log('Explosion Diamond collected! +5 points!');
    onScoreUpdate(prevScore => prevScore + 5); // Higher value for special diamonds
  }

  // Handle lava - player dies if stepping into lava
  if (targetTile === TILE.LAVA) {
    // Don't execute the move, just kill the player
    console.log('Player stepped in lava!');
    onPlayerDie(); // This should be passed as a parameter
    return; // Exit early, don't complete the move
  }
if (targetTile === TILE.DIRT) playMoveSound();
  // Execute move
  gridRef.current[index(player.x, player.y)] = TILE.EMPTY;


  player.x = tx;
  player.y = ty;
  gridRef.current[index(player.x, player.y)] = TILE.PLAYER;

  const remainingDiamonds = gridRef.current.filter(tile => tile === TILE.DIAMOND || tile === TILE.EXPLOSION_DIAMOND).length;
  console.log(`Remaining diamonds: ${remainingDiamonds}`);
  // Always check for level completion after move
  if (remainingDiamonds === 0) {
    // Use current score (assumes onScoreUpdate has already run)
    onLevelComplete();
  }
}

export function stepPlayerAlongPath(pathRef, playerRef, gridRef,  onScoreUpdate, onLevelComplete, onPathComplete, onPlayerDie) {
  if (pathRef.current.length === 0) {
    onPathComplete();
    return;
  }

  const next = pathRef.current.shift();
  const grid = gridRef.current;
  const t = grid[index(next.x, next.y)];

  // Check if path is blocked
  if (t === TILE.WALL || t === TILE.ROCK || t === TILE.BALLOON) {
    pathRef.current = [];
    onPathComplete();
    return;
  }

  // Handle lava - player dies if stepping into lava
  if (t === TILE.LAVA) {
    pathRef.current = []; // Clear remaining path
    onPathComplete();
    console.log('Player stepped in lava during pathfinding!');
    onPlayerDie();
    return;
  }
  // Handle diamond collection
  if (t === TILE.DIAMOND) {
    playDiamondSound();
    console.log('Diamond collected!');
    onScoreUpdate(s => s + 1);
  }

  // Handle explosion diamond collection (higher value)
  if (t === TILE.EXPLOSION_DIAMOND) {
    playDiamondSound();
    console.log('Explosion Diamond collected! +5 points!');
    onScoreUpdate(s => s + 5);
  }

  if (t === TILE.DIRT) playMoveSound();

  // Move player
  grid[index(playerRef.current.x, playerRef.current.y)] = TILE.EMPTY;

  playerRef.current.x = next.x;
  playerRef.current.y = next.y;
  grid[index(playerRef.current.x, playerRef.current.y)] = TILE.PLAYER;

  // Always check for level completion after move
  const remainingDiamonds = grid.filter(tile => tile === TILE.DIAMOND || tile === TILE.EXPLOSION_DIAMOND).length;
  if (remainingDiamonds === 0) {
    pathRef.current = [];
    onPathComplete();
    onLevelComplete();
    return;
  }
}


export function handlePlayerDeath(playerRef, gridRef, onLifeLost, onPathClear) {
  // Find empty space for respawn
  let respawnX = 2;
  let respawnY = 2;
  const grid = gridRef.current;

  // Find first available empty space
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (grid[index(x, y)] === TILE.EMPTY) {
        respawnX = x;
        respawnY = y;
        y = rows; // Break outer loop
        break;
      }
    }
  }

  // Remove player from current position
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === TILE.PLAYER) {
      grid[i] = TILE.EMPTY;
    }
  }

  // Place player at respawn position
  playerRef.current.x = respawnX;
  playerRef.current.y = respawnY;
  grid[index(playerRef.current.x, playerRef.current.y)] = TILE.PLAYER;

  // Clear any active paths
  onPathClear();

  // Update lives
  onLifeLost();
}

// Global timer for lava spreading
let lastLavaSpread = Date.now();

export function updateLavaSpread(gridRef) {
  const now = Date.now();
  
  // Only spread lava every 10 seconds
  if (now - lastLavaSpread < 10000) {
    return;
  }
  
  lastLavaSpread = now;
  const grid = gridRef.current;
  const newLavaPositions = [];
  
  // Find all current lava tiles
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[index(x, y)] === TILE.LAVA) {
        // Check adjacent empty tiles for potential spread
        const neighbors = [
          { x: x - 1, y: y },     // left
          { x: x + 1, y: y },     // right
          { x: x, y: y - 1 },     // up
          { x: x, y: y + 1 }      // down
        ];
        
        neighbors.forEach(neighbor => {
          if (inBounds(neighbor.x, neighbor.y)) {
            const neighborIndex = index(neighbor.x, neighbor.y);
            const neighborTile = grid[neighborIndex];
            
            // Lava can only spread to empty tiles (dirt acts as a barrier)
            if (neighborTile === TILE.EMPTY) {
              // Only 20% chance to spread to each eligible neighbor
              if (Math.random() < 0.2) {
                newLavaPositions.push(neighborIndex);
              }
            }
          }
        });
      }
    }
  }
  
  // Apply the new lava spread
  newLavaPositions.forEach(pos => {
    grid[pos] = TILE.LAVA;
  });
  
  if (newLavaPositions.length > 0) {
    console.log(`Lava spread to ${newLavaPositions.length} new tiles!`);
  }
}