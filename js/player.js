// player.js — The test subject

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 10;
    this.speed = 90;        // px/sec walking
    this.runSpeed = 160;
    this.crouchSpeed = 45;
    this.crouching = false;
    this.moving = false;
    this.vis = 0;           // 0-100 visibility meter
    this.shadow = 100;      // 0-100 shadow meter
    this.canMove = false;
  }

  update(dt, keys, lab) {
    if (!this.canMove) return;

    let dx = 0, dy = 0;
    if (keys['w'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['arrowright']) dx += 1;

    this.crouching = !!keys['s'];

    if (dx || dy) {
      const mag = Math.hypot(dx, dy);
      dx /= mag; dy /= mag;
    }

    let speed = this.speed;
    if (this.crouching) speed = this.crouchSpeed;
    else if (keys['shift']) speed = this.runSpeed;

    this.moving = (dx !== 0 || dy !== 0);

    const nx = this.x + dx * speed * dt;
    const ny = this.y + dy * speed * dt;

    // Tile-based collision
    const ts = lab.tileSize;
    const checkX = nx;
    const checkY = this.y;
    if (!this._collides(checkX, checkY, lab)) this.x = nx;

    const checkX2 = this.x;
    const checkY2 = ny;
    if (!this._collides(checkX2, checkY2, lab)) this.y = ny;
  }

  _collides(px, py, lab) {
    const ts = lab.tileSize;
    const r = this.radius;
    const corners = [
      [px - r, py - r], [px + r, py - r],
      [px - r, py + r], [px + r, py + r]
    ];
    for (const [cx, cy] of corners) {
      const tx = Math.floor(cx / ts);
      const ty = Math.floor(cy / ts);
      if (lab.isWall(tx, ty)) return true;
    }
    return false;
  }
}