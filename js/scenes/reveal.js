/**
 * ACT V — the shake reveal and the brand.
 *
 * beats 16–16.6  out of the cream: a huge finished shake
 *       16.3–18  the camera drifts around it (2.5D), light sweeps the glass
 *       18–20    the camera pulls back, ingredients keep floating,
 *                SHAKE FACTORY lands, then "Crafted to crave."
 */
import { env, vw, vh } from '../core/env.js';
import { DepthScene, seeded } from '../core/depth.js';
import { url } from '../core/assets.js';
import { idleFloat } from '../core/fx.js';
import { split } from '../core/text.js';
import { sizeOf } from '../data/ingredients.js';
import { world } from '../core/world.js';

export const REVEAL_START = 16;

const FLOATERS = [
  ['strawberry-front', 0.25, -34, -26], ['strawberry-half', 0.9, 30, 24], ['raspberry-single', 0.35, 26, -30], ['blueberry-single', 0.95, -30, 30],
  ['strawberry-slice', 0.55, -24, 14], ['cream-droplets', 0.6, 22, -8], ['blueberry-group', 0.18, 40, 8], ['strawberry-small-piece', 0.82, -40, -4],
  ['raspberry-single', 0.7, 38, 34], ['blueberry-single', 0.3, -12, -38]
];

export function buildReveal(stage, { covers }) {
  const rand = seeded(31);
  const T = (beat) => beat - REVEAL_START;
  const scene = new DepthScene(stage, { pointer: 1 });
  const cam = scene.cam;
  const tl = gsap.timeline({ defaults: { ease: 'none' } });

  const shakeId = 'shake-strawberry-cloud';
  const shake = scene.add(shakeId, { depth: 0.8, size: env.mobile ? 40 : 28, z: 60, light: false, eager: true });
  const sweep = document.createElement('div');
  sweep.className = 'sweep';
  sweep.style.setProperty('--mask', `url("${new URL(url(shakeId), document.baseURI).href}")`);
  shake.i.append(sweep);

  const floaters = FLOATERS.slice(0, env.count(FLOATERS.length)).map(([id, depth, x, y]) => {
    const l = scene.add(id, { depth, size: sizeOf(id), x: x * vw(1), y: y * vh(1), rot: rand.range(-120, 120), opacity: 0, z: depth > 0.62 ? 70 + Math.round(depth * 20) : Math.round(depth * 30) });
    idleFloat(l, { amp: 18, rot: 10, dur: 6 });
    return l;
  });

  const beam = stage.querySelector('.reveal__beam');
  const words = [...stage.querySelectorAll('.brand__word')];
  const chars = words.flatMap((w) => split(w, { mask: true }).chars);
  const tag = stage.querySelector('.brand__tag');

  // 16–16.6: out of the cream
  tl.set(stage, { visibility: 'visible' }, 0)
    .add(() => world.atmos.setTheme('#ffc4cf', 1), 0.05)
    .fromTo(shake.m, { scale: 1.35, y: vh(8), rotationY: -18 }, { scale: 1, y: 0, duration: 0.9, ease: 'expo.out' }, T(16.05))
    .fromTo(covers.cream, { opacity: 1 }, { opacity: 0, duration: 0.55, ease: 'power2.out' }, T(16.1))
    .set(covers.cream, { clipPath: 'circle(0% at 50% 50%)', opacity: 1 }, T(16.7))
    .fromTo(beam, { opacity: 0 }, { opacity: 1, duration: 0.8 }, T(16.2));
  floaters.forEach((l, i) => {
    tl.fromTo(l.m, { opacity: 0, scale: 0.4, x: 0, y: 0 }, { opacity: 1, scale: 1, x: l.x, y: l.y, duration: 0.8, ease: 'expo.out' }, T(16.15 + i * 0.03));
  });

  // 16.3–18: slow 2.5D orbit around the shake + light sweep
  tl.to(shake.m, { rotationY: 16, duration: 1.8, ease: 'sine.inOut' }, T(16.4))
    .to(cam, { x: -vw(5), duration: 1.8, ease: 'sine.inOut' }, T(16.3))
    .fromTo(sweep, { backgroundPosition: '160% 0' }, { backgroundPosition: '-60% 0', duration: 1.4, ease: 'power1.inOut' }, T(16.5));

  // 18–20: pull back, brand
  tl.to(shake.m, { rotationY: 0, y: -vh(2), duration: 1.2, ease: 'sine.inOut' }, T(18))
    .to(cam, { zoom: 0.74, x: 0, duration: 1.6, ease: 'power2.inOut' }, T(18))
    .fromTo(chars, { yPercent: 110, rotationX: -70, opacity: 0 }, { yPercent: 0, rotationX: 0, opacity: 1, duration: 0.7, stagger: 0.04, ease: 'expo.out' }, T(18.2))
    .fromTo(tag, { opacity: 0, y: vh(3), letterSpacing: '0.3em' }, { opacity: 1, y: 0, letterSpacing: '0em', duration: 0.6, ease: 'power3.out' }, T(19))
    .to({}, { duration: 0.4 }, T(19.6));

  return { tl, scene };
}
