// Player.js
export class Player {
  constructor(spawn) {
    this.position = { ...spawn };
  }
  moveTo(pos) {
    this.position = { ...pos };
  }
}
