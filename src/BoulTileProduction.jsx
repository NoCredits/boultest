import React, { useRef, useEffect, useState } from 'react';
import { GAME_CONFIG } from './GameConstants';
import { createLevel } from './LevelGenerator';
import { drawGame } from './GameRenderer';  // Use original renderer temporarily for debugging
import { drawTileEnhancedGame, initializeTileRenderer, updateTileAnimations, clearTileCache } from './GameRendererTileEnhanced';
import { updateRocks } from './GamePhysics';
import { InputHandler } from './InputHandler';
import { doMove, stepPlayerAlongPath, handlePlayerDeath } from './GameLogic.jsx';
import { handleCanvasClick, getCurrentPath, selectNextPath, selectPath, handleCanvasMouseMove } from './ClickHandler';
import GameUI from './GameUI';
import './Boul.css';
import { playMoveSound, unlockAudio } from './GameUtils.jsx';
import { tileFactory } from './tiles';  // Import tile factory instance

const { tileSize, cols, rows, PLAYER_MOVE_COOLDOWN, audioUnlocked } = GAME_CONFIG;

export default function BoulTileProduction() {
  // Game state - using same structure as Original
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [levelJson, setLevelJson] = useState('');

  // Game refs - exactly like Original
  const canvasRef = useRef(null);
  const gridRef = useRef([]);
  // Player state: x/y are logical tile, fx/fy are fractional for smooth animation
  const playerRef = useRef({ x: 2, y: 2, fx: 2, fy: 2 });
  
  // Camera state
  const cameraRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, speed: 0.1 });
  
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

  // Initialize game - exactly like Original
  const initializeGame = () => {
    console.log('🎮 Initializing game...');
    
    // Check canvas first
    if (!canvasRef.current) {
      console.error('❌ Canvas ref is null!');
      return;
    }
    
    console.log('✅ Canvas found:', canvasRef.current);
    console.log('📏 Canvas size:', canvasRef.current.width, 'x', canvasRef.current.height);
    
    // Test basic canvas drawing - REMOVED to not interfere
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) {
      console.error('❌ Cannot get canvas context!');
      return;
    }
    console.log('✅ Canvas context obtained');
    
    // Initialize tile renderer
    try {
      initializeTileRenderer();
      console.log('✅ Tile renderer initialized');
    } catch (error) {
      console.error('❌ Tile renderer failed:', error);
    }
    clearTileCache();
    
    const { grid, playerPos } = createLevel();
    console.log('📋 Grid created (1D):', grid);
    console.log('👤 Player position:', playerPos);
    
    // Convert 1D grid to 2D grid for enhanced renderer
    const grid2D = [];
    for (let y = 0; y < rows; y++) {
      grid2D[y] = [];
      for (let x = 0; x < cols; x++) {
        const index = y * cols + x;
        grid2D[y][x] = grid[index];
      }
    }
    console.log('📋 Grid converted to 2D:', grid2D);
    
    gridRef.current = grid;  // Keep 1D for original renderer
    // Store 2D version for enhanced renderer if needed
    gridRef.current.grid2D = grid2D;
    playerRef.current = { ...playerPos, fx: playerPos.x, fy: playerPos.y };
    setScore(0);
    setLives(3);
    
    // Initialize camera to center on player
    const camera = cameraRef.current;
    camera.targetX = Math.max(0, Math.min(playerPos.x - GAME_CONFIG.VIEWPORT_WIDTH / tileSize / 2, 
      grid[0].length - GAME_CONFIG.VIEWPORT_WIDTH / tileSize));
    camera.targetY = Math.max(0, Math.min(playerPos.y - GAME_CONFIG.VIEWPORT_HEIGHT / tileSize / 2, 
      grid.length - GAME_CONFIG.VIEWPORT_HEIGHT / tileSize));
    camera.x = camera.targetX;
    camera.y = camera.targetY;

    // Clear path
    pathRef.current = [];
    selectedDestRef.current = null;
    isPathActiveRef.current = false;
    selectedPathIndexRef.current = 0;

    // Reset timing
    lastTimeRef.current = performance.now();
    moveCooldownRef.current = 0;
    rockFallCooldownRef.current = 0;
  };

  // Initialize on mount
  useEffect(() => {
    // Initialize canvas viewport (like original)
    const updateViewport = (canvas) => {
      const { innerWidth, innerHeight } = window;
      const { MAX_VIEWPORT_TILES_X } = GAME_CONFIG;

      // Calculate new tile size
      const newTileSize = Math.floor(innerWidth / MAX_VIEWPORT_TILES_X);

      // Calculate how many vertical tiles fit
      const newViewportTilesY = Math.floor(innerHeight / newTileSize);

      // Update game config
      GAME_CONFIG.tileSize = newTileSize;
      GAME_CONFIG.VIEWPORT_WIDTH = MAX_VIEWPORT_TILES_X;
      GAME_CONFIG.VIEWPORT_HEIGHT = newViewportTilesY;

      // Update canvas pixel size
      canvas.width = MAX_VIEWPORT_TILES_X * newTileSize;
      canvas.height = newViewportTilesY * newTileSize;

      console.log(`✅ Viewport updated → tileSize=${newTileSize}, WIDTH=${MAX_VIEWPORT_TILES_X}, HEIGHT=${newViewportTilesY}`);
    };

    // Movement handler for InputHandler callback
    const handleMove = (direction) => {
      if (moveCooldownRef.current > 0) return;

      const player = playerRef.current;
      let moved = false;
      let newX = player.x;
      let newY = player.y;

      switch(direction) {
        case 'ArrowLeft':
          if (player.x > 0) {
            newX = player.x - 1;
            moved = true;
          }
          break;
        case 'ArrowRight':
          if (player.x < gridRef.current[0].length - 1) {
            newX = player.x + 1;
            moved = true;
          }
          break;
        case 'ArrowUp':
          if (player.y > 0) {
            newY = player.y - 1;
            moved = true;
          }
          break;
        case 'ArrowDown':
          if (player.y < gridRef.current.length - 1) {
            newY = player.y + 1;
            moved = true;
          }
          break;
      }

      if (moved && doMove(gridRef.current, player.x, player.y, newX, newY, 
          (newGrid) => { gridRef.current = newGrid; }, setScore, () => {})) {
        player.x = newX;
        player.y = newY;
        player.fx = newX;
        player.fy = newY;
        moveCooldownRef.current = PLAYER_MOVE_COOLDOWN;
        playMoveSound();

        // Clear path when manually moving
        pathRef.current = [];
        selectedDestRef.current = null;
        isPathActiveRef.current = false;
        selectedPathIndexRef.current = 0;
      }
    };

    initializeGame();
    
    // Setup canvas viewport like original
    if (canvasRef.current) {
      updateViewport(canvasRef.current);
    }
    
    // Setup input handler - exactly like Original
    const inputHandler = inputHandlerRef.current;
    inputHandler.setCallbacks(handleMove, () => {}, () => {});
    
    window.addEventListener('keydown', inputHandler.handleKeyDown);
    window.addEventListener('keyup', inputHandler.handleKeyUp);

    return () => {
      window.removeEventListener('keydown', inputHandler.handleKeyDown);
      window.removeEventListener('keyup', inputHandler.handleKeyUp);
      
      if (inputHandlerRef.current) {
        inputHandlerRef.current.cleanup();
      }
    };
  }, []);

  // Game loop - exactly like Original
  useEffect(() => {
    let animationFrameId;
    let frameCount = 0;

    const gameLoop = (currentTime) => {
      frameCount++;
      
      // Log every 60 frames to verify game loop is running
      if (frameCount % 60 === 0) {
        console.log(`🔄 Game loop running - frame ${frameCount}`);
      }
      
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      // Update camera
      const camera = cameraRef.current;
      camera.x += (camera.targetX - camera.x) * camera.speed;
      camera.y += (camera.targetY - camera.y) * camera.speed;

      // Update game state
      moveCooldownRef.current = Math.max(0, moveCooldownRef.current - deltaTime);
      rockFallCooldownRef.current = Math.max(0, rockFallCooldownRef.current - deltaTime);

      // Update rocks
      if (rockFallCooldownRef.current <= 0) {
        // Create a dummy player death handler for now
        const handlePlayerDeath = () => {
          console.log('Player died!');
          // TODO: Implement proper player death handling
        };
        
        updateRocks(deltaTime, rockFallCooldownRef, gridRef, handlePlayerDeath);
        rockFallCooldownRef.current = 500; // Reset cooldown manually since updateRocks handles it
      }

      // Update camera target to follow player
      const player = playerRef.current;
      camera.targetX = Math.max(0, Math.min(player.x - GAME_CONFIG.VIEWPORT_WIDTH / tileSize / 2, 
        gridRef.current[0].length - GAME_CONFIG.VIEWPORT_WIDTH / tileSize));
      camera.targetY = Math.max(0, Math.min(player.y - GAME_CONFIG.VIEWPORT_HEIGHT / tileSize / 2, 
        gridRef.current.length - GAME_CONFIG.VIEWPORT_HEIGHT / tileSize));

      // Update tile animations
      updateTileAnimations(deltaTime);

      // Render with enhanced tile system
      if (canvasRef.current && gridRef.current.length > 0) {
        const gameState = {
          playerX: player.x,
          playerY: player.y,
          cameraX: camera.x * tileSize,
          cameraY: camera.y * tileSize,
          currentPath: getCurrentPath(pathRef, selectedPathIndexRef)
        };
        
        // Use original renderer for debugging
        if (frameCount % 60 === 0) {
          console.log('🎨 Attempting to render frame...', gameState);
        }
        
        try {
          // Debug: Check all refs before calling drawGame
          if (frameCount % 60 === 0) {
            console.log('🔍 Refs check - grid length:', gridRef.current?.length, 'camera:', cameraRef.current);
          }
          
          // Check if any critical refs are undefined
          if (!canvasRef.current || !gridRef.current || !cameraRef.current || !playerRef.current) {
            console.error('❌ Critical refs missing');
            return;
          }
          
          // Use original drawGame with correct parameters (like Boul.jsx)
          drawGame(
            canvasRef,           
            gridRef,            
            cameraRef,          
            pathRef,            
            selectedPathIndexRef, 
            playerRef,          
            isPathActiveRef
          );
          
          // Log once per second
          if (frameCount % 60 === 0) {
            console.log(`� Original game restored - player movement should work`);
          }
        } catch (error) {
          console.error('❌ Rendering error:', error);
        }
      } else {
        if (frameCount % 60 === 0) {
          console.log('⚠️ Skipping render - canvas or grid not ready');
        }
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // Rest of the component...
  return (
    <div className="game-container" onClick={unlockAudio}>
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.VIEWPORT_WIDTH * GAME_CONFIG.tileSize}
        height={GAME_CONFIG.VIEWPORT_HEIGHT * GAME_CONFIG.tileSize}
        style={{ 
          border: '2px solid #333',
          display: 'block',
          imageRendering: 'pixelated'
        }}
      />
      
      <div style={{ 
        marginTop: '10px', 
        padding: '10px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <strong>🎨 Tile Production Version - ENHANCED!</strong>
        <br />
        Now using OOP tile system with 3D effects, animations, and enhanced graphics!
        <br />
        Score: {score} | Lives: {lives}
      </div>
    </div>
  );
}