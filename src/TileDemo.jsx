import React, { useRef, useEffect, useState } from 'react';
import { tileFactory, TileGridUtils } from './tiles';

const TileDemo = () => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const isRunningRef = useRef(false);
  const [isRunning, setIsRunning] = useState(false);
  const [tileGrid, setTileGrid] = useState(null);
  const [selectedTileType, setSelectedTileType] = useState('wall');
  const [info, setInfo] = useState('');

  const tileSize = 32;
  const gridWidth = 20;
  const gridHeight = 15;

  // Initialize demo
  useEffect(() => {
    console.log('🎮 Initializing Tile Demo...');
    
    // Initialize the tile demo
    setInfo('Tile system ready! Click tiles to change them.');

    // Create initial demo grid
    createDemoGrid();
  }, []);

  const createDemoGrid = () => {
    console.log('🎨 Creating demo grid...');
    
    // Create a demo level showcasing different tiles
    const demoLayout = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,4,0,0,0,0,0,0,0,0,4,0,0,0,1],
      [1,0,2,2,2,0,0,0,3,3,0,0,2,2,2,0,0,3,0,1],
      [1,0,2,4,2,0,0,0,0,0,0,0,2,4,2,0,0,0,0,1],
      [1,0,2,2,2,0,0,3,0,0,3,0,2,2,2,0,3,0,0,1],
      [1,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0,0,0,1],
      [1,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,0,4,0,0,3,3,3,3,3,3,3,0,0,4,0,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,2,2,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0,1],
      [1,0,2,4,0,0,0,3,0,0,0,3,0,0,0,4,2,0,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    const grid = tileFactory.createTileGrid(demoLayout);
    
    // Add some special tiles manually for demo
    grid[2][16] = tileFactory.createTile('lava', 16, 2);
    grid[3][17] = tileFactory.createTile('balloon', 17, 3, { properties: { color: '#FF69B4' } });
    grid[4][16] = tileFactory.createTile('heavy_rock', 16, 4);
    grid[6][1] = tileFactory.createTile('bouncy_rock', 1, 6);
    grid[7][18] = tileFactory.createTile('ruby_crystal', 18, 7);
    grid[9][1] = tileFactory.createTile('emerald_crystal', 1, 9);
    grid[11][18] = tileFactory.createTile('balloon', 18, 11, { properties: { color: '#00FF00' } });

    setTileGrid(grid);
  };

  const startAnimation = () => {
    if (!tileGrid || isRunningRef.current) return;
    
    isRunningRef.current = true;
    setIsRunning(true);

    let lastTime = performance.now();

    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas || !isRunningRef.current) return;

      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Animate all tiles
      TileGridUtils.animateGrid(tileGrid, deltaTime, {});

      // Draw all tiles
      TileGridUtils.drawGrid(ctx, tileGrid, tileSize, 0, 0, {});

      // Draw grid lines for clarity
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= gridWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * tileSize, 0);
        ctx.lineTo(x * tileSize, gridHeight * tileSize);
        ctx.stroke();
      }
      for (let y = 0; y <= gridHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * tileSize);
        ctx.lineTo(gridWidth * tileSize, y * tileSize);
        ctx.stroke();
      }

      // Continue animation loop
      if (isRunningRef.current) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Start the animation loop
    animationRef.current = requestAnimationFrame(animate);
  };

  const stopAnimation = () => {
    isRunningRef.current = false;
    setIsRunning(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  // Effect to handle cleanup on unmount
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Effect to draw initial frame when grid changes
  useEffect(() => {
    if (tileGrid && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw all tiles (initial frame)
      TileGridUtils.drawGrid(ctx, tileGrid, tileSize, 0, 0, {});

      // Draw grid lines
      ctx.strokeStyle = 'rgba(128, 128, 128, 0.2)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= gridWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * tileSize, 0);
        ctx.lineTo(x * tileSize, gridHeight * tileSize);
        ctx.stroke();
      }
      for (let y = 0; y <= gridHeight; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * tileSize);
        ctx.lineTo(gridWidth * tileSize, y * tileSize);
        ctx.stroke();
      }
    }
  }, [tileGrid]);

  const handleCanvasClick = (event) => {
    if (!tileGrid) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / tileSize);
    const y = Math.floor((event.clientY - rect.top) / tileSize);

    if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
      // Create new tile of selected type
      const newTile = tileFactory.createTile(selectedTileType, x, y);
      
      // Update grid
      const newGrid = [...tileGrid];
      newGrid[y][x] = newTile;
      setTileGrid(newGrid);

      setInfo(`Placed ${selectedTileType} at (${x}, ${y})`);
    }
  };

  // Get available tile types for selector
  const availableTypes = tileFactory.getAvailableTypes();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎮 Tile System Demo</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={isRunning ? stopAnimation : startAnimation}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isRunning ? '#ff4444' : '#44ff44',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {isRunning ? '⏸️ Stop' : '▶️ Start'} Animation
        </button>

        <button 
          onClick={createDemoGrid}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#4444ff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🔄 Reset Grid
        </button>

        <select 
          value={selectedTileType} 
          onChange={(e) => setSelectedTileType(e.target.value)}
          style={{
            padding: '10px',
            fontSize: '16px',
            marginRight: '10px'
          }}
        >
          {availableTypes.map(type => (
            <option key={type} value={type}>
              {type.replace('_', ' ').toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '10px', color: '#666' }}>
        {info}
      </div>

      <canvas
        ref={canvasRef}
        width={gridWidth * tileSize}
        height={gridHeight * tileSize}
        onClick={handleCanvasClick}
        style={{
          border: '2px solid #333',
          cursor: 'crosshair',
          display: 'block',
          marginBottom: '20px'
        }}
      />

      <div style={{ marginBottom: '20px' }}>
        <h3>🎯 Features Demonstrated:</h3>
        <ul>
          <li><strong>Basic Tiles:</strong> Wall (gray brick), Dirt (brown texture), Rock (3D gray), Diamond (sparkling cyan), Player (golden circle)</li>
          <li><strong>Special Tiles:</strong> Lava (flowing animation), Balloons (floating), Heavy/Bouncy Rocks, Ruby/Emerald Crystals</li>
          <li><strong>Animation System:</strong> Each tile type has custom animations (sparkles, flowing, floating, breathing)</li>
          <li><strong>Extensible Architecture:</strong> Easy to add new tile types by inheriting from base Tile class</li>
          <li><strong>Interactive:</strong> Click anywhere to place selected tile type</li>
        </ul>
      </div>

      <div style={{ backgroundColor: '#f5f5f5', padding: '15px', borderRadius: '5px' }}>
        <h3>🔧 Technical Details:</h3>
        <p><strong>Base Class:</strong> All tiles inherit from <code>Tile</code> class with <code>animate()</code> and <code>draw()</code> methods</p>
        <p><strong>Extensibility:</strong> New tiles like moving platforms, enemies, or power-ups can be easily added</p>
        <p><strong>Performance:</strong> Only visible tiles are drawn, with efficient animation system</p>
        <p><strong>Factory Pattern:</strong> <code>TileFactory</code> manages creation and registration of all tile types</p>
      </div>
    </div>
  );
};

export default TileDemo;