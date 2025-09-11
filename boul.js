let moveDir = null;
let moveInterval = null;
const TILE = { EMPTY: 0, WALL: 1, DIRT: 2, ROCK: 3, DIAMOND: 4, PLAYER: 5 };
const TILE_COLORS = { [TILE.EMPTY]: '#000', [TILE.WALL]: '#444', [TILE.DIRT]: '#8b5a2b', [TILE.ROCK]: '#888', [TILE.DIAMOND]: '#0ff', [TILE.PLAYER]: '#ff0' };
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const livesEl = document.getElementById('lives');
let tileSize = 40, cols = 28, rows = 20;
canvas.width = cols * tileSize; canvas.height = rows * tileSize;
let grid = [], player = { x: 2, y: 2 }, lives = 3, dest = null, path = [], moveCooldown = 0, lastTime = performance.now();
let rockFallCooldown = 0;
const ROCK_FALL_INTERVAL = 100; // ms between rock falls
let score = 0;
let dirtyTiles = new Set(); // For optimized rendering

function index(x, y) { return y * cols + x }
function inBounds(x, y) { return x >= 0 && y >= 0 && x < cols && y < rows }
function markDirty(x, y) { if (inBounds(x, y)) dirtyTiles.add(index(x, y)); }

function createLevel() {
    grid = new Array(cols * rows).fill(TILE.DIRT);
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
    player.x = 2; player.y = 2; 
    grid[index(player.x, player.y)] = TILE.PLAYER;
    markDirty(player.x, player.y);
    score = 0;
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = score;
    lives = 3;
    if (livesEl) livesEl.textContent = lives;
}

function loadLevel(json) {
    try {
        const data = JSON.parse(json);
        if (!Array.isArray(data.grid) || typeof data.player !== 'object') throw new Error('Invalid level format');
        let newRows = data.grid.length;
        let newCols = Array.isArray(data.grid[0]) ? data.grid[0].length : Math.sqrt(data.grid.length);
        if (!Number.isInteger(newCols) || newCols < 1 || newRows < 1) throw new Error('Invalid grid dimensions');
        rows = newRows;
        cols = newCols;
        if (typeof data.tileSize === 'number' && data.tileSize > 0) {
            tileSize = data.tileSize;
        }
        canvas.width = cols * tileSize;
        canvas.height = rows * tileSize;
        if (Array.isArray(data.grid[0])) {
            grid = data.grid.flat();
        } else {
            grid = data.grid.slice();
        }
        player.x = data.player.x;
        player.y = data.player.y;
        lives = data.lives ?? 3;
        score = data.score ?? 0;
        grid[index(player.x, player.y)] = TILE.PLAYER;
        dirtyTiles.clear();
        for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) markDirty(x, y);
        draw();
        if (document.getElementById('score')) document.getElementById('score').textContent = score;
        if (livesEl) livesEl.textContent = lives;
    } catch (e) {
        alert('Failed to load level: ' + e.message);
    }
}

function saveLevel() {
    const levelData = {
        grid: grid.slice(),
        player: { x: player.x, y: player.y },
        lives: lives,
        score: score,
        tileSize: tileSize
    };
    const json = JSON.stringify(levelData);
    navigator.clipboard.writeText(json).then(() => alert('Level copied to clipboard!'));
}

function draw() {
    if (dirtyTiles.size === 0 && path.length === 0) return;
    dirtyTiles.forEach(i => {
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
    dirtyTiles.clear();
}

function neighbors(node) {
    const n = []; const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const d of dirs) {
        const nx = node.x + d[0], ny = node.y + d[1]; 
        if (!inBounds(nx, ny)) continue;
        const t = grid[index(nx, ny)]; 
        if (t !== TILE.WALL && t !== TILE.ROCK) n.push({ x: nx, y: ny });
    }
    return n;
}

function bfsPath(start, goal) {
    const q = [start], key = p => p.x + "," + p.y, parent = new Map(); 
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

function updateRocks(dt) {
    rockFallCooldown -= dt;
    if (rockFallCooldown > 0) return;
    rockFallCooldown = ROCK_FALL_INTERVAL;
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
                if (grid[belowBelowId] === TILE.PLAYER) { playerDie(); }
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
                if (grid[index(x - 1, y + 2)] === TILE.PLAYER) { playerDie(); }
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
                if (grid[index(x + 1, y + 2)] === TILE.PLAYER) { playerDie(); }
                continue;
            }
        }
    }
}

function playerDie() {
    lives -= 1; 
    if (livesEl) livesEl.textContent = lives;
    let rx = 2, ry = 2;
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
    player.x = rx; player.y = ry; 
    grid[index(player.x, player.y)] = TILE.PLAYER; 
    markDirty(player.x, player.y);
    path = []; 
    dest = null;
    if (lives <= 0) {
        if (moveInterval) clearInterval(moveInterval);
        moveInterval = null;
        moveDir = null;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
        setTimeout(() => {
            lives = 3;
            if (livesEl) livesEl.textContent = lives;
            createLevel();
            draw();
        }, 2000);
    }
}

