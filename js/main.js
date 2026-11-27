// main.js — Game loop and state

import { IntroDirector, IntroState } from './intro.js';
import { Lab, SPAWN_TILE, FREE_TILE, DESK_TILE, EXIT_TILE, SCIENTIST_PATH } from './lab.js';
import { Player } from './player.js';
import { Scientist } from './scientist.js';
import { AudioEngine } from './audio.js';
import { render } from './render.js';
import { Facility, FLOOR_COUNT } from './facility.js';
import { Guard, SecurityCamera, isHidden, lureNearest } from './security.js';

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
let lab = new Lab();
const runSeed = Math.floor(Math.random() * 4294967296);
let floor = 0;
let guards = [];
let cameras = [];
let lureCooldown = 0;
let lurePulse = null;
const statusEl = document.getElementById('hud-status');
const lureEl = document.getElementById('hud-lure');
const alertEl = document.getElementById('hud-alert');
const player = new Player(
  SPAWN_TILE.x * lab.tileSize + lab.tileSize / 2,
  SPAWN_TILE.y * lab.tileSize + lab.tileSize / 2
);
let scientist = null;
let hideTime = 0;
let detectionTime = 0;
let ended = false;
let time=0, impact=null, wasChasing=false;
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
function accent(kind){impact={kind,age:0};}
const startButton = document.getElementById('start-game');
const restartButton = document.getElementById('restart-game');
restartButton.addEventListener('click', () => location.reload());

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

  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  if (ended || e.repeat) return;

  if (floor && k === 'q' && lureCooldown<=0) {
    const point={x:player.x,y:player.y};
    lureNearest(guards,point,lab);
    lureCooldown=12;
    lurePulse={...point,time:1.2};
    audio.playBeep(350,.12,.12);
    return;
  }
  if (floor && k === 'e') {
    if (lab.collect(player)) {
      audio.playBeep(1400, 0.08, 0.2);
      accent('access');
      objectiveEl.textContent = 'Reach the green elevator';
      subtitleEl.textContent = 'Access granted. Keep moving.';
    }
    return;
  }

  // Take keycard
  if (k === 'e' && director.currentStep()?.id === IntroState.KEYCARD) {
    const dx = player.x - (DESK_TILE.x * lab.tileSize + lab.tileSize / 2);
    const dy = player.y - (DESK_TILE.y * lab.tileSize + lab.tileSize / 2);
    if (Math.hypot(dx, dy) < 60) {
      lab.takeKeycard();
      lab.openExit();
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

window.addEventListener('blur', () => { for (const key of Object.keys(keys)) keys[key] = false; });
let lastMouse = null;
document.addEventListener('mousemove', e => {
  if (director.currentStep()?.id === IntroState.RESTRAINTS) {
    if (lastMouse) {
      director.registerMouseMove(e.clientX, e.clientY);
    }
    lastMouse = { x: e.clientX, y: e.clientY };
  } else {
    lastMouse = null;
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
    if (step.id === IntroState.FREE) {
      player.x = (FREE_TILE.x + 0.5) * lab.tileSize;
      player.y = (FREE_TILE.y + 0.5) * lab.tileSize;
    }

    // Spawn scientist at the right beat
    if (step.effects.spawnScientist && !scientist) {
      scientist = new Scientist(SCIENTIST_PATH);
    }

    // Alarm
    if (step.effects.alarm) {
      audio.playAlarm();
      accent('danger');
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

  if (completed === IntroState.SCIENTIST) scientist = null;
});

function endGame(success) {
  ended = true;
  accent(success?'access':'danger');
  player.canMove = false;
  player.moving = false;
  player.crouching = false;
  audio.setHeartbeat(0);
  document.body.classList.remove('danger');
  subtitleEl.textContent = success ? 'PROTOCOL ZERO COMPLETE — you reached the surface.' : 'SUBJECT DETECTED — the facility is on lockdown.';
  subtitleBox.style.opacity = 1;
  objectiveEl.textContent = success ? 'Facility escaped' : 'Try again';
  restartButton.hidden = false;
  restartButton.focus();
}

function enterFloor(number) {
  floor = number;
  accent('access'); wasChasing=false;
  lab = new Facility(runSeed, floor);
  player.x = (lab.spawn.x + .5) * lab.tileSize;
  player.y = (lab.spawn.y + .5) * lab.tileSize;
  player.canMove = true;
  player.moving = false;
  player.vis = 0;
  player.shadow = 100;
  scientist = null;
  guards = lab.patrols.map(path => new Guard(path,floor));
  cameras = lab.cameras.map(spec => new SecurityCamera(spec,lab));
  lureCooldown=0; lurePulse=null;
  detectionTime = 0;
  document.body.classList.remove('danger');
  effects = { blur: 0, brightness: 0.1, heartbeat: 0.5, vignette: 0.25, canMove: true };
  applyEffects();
  floorEl.textContent = floor + '/' + FLOOR_COUNT;
  objectiveEl.textContent = 'Find the amber keycard [E]';
  objectiveBox.style.opacity = 1;
  subtitleEl.textContent = 'SECTOR ' + String(floor).padStart(2,'0') + ' — C: hide in vents. Q: noise lure. E: access card.';
  subtitleBox.style.opacity = 1;
}
director.on('onComplete', () => enterFloor(1));

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
  time+=dt; if(impact)impact.age+=dt;

  // Update intro director
  if (!ended) director.update(dt);

  // Update player
  player.update(dt, keys, lab);

  if (scientist && !ended) {
    scientist.update(dt);
    const seen = scientist.canSee(player, lab);
    detectionTime = seen ? Math.min(1.25, detectionTime + dt) : Math.max(0, detectionTime - dt * 2);
    hideTime = player.crouching && !player.moving && !seen ? hideTime + dt : 0;
    if (detectionTime >= 1.25) {
      audio.playAlarm();
      endGame(false);
    } else if (hideTime >= 1.5) {
      director.registerAction('hide');
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

  if (floor && !ended) {
    lureCooldown=Math.max(0,lureCooldown-dt);
    if(lurePulse && (lurePulse.time-=dt)<=0) lurePulse=null;
    for(const camera of cameras) if(camera.tick(dt,player,lab)) {
      lureNearest(guards,player,lab,Infinity);
      audio.playBeep(850,.1,.12);
    }
    let captured=false;
    for(const guard of guards) if(guard.tick(dt,player,lab)) captured=true;
    const chasing=guards.some(g=>g.state==='CHASE');
    if(chasing&&!wasChasing)accent('danger');
    wasChasing=chasing;
    const searching=guards.some(g=>g.state==='SEARCH');
    detectionTime=1.25*Math.max(0,...guards.map(g=>g.state==='CHASE'?1:g.suspicion),...cameras.map(c=>c.suspicion));
    statusEl.textContent=chasing?'PURSUIT':isHidden(player,lab)?'CONCEALED':searching?'SEARCH':detectionTime>.25?'SUSPICIOUS':'CLEAR';
    lureEl.textContent=lureCooldown>0?Math.ceil(lureCooldown)+'s':'READY';
    document.body.classList.toggle('danger', chasing || detectionTime > .65);
    audio.setHeartbeat(0.45 + detectionTime * 0.4);
    if (captured) {
      audio.playAlarm();
      endGame(false);
    } else if (lab.reachedExit(player)) {
      if (floor === FLOOR_COUNT) endGame(true);
      else enterFloor(floor + 1);
    }
  }

  alertEl.textContent = Math.round(detectionTime / 1.25 * 100) + '%';
  if (!ended && (director.currentStep() || floor)) {
    const target = floor && isHidden(player,lab) ? 0 : player.crouching ? 15 : player.moving ? 70 : 35;
    player.vis += (target - player.vis) * Math.min(1, dt * 3);
    player.shadow = 100 - player.vis;
  }

  // HUD
  visEl.textContent = Math.round(player.vis) + '%';
  shadowEl.textContent = Math.round(player.shadow) + '%';

  // Render
  render(ctx, {
    lab,
    player,
    scientist,
    guards,
    cameras,
    lurePulse,
    concealed: floor && isHidden(player,lab),
    canvas,
    dt,time,impact,reducedMotion:motionPreference.matches,
    effects,
    introStep: director.currentStep()?.id
  });

  requestAnimationFrame(loop);
}

// --- Boot ---
subtitleEl.textContent = 'UMBRA: Protocol Zero';
subtitleBox.style.opacity = 1;

startButton.addEventListener('click', () => {
  audio.init();
  startButton.hidden = true;
  document.getElementById('title-panel').hidden=true;
  startButton.blur();
  director.start();
}, { once: true });

requestAnimationFrame(loop);
