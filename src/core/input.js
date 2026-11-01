// Keyboard, mouse (click to walk, drag to orbit, wheel to zoom) and touch (joystick, buttons, tap to walk).
export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.move = { x: 0, z: 0 }; // from joystick, -1..1
    this.actionDown = false;
    this.actionPressed = false;
    this.jumpPressed = false;
    this.run = false;
    this.clickTarget = null; // {clientX, clientY} pending ground pick
    this.orbit = 0; // accumulated drag yaw delta
    this.zoom = 0; // accumulated wheel delta
    this.enabled = true;
    this.lastDevice = 'keyboard';
    this.listeners = {};

    addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k) && this.enabled) e.preventDefault();
      if (!this.keys.has(k)) {
        if (k === 'e' || k === 'enter') { this.actionPressed = true; this.actionDown = true; }
        if (k === ' ') this.jumpPressed = true;
        this.emit('key', k);
      }
      this.keys.add(k);
      this.lastDevice = 'keyboard';
    });
    addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      this.keys.delete(k);
      if (k === 'e' || k === 'enter') this.actionDown = false;
    });
    addEventListener('blur', () => { this.keys.clear(); this.actionDown = false; });

    // Mouse: click (short press without much movement) = walk there; drag = orbit.
    let down = null;
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!down || e.pointerType === 'touch') return;
      const dx = e.clientX - down.x;
      down.moved = Math.max(down.moved, Math.hypot(dx, e.clientY - down.y));
      if (down.moved > 6) { this.orbit += (e.movementX || 0) * 0.005; }
    });
    canvas.addEventListener('pointerup', (e) => {
      if (!down || e.pointerType === 'touch') return;
      if (down.moved <= 6 && performance.now() - down.t < 500) { this.clickTarget = { clientX: e.clientX, clientY: e.clientY }; this.lastDevice = 'mouse'; }
      down = null;
    });
    canvas.addEventListener('wheel', (e) => { this.zoom += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });

    // Touch: taps walk; two-finger pinch zooms. The joystick and buttons are DOM controls.
    const touches = new Map();
    let pinch = null;
    canvas.addEventListener('touchstart', (e) => {
      for (const t of e.changedTouches) touches.set(t.identifier, { x: t.clientX, y: t.clientY, t: performance.now(), sx: t.clientX, sy: t.clientY });
      if (touches.size === 2) { const [a, b] = [...touches.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); }
      this.lastDevice = 'touch';
    }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      for (const t of e.changedTouches) { const s = touches.get(t.identifier); if (s) { s.x = t.clientX; s.y = t.clientY; } }
      if (touches.size === 2 && pinch) {
        const [a, b] = [...touches.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (Math.abs(d - pinch) > 24) { this.zoom += d < pinch ? 1 : -1; pinch = d; }
      } else if (touches.size === 1) {
        const s = [...touches.values()][0];
        if (Math.hypot(s.x - s.sx, s.y - s.sy) > 12) this.orbit += (e.changedTouches[0].clientX - (s.px ?? s.sx)) * 0.006;
        s.px = e.changedTouches[0].clientX;
      }
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
      for (const t of e.changedTouches) {
        const s = touches.get(t.identifier);
        if (s && touches.size === 1 && Math.hypot(t.clientX - s.sx, t.clientY - s.sy) < 12 && performance.now() - s.t < 400) this.clickTarget = { clientX: t.clientX, clientY: t.clientY };
        touches.delete(t.identifier);
      }
      if (touches.size < 2) pinch = null;
    });
  }

  on(name, fn) { (this.listeners[name] ||= []).push(fn); }
  emit(name, v) { (this.listeners[name] || []).forEach((f) => f(v)); }

  /** Joystick element: a base and a knob; feeds this.move. */
  attachJoystick(base, knob) {
    let id = null, cx = 0, cy = 0;
    const R = 46;
    const set = (x, y) => {
      let dx = x - cx, dy = y - cy;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx = (dx / d) * R; dy = (dy / d) * R; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
      this.move.x = dx / R;
      this.move.z = dy / R;
      this.run = d > R * 0.92;
    };
    base.addEventListener('pointerdown', (e) => {
      id = e.pointerId;
      const r = base.getBoundingClientRect();
      cx = r.left + r.width / 2; cy = r.top + r.height / 2;
      base.setPointerCapture(id);
      set(e.clientX, e.clientY);
      this.lastDevice = 'touch';
      e.preventDefault();
    });
    base.addEventListener('pointermove', (e) => { if (e.pointerId === id) set(e.clientX, e.clientY); });
    const end = (e) => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; this.move.x = this.move.z = 0; this.run = false; };
    base.addEventListener('pointerup', end);
    base.addEventListener('pointercancel', end);
  }

  /** Jump is held (space or the touch button): used for variable jump height. */
  jumpHeld() { return this.keys.has(' ') || this.jumpTouch === true; }

  attachButton(el, kind) {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (kind === 'action') { this.actionPressed = true; this.actionDown = true; }
      else { this.jumpPressed = true; this.jumpTouch = true; }
      el.classList.add('is-down');
    });
    const up = () => { if (kind === 'action') this.actionDown = false; else this.jumpTouch = false; el.classList.remove('is-down'); };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
  }

  /** Movement intent in camera space: x right, z down-screen (toward camera). */
  axis() {
    if (!this.enabled) return { x: 0, z: 0, run: false };
    let x = this.move.x, z = this.move.z;
    const k = this.keys;
    if (k.has('a') || k.has('arrowleft')) x -= 1;
    if (k.has('d') || k.has('arrowright')) x += 1;
    if (k.has('w') || k.has('arrowup')) z -= 1;
    if (k.has('s') || k.has('arrowdown')) z += 1;
    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    return { x, z, run: this.run || k.has('shift') };
  }

  consume() {
    const r = { action: this.actionPressed, jump: this.jumpPressed, click: this.clickTarget, orbit: this.orbit, zoom: this.zoom };
    this.actionPressed = this.jumpPressed = false;
    this.clickTarget = null;
    this.orbit = 0;
    this.zoom = 0;
    return r;
  }
}
