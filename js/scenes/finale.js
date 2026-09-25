/**
 * The calm final scene: ingredients drift down and settle on the surface,
 * the finished shake sits centred, and the brand signs off.
 */
import { env, vw, vh } from '../core/env.js';
import { createLayer, seeded } from '../core/depth.js';
import { image } from '../core/assets.js';
import { tilt } from '../core/pointer.js';
import { split } from '../core/text.js';
import { sizeOf } from '../data/ingredients.js';

const SETTLE = [
  ['strawberry-front', -38], ['blueberry-group', -27], ['almond', -18], ['mango-cube', -30], ['cookie-piece', 30],
  ['chocolate-chunk', 20], ['pistachio', 38], ['strawberry-half', 26], ['raspberry-single', -42], ['cashew', 44], ['blueberry-single', 12], ['banana-slice', -10]
];

export function buildFinale(section) {
  const rand = seeded(81);
  const settle = section.querySelector('.finale__settle');
  const holder = section.querySelector('.finale__product');
  holder.innerHTML = '<div class="product__shake"><div class="product__tilt"></div></div>';
  const tiltEl = holder.querySelector('.product__tilt');
  tiltEl.append(image('shake-strawberry-cloud', { sizes: '24vh', alt: 'Strawberry Cloud milkshake' }));
  let active = false;
  tilt(tiltEl, { isActive: () => active, rx: 5, ry: 9 });

  const layers = SETTLE.slice(0, env.count(SETTLE.length)).map(([id, x]) => {
    const depth = rand.range(0.45, 0.85);
    const l = createLayer(id, { parent: settle, depth, size: sizeOf(id), x: x * vw(1), y: -vh(80), rot: rand.range(-180, 180), light: false, blur: false });
    l.rest = { y: vh(40) - depth * vh(4) - rand.range(0, 3) * vh(1), rot: rand.range(-40, 40) };
    return l;
  });

  const mantra = section.querySelectorAll('.finale__mantra span');
  const brand = section.querySelector('.finale__brand');
  split(brand, { mask: true });

  if (env.reduced) {
    layers.forEach((l) => gsap.set(l.m, { y: l.rest.y, rotation: l.rest.rot }));
    return;
  }

  // ingredients slowly settle (scrubbed, soft landing)
  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  layers.forEach((l, i) => {
    tl.to(l.m, { y: l.rest.y, rotation: l.rest.rot, duration: 1, ease: 'bounce.out' }, i * 0.07);
  });
  ScrollTrigger.create({ trigger: section, start: 'top 85%', end: 'center 45%', scrub: 1.2, animation: tl });

  const intro = gsap.timeline({ paused: true });
  intro.fromTo(holder, { y: 80, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 1.6, ease: 'expo.out' })
    .fromTo(brand.querySelectorAll('.split-char'), { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.03, ease: 'expo.out' }, 0.4)
    .fromTo(mantra, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.18, ease: 'power3.out' }, 0.7)
    .fromTo(section.querySelectorAll('.finale__ctas .btn'), { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' }, 1.1);
  ScrollTrigger.create({ trigger: section, start: 'top 60%', once: true, onEnter: () => intro.play() });
  ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: (s) => { active = s.isActive; } });
}