function stepPlayer() {
    if (path.length === 0) return;
    const next = path.shift();
    const t = grid[index(next.x, next.y)];
    if (t === TILE.WALL || t === TILE.ROCK) { 
        path = []; 
        dest = null; 
        return; 
    }
    if (t === TILE.DIAMOND) {
        score++;
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = score;
        if (!grid.includes(TILE.DIAMOND)) {
            path = [];
            dest = null;
            if (moveInterval) clearInterval(moveInterval);
            moveInterval = null;
            moveDir = null;
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Level Complete! Score: ' + score, canvas.width / 2, canvas.height / 2);
            setTimeout(() => {
                createLevel();
                draw();
            }, 2000);
            return;
        }
    }
    grid[index(player.x, player.y)] = TILE.EMPTY;
    markDirty(player.x, player.y);
    player.x = next.x; player.y = next.y;
    grid[index(player.x, player.y)] = TILE.PLAYER;
    markDirty(player.x, player.y);
}

function gameTick(now) {
    const dt = now - lastTime; 
    lastTime = now;
    updateRocks(dt);
    moveCooldown -= dt;
    if (moveCooldown <= 0) { 
        if (path.length > 0) { 
            stepPlayer(); 
            moveCooldown = 120; 
        } 
    }
    draw();
    requestAnimationFrame(gameTick);
}

createLevel();
draw();
requestAnimationFrame(gameTick);

canvas.addEventListener('pointerdown', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const gx = Math.floor((ev.clientX - rect.left) / tileSize), gy = Math.floor((ev.clientY - rect.top) / tileSize);
    if (!inBounds(gx, gy)) return;
    const clickedTile = grid[index(gx, gy)];
    if (clickedTile === TILE.ROCK) {
        const dx = gx - player.x;
        const dy = gy - player.y;
        if ((Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0)) {
            const pushX = gx + dx;
            const pushY = gy + dy;
            if (inBounds(pushX, pushY) && grid[index(pushX, pushY)] === TILE.EMPTY) {
                grid[index(pushX, pushY)] = TILE.ROCK;
                grid[index(gx, gy)] = TILE.EMPTY;
                markDirty(gx, gy);
                markDirty(pushX, pushY);
                updateRocks(0); // Check for falling rocks
            }
        }
    } else {
        dest = { x: gx, y: gy };
        path = bfsPath(player, dest);
    }
});

window.addEventListener('keydown', (e) => {
    if (moveInterval) return;
    let dir = null;
    if (e.key === 'ArrowUp' || e.key === 'w') { dir = { x: 0, y: -1 }; }
    else if (e.key === 'ArrowDown' || e.key === 's') { dir = { x: 0, y: 1 }; }
    else if (e.key === 'ArrowLeft' || e.key === 'a') { dir = { x: -1, y: 0 }; }
    else if (e.key === 'ArrowRight' || e.key === 'd') { dir = { x: 1, y: 0 }; }
    if (dir) {
        path = []; // Clear pathfinding
        dest = null;
        moveDir = dir;
        function doMove() {
            const tx = player.x + moveDir.x;
            const ty = player.y + moveDir.y;
            if (!inBounds(tx, ty)) return;
            const targetTile = grid[index(tx, ty)];
            if (targetTile === TILE.WALL || targetTile === TILE.ROCK) {
                if (targetTile === TILE.ROCK && moveDir.x !== 0 && moveDir.y === 0) {
                    const pushX = tx + moveDir.x;
                    const pushY = ty;
                    if (inBounds(pushX, pushY) && grid[index(pushX, pushY)] === TILE.EMPTY) {
                        grid[index(pushX, pushY)] = TILE.ROCK;
                        grid[index(tx, ty)] = TILE.EMPTY;
                        grid[index(player.x, player.y)] = TILE.EMPTY;
                        player.x = tx; player.y = ty;
                        grid[index(player.x, player.y)] = TILE.PLAYER;
                        markDirty(pushX, pushY);
                        markDirty(tx, ty);
                        markDirty(player.x - moveDir.x, player.y);
                        updateRocks(0);
                    }
                }
                return;
            }
            if (targetTile === TILE.DIAMOND) {
                score++;
                const scoreEl = document.getElementById('score');
                if (scoreEl) scoreEl.textContent = score;
                if (!grid.includes(TILE.DIAMOND)) {
                    clearInterval(moveInterval);
                    moveInterval = null;
                    moveDir = null;
                    ctx.fillStyle = 'rgba(0,0,0,0.7)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = 'white';
                    ctx.font = '48px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('Level Complete! Score: ' + score, canvas.width / 2, canvas.height / 2);
                    setTimeout(() => {
                        createLevel();
                        draw();
                    }, 2000);
                    return;
                }
            }
            grid[index(player.x, player.y)] = TILE.EMPTY;
            markDirty(player.x, player.y);
            player.x = tx; player.y = ty;
            grid[index(player.x, player.y)] = TILE.PLAYER;
            markDirty(player.x, player.y);
            draw();
        }
        doMove();
        moveInterval = setInterval(doMove, 120);
    }
});

window.addEventListener('keyup', (e) => {
    if (moveInterval) {
        clearInterval(moveInterval);
        moveInterval = null;
        moveDir = null;
    }
});

resetBtn.addEventListener('click', () => {
    lives = 3;
    if (livesEl) livesEl.textContent = lives;
    path = [];
    dest = null;
    if (moveInterval) clearInterval(moveInterval);
    moveInterval = null;
    moveDir = null;
    createLevel();
    draw();
});

document.getElementById('saveBtn').addEventListener('click', saveLevel);