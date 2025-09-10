import React, { useEffect, useMemo, useRef, useState } from "react";

const T = {
  EMPTY: 0,
  DIRT: 1,
  WALL: 2,
  BOULDER: 3,
};

const TILE_EMOJI = {
  [T.EMPTY]: "",
  [T.DIRT]: "·",
  [T.WALL]: "█",
  [T.BOULDER]: "◉",
};

const CELL_BG = {
  [T.EMPTY]: "bg-zinc-900",
  [T.DIRT]: "bg-amber-900/40",
  [T.WALL]: "bg-zinc-800",
  [T.BOULDER]: "bg-zinc-700",
};

const GRID_W = 16;
const GRID_H = 24;

function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function cloneGrid(g) {
  return g.map((row) => row.slice());
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeLevel(seed) {
  if (seed !== undefined) Math.random = mulberry32(seed);

  let g = Array.from({ length: GRID_H }, () =>
    Array.from({ length: GRID_W }, () => T.DIRT)
  );

  // Create borders
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      if (x === 0 || y === 0 || x === GRID_W - 1 || y === GRID_H - 1) {
        g[y][x] = T.WALL;
      }
    }
  }

  // Dig random caves
  for (let i = 0; i < 6; i++) {
    let x = randInt(2, GRID_W - 3);
    let y = randInt(2, GRID_H - 3);
    const steps = randInt(80, 140);
    for (let s = 0; s < steps; s++) {
      g[y][x] = T.EMPTY;
      const dir = randInt(0, 3);
      if (dir === 0 && x < GRID_W - 2) x++;
      if (dir === 1 && x > 1) x--;
      if (dir === 2 && y < GRID_H - 2) y++;
      if (dir === 3 && y > 1) y--;
    }
  }

  // Add some boulders
  for (let y = 1; y < GRID_H - 1; y++) {
    for (let x = 1; x < GRID_W - 1; x++) {
      if (g[y][x] === T.DIRT && Math.random() < 0.12) g[y][x] = T.BOULDER;
    }
  }

  // Clear spawn area
  const spawn = { x: 2, y: 2 };
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = 0; dx < 3; dx++) {
      g[spawn.y + dy][spawn.x + dx] = T.EMPTY;
    }
  }
  return { grid: g, spawn };
}

function aStar(grid, start, goal) {
  const W = grid[0].length;
  const H = grid.length;
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const pass = (x, y) => grid[y][x] === T.EMPTY || grid[y][x] === T.DIRT;
  const h = (x, y) => Math.abs(x - goal.x) + Math.abs(y - goal.y);

  const key = (x, y) => `${x},${y}`;
  const open = new Set([key(start.x, start.y)]);
  const came = new Map();
  const gScore = new Map([[key(start.x, start.y), 0]]);
  const fScore = new Map([[key(start.x, start.y), h(start.x, start.y)]]);

  while (open.size) {
    let currentKey = "";
    let bestF = Infinity;
    for (const k of open) {
      const f = fScore.get(k) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        currentKey = k;
      }
    }
    const [cx, cy] = currentKey.split(",").map(Number);
    if (cx === goal.x && cy === goal.y) {
      const path = [];
      let ck = currentKey;
      while (ck !== key(start.x, start.y)) {
        const [px, py] = ck.split(",").map(Number);
        path.push({ x: px, y: py });
        ck = came.get(ck);
      }
      path.reverse();
      return path;
    }

    open.delete(currentKey);
    const dirs = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!inb(nx, ny) || !pass(nx, ny)) continue;
      const nk = key(nx, ny);
      const tentativeG = (gScore.get(currentKey) ?? Infinity) + 1;
      if (tentativeG < (gScore.get(nk) ?? Infinity)) {
        came.set(nk, currentKey);
        gScore.set(nk, tentativeG);
        fScore.set(nk, tentativeG + h(nx, ny));
        open.add(nk);
      }
    }
  }
  return null;
}

