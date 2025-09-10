let moveDir = null;
let moveInterval = null;
const TILE = { EMPTY: 0, WALL: 1, DIRT: 2, ROCK: 3, DIAMOND: 4, PLAYER: 5 };
const TILE_COLORS = { [TILE.EMPTY]: '#000', [TILE.WALL]: '#444', [TILE.DIRT]: '#8b5a2b', [TILE.ROCK]: '#888', [TILE.DIAMOND]: '#0ff', [TILE.PLAYER]: '#ff0' };
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const resetBtn = document.getElementById('resetBtn');
const livesEl = document.getElementById('lives');
let tileSize = 24, cols = 28, rows = 20;
canvas.width = cols * tileSize; canvas.height = rows * tileSize;
let grid = [], player = { x: 2, y: 2 }, lives = 3, dest = null, path = [], moveCooldown = 0, lastTime = performance.now();
let keyMoveCooldown = 0;
let keyPressed = {};
let rockFallCooldown = 0;
const ROCK_FALL_INTERVAL = 100; // ms between rock falls
let score = 0;
function index(x, y) { return y * cols + x }
function inBounds(x, y) { return x >= 0 && y >= 0 && x < cols && y < rows }
function createLevel() {
    grid = new Array(cols * rows).fill(TILE.DIRT);
    for (let x = 0; x < cols; x++) { grid[index(x, 0)] = TILE.WALL; grid[index(x, rows - 1)] = TILE.WALL; }
    for (let y = 0; y < rows; y++) { grid[index(0, y)] = TILE.WALL; grid[index(cols - 1, y)] = TILE.WALL; }
    for (let y = 2; y < rows - 2; y++) {
        for (let x = 2; x < cols - 2; x++) {
            grid[index(x, y)] = Math.random() < 0.12 ? TILE.EMPTY : TILE.DIRT;
            if (Math.random() < 0.08    ) grid[index(x, y)] = TILE.ROCK;
            if (Math.random() < 0.01) grid[index(x, y)] = TILE.DIAMOND;
        }
    }
    for (let i = 0; i < 10; i++) {
        let wx = 4 + Math.floor(Math.random() * (cols - 8)), wy = 3 + Math.floor(Math.random() * (rows - 6));
        grid[index(wx, wy)] = TILE.WALL;
    }
    player.x = 2; player.y = 2; grid[index(player.x, player.y)] = TILE.PLAYER;
    score = 0;
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = score;
}
createLevel();
function draw() {
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
                const tile = grid[index(x, y)];
                const px = x * tileSize, py = y * tileSize;
                // Background
                if (tile === TILE.ROCK) {
                    // Draw black background for rocks
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
                // Add highlights and details
                if (tile === TILE.ROCK) {
                    // Rock: perfectly round, radial gradient and highlight
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize / 2.2, 0, 2 * Math.PI);
                    ctx.closePath();
                    const grad = ctx.createRadialGradient(px + tileSize / 2, py + tileSize / 2, 4, px + tileSize / 2, py + tileSize / 2, tileSize / 2.2);
                    grad.addColorStop(0, '#bbb');
                    grad.addColorStop(1, TILE_COLORS[TILE.ROCK]);
                    ctx.fillStyle = grad;
                    ctx.fill();
                    // Highlight
                    ctx.fillStyle = 'rgba(255,255,255,0.25)';
                    ctx.beginPath();
                    ctx.arc(px + tileSize / 2 - 5, py + tileSize / 2 - 5, 5, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.restore();
                } else if (tile === TILE.DIAMOND) {
                    // Diamond: blue gradient and sparkle
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
                    // Dirt: brown gradient
                    const grad = ctx.createLinearGradient(px, py, px + tileSize, py + tileSize);
                    grad.addColorStop(0, '#a97c50');
                    grad.addColorStop(1, TILE_COLORS[TILE.DIRT]);
                    ctx.fillStyle = grad;
                    ctx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
                } else if (tile === TILE.PLAYER) {
                    // Player: more visible humanoid (head, body, arms, legs, strong colors and outline)
                    ctx.save();
                    ctx.shadowColor = '#fff';
                    ctx.shadowBlur = 12;
                    // Head
                    ctx.fillStyle = '#ffea00';
                    ctx.strokeStyle = '#222';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(px + tileSize / 2, py + tileSize / 2 - 4, tileSize / 6, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                    // Body
                    ctx.fillStyle = '#ff9800';
                    ctx.fillRect(px + tileSize / 2 - 4, py + tileSize / 2, 8, 10);
                    ctx.strokeRect(px + tileSize / 2 - 4, py + tileSize / 2, 8, 10);
                    // Arms
                    ctx.strokeStyle = '#ff9800';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(px + tileSize / 2 - 4, py + tileSize / 2 + 4);
                    ctx.lineTo(px + tileSize / 2 - 10, py + tileSize / 2 + 10);
                    ctx.moveTo(px + tileSize / 2 + 4, py + tileSize / 2 + 4);
                    ctx.lineTo(px + tileSize / 2 + 10, py + tileSize / 2 + 10);
                    ctx.stroke();
                    // Legs
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
                    // Wall: dark gray with highlight
                    ctx.fillStyle = '#333';
                    ctx.fillRect(px + 1, py + 1, tileSize - 2, tileSize - 2);
                    ctx.fillStyle = '#666';
                    ctx.fillRect(px + 1, py + 1, tileSize - 2, 6);
                }
                // Grid lines
                ctx.strokeStyle = 'rgba(0,0,0,0.08)';
                ctx.strokeRect(px, py, tileSize, tileSize);
        }
    }
}
function neighbors(node) {
    const n = []; const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const d of dirs) {
        const nx = node.x + d[0], ny = node.y + d[1]; if (!inBounds(nx, ny)) continue;
        const t = grid[index(nx, ny)]; if (t !== TILE.WALL && t !== TILE.ROCK) n.push({ x: nx, y: ny });
    }
    return n;
}
function bfsPath(start, goal) {
    const q = [start], key = p => p.x + "," + p.y, parent = new Map(); parent.set(key(start), null);
    while (q.length) {
        const cur = q.shift(); if (cur.x === goal.x && cur.y === goal.y) break;
        for (const n of neighbors(cur)) { const k = key(n); if (!parent.has(k)) { parent.set(k, cur); q.push(n); } }
    }
    const goalKey = key(goal); if (!parent.has(goalKey)) return [];
    const path = []; let curKey = goalKey, cur = goal;
    while (cur) { path.push({ x: cur.x, y: cur.y }); cur = parent.get(curKey); if (cur) curKey = cur.x + "," + cur.y; }
    path.reverse(); if (path.length > 0 && path[0].x === start.x && path[0].y === start.y) path.shift(); return path;
}
function updateRocks(dt) {
    // Slow down rock falling using cooldown
    rockFallCooldown -= dt;
    if (rockFallCooldown > 0) return;
    rockFallCooldown = ROCK_FALL_INTERVAL;
    // Classic Boulder Dash rock/diamond falling logic with sideways movement
    for (let y = rows - 2; y >= 1; y--) {
        for (let x = 1; x < cols - 1; x++) {
            const id = index(x, y);
            if (grid[id] !== TILE.ROCK && grid[id] !== TILE.DIAMOND) continue;
            const isDiamond = grid[id] === TILE.DIAMOND;
            const belowId = index(x, y + 1);
            const belowBelowId = index(x, y + 2);
            // Fall straight down
            if (grid[belowId] === TILE.EMPTY) {
                grid[belowId] = grid[id];
                grid[id] = TILE.EMPTY;
                if (grid[belowBelowId] === TILE.PLAYER) { playerDie(); }
                continue;
            }
            // Fall left (only if supported by rock or diamond)
            if (
                grid[index(x-1, y)] === TILE.EMPTY &&
                grid[index(x-1, y+1)] === TILE.EMPTY &&
                (grid[belowId] === TILE.ROCK || grid[belowId] === TILE.DIAMOND) &&
                grid[belowId] !== TILE.PLAYER
            ) {
                grid[index(x-1, y+1)] = grid[id];
                grid[id] = TILE.EMPTY;
                if (grid[index(x-1, y+2)] === TILE.PLAYER) { playerDie(); }
                continue;
            }
            // Fall right (only if supported by rock or diamond)
            if (
                grid[index(x+1, y)] === TILE.EMPTY &&
                grid[index(x+1, y+1)] === TILE.EMPTY &&
                (grid[belowId] === TILE.ROCK || grid[belowId] === TILE.DIAMOND) &&
                grid[belowId] !== TILE.PLAYER
            ) {
                grid[index(x+1, y+1)] = grid[id];
                grid[id] = TILE.EMPTY;
                if (grid[index(x+1, y+2)] === TILE.PLAYER) { playerDie(); }
                continue;
            }
        }
    }
}
function playerDie() {
    lives -= 1; livesEl.textContent = lives;
    let rx = 2, ry = 2;
    for (let y = 1; y < rows - 1; y++) { for (let x = 1; x < cols - 1; x++) { if (grid[index(x, y)] === TILE.EMPTY) { rx = x; ry = y; y = rows; break; } } }
    for (let i = 0; i < grid.length; i++) if (grid[i] === TILE.PLAYER) grid[i] = TILE.EMPTY;
    player.x = rx; player.y = ry; grid[index(player.x, player.y)] = TILE.PLAYER; path = []; dest = null;
    if (lives <= 0) {
        if (moveInterval) clearInterval(moveInterval);
        moveInterval = null;
        moveDir = null;
        alert('Game Over'); lives = 3; livesEl.textContent = lives; createLevel();
    }
}
function stepPlayer() {
    if (path.length === 0) return;
    const next = path.shift();
    const t = grid[index(next.x, next.y)];
    if (t === TILE.WALL || t === TILE.ROCK) { path = []; dest = null; return; }
    // Collect diamond and increment score
    if (t === TILE.DIAMOND) {
        score++;
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = score;
    }
    grid[index(player.x, player.y)] = TILE.EMPTY;
    player.x = next.x; player.y = next.y;
    grid[index(player.x, player.y)] = TILE.PLAYER;
}
function gameTick(now) {
    const dt = now - lastTime; lastTime = now;

    updateRocks(dt); // rocks fall first

    moveCooldown -= dt;
    keyMoveCooldown -= dt;
    if (moveCooldown <= 0) { if (path.length > 0) { stepPlayer(); moveCooldown = 120; } }

    draw();
    requestAnimationFrame(gameTick);
}

