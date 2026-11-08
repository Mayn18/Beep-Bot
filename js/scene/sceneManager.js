// Owns the full-screen pixel world: paints scenes, runs ambient animation,
// crossfades between worlds, and re-renders on resize / pixel-size changes.

import { paintScene } from './scenes.js';
import { createAmbient } from './ambient.js';
import { makeCanvas } from './pixel.js';

const PIXEL_SIZES = {
  desktop: { chunky: 6, normal: 4, fine: 3 },
  mobile: { chunky: 5, normal: 3, fine: 2 },
};
const FRAME_MS = 1000 / 24;

class SceneLayer {
  constructor(themeId, W, H, ps, ambientOn) {
    this.themeId = themeId;
    this.W = W; this.H = H; this.ps = ps;
    this.el = document.createElement('div');
    this.el.className = 'scene__layer';

    this.bg = makeCanvas(W, H);
    this.fg = makeCanvas(W, H);
    for (const c of [this.bg, this.fg]) {
      c.style.width = `${W * ps}px`;
      c.style.height = `${H * ps}px`;
      this.el.appendChild(c);
    }
    const bctx = this.bg.getContext('2d');
    bctx.imageSmoothingEnabled = false;
    const vw = window.innerWidth;
    const margin = vw > 980 ? Math.max(0, Math.floor((vw - 1100) / 2 / ps)) : 0;
    this.meta = paintScene(themeId, bctx, W, H, margin);
    this.fctx = this.fg.getContext('2d');
    this.fctx.imageSmoothingEnabled = false;
    this.ambient = createAmbient(themeId, W, H, this.meta);
    this.t = 0;
    this.setAmbient(ambientOn);
    this.drawFrame(0);                // one still frame so reduced-motion users still get detail
  }
  setAmbient(on) { this.animated = on; this.fg.style.display = 'block'; }
  drawFrame(dt) {
    this.fctx.clearRect(0, 0, this.W, this.H);
    this.t += dt;
    this.ambient.draw(this.fctx, this.t, dt);
  }
}

export class SceneManager {
  constructor(root) {
    this.root = root;
    this.layers = [];
    this.themeId = null;
    this.sizeKey = 'normal';
    this.ambientOn = true;
    this.last = 0;
    this.running = false;
    this._resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this.handleResize(), 220);
    });
    document.addEventListener('visibilitychange', () => { this.last = 0; });
  }

  get ps() {
    const set = window.innerWidth < 640 ? PIXEL_SIZES.mobile : PIXEL_SIZES.desktop;
    return set[this.sizeKey] || set.normal;
  }

  dims() {
    const ps = this.ps;
    return { ps, W: Math.ceil(window.innerWidth / ps) + 1, H: Math.ceil(window.innerHeight / ps) + 1 };
  }

  setTheme(id, { instant = false } = {}) {
    if (id === this.themeId && this.layers.length) return;
    this.themeId = id;
    this.mount(id, instant);
  }

  mount(id, instant) {
    const { W, H, ps } = this.dims();
    const layer = new SceneLayer(id, W, H, ps, this.ambientOn);
    this.root.appendChild(layer.el);
    this.layers.push(layer);
    this.size = { W, H, ps };
    if (instant) layer.el.style.transition = 'none';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      layer.el.classList.add('is-in');
      if (instant) requestAnimationFrame(() => (layer.el.style.transition = ''));
    }));
    // retire older layers once the fade completes
    const older = this.layers.slice(0, -1);
    const retire = () => {
      older.forEach((l) => l.el.remove());
      this.layers = this.layers.filter((l) => !older.includes(l));
    };
    if (instant) retire(); else setTimeout(retire, 1300);
    this.start();
  }

  setAmbient(on) {
    this.ambientOn = on;
    this.layers.forEach((l) => l.setAmbient(on));
    if (!on) this.layers.forEach((l) => l.drawFrame(0));
  }

  setPixelSize(key) {
    if (key === this.sizeKey) return;
    this.sizeKey = key;
    this.rebuild();
  }

  rebuild() {
    if (!this.themeId) return;
    this.layers.forEach((l) => l.el.remove());
    this.layers = [];
    this.mount(this.themeId, true);
  }

  handleResize() {
    if (!this.size) return;
    const { W, H, ps } = this.dims();
    const grew = W > this.size.W || H > this.size.H;
    const shrankALot = W < this.size.W * 0.7 || H < this.size.H * 0.7;
    if (ps !== this.size.ps || grew || shrankALot) this.rebuild();
  }

  start() {
    if (this.running) return;
    this.running = true;
    const loop = (now) => {
      requestAnimationFrame(loop);
      if (!this.ambientOn) return;
      if (!this.last) this.last = now;
      const elapsed = now - this.last;
      if (elapsed < FRAME_MS) return;
      const dt = Math.min(0.1, elapsed / 1000);
      this.last = now;
      this.layers.forEach((l) => l.drawFrame(dt));
    };
    requestAnimationFrame(loop);
  }
}

/** Render a small static preview of a world (used by the world picker). */
export function renderPreview(canvas, themeId) {
  const W = 112, H = 63;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const meta = paintScene(themeId, ctx, W, H);
  const ambient = createAmbient(themeId, W, H, meta, 3);
  ambient.draw(ctx, 4.2, 0.016);
}
