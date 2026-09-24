// lab.js — The scripted laboratory room

export const TileType = {
  FLOOR: 0,
  WALL: 1,
  TABLE: 2,        // operating table (spawn)
  DESK: 3,         // keycard on top
  DOOR_LOCKED: 4,  // exit — needs keycard
  DOOR_OPEN: 5,    // exit after keycard
  GLASS: 6,        // observation window (see-through, not walk-through)
  VENT: 7          // optional hiding spot
};

// 20 x 15 hand-crafted lab
// 0 = floor, 1 = wall, 2 = table, 3 = desk, 4 = locked door, 6 = glass
export const LAB_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,6,0,0,0,0,0,0,0,0,0,6,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,1,0,0,2,2,2,2,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,1,0,0,2,2,2,2,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,1,0,0,2,2,2,2,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,6,0,0,0,0,0,0,0,0,0,6,0,0,0,1],
  [1,0,0,0,0,1,0,0,3,0,0,0,0,0,0,1,0,0,0,1],
  [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,1,1,1,1,1]
];

export const SPAWN_TILE = { x: 9, y: 6 };      // center of operating table
export const DESK_TILE = { x: 8, y: 12 };       // keycard location
export const EXIT_TILE = { x: 14, y: 14 };      // locked door at bottom
export const SCIENTIST_PATH = [
  { x: 2, y: 2 },
  { x: 2, y: 12 },
  { x: 13, y: 12 },
  { x: 13, y: 2 },
  { x: 2, y: 2 }
];

export class Lab {
  constructor() {
    // Deep copy so we can mutate
    this.map = LAB_MAP.map(row => [...row]);
    this.tileSize = 40;
    this.width = this.map[0].length;
    this.height = this.map.length;
    this.exitOpen = false;
    this.keycardTaken = false;
  }

  isWall(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return true;
    const t = this.map[ty][tx];
    return t === TileType.WALL || t === TileType.TABLE || t === TileType.DESK;
  }

  isOpaque(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.width || ty >= this.height) return true;
    const t = this.map[ty][tx];
    return t === TileType.WALL || t === TileType.TABLE || t === TileType.DESK;
  }

  openExit() {
    this.exitOpen = true;
    // Find the door tile and convert to open
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.map[y][x] === TileType.DOOR_LOCKED) {
          this.map[y][x] = TileType.DOOR_OPEN;
        }
      }
    }
  }

  takeKeycard() {
    this.keycardTaken = true;
    // Desk becomes empty floor
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.map[y][x] === TileType.DESK) {
          this.map[y][x] = TileType.FLOOR;
        }
      }
    }
  }
}