requestAnimationFrame(gameTick);
canvas.addEventListener('pointerdown', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const gx = Math.floor((ev.clientX - rect.left) / tileSize), gy = Math.floor((ev.clientY - rect.top) / tileSize);
    if (!inBounds(gx, gy)) return;
    const clickedTile = grid[index(gx, gy)];
    // Check if clicked tile is a boulder and player is adjacent
    if (clickedTile === TILE.ROCK) {
        const dx = gx - player.x;
        const dy = gy - player.y;
        // Only allow push if adjacent (not diagonal)
        if ((Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0)) {
            // Determine push direction
            const pushX = gx + dx;
            const pushY = gy + dy;
            if (inBounds(pushX, pushY) && grid[index(pushX, pushY)] === TILE.EMPTY) {
                // Move the rock
                grid[index(pushX, pushY)] = TILE.ROCK;
                grid[index(gx, gy)] = TILE.EMPTY;
            }
        }
    } else {
        // Find path to clicked empty tile
        dest = { x: gx, y: gy };
        path = bfsPath(player, dest);
    }
});
window.addEventListener('keydown', (e) => {
    if (moveDir !== null) return;
    if (e.key === 'ArrowUp' || e.key === 'w') { moveDir = { x: 0, y: -1 }; }
    else if (e.key === 'ArrowDown' || e.key === 's') { moveDir = { x: 0, y: 1 }; }
    else if (e.key === 'ArrowLeft' || e.key === 'a') { moveDir = { x: -1, y: 0 }; }
    else if (e.key === 'ArrowRight' || e.key === 'd') { moveDir = { x: 1, y: 0 }; }
    if (moveDir !== null) {
        const tx = player.x + moveDir.x;
        const ty = player.y + moveDir.y;
        const targetTile = grid[index(tx, ty)];
        // Key push logic: only allow pushing rocks horizontally
        if (
            (moveDir.x !== 0 && moveDir.y === 0) && // horizontal move
            targetTile === TILE.ROCK
        ) {
            const pushX = tx + moveDir.x;
            const pushY = ty;
            if (inBounds(pushX, pushY) && grid[index(pushX, pushY)] === TILE.EMPTY) {
                // Move the rock
                grid[index(pushX, pushY)] = TILE.ROCK;
                grid[index(tx, ty)] = TILE.EMPTY;
                // Move the player
                grid[index(player.x, player.y)] = TILE.EMPTY;
                player.x = tx; player.y = ty;
                grid[index(player.x, player.y)] = TILE.PLAYER;
                path = [];
                moveDir = null;
                return;
            }
        }
        // Normal movement
        const newPath = bfsPath(player, { x: tx, y: ty });
        if (newPath.length > 0) {
            path = newPath;
            moveDir = null;
        } else {
            moveDir = null;
        }
    }
});
resetBtn.addEventListener('click', () => { location.reload(); });
