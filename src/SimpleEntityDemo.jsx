import React, { useRef, useEffect, useState } from 'react';
import { GAME_CONFIG, TILE, TILE_COLORS } from './GameConstants';
import { createLevel } from './LevelGenerator';
import './Boul.css';

const { tileSize, cols, rows } = GAME_CONFIG;

// Simple Entity base class
class SimpleEntity {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
  }

  render(ctx, screenX, screenY, tileSize) {
    // Default rendering - override in subclasses
    ctx.fillStyle = TILE_COLORS[this.type] || '#ff00ff';
    ctx.fillRect(screenX, screenY, tileSize, tileSize);
  }
}

// Enhanced Wall with 3D effect
class WallEntity extends SimpleEntity {
  render(ctx, screenX, screenY, tileSize) {
    // Base wall
    ctx.fillStyle = TILE_COLORS[TILE.WALL];
    ctx.fillRect(screenX, screenY, tileSize, tileSize);
    
    // 3D highlight
    ctx.fillStyle = '#666';
    ctx.fillRect(screenX, screenY, tileSize, 3);
    ctx.fillRect(screenX, screenY, 3, tileSize);
    
    // Shadow
    ctx.fillStyle = '#222';
    ctx.fillRect(screenX, screenY + tileSize - 3, tileSize, 3);
    ctx.fillRect(screenX + tileSize - 3, screenY, 3, tileSize);
  }
}

// Enhanced Diamond with sparkle
class DiamondEntity extends SimpleEntity {
  render(ctx, screenX, screenY, tileSize, time) {
    // Diamond shape
    const centerX = screenX + tileSize / 2;
    const centerY = screenY + tileSize / 2;
    const size = tileSize * 0.3;
    
    // Animated color
    const sparkle = Math.sin(time * 0.005 + this.x * 0.5 + this.y * 0.3) * 0.3 + 0.7;
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
  }
}

// Enhanced Rock with gradient
class RockEntity extends SimpleEntity {
  render(ctx, screenX, screenY, tileSize) {
    const centerX = screenX + tileSize / 2;
    const centerY = screenY + tileSize / 2;
    const radius = tileSize / 2 - 2;
    
    // Gradient
    const grad = ctx.createRadialGradient(centerX - 6, centerY - 6, 6, centerX, centerY, radius);
    grad.addColorStop(0, '#bbb');
    grad.addColorStop(1, TILE_COLORS[TILE.ROCK]);
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(centerX - 8, centerY - 8, 8, 0, 2 * Math.PI);
    ctx.fill();
  }
}

// Enhanced Player
class PlayerEntity extends SimpleEntity {
  render(ctx, screenX, screenY, tileSize) {
    const centerX = screenX + tileSize / 2;
    const centerY = screenY + tileSize / 2;
    const radius = tileSize * 0.35;

    // Body gradient
    const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    grad.addColorStop(0, '#ff6');
    grad.addColorStop(1, TILE_COLORS[TILE.PLAYER]);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();

    // Eyes
    ctx.fillStyle = 'black';
    ctx.fillRect(centerX - 8, centerY - 6, 4, 4);
    ctx.fillRect(centerX + 4, centerY - 6, 4, 4);
  }
}

// Enhanced Dirt with texture
class DirtEntity extends SimpleEntity {
  render(ctx, screenX, screenY, tileSize) {
    // Base dirt
    ctx.fillStyle = TILE_COLORS[TILE.DIRT];
    ctx.fillRect(screenX, screenY, tileSize, tileSize);
    
    // Gradient overlay
    const grad = ctx.createLinearGradient(screenX, screenY, screenX + tileSize, screenY + tileSize);
    grad.addColorStop(0, '#a97c50');
    grad.addColorStop(1, TILE_COLORS[TILE.DIRT]);
    ctx.fillStyle = grad;
    ctx.fillRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
    
    // Texture dots
    ctx.fillStyle = '#654321';
    for (let i = 0; i < 4; i++) {
      const dotX = screenX + (i % 2) * tileSize * 0.3 + tileSize * 0.2;
      const dotY = screenY + Math.floor(i / 2) * tileSize * 0.3 + tileSize * 0.2;
      ctx.fillRect(dotX, dotY, 2, 2);
    }
  }
}