function App() {
  const [seed, setSeed] = useState(() => randInt(0, 1000000));
  const level = useMemo(() => makeLevel(seed), [seed]);
  const [grid, setGrid] = useState(() => cloneGrid(level.grid));
  const [player, setPlayer] = useState(level.spawn);
  const [path, setPath] = useState([]);
  const [target, setTarget] = useState(null);
  const [status, setStatus] = useState("playing");
  const loopRef = useRef(null);

  const cellPx = useResponsiveCellPx();

  // Recalculate path when target or grid changes
  useEffect(() => {
    if (!target || status !== "playing") return;
    const p = aStar(grid, player, target);
    if (p) setPath(p);
    else setPath([]);
  }, [target, grid, player, status]);

  // Main game loop
  useEffect(() => {
    if (status !== "playing") return;
    const tickMs = 120;

    function step() {
      setGrid((old) => {
        const g = cloneGrid(old);       // Read-only snapshot
        const tempGrid = cloneGrid(old); // Future state
        let newPlayer = { ...player };
        let newStatus = status;

        // --- Player Movement ---
        if (path.length) {
          const next = path[0];
          if (g[next.y][next.x] === T.EMPTY || g[next.y][next.x] === T.DIRT) {
            newPlayer = { ...next };
            if (g[next.y][next.x] === T.DIRT) tempGrid[next.y][next.x] = T.EMPTY;
            setPath((p) => p.slice(1));
          } else {
            setPath([]);
          }
        }

//         // --- Boulder Movement ---
// let playerWillBeCrushed = false;

// for (let y = GRID_H - 2; y >= 1; y--) {
//   for (let x = 1; x < GRID_W - 1; x++) {
//     if (g[y][x] === T.BOULDER) {
//       const below = g[y + 1][x];

//       // Boulder can only move into EMPTY space
//       if (below === T.EMPTY) {
        
//         // Move boulder down in tempGrid
//         tempGrid[y][x] = T.EMPTY;
//         tempGrid[y + 1][x] = T.BOULDER;

//         // ✅ Player is crushed ONLY if boulder moved INTO their current tile
//         if (newPlayer.x === x && newPlayer.y === y + 1) {
//           console.log("Boulder crushed player at", x, y + 1);
//           playerWillBeCrushed = true;
//         }
//       }
//     }
//   }
// }

  // --- Boulder Movement ---
  let playerWillBeCrushed = false;

  for (let y = GRID_H - 2; y >= 1; y--) {
    for (let x = 1; x < GRID_W - 1; x++) {
      if (g[y][x] === T.BOULDER) {
        const below = g[y + 1][x];

        // Boulder can only move into EMPTY space
        if (below === T.EMPTY) {
          // Check if the boulder's destination is the player's current position
          if (newPlayer.x === x && newPlayer.y === y + 1) {
            console.log("Boulder crushed player at", x, y + 1);
            playerWillBeCrushed = true;
          }

          // Move boulder down in tempGrid
          tempGrid[y][x] = T.EMPTY;
          tempGrid[y + 1][x] = T.BOULDER;
        }
      }
    }
  }
          if (playerWillBeCrushed) {
            newStatus = "gameover";
            setStatus("gameover");
          }

          setPlayer(newPlayer);
          return tempGrid;
        });

      loopRef.current = window.setTimeout(step, tickMs);
    }

    loopRef.current = window.setTimeout(step, tickMs);
    return () => {
      if (loopRef.current) window.clearTimeout(loopRef.current);
    };
  }, [status, player, path]);

  function clickCell(x, y) {
    if (status !== "playing") return;
    if (grid[y][x] === T.WALL || grid[y][x] === T.BOULDER) return;
    setTarget({ x, y });
  }

  function reset() {
    setGrid(cloneGrid(level.grid));
    setPlayer(level.spawn);
    setPath([]);
    setTarget(null);
    setStatus("playing");
  }

  function newLevel() {
    const s = randInt(0, 1_000_000);
    setSeed(s);
    const l = makeLevel(s);
    setGrid(cloneGrid(l.grid));
    setPlayer(l.spawn);
    setPath([]);
    setTarget(null);
    setStatus("playing");
  }

  return (
    <div className="min-h-[80vh] w-full flex items-center justify-center p-4 bg-zinc-900 text-zinc-100">
      <div className="w-full max-w-[520px]">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Boulder Tap-Path (Vite+React)</h1>
          <div className="flex gap-2">
            <button onClick={reset} className="px-3 py-1 rounded-2xl bg-zinc-700 active:scale-[0.98] shadow">
              Reset
            </button>
            <button onClick={newLevel} className="px-3 py-1 rounded-2xl bg-indigo-600 active:scale-[0.98] shadow">
              New Level
            </button>
          </div>
        </div>

        <div className="mb-2 text-sm opacity-80">
          Tap a reachable cell to auto-walk. Dig through dirt. If a boulder falls on your head → game over.
        </div>

        <div
          className="relative rounded-2xl overflow-hidden shadow-xl border border-zinc-800 bg-black"
          style={{ width: cellPx * GRID_W, height: cellPx * GRID_H }}
        >
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${GRID_W}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_H}, 1fr)`,
              width: cellPx * GRID_W,
              height: cellPx * GRID_H,
            }}
          >
            {grid.map((row, y) =>
              row.map((tile, x) => (
                <div
                  key={`${x},${y}`}
                  onClick={() => clickCell(x, y)}
                  className={`relative ${CELL_BG[tile]} border-[0.5px] border-zinc-900 active:scale-95 select-none flex items-center justify-center`}
                  style={{ width: cellPx, height: cellPx, fontSize: Math.max(10, cellPx * 0.45) }}
                >
                  {target && target.x === x && target.y === y && (
                    <div className="absolute inset-0 border-2 border-indigo-500/80 rounded" />
                  )}
                  {player.x === x && player.y === y ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="leading-none">🧑‍🚀</span>
                    </div>
                  ) : (
                    <span className="opacity-70">{TILE_EMOJI[tile]}</span>
                  )}
                </div>
              ))
            )}
          </div>

          {status === "gameover" && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">Game Over</div>
                <div className="opacity-80 mb-3">A boulder crushed you!</div>
                <button onClick={reset} className="px-4 py-2 rounded-2xl bg-red-600 shadow">
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 text-xs opacity-70">
          Prototype rules: boulders only fall straight down, no diagonal rolling yet. Pathfinding uses A* and avoids walls/rocks.
        </div>
      </div>
    </div>
  );
}

function useResponsiveCellPx() {
  const [px, setPx] = useState(22);
  useEffect(() => {
    const fn = () => {
      const vw = Math.min(window.innerWidth, 520);
      const margin = 16;
      const usable = vw - margin * 2;
      setPx(Math.floor(Math.max(18, Math.min(28, usable / GRID_W))));
    };
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return px;
}

export default App;
