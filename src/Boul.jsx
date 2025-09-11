import React, { useRef, useEffect, useState } from 'react';
import './Boul.css';

export default function Boul() {
  // Game state refs for logic
  const destRef = useRef(null);
  const pathRef = useRef([]);
  const moveCooldownRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rockFallCooldownRef = useRef(0);
  const ROCK_FALL_INTERVAL = 100;
  const keysPressedRef = useRef(new Set());  // Tracks pressed keys (e.g., 'ArrowUp')
  const keyRepeatTimersRef = useRef(new Map());  // Per-key timers for custom repeat
  const selectedDestRef = useRef(null);  // Tracks the selected destination for double-click
  const isPathActiveRef = useRef(false);  // Controls if path is being followed

  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [levelJson, setLevelJson] = useState('');

  // Game constants and state
  const TILE = { EMPTY: 0, WALL: 1, DIRT: 2, ROCK: 3, DIAMOND: 4, PLAYER: 5 };
  const TILE_COLORS = {
    [TILE.EMPTY]: '#000',
    [TILE.WALL]: '#444',
    [TILE.DIRT]: '#8b5a2b',
    [TILE.ROCK]: '#888',
    [TILE.DIAMOND]: '#0ff',
    [TILE.PLAYER]: '#ff0'
  };

  const tileSize = 40, cols = 28, rows = 20;

  // Mutable refs for game state
  const gridRef = useRef([]);
  const playerRef = useRef({ x: 2, y: 2 });
  const dirtyTilesRef = useRef(new Set());
  const moveDirRef = useRef(null);  // For direction tracking

  // Constants for custom repeat (tuned for no initial delay + faster repeats)
  const REPEAT_INITIAL_DELAY = 0;  // ms before first repeat (0 = instant after first move)
  const REPEAT_INTERVAL = 80;      // ms between repeats (snappier movement)

  // Helper functions
  function index(x, y) { return y * cols + x; }
  function inBounds(x, y) { return x >= 0 && y >= 0 && x < cols && y < rows; }
  function markDirty(x, y) { if (inBounds(x, y)) dirtyTilesRef.current.add(index(x, y)); }
  function getDirection(key) {
    switch (key) {
      case 'ArrowUp':
      case 'w':
      case 'W': return { x: 0, y: -1 };
      case 'ArrowDown':
      case 's':
      case 'S': return { x: 0, y: 1 };
      case 'ArrowLeft':
      case 'a':
      case 'A': return { x: -1, y: 0 };
      case 'ArrowRight':
      case 'd':
      case 'D': return { x: 1, y: 0 };
      default: return null;
    }
  }

  function neighbors(node) {
    const n = [];
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const d of dirs) {
      const nx = node.x + d[0], ny = node.y + d[1];
      if (!inBounds(nx, ny)) continue;
      const t = gridRef.current[index(nx, ny)];
      if (t !== TILE.WALL && t !== TILE.ROCK) n.push({ x: nx, y: ny });
    }
    return n;
  }

  function bfsPath(start, goal) {
    const q = [start];
    const key = p => p.x + "," + p.y;
    const parent = new Map();
    parent.set(key(start), null);
    while (q.length) {
      const cur = q.shift();
      if (cur.x === goal.x && cur.y === goal.y) break;
      for (const n of neighbors(cur)) {
        const k = key(n);
        if (!parent.has(k)) {
          parent.set(k, cur);
          q.push(n);
        }
      }
    }
    const goalKey = key(goal);
    if (!parent.has(goalKey)) return [];
    const path = [];
    let curKey = goalKey, cur = goal;
    while (cur) {
      path.push({ x: cur.x, y: cur.y });
      cur = parent.get(curKey);
      if (cur) curKey = cur.x + "," + cur.y;
    }
    path.reverse();
    if (path.length > 0 && path[0].x === start.x && path[0].y === start.y) path.shift();
    return path;
  }

  // Level creation
  function createLevel() {
    const grid = new Array(cols * rows).fill(TILE.DIRT);
    for (let x = 0; x < cols; x++) {
      grid[index(x, 0)] = TILE.WALL;
      grid[index(x, rows - 1)] = TILE.WALL;
      markDirty(x, 0);
      markDirty(x, rows - 1);
    }
    for (let y = 0; y < rows; y++) {
      grid[index(0, y)] = TILE.WALL;
      grid[index(cols - 1, y)] = TILE.WALL;
      markDirty(0, y);
      markDirty(cols - 1, y);
    }
    for (let y = 2; y < rows - 2; y++) {
      for (let x = 2; x < cols - 2; x++) {
        grid[index(x, y)] = Math.random() < 0.12 ? TILE.EMPTY : TILE.DIRT;
        if (Math.random() < 0.08) grid[index(x, y)] = TILE.ROCK;
        if (Math.random() < 0.01) grid[index(x, y)] = TILE.DIAMOND;
        markDirty(x, y);
      }
    }
    for (let i = 0; i < 10; i++) {
      let wx = 4 + Math.floor(Math.random() * (cols - 8)), wy = 3 + Math.floor(Math.random() * (rows - 6));
      grid[index(wx, wy)] = TILE.WALL;
      markDirty(wx, wy);
    }
    playerRef.current = { x: 2, y: 2 };
    grid[index(playerRef.current.x, playerRef.current.y)] = TILE.PLAYER;
    markDirty(playerRef.current.x, playerRef.current.y);
    gridRef.current = grid;

    dirtyTilesRef.current.clear();  // Reset to avoid duplicates
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        markDirty(x, y);
      }
    }
    setScore(0);
    setLives(3);
    selectedDestRef.current = null;  // Reset selected destination on new level
    isPathActiveRef.current = false;
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const grid = gridRef.current;
    const dirtyTiles = dirtyTilesRef.current;
    const path = pathRef.current || [];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tilesToDraw = dirtyTiles.size > 0 ? dirtyTiles : new Set([...Array(cols * rows).keys()]);
    tilesToDraw.forEach(i => {
      const x = i % cols, y = Math.floor(i / cols);
      const tile = grid[i];
      const px = x * tileSize, py = y * tileSize;
      if (tile === TILE.ROCK) {
        ctx.fillStyle = '#000';
        ctx.fillRect(px, py, tileSize, tileSize);
      } else {
        ctx.fillStyle = TILE_COLORS[tile] || '#f0f';
        ctx.beginPath();
        ctx.moveTo(px + 4, py);
        ctx.lineTo(px + tileSize - 4, py);
        ctx.quadraticCurveTo(px + tileSize, py, px + tileSize, py + 4);
        ctx.lineTo(px + tileSize, py + tileSize - 4);
        ctx.quadraticCurveTo(px + tileSize, py + tileSize, px + tileSize - 4, py + tileSize);
        ctx.lineTo(px + 4, py + tileSize);
        ctx.quadraticCurveTo(px, py + tileSize, px, py + tileSize - 4);
        ctx.lineTo(px, py + 4);
        ctx.quadraticCurveTo(px, py, px + 4, py);
        ctx.closePath();
        ctx.fill();
      }
      if (tile === TILE.ROCK) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize / 2.2, 0, 2 * Math.PI);
        ctx.closePath();
        const grad = ctx.createRadialGradient(px + tileSize / 2, py + tileSize / 2, 4, px + tileSize / 2, py + tileSize / 2, tileSize / 2.2);
        grad.addColorStop(0, '#bbb');
        grad.addColorStop(1, TILE_COLORS[TILE.ROCK]);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.arc(px + tileSize / 2 - 5, py + tileSize / 2 - 5, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();
      } else if (tile === TILE.DIAMOND) {
        const grad = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize);
        grad.addColorStop(0, '#0ff');
        grad.addColorStop(1, '#08f');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(px + tileSize / 2, py + 4);
        ctx.lineTo(px + tileSize - 4, py + tileSize / 2);
        ctx.lineTo(px + tileSize / 2, py + tileSize - 4);
        ctx.lineTo(px + 4, py + tileSize / 2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(px + tileSize / 2, py + tileSize / 2, 3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      } else if (tile === TILE.DIRT) {
        const grad = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize);
        grad.addColorStop(0, '#a97c50');
        grad.addColorStop(1, TILE_COLORS[TILE.DIRT]);
        ctx.fillStyle = grad;
        ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
      } else if (tile === TILE.PLAYER) {
        ctx.save();
        ctx.shadowColor = '#fff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffea00';
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px + tileSize / 2, py + tileSize / 2 - 4, tileSize / 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ff9800';
        ctx.fillRect(px + tileSize / 2 - 4, py + tileSize / 2, 8, 10);
        ctx.strokeRect(px + tileSize / 2 - 4, py + tileSize / 2, 8, 10);
        ctx.strokeStyle = '#ff9800';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(px + tileSize / 2 - 4, py + tileSize / 2 + 4);
        ctx.lineTo(px + tileSize / 2 - 10, py + tileSize / 2 + 10);
        ctx.moveTo(px + tileSize / 2 + 4, py + tileSize / 2 + 4);
        ctx.lineTo(px + tileSize / 2 + 10, py + tileSize / 2 + 10);
        ctx.stroke();
        ctx.strokeStyle = '#1565c0';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(px + tileSize / 2 - 2, py + tileSize / 2 + 10);
        ctx.lineTo(px + tileSize / 2 - 4, py + tileSize / 2 + 18);
        ctx.moveTo(px + tileSize / 2 + 2, py + tileSize / 2 + 10);
        ctx.lineTo(px + tileSize / 2 + 4, py + tileSize / 2 + 18);
        ctx.stroke();
        ctx.restore();
      } else if (tile === TILE.WALL) {
        ctx.fillStyle = '#333';
        ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
        ctx.fillStyle = '#666';
        ctx.fillRect(px + 1, py + 1, tileSize - 2, 6);
      }
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.strokeRect(px, py, tileSize, tileSize);
    });

    // Draw path
    ctx.fillStyle = 'rgba(255,255,0,0.3)';
    for (const p of path) {
      ctx.fillRect(p.x * tileSize, p.y * tileSize, tileSize, tileSize);
    }
  }

  function doMove(key) {
    const player = playerRef.current;
    const dir = getDirection(key);
    if (!dir) return;

    const tx = player.x + dir.x;
    const ty = player.y + dir.y;
    if (!inBounds(tx, ty)) return;

    const targetTile = gridRef.current[index(tx, ty)];
    if (targetTile === TILE.WALL || targetTile === TILE.ROCK) {
      if (targetTile === TILE.ROCK && dir.x !== 0 && dir.y === 0) {
        const pushX = tx + dir.x;
        const pushY = ty;
        if (inBounds(pushX, pushY) && gridRef.current[index(pushX, pushY)] === TILE.EMPTY) {
          gridRef.current[index(pushX, pushY)] = TILE.ROCK;
          gridRef.current[index(tx, ty)] = TILE.EMPTY;
          gridRef.current[index(player.x, player.y)] = TILE.EMPTY;
          player.x = tx; player.y = ty;
          gridRef.current[index(player.x, player.y)] = TILE.PLAYER;
          markDirty(pushX, pushY);
          markDirty(tx, ty);
          markDirty(player.x - dir.x, player.y);
          updateRocks(0);
        }
      }
      return;
    }

    if (targetTile === TILE.DIAMOND) {
      setScore(s => {
        const newScore = s + 1;
        if (!gridRef.current.includes(TILE.DIAMOND)) {
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
            createLevel();
            draw();
          }, 2000);
        }
        return newScore;
      });
    }

    gridRef.current[index(player.x, player.y)] = TILE.EMPTY;
    markDirty(player.x, player.y);
    player.x = tx; player.y = ty;
    gridRef.current[index(player.x, player.y)] = TILE.PLAYER;
    markDirty(player.x, player.y);
    draw();
  }

  function handleKeyDown(e) {
    const key = e.key;
    if (keysPressedRef.current.has(key)) return;
    keysPressedRef.current.add(key);

    console.log('Key pressed:', key, 'at', performance.now());  // Debug: Check timing in console

    const dir = getDirection(key);
    if (!dir) return;

    pathRef.current = [];  // Clear pathfinding
    destRef.current = null;
    selectedDestRef.current = null; // Clear selected destination on key press
    isPathActiveRef.current = false;
    moveDirRef.current = dir;
    doMove(key);

    const timer = setTimeout(() => {
      const intervalId = setInterval(() => {
        if (!keysPressedRef.current.has(key)) return;
        doMove(key);
      }, REPEAT_INTERVAL);
      keyRepeatTimersRef.current.set(key, intervalId);
    }, REPEAT_INITIAL_DELAY);

    keyRepeatTimersRef.current.set(key + '_initial', timer);
  }

  function handleKeyUp(e) {
    const key = e.key;
    keysPressedRef.current.delete(key);

    const initialTimer = keyRepeatTimersRef.current.get(key + '_initial');
    if (initialTimer) {
      clearTimeout(initialTimer);
      keyRepeatTimersRef.current.delete(key + '_initial');
    }
    const intervalId = keyRepeatTimersRef.current.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      keyRepeatTimersRef.current.delete(key);
    }
  }

  // Initial setup and input listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = cols * tileSize;
    canvas.height = rows * tileSize;
    createLevel();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function handleCanvasClick(e) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const gx = Math.floor((e.clientX - rect.left) / tileSize);
      const gy = Math.floor((e.clientY - rect.top) / tileSize);
      if (!inBounds(gx, gy)) return;
      const clickedTile = gridRef.current[index(gx, gy)];
      const player = playerRef.current;

      if (clickedTile === TILE.ROCK) {
        const dx = gx - player.x;
        const dy = gy - player.y;
        if ((Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0)) {
          const pushX = gx + dx;
          const pushY = gy + dy;
          if (inBounds(pushX, pushY) && gridRef.current[index(pushX, pushY)] === TILE.EMPTY) {
            gridRef.current[index(pushX, pushY)] = TILE.ROCK;
            gridRef.current[index(gx, gy)] = TILE.EMPTY;
            markDirty(gx, gy);
            markDirty(pushX, pushY);
            updateRocks(0);
            draw();
          }
        }
      } else {
        // Check if this is a second click on the same spot
        if (selectedDestRef.current && selectedDestRef.current.x === gx && selectedDestRef.current.y === gy) {
          // Second click: Activate path following
          isPathActiveRef.current = true;
          selectedDestRef.current = null;
        } else {
          // First click: Preview the path
          destRef.current = { x: gx, y: gy };
          pathRef.current = bfsPath(playerRef.current, destRef.current);
          isPathActiveRef.current = false;
          selectedDestRef.current = { x: gx, y: gy };
          draw();
        }
      }
    }
    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('click', handleCanvasClick);
      keyRepeatTimersRef.current.forEach(timer => {
        if (typeof timer === 'number') clearInterval(timer);
        else if (typeof timer === 'object') clearTimeout(timer);
      });
      keyRepeatTimersRef.current.clear();
      keysPressedRef.current.clear();
    };
  }, []);

  // Update rocks and diamonds
  function updateRocks(dt) {
    rockFallCooldownRef.current -= dt;
    if (rockFallCooldownRef.current > 0) return;
    rockFallCooldownRef.current = ROCK_FALL_INTERVAL;
    const grid = gridRef.current;
    for (let y = rows - 2; y >= 1; y--) {
      for (let x = 1; x < cols - 1; x++) {
        const id = index(x, y);
        if (grid[id] !== TILE.ROCK && grid[id] !== TILE.DIAMOND) continue;
        const isDiamond = grid[id] === TILE.DIAMOND;
        const belowId = index(x, y + 1);
        const belowBelowId = index(x, y + 2);
        if (grid[belowId] === TILE.EMPTY) {
          grid[belowId] = grid[id];
          grid[id] = TILE.EMPTY;
          markDirty(x, y);
          markDirty(x, y + 1);
          if (grid[belowBelowId] === TILE.PLAYER) playerDie();
          continue;
        }
        if (
          grid[index(x - 1, y)] === TILE.EMPTY &&
          grid[index(x - 1, y + 1)] === TILE.EMPTY &&
          (grid[belowId] === TILE.ROCK || grid[belowId] === TILE.DIAMOND) &&
          grid[belowId] !== TILE.PLAYER
        ) {
          grid[index(x - 1, y + 1)] = grid[id];
          grid[id] = TILE.EMPTY;
          markDirty(x, y);
          markDirty(x - 1, y + 1);
          if (grid[index(x - 1, y + 2)] === TILE.PLAYER) playerDie();
          continue;
        }
        if (
          grid[index(x + 1, y)] === TILE.EMPTY &&
          grid[index(x + 1, y + 1)] === TILE.EMPTY &&
          (grid[belowId] === TILE.ROCK || grid[belowId] === TILE.DIAMOND) &&
          grid[belowId] !== TILE.PLAYER
        ) {
          grid[index(x + 1, y + 1)] = grid[id];
          grid[id] = TILE.EMPTY;
          markDirty(x, y);
          markDirty(x + 1, y + 1);
          if (grid[index(x + 1, y + 2)] === TILE.PLAYER) playerDie();
          continue;
        }
      }
    }
  }

  // Player death logic
  function playerDie() {
    setLives(l => {
      const newLives = l - 1;
      if (newLives <= 0) {
        setTimeout(() => {
          setLives(3);
          createLevel();
          draw();
        }, 2000);
      }
      return newLives;
    });
    let rx = 2, ry = 2;
    const grid = gridRef.current;
    for (let y = 1; y < rows - 1; y++) {
      for (let x = 1; x < cols - 1; x++) {
        if (grid[index(x, y)] === TILE.EMPTY) {
          rx = x; ry = y;
          y = rows;
          break;
        }
      }
    }
    for (let i = 0; i < grid.length; i++) if (grid[i] === TILE.PLAYER) {
      grid[i] = TILE.EMPTY;
      markDirty(i % cols, Math.floor(i / cols));
    }
    playerRef.current.x = rx; playerRef.current.y = ry;
    grid[index(playerRef.current.x, playerRef.current.y)] = TILE.PLAYER;
    markDirty(playerRef.current.x, playerRef.current.y);
    pathRef.current = [];
    destRef.current = null;
    selectedDestRef.current = null;  // Reset selected destination on death
    isPathActiveRef.current = false;
  }

  // Step player along path (used in game loop, but overridden by double-click)
  function stepPlayer() {
    if (pathRef.current.length === 0) {
      isPathActiveRef.current = false;
      return;
    }
    const next = pathRef.current.shift();
    const grid = gridRef.current;
    const t = grid[index(next.x, next.y)];
    if (t === TILE.WALL || t === TILE.ROCK) {
      pathRef.current = [];
      destRef.current = null;
      selectedDestRef.current = null;
      isPathActiveRef.current = false;
      return;
    }
    if (t === TILE.DIAMOND) {
      setScore(s => s + 1);
      if (!grid.includes(TILE.DIAMOND)) {
        pathRef.current = [];
        destRef.current = null;
        selectedDestRef.current = null;
        isPathActiveRef.current = false;
        setTimeout(() => {
          createLevel();
          draw();
        }, 2000);
        return;
      }
    }
    grid[index(playerRef.current.x, playerRef.current.y)] = TILE.EMPTY;
    markDirty(playerRef.current.x, playerRef.current.y);
    playerRef.current.x = next.x; playerRef.current.y = next.y;
    grid[index(playerRef.current.x, playerRef.current.y)] = TILE.PLAYER;
    markDirty(playerRef.current.x, playerRef.current.y);
  }

  // Game loop
  useEffect(() => {
    let running = true;
    function tick(now) {
      if (!running) return;
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      updateRocks(dt);
      moveCooldownRef.current -= dt;
      if (moveCooldownRef.current <= 0) {
        if (isPathActiveRef.current && pathRef.current.length > 0) {
          stepPlayer();
          moveCooldownRef.current = 120;
        }
      }
      if (dirtyTilesRef.current.size > 0) {
        draw();
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    return () => { running = false; };
  }, []);

  // Redraw when score/lives change
  useEffect(() => {
    draw();
  }, [score, lives]);

  // Reset button handler
  const handleReset = () => {
    createLevel();
    draw();
    isPathActiveRef.current = false;
  };

  // Load level handler (stub)
  const handleLoadLevel = () => {
    createLevel();
    draw();
    isPathActiveRef.current = false;
  };

  return (
    <div>
      <div id="ui">
        <button id="resetBtn" onClick={handleReset}>Reset</button>
        <div>Click once to show path, click again on same spot to follow it. Arrow keys also work.</div>
        <span id="score">{score}</span>
        <div style={{ marginLeft: 'auto' }}>Lives: <span id="lives">{lives}</span></div>
        <div>
          <span>Score: <span id="score">{score}</span></span>
        </div>
        <div>Current Date/Time: 11:02 AM CEST, Thursday, September 11, 2025</div>
      </div>
      <div style={{ margin: '10px 0' }}>
        <textarea id="levelJson" rows={4} cols={60} placeholder="Paste level JSON here" value={levelJson} onChange={e => setLevelJson(e.target.value)} />
        <br />
        <button id="loadLevelBtn" onClick={handleLoadLevel}>Load Level</button>
      </div>
      <canvas id="c" ref={canvasRef}></canvas>
    </div>
  );
}