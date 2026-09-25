/**
 * THE FACTORY FAVORITES — six mini-commercials in one pinned sequence.
 * Each product: the shake arrives out of depth, its ingredients orbit it, a
 * hero ingredient sweeps in from the side, the typography lands beside it —
 * then the whole set moves away and the next commercial begins.
 */
import { env, vw, vh } from '../core/env.js';
import { DepthScene, seeded } from '../core/depth.js';
import { image } from '../core/assets.js';
import { idleFloat } from '../core/fx.js';
import { tilt } from '../core/pointer.js';
import { split } from '../core/text.js';
import { CURRENCY, PRODUCTS } from '../data/products.js';
import { sizeOf } from '../data/ingredients.js';
import { world } from '../core/world.js';

function slideMarkup(p, i) {
  const el = document.createElement('article');
  el.className = 'product';
  el.id = `shake-${p.id}`;
  el.style.setProperty('--pa', p.accent);
  el.setAttribute('aria-label', `${p.name}, ${CURRENCY}${p.price}`);
  el.innerHTML = `
    <div class="product__visual">
      <div class="product__field"></div>
      <div class="product__shake"><div class="product__tilt"></div></div>
    </div>
    <div class="product__copy">
      <p class="product__index">${String(i + 1).padStart(2, '0')} / ${String(PRODUCTS.length).padStart(2, '0')}</p>
      <h3 class="product__name">${p.name}</h3>
      <p class="product__tagline">${p.tagline}</p>
      <ul class="product__ingredients">${p.ingredients.map((x) => `<li>${x}</li>`).join('')}</ul>
      <div class="product__buy">
        <span class="product__price">${CURRENCY}${p.price}</span>
        <a class="btn btn--ghost" href="#contact" data-scroll-to>Find a factory</a>
      </div>
    </div>`;
  el.querySelector('.product__tilt').append(image(p.shake, { sizes: env.mobile ? '60vw' : '32vw', alt: `${p.name} milkshake` }));
  return el;
}

export function buildProducts(section) {
  const stage = section.querySelector('.products__stage');
  const holder = section.querySelector('[data-products]');
  const backdrop = section.querySelector('.products__backdrop');
  const countEl = section.querySelector('.products__count b');
  const bar = section.querySelector('.products__bar i');
  const rand = seeded(41);
  const n = PRODUCTS.length;
  const slides = PRODUCTS.map((p, i) => {
    const el = slideMarkup(p, i);
    holder.append(el);
    const field = el.querySelector('.product__field');
    const scene = new DepthScene(field, { pointer: 1.4 });
    const floats = p.float.slice(0, env.count(p.float.length)).map((id, k) => {
      const ang = (k / p.float.length) * Math.PI * 2 + rand.range(-0.3, 0.3);
      const depth = k % 3 === 0 ? rand.range(0.82, 0.95) : rand.range(0.25, 0.6);
      const l = scene.add(id, { depth, size: sizeOf(id), rot: rand.range(-150, 150), opacity: 0, z: depth > 0.7 ? 80 : 5 });
      l.home = { x: Math.cos(ang) * rand.range(15, 24), y: Math.sin(ang) * rand.range(18, 30) };
      idleFloat(l, { amp: 16, rot: 12, dur: 5 });
      return l;
    });
    const side = scene.add(p.side, { depth: 0.7, size: sizeOf(p.side) * 0.8, opacity: 0, z: 70 });
    const shake = el.querySelector('.product__shake');
    const name = el.querySelector('.product__name');
    split(name, { mask: true });
    let active = false;
    tilt(el.querySelector('.product__tilt'), { isActive: () => active });
    return { p, el, scene, floats, side, shake, name, copy: el.querySelector('.product__copy'), setActive: (v) => { active = v; } };
  });

  // one pinned timeline, one unit per product
  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  slides.forEach((s, i) => {
    const t = i;
    const other = s.copy.querySelectorAll('.product__index, .product__tagline, .product__ingredients li, .product__buy');
    tl.set(s.el, { visibility: 'visible' }, t)
      .to(backdrop, { '--pc': s.p.color, duration: 0.3 }, t)
      .add(() => world.atmos.setTheme(s.p.accent, 0.8), t + 0.01)
      .fromTo(s.shake, { x: vw(i === 0 ? 0 : 30), scale: i === 0 ? 1.15 : 1.35, opacity: 0, filter: env.blur ? 'blur(16px)' : 'none' },
        { x: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.35, ease: 'power3.out' }, t)
      .fromTo(s.name.querySelectorAll('.split-char'), { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, stagger: 0.01, ease: 'expo.out' }, t + 0.06)
      .fromTo(other, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, stagger: 0.02, ease: 'power3.out' }, t + 0.12)
      .fromTo(s.side.m, { x: vw(60), y: vh(20), rotation: 40, opacity: 0 }, { x: vw(14), y: -vh(18), rotation: -12, opacity: 1, duration: 0.4, ease: 'expo.out' }, t + 0.1);
    s.floats.forEach((l, k) => {
      tl.fromTo(l.m, { x: 0, y: 0, scale: 0.2, opacity: 0 }, { x: l.home.x * vw(1), y: l.home.y * vh(1), scale: 1, opacity: 1, duration: 0.35, ease: 'expo.out' }, t + 0.08 + k * 0.02);
    });
    // hold, with a slow drift (the "camera" keeps moving)
    tl.to(s.scene.cam, { x: -vw(3), y: vh(1), duration: 0.6 }, t + 0.2);
    if (i < n - 1) {
      // exit: the whole commercial moves away into depth
      tl.to(s.shake, { x: -vw(34), scale: 0.62, opacity: 0, filter: env.blur ? 'blur(12px)' : 'none', duration: 0.3, ease: 'power3.in' }, t + 0.72)
        .to([s.name, ...other], { y: -40, opacity: 0, duration: 0.2, stagger: 0.01, ease: 'power2.in' }, t + 0.72)
        .to(s.side.m, { x: -vw(80), rotation: -60, opacity: 0, duration: 0.3, ease: 'power3.in' }, t + 0.72);
      s.floats.forEach((l) => {
        tl.to(l.m, { x: l.home.x * vw(3), y: l.home.y * vh(3), scale: l.depth > 0.7 ? 2.4 : 0.6, opacity: 0, duration: 0.3, ease: 'power3.in' }, t + 0.72);
      });
      tl.set(s.el, { visibility: 'hidden' }, t + 1);
    }
  });
  tl.to({}, { duration: 0.2 }, n - 0.2);

  let current = -1;
  ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    end: () => `+=${n * (env.mobile ? 0.9 : 1.1) * window.innerHeight}`,
    pin: true,
    scrub: env.touch ? 0.5 : 0.9,
    animation: tl,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const idx = Math.min(n - 1, Math.floor(self.progress * n * 0.999 + 0.1));
      if (idx !== current) {
        current = idx;
        countEl.textContent = String(idx + 1).padStart(2, '0');
        slides.forEach((s, k) => { s.setActive(k === idx); (Math.abs(k - idx) <= 1 ? s.scene.start() : s.scene.stop()); });
      }
      bar.style.transform = `scaleX(${self.progress.toFixed(4)})`;
    },
    onToggle: (self) => { if (!self.isActive) slides.forEach((s) => s.scene.stop()); }
  });
  return slides;
}
