/**
 * The 2.5D depth system.
 *
 * Every photographic ingredient is a layer with a `depth` from 0 (far) to 1
 * (touching the lens). Depth drives:
 *   scale   — near things are bigger
 *   blur    — depth of field: far and extremely near layers go soft
 *   light   — atmospheric perspective: far layers sit darker in the haze
 *   parallax— how much the layer reacts to the camera and the pointer
 *   z-order — near layers stack above far ones (and above/below text)
 *   spin    — near layers rotate faster as they pass
 *
 * Layer DOM:  .ing (camera + pointer)  >  .ing__m (scene timelines)  >  .ing__i (idle float)  >  img
 * Separating the three transform owners means scroll timelines, camera moves
 * and idle motion never fight over the same property.
 */
import { env } from './env.js';
import { aspect, image } from './assets.js';
import { pointer } from './pointer.js';

export function depthProps(depth, { focus = 0.72 } = {}) {
  const d = Math.min(1, Math.max(0, depth));
  const scale = 0.32 + d * 1.18;
  let blur = 0;
  if (d < focus - 0.4) blur = (focus - 0.4 - d) * 18;
  else if (d > 0.9) blur = (d - 0.9) * 50;
  return {
    scale,
    blur: env.blur ? blur : 0,
    light: Math.min(1, 0.5 + d * 0.62),
    parallax: Math.pow(d, 1.35),
    z: Math.round(d * 100),
    spin: 0.4 + d * 1.6
  };
}

/**
 * Creates one photographic layer.
 * @param {string} id      asset id
 * @param {object} o
 *   depth, x/y (px offsets of .ing__m from the parent centre), rot, size (vmin at depth 1 → scaled by depth),
 *   parent, alt (second asset id cross-faded inside the same layer), focus, units ('vmin' | '%')
 */
export function createLayer(id, o = {}) {
  const depth = o.depth ?? 0.5;
  const dp = depthProps(depth, o);
  const size = (o.size ?? 20) * dp.scale;
  const unit = o.units || 'vmin';
  const el = document.createElement('div');
  el.className = `ing ${o.className || ''}`.trim();
  el.style.setProperty('--size', size.toFixed(2));
  if (unit === 'vmin') el.style.marginTop = `${(-size * aspect(id) * 0.5).toFixed(2)}vmin`;
  el.style.zIndex = o.z ?? dp.z;
  const filters = [];
  if (dp.blur > 0.2 && o.blur !== false) filters.push(`blur(${dp.blur.toFixed(1)}px)`);
  if (dp.light < 0.99 && o.light !== false) filters.push(`brightness(${dp.light.toFixed(2)})`);
  if (o.filter) filters.push(o.filter);
  if (filters.length) el.style.setProperty('--f', filters.join(' '));

  const m = document.createElement('div');
  m.className = 'ing__m';
  const i = document.createElement('div');
  i.className = 'ing__i';
  const sizes = unit === 'vmin' ? `${Math.round(Math.min(size * 1.1, 160))}vmin` : '40vw';
  i.append(image(id, { sizes, eager: o.eager }));
  let alt = null;
  if (o.alt) { alt = image(o.alt, { sizes, eager: o.eager, className: 'ing__alt' }); i.append(alt); }
  m.append(i);
  el.append(m);
  (o.parent || document.body).append(el);
  if (unit === '%') el.style.marginTop = '0';

  const layer = { id, el, m, i, alt, depth, dp, par: dp.parallax, x: o.x || 0, y: o.y || 0 };
  gsap.set(m, { x: layer.x, y: layer.y, rotation: o.rot || 0, scale: o.scale ?? 1, opacity: o.opacity ?? 1 });
  if (unit === '%') gsap.set(el, { xPercent: 0, yPercent: -50 });
  return layer;
}

/**
 * A group of layers sharing a virtual camera. The camera (x, y, zoom, rot)
 * and the pointer are applied per layer, weighted by depth → real parallax.
 */
export class DepthScene {
  constructor(root, { pointer: strength = 1, camera = {} } = {}) {
    this.root = root;
    this.layers = [];
    this.cam = { x: 0, y: 0, zoom: 1, rot: 0, shakeX: 0, shakeY: 0, ...camera };
    this.strength = env.touch ? 0 : strength;
    this.running = false;
    this.render = this.render.bind(this);
  }

  add(id, o = {}) {
    const layer = createLayer(id, { parent: this.root, ...o });
    this.layers.push(layer);
    return layer;
  }

  render() {
    const { cam } = this;
    const px = pointer.x * this.strength, py = pointer.y * this.strength;
    for (const l of this.layers) {
      const k = l.par;
      const tx = (cam.x + cam.shakeX) * (0.25 + k) - px * 46 * k;
      const ty = (cam.y + cam.shakeY) * (0.25 + k) - py * 30 * k;
      const s = 1 + (cam.zoom - 1) * (0.35 + k * 1.1);
      const r = cam.rot * (0.3 + k);
      l.el.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0) scale(${s.toFixed(4)}) rotate(${r.toFixed(2)}deg)`;
    }
  }

  start() { if (!this.running) { this.running = true; gsap.ticker.add(this.render); } }
  stop() { if (this.running) { this.running = false; gsap.ticker.remove(this.render); } }

  /** Runs the render loop only while `trigger` is on screen. */
  autoRun(trigger) {
    ScrollTrigger.create({ trigger, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? this.start() : this.stop()) });
    return this;
  }
}

/** Seeded PRNG so every visit gets the same composition. */
export function seeded(seed = 7) {
  let a = seed >>> 0;
  const r = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (lo, hi) => lo + r() * (hi - lo);
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.sign = () => (r() < 0.5 ? -1 : 1);
  return r;
}
