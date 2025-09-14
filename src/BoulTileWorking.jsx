import React, { useRef, useEffect, useState } from 'react';
import { GAME_CONFIG } from './GameConstants';
import { createLevel } from './LevelGenerator';
import { drawGame } from './GameRenderer';
import { updateRocks } from './GamePhysics';
import { InputHandler } from './InputHandler';
import { doMove, stepPlayerAlongPath, handlePlayerDeath } from './GameLogic.jsx';
import { handleCanvasClick, getCurrentPath, selectNextPath, selectPath, handleCanvasMouseMove } from './ClickHandler';
import GameUI from './GameUI';
import './Boul.css';
import { playMoveSound, unlockAudio } from './GameUtils.jsx';
import { tileFactory } from './tiles';  // Add tile system
import { seededRandom } from './GameUtils'; // For starfield

const { tileSize, cols, rows, PLAYER_MOVE_COOLDOWN, audioUnlocked } = GAME_CONFIG;

export default function BoulTileWorking() {
  // Game state
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [levelJson, setLevelJson] = useState('');

  // Game refs
  const canvasRef = useRef(null);
  const gridRef = useRef([]);
  // Player state: x/y are logical tile, fx/fy are fractional for smooth animation
  const playerRef = useRef({ x: 2, y: 2, fx: 2, fy: 2 });
  // Player tile instance for enhanced animation
  const playerTileRef = useRef(null);
  
  // Camera state
  const cameraRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, speed: 0.1 }); // top-left tile of the viewport
  
  // Path and movement refs
  const pathRef = useRef([]);
  const selectedDestRef = useRef(null);
  const isPathActiveRef = useRef(false);
  const selectedPathIndexRef = useRef(0);
  
  // Timing refs
  const lastTimeRef = useRef(performance.now());
  const moveCooldownRef = useRef(0);
  const rockFallCooldownRef = useRef(0);
  
  // Input handler
  const inputHandlerRef = useRef(new InputHandler());

  // Initialize game
  const initializeGame = () => {
    const { grid, playerPos } = createLevel();
  gridRef.current = grid;
  playerRef.current = { ...playerPos, fx: playerPos.x, fy: playerPos.y };
    // Initialize player tile
    playerTileRef.current = tileFactory.createTile('player', playerPos.x, playerPos.y);
    setScore(0);
    setLives(3);
    clearPath();
    updateCamera(); // Center camera on player at start
  };

  const clearPath = () => {
    pathRef.current = [];
    selectedDestRef.current = null;
    isPathActiveRef.current = false;
    selectedPathIndexRef.current = 0;
  };
  
  const handlePathSelect = (action, pathIndex) => {
    if (action === 'cycle') {
      selectNextPath(pathRef, selectedPathIndexRef, draw);
    } else if (action === 'select' && pathIndex !== undefined) {
      selectPath(pathRef, selectedPathIndexRef, pathIndex, draw);
    }
  };

  // Starfield background function (from original GameRenderer)
  const drawAnimatedStars = (ctx, px, py, tileSize, time, mapX, mapY) => {
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
      const blinkThreshold = seededRandom(starSeed + 6); // 0 → 1
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
  };

  const draw = () => {
    // Enhanced tile rendering only
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { tileSize } = GAME_CONFIG;
    const grid = gridRef.current;
    const camera = cameraRef.current;
    
    // Clear canvas with space background
    ctx.fillStyle = '#07071a'; // Dark space background (same as original)
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Map numeric values to tile type strings
    const tileTypeMap = {
      0: null,        // Empty - skip
      1: 'wall',      // Wall
      2: 'dirt',      // Dirt  
      3: 'rock',      // Rock
      4: 'diamond',   // Diamond
      5: 'player'     // Player
    };
    
    // Calculate viewport bounds
    const startX = Math.floor(camera.x);
    const startY = Math.floor(camera.y);
    const endX = Math.min(startX + Math.ceil(canvas.width / tileSize) + 1, GAME_CONFIG.cols);
    const endY = Math.min(startY + Math.ceil(canvas.height / tileSize) + 1, GAME_CONFIG.rows);
    
    // Draw starfield background for the entire viewport
    const currentTime = performance.now();
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const screenX = (x - camera.x) * tileSize;
        const screenY = (y - camera.y) * tileSize;
        
        // Draw stars for all positions (will be behind tiles)
        drawAnimatedStars(ctx, screenX, screenY, tileSize, currentTime, x, y);
      }
    }
    
    // Draw tiles with enhanced graphics (on top of starfield)
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const index = y * GAME_CONFIG.cols + x;
        const tileValue = grid[index];
        const tileType = tileTypeMap[tileValue];
        
        if (!tileType) continue; // Skip empty tiles (stars show through)
        
        // Skip player tile - we'll draw it separately with animation
        if (tileType === 'player') continue;
        
        // Create enhanced tile
        const tile = tileFactory.createTile(tileType, x, y);
        if (tile) {
          // Calculate screen position accounting for camera
          const screenX = (x - camera.x) * tileSize;
          const screenY = (y - camera.y) * tileSize;
          
          // Draw with enhanced graphics - pass grid and map coordinates for wall connections
          tile.draw(ctx, screenX, screenY, tileSize, currentTime, grid, GAME_CONFIG.cols, x, y);
        }
      }
    }
    
    // Draw animated player on top of everything else
    const player = playerRef.current;
    const playerTile = playerTileRef.current;
    if (player && playerTile) {
      // Update player tile position and animate
      playerTile.updatePosition(player.x, player.y);
      playerTile.animate(16, { time: currentTime }); // 16ms approximate delta time
      
      // Check if player is in viewport
      if (player.x >= camera.x - 1 && player.y >= camera.y - 1 &&
          player.x < camera.x + Math.ceil(canvas.width / tileSize) + 1 && 
          player.y < camera.y + Math.ceil(canvas.height / tileSize) + 1) {
        
        const screenX = (player.x - camera.x) * tileSize;
        const screenY = (player.y - camera.y) * tileSize;
        
        // Draw animated player
        playerTile.draw(ctx, screenX, screenY, tileSize, currentTime, grid, GAME_CONFIG.cols, player.x, player.y);
      }
    }
    
    // Draw path overlays on top of tiles
    const paths = pathRef.current || [];
    const time = performance.now();
    const pathColors = [
      'rgba(255,255,0,0.5)',   // Yellow - primary/selected path
      'rgba(0,255,255,0.3)',   // Cyan - alternate path 1
      'rgba(255,0,255,0.3)',   // Magenta - alternate path 2
      'rgba(0,255,0,0.3)',     // Green - additional paths
      'rgba(255,128,0,0.3)'    // Orange - additional paths
    ];
    
    const isPathActive = isPathActiveRef && isPathActiveRef.current;
    
    if (Array.isArray(paths) && paths.length > 0) {
      for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
        const path = paths[pathIndex];
        const isSelected = selectedPathIndexRef && selectedPathIndexRef.current === pathIndex;
        
        // Use different colors and opacity for selected vs non-selected paths
        if (isSelected) {
          if (isPathActive) {
            const glow = 0.3 + 0.2 * Math.sin(time * 0.005); // Gentle pulsing
            ctx.fillStyle = `rgba(255,255,100,${glow})`;
          } else {
            ctx.fillStyle = pathColors[0]; // Bright yellow for selected
          }
        } else {
          ctx.fillStyle = pathColors[Math.min(pathIndex + 1, pathColors.length - 1)];
        }
        
        // Draw path tiles that are in viewport
        for (const p of path) {
          if (p.x >= camera.x - 1 && p.y >= camera.y - 1 &&
              p.x < camera.x + Math.ceil(canvas.width / tileSize) + 1 && 
              p.y < camera.y + Math.ceil(canvas.height / tileSize) + 1) {
            const screenX = (p.x - camera.x) * tileSize;
            const screenY = (p.y - camera.y) * tileSize;
            
            if (isSelected) {
              // Draw selected path with border
              ctx.fillRect(screenX, screenY, tileSize, tileSize);
              ctx.strokeStyle = 'rgba(255,255,0,0.8)';
              ctx.lineWidth = 2;
              ctx.strokeRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);
            } else {
              // Draw non-selected paths with subtle hover hint
              ctx.fillRect(screenX, screenY, tileSize, tileSize);
              
              // Add a subtle border to indicate it's clickable (only when multiple paths exist)
              if (paths.length > 1 && !isPathActive) {
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX + 1, screenY + 1, tileSize - 2, tileSize - 2);
              }
            }
          }
        }
      }
    }
    
    // Draw path numbers/indicators for multiple paths
    if (paths.length > 1 && !isPathActive) {
      ctx.font = `${Math.floor(tileSize * 0.4)}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Group paths by their starting position to handle overlapping numbers
      const pathsByPosition = new Map();
      
      for (let pathIndex = 0; pathIndex < paths.length; pathIndex++) {
        const path = paths[pathIndex];
        if (path.length > 0) {
          const firstStep = path[0];
          const posKey = `${firstStep.x},${firstStep.y}`;
          
          if (!pathsByPosition.has(posKey)) {
            pathsByPosition.set(posKey, []);
          }
          pathsByPosition.get(posKey).push({ pathIndex, firstStep });
        }
      }
      
      // Draw numbers for each position group
      for (const [posKey, pathGroup] of pathsByPosition) {
        const basePosition = pathGroup[0].firstStep;
        
        // Only draw if position is in viewport
        const VIEWPORT_WIDTH = Math.ceil(canvas.width / tileSize);
        const VIEWPORT_HEIGHT = Math.ceil(canvas.height / tileSize);
        if (basePosition.x >= camera.x - 1 && basePosition.y >= camera.y - 1 &&
            basePosition.x < camera.x + VIEWPORT_WIDTH + 1 && basePosition.y < camera.y + VIEWPORT_HEIGHT + 1) {
          
          const baseScreenX = (basePosition.x - camera.x) * tileSize;
          const baseScreenY = (basePosition.y - camera.y) * tileSize;
          
          // If multiple paths start from same position, arrange numbers in a circle
          if (pathGroup.length > 1) {
            const radius = tileSize * 0.4; // Distance from center
            const angleStep = (2 * Math.PI) / pathGroup.length;
            
            for (let i = 0; i < pathGroup.length; i++) {
              const { pathIndex } = pathGroup[i];
              const angle = i * angleStep - Math.PI / 2; // Start from top
              const offsetX = Math.cos(angle) * radius;
              const offsetY = Math.sin(angle) * radius;
              
              const screenX = baseScreenX + tileSize / 2 + offsetX;
              const screenY = baseScreenY + tileSize / 2 + offsetY;
              
              const isSelected = selectedPathIndexRef && selectedPathIndexRef.current === pathIndex;
              
              // Background circle
              ctx.fillStyle = isSelected ? 'rgba(255,255,0,0.9)' : 'rgba(0,0,0,0.7)';
              ctx.beginPath();
              ctx.arc(screenX, screenY, tileSize * 0.2, 0, 2 * Math.PI);
              ctx.fill();
              
              // Path number
              ctx.fillStyle = isSelected ? 'black' : 'white';
              ctx.fillText((pathIndex + 1).toString(), screenX, screenY);
            }
          } else {
            // Single path at this position - draw normally in center
            const { pathIndex } = pathGroup[0];
            const screenX = baseScreenX + tileSize / 2;
            const screenY = baseScreenY + tileSize / 2;
            
            const isSelected = selectedPathIndexRef && selectedPathIndexRef.current === pathIndex;
            
            // Background circle
            ctx.fillStyle = isSelected ? 'rgba(255,255,0,0.9)' : 'rgba(0,0,0,0.7)';
            ctx.beginPath();
            ctx.arc(screenX, screenY, tileSize * 0.25, 0, 2 * Math.PI);
            ctx.fill();
            
            // Path number
            ctx.fillStyle = isSelected ? 'black' : 'white';
            ctx.fillText((pathIndex + 1).toString(), screenX, screenY);
          }
        }
      }
      
      // Add instruction text at the top
      ctx.font = `${Math.floor(tileSize * 0.3)}px Arial`;
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText('Click on a path to select it', 10, 20);
    }
  };

  // Game event handlers
  const handleMove = (key) => {
    unlockAudio();
    const prevX = playerRef.current.x;
    const prevY = playerRef.current.y;
    doMove(
      key, 
      playerRef, 
      gridRef, 
      setScore, 
      (newScore) => showLevelComplete(newScore),
      (dt) => updateRocks(dt, rockFallCooldownRef, gridRef, handlePlayerDie)
    );
    // Set player fractional target to new position
    playerRef.current.fx = prevX;
    playerRef.current.fy = prevY;
    updateCamera(); // Update camera target after player moves
  };

  const handlePlayerDie = () => {
    handlePlayerDeath(
      playerRef, 
      gridRef, 
      () => {
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setTimeout(() => {
              setLives(3);
              initializeGame();
              draw();
            }, 2000);
          }
          return newLives;
        });
      },
      clearPath
    );
  };

  const showLevelComplete = (newScore) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Level Complete! Score: ' + newScore, canvas.width / 2, canvas.height / 2);
    }
    setTimeout(() => {
      initializeGame();
      draw();
    }, 2000);
  };

  const stepPlayer = () => {
    const prevX = playerRef.current.x;
    const prevY = playerRef.current.y;
    
    // Get the currently selected path
    const currentPath = getCurrentPath(pathRef, selectedPathIndexRef);
    
    // Create a temporary ref for the current path
    const currentPathRef = { current: currentPath };
    
    stepPlayerAlongPath(
      currentPathRef, 
      playerRef, 
      gridRef, 
      setScore,
      () => showLevelComplete(score),
      () => {
        isPathActiveRef.current = false;
        selectedDestRef.current = null;
        // Clear all paths when path following is complete
        pathRef.current = [];
        selectedPathIndexRef.current = 0;
      }
    );
    
    // Update the main pathRef with the modified current path
    if (pathRef.current && pathRef.current.length > 0) {
      pathRef.current[selectedPathIndexRef.current] = currentPathRef.current;
    }
    
    // Set player fractional target to new position
    playerRef.current.fx = prevX;
    playerRef.current.fy = prevY;
    updateCamera(); // Update camera target after player moves
  };

  // UI event handlers
  const handleReset = () => {
    initializeGame();
    draw();
  };

  const handleLoadLevel = () => {
    // TODO: Implement level loading from JSON
    initializeGame();
    draw();
  };

  // Removed local audioUnlockedRef and unlockAudio, now using global unlockAudio from GameUtils

  const handleClick = (e) => {
    unlockAudio();
    
    // Ensure canvas has focus for keyboard events
    if (canvasRef.current) {
      canvasRef.current.focus();
    }
    
    handleCanvasClick(
      e,
      canvasRef,
      gridRef,
      playerRef,
      pathRef,
      selectedDestRef,
      isPathActiveRef,
      rockFallCooldownRef,
      handlePlayerDie,
      draw,
      cameraRef,
      selectedPathIndexRef,
      'multiple' // pathfinding mode - 'single', 'multiple', 'alternate', 'randomized'
    );
  };

  const handleMouseMove = (e) => {
    handleCanvasMouseMove(e, canvasRef, pathRef, cameraRef);
  };


function updateViewport(canvas) {
  const { innerWidth, innerHeight } = window;
  const { MAX_VIEWPORT_TILES_X } = GAME_CONFIG;

  // Step 1: Calculate new tile size
  const newTileSize = Math.floor(innerWidth / MAX_VIEWPORT_TILES_X);

  // Step 2: Calculate how many vertical tiles fit
  const newViewportTilesY = Math.floor(innerHeight / newTileSize);

  // Step 3: Update game config
  GAME_CONFIG.tileSize = newTileSize;
  GAME_CONFIG.VIEWPORT_WIDTH = MAX_VIEWPORT_TILES_X;
  GAME_CONFIG.VIEWPORT_HEIGHT = newViewportTilesY;

  // Step 4: Update canvas pixel size
  canvas.width = MAX_VIEWPORT_TILES_X * newTileSize;
  canvas.height = newViewportTilesY * newTileSize;

  console.log(
    `Viewport updated → tileSize=${newTileSize}, WIDTH=${MAX_VIEWPORT_TILES_X}, HEIGHT=${newViewportTilesY}`
  );
}



  // Initialize canvas and game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    updateViewport(canvas);
    initializeGame();
    
    // Set up input handler
    const inputHandler = inputHandlerRef.current;
    inputHandler.setCallbacks(handleMove, clearPath, handlePathSelect);
    
    // Add event listeners
    window.addEventListener('keydown', inputHandler.handleKeyDown);
    window. addEventListener('keyup', inputHandler.handleKeyUp);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('mousemove', handleMouseMove);
    
    // Give canvas focus for keyboard events
    canvas.focus();

    // Event listener for resizing
  function handleResize() {
    updateViewport(canvas);
    draw(); // Redraw immediately after resizing
  }
  window.addEventListener('resize', handleResize);


    return () => {
      window.removeEventListener('keydown', inputHandler.handleKeyDown);
      window.removeEventListener('keyup', inputHandler.handleKeyUp);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
       window.removeEventListener('resize', handleResize);
      inputHandler.cleanup();
    };
  }, []);


  function updateCamera() {
    const { VIEWPORT_WIDTH, VIEWPORT_HEIGHT, cols, rows } = GAME_CONFIG;
    const player = playerRef.current;

    // Center camera on player
    let camX = player.x - Math.floor(VIEWPORT_WIDTH / 2);
    let camY = player.y - Math.floor(VIEWPORT_HEIGHT / 2);

    // Clamp to map boundaries
    camX = Math.max(0, Math.min(cols - VIEWPORT_WIDTH, camX));
    camY = Math.max(0, Math.min(rows - VIEWPORT_HEIGHT, camY));

    cameraRef.current.targetX = camX;
    cameraRef.current.targetY = camY;
    // If camera is far from target (e.g. on reset), snap to target
    if (Math.abs(cameraRef.current.x - camX) > 2 || Math.abs(cameraRef.current.y - camY) > 2) {
      cameraRef.current.x = camX;
      cameraRef.current.y = camY;
    }
  }


  // Game loop
  useEffect(() => {
    let running = true;
    
    function tick(now) {
      if (!running) return;
      
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      
  // Animate camera each frame
  const cam = cameraRef.current;
  const lerp = (a, b, t) => a + (b - a) * t;
  cam.x = lerp(cam.x, cam.targetX, cam.speed);
  cam.y = lerp(cam.y, cam.targetY, cam.speed);

  // Animate player fractional position
  const player = playerRef.current;
  const playerSpeed = 0.25; // Higher = faster interpolation
  player.fx = lerp(player.fx, player.x, playerSpeed);
  player.fy = lerp(player.fy, player.y, playerSpeed);

      // Update rock physics
      updateRocks(dt, rockFallCooldownRef, gridRef, handlePlayerDie);

      // Handle path following
      moveCooldownRef.current -= dt;
      if (moveCooldownRef.current <= 0) {
        if (isPathActiveRef.current && pathRef.current.length > 0) {
          const currentPath = getCurrentPath(pathRef, selectedPathIndexRef);
          if (currentPath.length > 0) {
            stepPlayer();
            moveCooldownRef.current = PLAYER_MOVE_COOLDOWN;
          }
        }
      }

      // Render if needed
      draw();

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);

    return () => { 
      running = false; 
    };
  }, []);


  
  // Redraw when score/lives change
  useEffect(() => {
    draw();
  }, [score, lives]);

  return (
    <div>
      <GameUI
        score={score}
        lives={lives}
        levelJson={levelJson}
        setLevelJson={setLevelJson}
        onReset={handleReset}
        onLoadLevel={handleLoadLevel}
      />
      <canvas id="c" ref={canvasRef} tabIndex="0"></canvas>
    </div>
  );
}