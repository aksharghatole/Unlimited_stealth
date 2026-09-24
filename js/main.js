// main.js — Game loop and state

import { IntroDirector, IntroState } from './intro.js';
import { Lab, SPAWN_TILE, DESK_TILE, EXIT_TILE, SCIENTIST_PATH } from './lab.js';
import { Player } from './player.js';
import { Scientist } from './scientist.js';
import { AudioEngine } from './audio.js';
import { render } from './render.js';

// --- Setup ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const subtitleEl = document.getElementById('subtitle-text');
const subtitleBox = document.getElementById('subtitle-box');
const objectiveEl = document.getElementById('objective-text');
const objectiveBox = document.getElementById('objective-box');
const floorEl = document.getElementById('hud-floor');
const visEl = document.getElementById('hud-vis');
const shadowEl = document.getElementById('hud-shadow');
const vignetteEl = document.getElementById('vignette');
const blurEl = document.getElementById('blur-overlay');

const director = new IntroDirector();
const audio = new AudioEngine();
const lab = new Lab();
const player = new Player(
  SPAWN_TILE.x * lab.tileSize + lab.tileSize / 2,
  SPAWN_TILE.y * lab.tileSize + lab.tileSize / 2
);
let scientist = null;

const keys = {};
let effects = {
  blur: 12,
  brightness: 0.9,
  heartbeat: 0.5,
  vignette: 0.7,
  canMove: false
};

// --- Input ---
document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  keys[k] = true;

  // First interaction unlocks audio context
  if (!audio.enabled) audio.init();

  // Crouch to hide
  if (k === 's' && director.currentStep()?.id === IntroState.SCIENTIST) {
    // Crouch is checked in update loop; but mark as registered
    setTimeout(() => {
      if (player.crouching) director.registerAction('hide');
    }, 200);
  }

  // Take keycard
  if (k === 'e' && director.currentStep()?.id === IntroState.KEYCARD) {
    const dx = player.x - (DESK_TILE.x * lab.tileSize + lab.tileSize / 2);
    const dy = player.y - (DESK_TILE.y * lab.tileSize + lab.tileSize / 2);
    if (Math.hypot(dx, dy) < 60) {
      lab.takeKeycard();
      audio.playBeep(1400, 0.08, 0.2);
      director.registerAction('take_keycard');
    }
  }

  // Escape key — close
  if (k === 'escape') { /* pause menu later */ }
});

document.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

let lastMouse = { x: 0, y: 0 };
document.addEventListener('mousemove', e => {
  if (director.currentStep()?.id === IntroState.RESTRAINTS) {
    if (lastMouse.x === 0 && lastMouse.y === 0) {
      lastMouse.x = e.clientX;
      lastMouse.y = e.clientY;
      return;
    }
    director.registerMouseMove(e.clientX, e.clientY);
  }
});

// --- Intro step reactions ---
director.on('onStep', ({ started, step, completed }) => {
  if (started) {
    // Update subtitle
    subtitleEl.textContent = step.subtitle || '';
    subtitleBox.style.opacity = step.subtitle ? 1 : 0;

    // Update objective
    if (step.objective) {
      objectiveEl.textContent = step.objective;
      objectiveBox.style.opacity = 1;
    } else {
      objectiveBox.style.opacity = 0;
    }

    // Apply effects
    effects = { ...effects, ...step.effects };
    applyEffects();

    // Player movement permission
    player.canMove = !!step.effects.canMove;

    // Spawn scientist at the right beat
    if (step.effects.spawnScientist && !scientist) {
      scientist = new Scientist(SCIENTIST_PATH);
    }

    // Alarm
    if (step.effects.alarm) {
      audio.playAlarm();
    }

    // Shake
    if (step.effects.shake) {
      canvas.classList.add('shake');
      setTimeout(() => canvas.classList.remove('shake'), 400);
    }

    // Danger pulse
    if (step.effects.dangerPulse) {
      document.body.classList.add('danger');
    }

    // Update floor HUD
    if (step.id === IntroState.ESCAPE) {
      floorEl.textContent = '—';
    }
  }

  if (completed === IntroState.SCIENTIST && scientist) {
    // Scientist has entered — begin leaving after a pause
    setTimeout(() => {
      scientist = null; // walks out (simplified)
    }, 3000);
  }
});

director.on('onComplete', () => {
  console.log('[UMBRA] Intro complete. Handing off to procedural generation.');
  // For now, freeze here — next module will generate floors
  subtitleEl.textContent = 'The corridor stretches ahead. The facility is vast. You are small.';
  subtitleBox.style.opacity = 1;
});

function applyEffects() {
  blurEl.style.backdropFilter = `blur(${effects.blur}px)`;
  blurEl.style.background = `rgba(0, 0, 0, ${effects.brightness * 0.3})`;
  vignetteEl.style.opacity = String(effects.vignette);
  audio.setHeartbeat(effects.heartbeat);
}

// --- Game loop ---
let last = performance.now();

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  // Update intro director
  director.update(dt);

  // Update player
  player.update(dt, keys, lab);

  // Update scientist
  if (scientist) {
    scientist.update(dt);

    // Check if scientist sees player
    if (scientist.canSee(player, lab)) {
      if (director.currentStep()?.id === IntroState.SCIENTIST) {
        // Scientist sees you — this is a failure state for now
        subtitleEl.textContent = 'The scientist locks eyes with you. "SUBJECT IS AWAKE!"';
        audio.playAlarm();
        document.body.classList.add('danger');
      }
    }
  }

  // Check exit reached
  if (director.currentStep()?.id === IntroState.ESCAPE && lab.exitOpen) {
    const dx = player.x - (EXIT_TILE.x * lab.tileSize + lab.tileSize / 2);
    const dy = player.y - (EXIT_TILE.y * lab.tileSize + lab.tileSize / 2);
    if (Math.hypot(dx, dy) < 30) {
      director.registerAction('reached_exit');
    }
  }

  // Open exit when keycard taken
  if (lab.keycardTaken && !lab.exitOpen) {
    setTimeout(() => lab.openExit(), 500);
  }

  // Visibility update (simple version)
  // Lab is bright — you're always somewhat visible
  const brightness = 1 - effects.brightness * 0.5;
  player.vis = Math.min(100, player.vis + (player.moving ? 0.4 : 0.1) * brightness);
  if (player.crouching) player.vis = Math.max(0, player.vis - 0.8);

  // HUD
  visEl.textContent = Math.round(player.vis) + '%';
  shadowEl.textContent = Math.round(player.shadow) + '%';

  // Render
  render(ctx, {
    lab,
    player,
    scientist,
    canvas,
    effects,
    introStep: director.currentStep()?.id
  });

  requestAnimationFrame(loop);
}

// --- Boot ---
subtitleEl.textContent = 'Click anywhere to begin.';
subtitleBox.style.opacity = 1;

function startOnFirstClick() {
  audio.init();
  document.removeEventListener('click', startOnFirstClick);
  director.advance(); // begin AWAKE
}

document.addEventListener('click', startOnFirstClick);

requestAnimationFrame(loop);