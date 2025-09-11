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

    // Helper functions
    function index(x, y) { return y * cols + x; }
    function inBounds(x, y) { return x >= 0 && y >= 0 && x < cols && y < rows; }
    function markDirty(x, y) { if (inBounds(x, y)) dirtyTilesRef.current.add(index(x, y)); }

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

        // In createLevel(), after gridRef.current = grid;
        dirtyTilesRef.current.clear();  // Reset to avoid duplicates
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                markDirty(x, y);
            }
        }
        setScore(0);
        setLives(3);
        //draw();  
    }

    function draw() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const grid = gridRef.current;
        const dirtyTiles = dirtyTilesRef.current;
        const path = window.path || [];

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw all tiles if no dirty tiles or path, otherwise just dirty ones
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
        // Do not clear dirtyTiles here to allow persistent rendering
    }

    // Initial setup and input listeners
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = cols * tileSize;
        canvas.height = rows * tileSize;
        createLevel();

        // Keyboard input
        function handleKeyDown(e) {
            const player = playerRef.current;
            let dx = 0, dy = 0;
            if (e.key === 'ArrowUp') dy = -1;
            else if (e.key === 'ArrowDown') dy = 1;
            else if (e.key === 'ArrowLeft') dx = -1;
            else if (e.key === 'ArrowRight') dx = 1;
            if (dx !== 0 || dy !== 0) {
                const nx = player.x + dx, ny = player.y + dy;
                const targetTile =  gridRef.current[index(nx, ny)];
                if (inBounds(nx, ny)) {
                    if ( targetTile === TILE.EMPTY || targetTile === TILE.DIRT ) {
                        gridRef.current[index(player.x, player.y)] = TILE.EMPTY;
                        player.x = nx; player.y = ny;
                        gridRef.current[index(player.x, player.y)] = TILE.PLAYER;
                        markDirty(player.x, player.y);  // Old position
                        markDirty(nx, ny);             // New position
                        draw();
                    }
                    if ( targetTile === TILE.DIAMOND  ) {
                        gridRef.current[index(player.x, player.y)] = TILE.EMPTY;
                        player.x = nx; player.y = ny;
                        gridRef.current[index(player.x, player.y)] = TILE.PLAYER;
                        markDirty(player.x, player.y);  // Old position
                        markDirty(nx, ny);             // New position
                        draw();
                    }
                    if ( targetTile == TILE.ROCK && dx !== 0 && dy === 0) {
                        const pushX = nx + dx;
                        const pushY = ny + dy;
                        if (inBounds(pushX, pushY) &&  gridRef.current[index(pushX, pushY)] === TILE.EMPTY) {
                            gridRef.current[index(pushX, pushY)] = TILE.ROCK;
                            gridRef.current[index(player.x, player.y)] = TILE.EMPTY;
                            player.x = nx; player.y = ny;
                            gridRef.current[index(player.x, player.y)] = TILE.PLAYER;
                            markDirty(pushX, pushY);  // new rock position
                            markDirty(player.x, player.y);  // Old position
                            markDirty(nx, ny);             // New position
                            draw();
                        }
                    }
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown);

        // function handleCanvasClick(e) {
        //     const rect = canvas.getBoundingClientRect();
        //     const x = Math.floor((e.clientX - rect.left) / tileSize);
        //     const y = Math.floor((e.clientY - rect.top) / tileSize);
        //     if (inBounds(x, y) && gridRef.current[index(x, y)] !== TILE.WALL) {
        //         const player = playerRef.current;
        //         gridRef.current[index(player.x, player.y)] = TILE.EMPTY;
        //         player.x = x; player.y = y;
        //         gridRef.current[index(player.x, player.y)] = TILE.PLAYER;
        //         markDirty(player.x, player.y);  // Old position
        //         markDirty(x, y);               // New position
        //         draw();
        //     }
        // }
        // Update the handleCanvasClick in the first useEffect
function handleCanvasClick(e) {
  e.preventDefault(); // Prevent default for pointerdown
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
        updateRocks(0); // Check for falling rocks
        draw();
      }
    }
  } else {
    destRef.current = { x: gx, y: gy };
    pathRef.current = bfsPath(playerRef.current, destRef.current);
    // If you want immediate movement to the clicked tile (like original non-path version), uncomment below:
    // gridRef.current[index(player.x, player.y)] = TILE.EMPTY;
    // player.x = gx; player.y = gy;
    // gridRef.current[index(player.x, player.y)] = TILE.PLAYER;
    // markDirty(player.x, player.y);  // Old position (but since we set it after, adjust if needed)
    // markDirty(gx, gy);               // New position
    // draw();
  }
  draw(); // Always draw after handling
}
        canvas.addEventListener('click', handleCanvasClick);

        // Cleanup
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            canvas.removeEventListener('click', handleCanvasClick);
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
// Add these functions after the helper functions (index, inBounds, markDirty) and before createLevel

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
    // Player death logic
    function playerDie() {
        setLives(l => l - 1);
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
        if (lives - 1 <= 0) {
            // Game over
            setTimeout(() => {
                setLives(3);
                createLevel();
                draw();
            }, 2000);
        }
    }

    // Step player along path
    function stepPlayer() {
        if (pathRef.current.length === 0) return;
        const next = pathRef.current.shift();
        const grid = gridRef.current;
        const t = grid[index(next.x, next.y)];
        if (t === TILE.WALL || t === TILE.ROCK) {
            pathRef.current = [];
            destRef.current = null;
            return;
        }
        if (t === TILE.DIAMOND) {
            setScore(s => s + 1);
            if (!grid.includes(TILE.DIAMOND)) {
                pathRef.current = [];
                destRef.current = null;
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
                if (pathRef.current.length > 0) {
                    stepPlayer();
                    moveCooldownRef.current = 120;
                }
            }
            draw();
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
    };

    // Load level handler (stub)
    const handleLoadLevel = () => {
        // You can parse levelJson and update gridRef.current here
        // For now, just reset
        createLevel();
        draw();
    };

    return (
        <div>
            <div id="ui">
                <button id="resetBtn" onClick={handleReset}>Reset</button>
                <div>Touch/click anywhere on canvas to move there. Arrow keys also work.</div>
                <span id="score">{score}</span>
                <div style={{ marginLeft: 'auto' }}>Lives: <span id="lives">{lives}</span></div>
                <div>
                    <span>Score: <span id="score">{score}</span></span>
                </div>
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
