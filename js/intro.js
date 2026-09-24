// intro.js — The scripted lab awakening sequence

export const IntroState = {
  AWAKE: 'AWAKE',
  RESTRAINTS: 'RESTRAINTS',
  FREE: 'FREE',
  SCIENTIST: 'SCIENTIST',
  KEYCARD: 'KEYCARD',
  ALARM: 'ALARM',
  ESCAPE: 'ESCAPE',
  DONE: 'DONE'
};

// Each step defines what the world looks like and what the player must do
export const INTRO_SCRIPT = [
  {
    id: IntroState.AWAKE,
    duration: 4000,
    subtitle: '...you are awake.',
    objective: null,
    effects: {
      blur: 12,           // px of blur
      brightness: 0.9,    // overlay darkness
      heartbeat: 0.5,     // 0-1 intensity
      vignette: 0.7,
      muted: true,
      canMove: false
    }
  },
  {
    id: IntroState.RESTRAINTS,
    duration: null, // waits for player action
    subtitle: 'One arm is still strapped down. Wiggle the mouse to loosen it.',
    objective: 'Break free',
    effects: {
      blur: 8,
      brightness: 0.7,
      heartbeat: 0.6,
      vignette: 0.6,
      canMove: false,
      requiresMouseWiggle: 300 // total mouse movement in px
    }
  },
  {
    id: IntroState.FREE,
    duration: 2500,
    subtitle: 'You slide off the table. The floor is cold. Your legs barely work.',
    objective: null,
    effects: {
      blur: 5,
      brightness: 0.5,
      heartbeat: 0.7,
      vignette: 0.5,
      canMove: true
    }
  },
  {
    id: IntroState.SCIENTIST,
    duration: null,
    subtitle: 'Footsteps. Someone is coming. [S] to crouch — hide under the table.',
    objective: 'Hide',
    effects: {
      blur: 3,
      brightness: 0.3,
      heartbeat: 0.8,
      vignette: 0.4,
      canMove: true,
      spawnScientist: true
    }
  },
  {
    id: IntroState.KEYCARD,
    duration: null,
    subtitle: 'A keycard glints on the desk. [E] to take it.',
    objective: 'Take keycard',
    effects: {
      blur: 2,
      brightness: 0.2,
      heartbeat: 0.7,
      vignette: 0.3,
      canMove: true
    }
  },
  {
    id: IntroState.ALARM,
    duration: 2000,
    subtitle: 'The lock chirps. Too loud. A guard heard that. MOVE.',
    objective: 'Escape the lab',
    effects: {
      blur: 0,
      brightness: 0.1,
      heartbeat: 1.0,
      vignette: 0.2,
      canMove: true,
      alarm: true,
      shake: true,
      dangerPulse: true
    }
  },
  {
    id: IntroState.ESCAPE,
    duration: null,
    subtitle: 'The corridor stretches ahead. The facility is vast. You are small.',
    objective: 'Reach the surface',
    effects: {
      blur: 0,
      brightness: 0,
      heartbeat: 0.7,
      vignette: 0.2,
      canMove: true
    }
  }
];

export class IntroDirector {
  constructor() {
    this.index = 0;
    this.timer = 0;
    this.mouseWiggle = 0;
    this.lastMouse = { x: 0, y: 0 };
    this.finished = false;
    this.listeners = {
      onStep: [],
      onComplete: []
    };
  }

  on(event, fn) {
    if (this.listeners[event]) this.listeners[event].push(fn);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      for (const fn of this.listeners[event]) fn(data);
    }
  }

  currentStep() {
    return INTRO_SCRIPT[this.index] || null;
  }

  // Called when player moves the mouse — for the restraint mechanic
  registerMouseMove(x, y) {
    const step = this.currentStep();
    if (!step || step.id !== IntroState.RESTRAINTS) return;

    const dx = x - this.lastMouse.x;
    const dy = y - this.lastMouse.y;
    const dist = Math.hypot(dx, dy);
    this.mouseWiggle += dist;
    this.lastMouse.x = x;
    this.lastMouse.y = y;

    if (this.mouseWiggle >= step.effects.requiresMouseWiggle) {
      this.advance();
    }
  }

  // Called when player presses a key — for hide, keycard, etc.
  registerAction(action) {
    const step = this.currentStep();
    if (!step) return;

    if (step.id === IntroState.SCIENTIST && action === 'hide') {
      this.advance();
    }
    if (step.id === IntroState.KEYCARD && action === 'take_keycard') {
      this.advance();
    }
    if (step.id === IntroState.ESCAPE && action === 'reached_exit') {
      this.advance();
    }
  }

  advance() {
    const step = this.currentStep();
    if (step) this.emit('onStep', { completed: step.id });

    this.index++;
    this.timer = 0;
    this.mouseWiggle = 0;

    const next = this.currentStep();
    if (next) {
      this.emit('onStep', { started: next.id, step: next });
    } else {
      this.finished = true;
      this.emit('onComplete');
    }
  }

  update(dt) {
    const step = this.currentStep();
    if (!step) return;

    this.timer += dt * 1000;

    // Auto-advance steps with a duration
    if (step.duration !== null && this.timer >= step.duration) {
      this.advance();
    }
  }
}