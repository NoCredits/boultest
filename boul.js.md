# Explanation of `boul.js`

This file contains the JavaScript logic for a simple Boulder Dash-like game rendered on an HTML canvas. Here’s a breakdown of its main components and functions:

## Constants
- `TILE`: Enum for different tile types (empty, wall, dirt, rock, diamond, player).
- `TILE_COLORS`: Maps each tile type to a color for rendering.

## Canvas Setup
- Gets references to the canvas, UI elements, and sets up grid dimensions.
- Initializes the canvas size based on the grid.

## Game State
- `grid`: 1D array representing the game map.
- `player`: Object holding the player's position.
- `lives`, `dest`, `path`, `moveCooldown`, `lastTime`: Variables for game state and movement.

## Utility Functions
- `index(x, y)`: Converts 2D coordinates to 1D array index.
- `inBounds(x, y)`: Checks if coordinates are inside the grid.

## Level Creation
- `createLevel()`: Fills the grid with dirt, places walls, rocks, diamonds, and the player at the start position.

## Rendering
- `draw()`: Draws the entire grid on the canvas, coloring each tile appropriately.

## Pathfinding
- `neighbors(node)`: Returns valid neighboring tiles for movement.
- `bfsPath(start, goal)`: Breadth-first search to find a path from the player to a destination.

## Game Mechanics
- `updateRocks(dt)`: Handles rock falling and sliding logic, including player death if hit.
- `playerDie()`: Handles player death, respawn, and game over logic.
- `stepPlayer()`: Moves the player along the calculated path.

## Game Loop
- `gameTick(now)`: Main loop, updates rocks, moves player, redraws, and schedules next frame.

## Event Listeners
- Canvas pointer: Sets destination and calculates path on click/touch.
- Keyboard: Moves player with arrow keys.
- Reset button: Resets the level and lives.

---
This structure keeps the game logic modular and easy to follow. Each function has a clear responsibility, making it simple to extend or modify the game.
