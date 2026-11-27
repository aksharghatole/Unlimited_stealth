// render.js — Canvas rendering with fog of war

import { TileType } from './lab.js';

const TILE_COLORS = {
  [TileType.FLOOR]:        '#1a1a1a',
  [TileType.WALL]:         '#2a2a3a',
  [TileType.TABLE]:        '#4a4a5a',
  [TileType.DESK]:         '#5a4a3a',
  [TileType.DOOR_LOCKED]:  '#3a1a1a',
  [TileType.DOOR_OPEN]:    '#1a3a1a',
  [TileType.GLASS]:        'rgba(100, 180, 220, 0.15)',
  [TileType.VENT]:         '#222'
};

export function render(ctx, state) {
  const { lab, player, canvas, effects } = state;
  const actors = [...(state.scientist ? [state.scientist] : []), ...(state.guards || [])];
  const ts = lab.tileSize;

  // Camera follows player, clamped to map
  const camX = player.x - canvas.width / 2;
  const camY = player.y - canvas.height / 2;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw tiles with distance-based lighting (fog of war)
  for (let y = 0; y < lab.height; y++) {
    for (let x = 0; x < lab.width; x++) {
      const tx = x * ts - camX;
      const ty = y * ts - camY;

      if (tx + ts < 0 || ty + ts < 0 || tx > canvas.width || ty > canvas.height) continue;

      const t = lab.map[y][x];
      const distToPlayer = Math.hypot(
        (x * ts + ts / 2) - player.x,
        (y * ts + ts / 2) - player.y
      );

      // Visibility radius — fades with distance
      const visibility = Math.max(0, 1 - distToPlayer / 280);
      if (visibility <= 0.01 && t !== TileType.GLASS) continue;

      ctx.globalAlpha = Math.max(0.08, visibility);
      ctx.fillStyle = TILE_COLORS[t] || '#000';
      ctx.fillRect(tx, ty, ts, ts);

      // Slight grid outline
      ctx.globalAlpha = visibility * 0.15;
      ctx.strokeStyle = '#0f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx + 0.5, ty + 0.5, ts - 1, ts - 1);
    }
  }

  ctx.globalAlpha = 1;

  // Glow around operating table during intro
  if (state.introStep === 'AWAKE' || state.introStep === 'RESTRAINTS') {
    const tableX = 9 * ts + ts * 2 - camX; // center of table
    const tableY = 6 * ts + ts * 1.5 - camY;
    const grad = ctx.createRadialGradient(tableX, tableY, 0, tableX, tableY, 200);
    grad.addColorStop(0, 'rgba(180, 220, 255, 0.25)');
    grad.addColorStop(1, 'rgba(180, 220, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Scientist
  for (const scientist of actors) {
    const sx = scientist.x - camX;
    const sy = scientist.y - camY;
    const dist = Math.hypot(scientist.x - player.x, scientist.y - player.y);
    if (dist < 320) {
      ctx.globalAlpha = Math.max(0.15, 1 - dist / 320);

      // Vision cone
      ctx.fillStyle = 'rgba(255, 200, 100, 0.08)';
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.arc(sx, sy, 220, scientist.heading - 0.6, scientist.heading + 0.6);
      ctx.closePath();
      ctx.fill();

      // Body
      ctx.fillStyle = scientist.isGuard ? '#b86d4e' : '#e8e8f0';
      ctx.beginPath();
      ctx.arc(sx, sy, 9, 0, Math.PI * 2);
      ctx.fill();

      // Helmet visor
      ctx.fillStyle = scientist.isGuard ? '#ffb16c' : '#88ccff';
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 1;
    }
  }

  // Objective markers: local only, so exploring the facility still matters.
  if (lab.card && !lab.keycardTaken) {
    const x = (lab.card.x + .5) * ts, y = (lab.card.y + .5) * ts;
    if (Math.hypot(x - player.x, y - player.y) < 230) {
      ctx.fillStyle = '#ffc66b';
      ctx.fillRect(x - camX - 9, y - camY - 5, 18, 10);
      ctx.fillStyle = '#372516';
      ctx.fillRect(x - camX - 5, y - camY - 2, 5, 4);
      ctx.fillStyle = '#ffc66b';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('ACCESS CARD', x-camX, y-camY-12);
      ctx.textAlign = 'start';
    }
  }
  if (lab.exit) {
    const x = (lab.exit.x + .5) * ts, y = (lab.exit.y + .5) * ts;
    if (Math.hypot(x-player.x,y-player.y)<250) {
      ctx.strokeStyle = lab.exitOpen ? '#59ffb2' : '#c95f55';
      ctx.lineWidth = 2;
      ctx.strokeRect(x-camX-14,y-camY-14,28,28);
      ctx.fillStyle = ctx.strokeStyle;
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(lab.exitOpen ? 'ELEVATOR' : 'LOCKED', x-camX,y-camY-21);
      ctx.textAlign = 'start';
    }
  }

  // Player
  const px = player.x - camX;
  const py = player.y - camY;
  const glow = player.vis / 100;

  // Shadow aura (green)
  const auraGrad = ctx.createRadialGradient(px, py, 0, px, py, 30 + glow * 30);
  auraGrad.addColorStop(0, `rgba(0, 255, 120, ${0.4 - glow * 0.2})`);
  auraGrad.addColorStop(1, 'rgba(0, 255, 120, 0)');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(px, py, 30 + glow * 30, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = player.crouching ? '#0a5' : '#0f8';
  ctx.beginPath();
  ctx.arc(px, py, player.crouching ? 6 : 9, 0, Math.PI * 2);
  ctx.fill();

  // Direction indicator
  ctx.strokeStyle = '#aff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, 13, 0, Math.PI * 2);
  ctx.stroke();

  // Crouch indicator
  if (player.crouching) {
    ctx.fillStyle = '#0f0';
    ctx.font = '10px monospace';
    ctx.fillText('[CROUCH]', px - 22, py - 18);
  }

  // Apply blur overlay
  if (effects.blur > 0) {
    // We use CSS backdrop-filter via a DOM overlay instead — see main.js
  }

  return { camX, camY, ts };
}