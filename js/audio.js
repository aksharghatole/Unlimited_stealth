// audio.js — Procedural heartbeat + SFX via Web Audio API

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.heartbeatInterval = null;
    this.heartbeatIntensity = 0.5;
    this.masterGain = null;
    this.enabled = false;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.4;
    this.masterGain.connect(this.ctx.destination);
    this.enabled = true;
    this.startHeartbeat();
  }

  setHeartbeat(intensity) {
    this.heartbeatIntensity = Math.max(0, Math.min(1, intensity));
  }

  startHeartbeat() {
    if (this.heartbeatInterval) return;

    const beat = () => {
      if (!this.enabled) return;
      this.playThump(60, 0.15 * this.heartbeatIntensity);
      setTimeout(() => {
        this.playThump(50, 0.10 * this.heartbeatIntensity);
      }, 180);

      const bpm = 50 + this.heartbeatIntensity * 80;
      const interval = 60000 / bpm;
      this.heartbeatInterval = setTimeout(beat, interval);
    };
    beat();
  }

  playThump(freq, vol) {
    if (!this.ctx || vol <= 0.001) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playBeep(freq = 880, dur = 0.1, vol = 0.15) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  playAlarm() {
    if (!this.ctx) return;
    for (let i = 0; i < 3; i++) {
      setTimeout(() => this.playBeep(1200, 0.15, 0.2), i * 200);
    }
  }
}