// scientist.js — The first NPC you encounter

export class Scientist {
  constructor(path) {
    this.path = path;
    this.pathIndex = 0;
    this.x = path[0].x * 40 + 20;
    this.y = path[0].y * 40 + 20;
    this.speed = 50;
    this.state = 'PATROL'; // PATROL | ALERT
    this.radius = 10;
    this.pauseTimer = 0;
  }

  update(dt) {
    if (this.state === 'PATROL' && this.pauseTimer > 0) {
      this.pauseTimer -= dt;
      return;
    }

    const target = this.path[this.pathIndex];
    if (!target) return;

    const tx = target.x * 40 + 20;
    const ty = target.y * 40 + 20;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 2) {
      this.pathIndex = (this.pathIndex + 1) % this.path.length;
      this.pauseTimer = 0.8; // pause at each waypoint
      return;
    }

    this.x += (dx / dist) * this.speed * dt;
    this.y += (dy / dist) * this.speed * dt;
  }

  // Called each frame with player position
  canSee(player, lab) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 220) return false;

    // Line of sight check
    const steps = Math.ceil(dist / 20);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const sx = this.x + dx * t;
      const sy = this.y + dy * t;
      const tx = Math.floor(sx / 40);
      const ty = Math.floor(sy / 40);
      if (lab.isOpaque(tx, ty)) return false;
    }
    return true;
  }
}