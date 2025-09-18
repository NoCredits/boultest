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

const { tileSize, cols, rows, PLAYER_MOVE_COOLDOWN, audioUnlocked } = GAME_CONFIG;

export default function Boul() {
  // Game state
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [levelJson, setLevelJson] = useState('');

  // Game refs
  const canvasRef = useRef(null);
  const gridRef = useRef([]);
  // Player state: x/y are logical tile, fx/fy are fractional for smooth animation
  const playerRef = useRef({ x: 2, y: 2, fx: 2, fy: 2 });
  
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
  // balloonFloatCooldownRef removed - balloon physics handled in PhysicsManager
  
  // Input handler
  const inputHandlerRef = useRef(new InputHandler());

  // Initialize game
  const initializeGame = () => {
    const { grid, playerPos } = createLevel();
  gridRef.current = grid;
  playerRef.current = { ...playerPos, fx: playerPos.x, fy: playerPos.y };
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

  const draw = () => {

  drawGame(canvasRef, gridRef, cameraRef, pathRef, selectedPathIndexRef, playerRef, isPathActiveRef);
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
      },
      handlePlayerDie // Add the missing onPlayerDie parameter
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
    
    //     //canvas.width = cols * tileSize;
    //     //canvas.height = rows * tileSize;
    // //    canvas.width = GAME_CONFIG.VIEWPORT_WIDTH * GAME_CONFIG.tileSize;
    // //    canvas.height = GAME_CONFIG.VIEWPORT_HEIGHT * GAME_CONFIG.tileSize;

    // // --- Step 1: Calculate tile size based on width ---
    //     const tileSize = Math.floor(innerWidth / GAME_CONFIG.MAX_VIEWPORT_TILES_X);

    //     // --- Step 2: Calculate how many vertical tiles can fit ---
    //     const viewportTilesY = Math.floor(innerHeight / tileSize);

    //     // --- Step 3: Store back into config ---
    //     GAME_CONFIG.tileSize = tileSize;
    //     GAME_CONFIG.VIEWPORT_WIDTH = GAME_CONFIG.MAX_VIEWPORT_TILES_X;
    //     GAME_CONFIG.VIEWPORT_HEIGHT = viewportTilesY;

    //     // --- Step 4: Set canvas pixel size ---
    //     canvas.width = GAME_CONFIG.MAX_VIEWPORT_TILES_X * tileSize;
    //     canvas.height = viewportTilesY * tileSize;

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
      
      // Balloon physics are now handled in PhysicsManager via updateRocks

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