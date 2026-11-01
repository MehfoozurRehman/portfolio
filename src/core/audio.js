// All sound is synthesized with Web Audio: no audio files. Starts only after the visitor presses Start.
export class Audio {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.master = null;
  }

  start() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { return; }
    const c = this.ctx;
    this.master = c.createGain();
    this.master.gain.value = this.enabled ? 0.7 : 0;
    this.master.connect(c.destination);
    // Soft surf: filtered noise with a slow swell.
    const noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    const g = c.createGain();
    g.gain.value = 0.05;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.12;
    const lg = c.createGain();
    lg.gain.value = 0.03;
    lfo.connect(lg).connect(g.gain);
    src.connect(lp).connect(g).connect(this.master);
    src.start();
    lfo.start();
    this.noise = noise;
    this.birdTimer = setInterval(() => { if (Math.random() < 0.55) this.bird(); }, 5200);
  }

  setEnabled(on) {
    this.enabled = on;
    if (this.master) this.master.gain.setTargetAtTime(on ? 0.7 : 0, this.ctx.currentTime, 0.1);
  }

  _env(node, t, a, peak, dec) {
    node.gain.setValueAtTime(0.0001, t);
    node.gain.exponentialRampToValueAtTime(peak, t + a);
    node.gain.exponentialRampToValueAtTime(0.0001, t + a + dec);
  }

  tone(freq, { type = 'sine', dur = 0.25, vol = 0.18, at = 0, slide = 0 } = {}) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx, t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    this._env(g, t, 0.01, vol, dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  noiseHit({ freq = 1200, q = 1, dur = 0.08, vol = 0.12, at = 0 } = {}) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx, t = c.currentTime + at;
    const s = c.createBufferSource();
    s.buffer = this.noise;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = q;
    const g = c.createGain();
    this._env(g, t, 0.005, vol, dur);
    s.connect(f).connect(g).connect(this.master);
    s.start(t, Math.random());
    s.stop(t + dur + 0.05);
  }

  /**
   * A footstep is two layers: a soft low "heel" thump (the body weight) and a short filtered texture
   * (what the shoe lands on). Both get small random variation so no two steps sound identical.
   */
  step(surface, run) {
    if (!this.ctx || !this.enabled) return;
    const c = this.ctx, t = c.currentTime;
    const vary = () => 0.9 + Math.random() * 0.2;
    const w = run ? 1.25 : 1;
    // heel thump: a quick pitch-dropping sine, felt more than heard
    const o = c.createOscillator(), og = c.createGain();
    o.type = 'sine';
    const f0 = (surface === 'wood' ? 150 : surface === 'water' ? 70 : 95) * vary();
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f0 * 0.55, t + 0.08);
    this._env(og, t, 0.004, (surface === 'wood' ? 0.07 : 0.045) * w, 0.09);
    o.connect(og).connect(this.master);
    o.start(t); o.stop(t + 0.14);
    // surface texture: filtered noise shaped like the material
    const s = c.createBufferSource();
    s.buffer = this.noise;
    const f = c.createBiquadFilter();
    const g = c.createGain();
    let dur = 0.07, vol = 0.03;
    if (surface === 'grass' || surface === 'grass_deep') { f.type = 'lowpass'; f.frequency.value = 1100 * vary(); dur = 0.09; vol = 0.028; }
    else if (surface === 'sand') { f.type = 'lowpass'; f.frequency.value = 1800 * vary(); dur = 0.12; vol = 0.03; }
    else if (surface === 'wood') { f.type = 'bandpass'; f.frequency.value = 700 * vary(); f.Q.value = 2.5; dur = 0.06; vol = 0.04; }
    else if (surface === 'water') { f.type = 'bandpass'; f.frequency.value = 900 * vary(); f.Q.value = 0.7; dur = 0.22; vol = 0.06; }
    else { f.type = 'bandpass'; f.frequency.value = 1300 * vary(); f.Q.value = 1.2; dur = 0.05; vol = 0.022; } // stone, plaza
    this._env(g, t + 0.005, 0.006, vol * w, dur);
    s.connect(f).connect(g).connect(this.master);
    s.start(t, Math.random() * 1.5);
    s.stop(t + dur + 0.1);
  }
  splash(big = false) { this.noiseHit({ freq: 700, q: 0.5, dur: big ? 0.5 : 0.25, vol: big ? 0.14 : 0.07 }); this.tone(220, { dur: 0.15, vol: 0.03, slide: 0.5 }); }
  jump() { this.tone(330, { type: 'triangle', dur: 0.16, vol: 0.08, slide: 1.8 }); }
  land() { this.step('grass', true); this.tone(80, { dur: 0.12, vol: 0.06, slide: 0.6 }); }
  pop() { this.tone(660, { type: 'sine', dur: 0.12, vol: 0.12, slide: 1.6 }); }
  open() { this.tone(523, { dur: 0.12, vol: 0.1 }); this.tone(784, { dur: 0.18, vol: 0.09, at: 0.08 }); }
  close() { this.tone(659, { dur: 0.1, vol: 0.08 }); this.tone(440, { dur: 0.14, vol: 0.07, at: 0.06 }); }
  collect() { [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, { type: 'triangle', dur: 0.18, vol: 0.09, at: i * 0.07 })); }
  bell() { [1318, 1975].forEach((f, i) => this.tone(f, { type: 'sine', dur: 1.4, vol: 0.12 - i * 0.04 })); }
  whoosh() { this.noiseHit({ freq: 900, q: 0.5, dur: 0.5, vol: 0.12 }); }
  kick() { this.noiseHit({ freq: 300, q: 1.2, dur: 0.1, vol: 0.2 }); this.tone(140, { dur: 0.12, vol: 0.12, slide: 0.6 }); }
  clatter() { for (let i = 0; i < 5; i++) this.noiseHit({ freq: 1800 + i * 300, q: 6, dur: 0.06, vol: 0.1, at: i * 0.05 }); }
  build(stage) { const base = [262, 330, 392][stage] || 262; this.tone(base, { type: 'triangle', dur: 0.5, vol: 0.12 }); this.tone(base * 1.5, { type: 'sine', dur: 0.6, vol: 0.08, at: 0.05 }); }
  launch() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, { type: 'triangle', dur: 0.9, vol: 0.1, at: i * 0.09 })); this.noiseHit({ freq: 4000, q: 0.4, dur: 0.6, vol: 0.06, at: 0.3 }); }
  fanfare() { [[523, 0], [659, 0.15], [784, 0.3], [1047, 0.45], [784, 0.7], [1047, 0.85]].forEach(([f, at]) => this.tone(f, { type: 'square', dur: 0.22, vol: 0.05, at })); }
  bird() { const f = 2200 + Math.random() * 900; this.tone(f, { dur: 0.08, vol: 0.03, slide: 1.25 }); this.tone(f * 1.1, { dur: 0.07, vol: 0.025, at: 0.12, slide: 0.8 }); }
  parrot() { this.tone(1400, { type: 'square', dur: 0.07, vol: 0.03, slide: 1.4 }); this.tone(1800, { type: 'square', dur: 0.06, vol: 0.025, at: 0.09, slide: 0.7 }); }
  meow() { this.tone(700, { type: 'triangle', dur: 0.35, vol: 0.06, slide: 1.5 }); this.tone(1050, { type: 'sine', dur: 0.25, vol: 0.04, at: 0.2, slide: 0.7 }); }
  woof() { this.tone(220, { type: 'sawtooth', dur: 0.12, vol: 0.05, slide: 0.7 }); this.tone(200, { type: 'sawtooth', dur: 0.12, vol: 0.05, at: 0.18, slide: 0.7 }); }
  baa() { for (let i = 0; i < 4; i++) this.tone(420 + (i % 2) * 30, { type: 'sawtooth', dur: 0.09, vol: 0.035, at: i * 0.08 }); }
  honk() { this.tone(440, { type: 'square', dur: 0.12, vol: 0.05 }); this.tone(440, { type: 'square', dur: 0.16, vol: 0.05, at: 0.18 }); }
  ding() { this.tone(2100, { type: 'sine', dur: 0.5, vol: 0.07 }); this.tone(2100, { type: 'sine', dur: 0.6, vol: 0.06, at: 0.16 }); }
  creak() { this.tone(180 + Math.random() * 40, { type: 'sawtooth', dur: 0.18, vol: 0.02, slide: 1.3 }); }
}
