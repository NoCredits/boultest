import { getDirection, GAME_CONFIG } from './GameConstants';

const { REPEAT_INITIAL_DELAY, REPEAT_INTERVAL } = GAME_CONFIG;

export class InputHandler {
  constructor() {
    this.keysPressedRef = { current: new Set() };
    this.keyRepeatTimersRef = { current: new Map() };
    this.onMoveCallback = null;
    this.onPathClearCallback = null;
    this.onPathSelectCallback = null;
  }

  setCallbacks(onMove, onPathClear, onPathSelect) {
    this.onMoveCallback = onMove;
    this.onPathClearCallback = onPathClear;
    this.onPathSelectCallback = onPathSelect;
  }

  handleKeyDown = (e) => {
    const key = e.key;
    if (this.keysPressedRef.current.has(key)) return;
    
    this.keysPressedRef.current.add(key);

    // Handle path selection keys (Tab to cycle, number keys 1-5 for direct selection)
    if (key === 'Tab') {
      e.preventDefault();
      if (this.onPathSelectCallback) {
        this.onPathSelectCallback('cycle');
      }
      return;
    }
    
    // Handle number keys for direct path selection
    if (key >= '1' && key <= '5') {
      if (this.onPathSelectCallback) {
        this.onPathSelectCallback('select', parseInt(key) - 1);
      }
      return;
    }

    const dir = getDirection(key);
    if (!dir) return;

    // Clear pathfinding on manual movement
    if (this.onPathClearCallback) {
      this.onPathClearCallback();
    }

    // Execute first move immediately
    if (this.onMoveCallback) {
      this.onMoveCallback(key);
    }

    // Set up repeat timer
    const timer = setTimeout(() => {
      const intervalId = setInterval(() => {
        if (!this.keysPressedRef.current.has(key)) return;
        if (this.onMoveCallback) {
          this.onMoveCallback(key);
        }
      }, REPEAT_INTERVAL);
      this.keyRepeatTimersRef.current.set(key, intervalId);
    }, REPEAT_INITIAL_DELAY);

    this.keyRepeatTimersRef.current.set(key + '_initial', timer);
  }

  handleKeyUp = (e) => {
    const key = e.key;
    this.keysPressedRef.current.delete(key);

    // Clear timers
    const initialTimer = this.keyRepeatTimersRef.current.get(key + '_initial');
    if (initialTimer) {
      clearTimeout(initialTimer);
      this.keyRepeatTimersRef.current.delete(key + '_initial');
    }

    const intervalId = this.keyRepeatTimersRef.current.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.keyRepeatTimersRef.current.delete(key);
    }
  }

  cleanup() {
    // Clear all timers
    this.keyRepeatTimersRef.current.forEach(timer => {
      if (typeof timer === 'number') {
        clearInterval(timer);
      } else if (typeof timer === 'object') {
        clearTimeout(timer);
      }
    });
    this.keyRepeatTimersRef.current.clear();
    this.keysPressedRef.current.clear();
  }
}