function createEntityFromTile(x, y, tileType) {
  switch (tileType) {
    case TILE.WALL: return new WallEntity(x, y, tileType);
    case TILE.DIAMOND: return new DiamondEntity(x, y, tileType);
    case TILE.ROCK: return new RockEntity(x, y, tileType);
    case TILE.PLAYER: return new PlayerEntity(x, y, tileType);
    case TILE.DIRT: return new DirtEntity(x, y, tileType);
    default: return new SimpleEntity(x, y, tileType);
  }
}

export default function SimpleEntityDemo() {
  const canvasRef = useRef(null);
  const entitiesRef = useRef(new Map());
  const cameraRef = useRef({ x: 0, y: 0 });
  const animationIdRef = useRef(null);

  useEffect(() => {
    console.log("SimpleEntityDemo: Initializing...");
    
    // Create entities from level
    const { grid, playerPos } = createLevel();
    console.log("SimpleEntityDemo: Grid created, size:", grid.length);
    
    const entities = new Map();
    let entityCount = 0;
    
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const index = y * cols + x;
        const tileType = grid[index];
        if (tileType !== TILE.EMPTY) {
          try {
            const entity = createEntityFromTile(x, y, tileType);
            entities.set(`${x},${y}`, entity);
            entityCount++;
          } catch (error) {
            console.error(`Error creating entity at (${x},${y}) type ${tileType}:`, error);
          }
        }
      }
    }
    
    console.log("SimpleEntityDemo: Created", entityCount, "entities");
    entitiesRef.current = entities;
    
    // Center camera on player
    if (playerPos) {
      cameraRef.current.x = playerPos.x - GAME_CONFIG.VIEWPORT_WIDTH / 2;
      cameraRef.current.y = playerPos.y - GAME_CONFIG.VIEWPORT_HEIGHT / 2;
    }
    
    // Start render loop
    const renderLoop = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        console.log("SimpleEntityDemo: No canvas found");
        return;
      }
      
      const ctx = canvas.getContext('2d');
      const time = performance.now();
      
      // Clear canvas with dark background
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Render entities
      const camera = cameraRef.current;
      const viewportWidth = GAME_CONFIG.VIEWPORT_WIDTH;
      const viewportHeight = GAME_CONFIG.VIEWPORT_HEIGHT;
      
      let renderedCount = 0;
      
      for (let y = 0; y < viewportHeight; y++) {
        for (let x = 0; x < viewportWidth; x++) {
          const worldX = x + Math.floor(camera.x);
          const worldY = y + Math.floor(camera.y);
          
          // Ensure we're within bounds
          if (worldX >= 0 && worldX < cols && worldY >= 0 && worldY < rows) {
            const entity = entitiesRef.current.get(`${worldX},${worldY}`);
            
            if (entity) {
              try {
                const screenX = x * tileSize;
                const screenY = y * tileSize;
                entity.render(ctx, screenX, screenY, tileSize, time);
                renderedCount++;
              } catch (error) {
                console.error(`Error rendering entity at (${worldX},${worldY}):`, error);
              }
            } else {
              // Draw a faint grid for debugging empty spaces
              if (worldX % 5 === 0 && worldY % 5 === 0) {
                ctx.strokeStyle = '#333';
                ctx.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
              }
            }
          }
        }
      }
      
      // Debug info
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(`Entities: ${entitiesRef.current.size}, Rendered: ${renderedCount}`, 10, 20);
      ctx.fillText(`Camera: (${camera.x.toFixed(1)}, ${camera.y.toFixed(1)})`, 10, 35);
      
      animationIdRef.current = requestAnimationFrame(renderLoop);
    };
    
    console.log("SimpleEntityDemo: Starting render loop");
    renderLoop();
    
    // Cleanup function
    return () => {
      console.log("SimpleEntityDemo: Cleaning up");
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  return (
    <div className="game-container" style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={GAME_CONFIG.VIEWPORT_WIDTH * tileSize}
        height={GAME_CONFIG.VIEWPORT_HEIGHT * tileSize}
        style={{ 
          border: '1px solid black', 
          imageRendering: 'pixelated',
          backgroundColor: '#111' 
        }}
      />
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        right: '10px', 
        color: 'white', 
        fontSize: '14px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '5px 10px',
        borderRadius: '5px'
      }}>
        ✨ Entity System Demo<br/>
        <span style={{ fontSize: '12px' }}>Enhanced visuals with entity classes</span>
      </div>
    </div>
  );
}