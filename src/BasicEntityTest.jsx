import React, { useRef, useEffect } from 'react';
import { GAME_CONFIG, TILE, TILE_COLORS } from './GameConstants';

const { tileSize } = GAME_CONFIG;

export default function BasicEntityTest() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    console.log("BasicEntityTest: Canvas context obtained");

    const render = () => {
      console.log("BasicEntityTest: Rendering frame");
      
      // Clear with dark background
      ctx.fillStyle = '#222';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw a simple test pattern
      const time = performance.now();
      
      // Test wall with 3D effect
      const wallX = 2 * tileSize;
      const wallY = 2 * tileSize;
      
      // Base wall
      ctx.fillStyle = TILE_COLORS[TILE.WALL];
      ctx.fillRect(wallX, wallY, tileSize, tileSize);
      
      // 3D highlight
      ctx.fillStyle = '#666';
      ctx.fillRect(wallX, wallY, tileSize, 3);
      ctx.fillRect(wallX, wallY, 3, tileSize);
      
      // Shadow
      ctx.fillStyle = '#222';
      ctx.fillRect(wallX, wallY + tileSize - 3, tileSize, 3);
      ctx.fillRect(wallX + tileSize - 3, wallY, 3, tileSize);
      
      // Test diamond with sparkle
      const diamondX = 4 * tileSize;
      const diamondY = 2 * tileSize;
      const centerX = diamondX + tileSize / 2;
      const centerY = diamondY + tileSize / 2;
      const size = tileSize * 0.3;
      
      // Animated color
      const sparkle = Math.sin(time * 0.005) * 0.3 + 0.7;
      const color = `hsl(180, 100%, ${50 + sparkle * 30}%)`;
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - size);
      ctx.lineTo(centerX + size * 0.6, centerY - size * 0.3);
      ctx.lineTo(centerX + size * 0.6, centerY + size * 0.3);
      ctx.lineTo(centerX, centerY + size);
      ctx.lineTo(centerX - size * 0.6, centerY + size * 0.3);
      ctx.lineTo(centerX - size * 0.6, centerY - size * 0.3);
      ctx.closePath();
      ctx.fill();
      
      // Sparkle effect
      ctx.fillStyle = 'white';
      ctx.globalAlpha = sparkle;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 0.3, 0, 2 * Math.PI);
      ctx.fill();
      ctx.globalAlpha = 1;
      
      // Test rock with gradient
      const rockX = 6 * tileSize;
      const rockY = 2 * tileSize;
      const rockCenterX = rockX + tileSize / 2;
      const rockCenterY = rockY + tileSize / 2;
      const radius = tileSize / 2 - 2;
      
      // Gradient
      const grad = ctx.createRadialGradient(rockCenterX - 6, rockCenterY - 6, 6, rockCenterX, rockCenterY, radius);
      grad.addColorStop(0, '#bbb');
      grad.addColorStop(1, TILE_COLORS[TILE.ROCK]);
      
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rockCenterX, rockCenterY, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Status text
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.fillText('Entity Test: Wall, Diamond, Rock', 10, 25);
      ctx.fillText(`Time: ${time.toFixed(0)}ms`, 10, 45);
      
      requestAnimationFrame(render);
    };
    
    console.log("BasicEntityTest: Starting render loop");
    render();
    
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={600}
        height={400}
        style={{ 
          border: '1px solid black', 
          imageRendering: 'pixelated',
          backgroundColor: '#333'
        }}
      />
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        color: 'white', 
        fontSize: '14px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: '5px 10px',
        borderRadius: '5px'
      }}>
        🧪 Basic Entity Test<br/>
        <span style={{ fontSize: '12px' }}>Simple rendering test</span>
      </div>
    </div>
  );
}