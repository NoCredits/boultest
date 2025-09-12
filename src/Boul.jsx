import React, { useRef, useEffect, useState } from 'react';
import { GAME_CONFIG } from './GameConstants';
import { createLevel } from './LevelGenerator';
import { drawGame } from './GameRenderer';
import { updateRocks } from './GamePhysics';
import { InputHandler } from './InputHandler';
import { doMove, stepPlayerAlongPath, handlePlayerDeath } from './GameLogic.jsx';
import { handleCanvasClick } from './ClickHandler';
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
  const playerRef = useRef({ x: 2, y: 2 });
    
  // Path and movement refs
  const pathRef = useRef([]);
  const selectedDestRef = useRef(null);
  const isPathActiveRef = useRef(false);
  
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
    playerRef.current = playerPos;
    setScore(0);
    setLives(3);
    clearPath();
  };

  const clearPath = () => {
    pathRef.current = [];
    selectedDestRef.current = null;
    isPathActiveRef.current = false;
  };

  const draw = () => {

    drawGame(canvasRef, gridRef, pathRef);
  };

  // Game event handlers
  const handleMove = (key) => {
    unlockAudio();
    doMove(
      key, 
      playerRef, 
      gridRef, 
      
      setScore, 
      (newScore) => showLevelComplete(newScore),
      (dt) => updateRocks(dt, rockFallCooldownRef, gridRef, handlePlayerDie)
    );
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
    stepPlayerAlongPath(
      pathRef, 
      playerRef, 
      gridRef, 
      
      setScore,
      () => showLevelComplete(),
      () => {
        isPathActiveRef.current = false;
        selectedDestRef.current = null;
      }
    );
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
      draw
    );
  };


  // Initialize canvas and game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.width = cols * tileSize;
    canvas.height = rows * tileSize;
    
    initializeGame();
    
    // Set up input handler
    const inputHandler = inputHandlerRef.current;
    inputHandler.setCallbacks(handleMove, clearPath);
    
    // Add event listeners
    window.addEventListener('keydown', inputHandler.handleKeyDown);
    window.addEventListener('keyup', inputHandler.handleKeyUp);
    canvas.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('keydown', inputHandler.handleKeyDown);
      window.removeEventListener('keyup', inputHandler.handleKeyUp);
      canvas.removeEventListener('click', handleClick);
      inputHandler.cleanup();
    };
  }, []);

  // Game loop
  useEffect(() => {
    let running = true;
    
    function tick(now) {
      if (!running) return;
      
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      
      // Update rock physics
      updateRocks(dt, rockFallCooldownRef, gridRef, handlePlayerDie);
      
      // Handle path following
      moveCooldownRef.current -= dt;
      if (moveCooldownRef.current <= 0) {
        if (isPathActiveRef.current && pathRef.current.length > 0) {
          stepPlayer();
          moveCooldownRef.current = PLAYER_MOVE_COOLDOWN;
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
      <canvas id="c" ref={canvasRef}></canvas>
    </div>
  );
}