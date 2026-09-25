/**
 * ACT III + IV — the mixing jar.
 *
 * beats  9.2–10  the jar rises out of the dark
 *        10–11   fruit slices fly into it
 *        11–13   banana, mango, strawberry, nuts, chocolate, cookie, ice fall in
 *        13–14.2 fresh milk pours — stream, splash, bubbles, level rises
 *        14.2–15.6 BLEND: camera pushes in, everything whirls, light flashes
 *        15.6–16 everything converges, fast push, cream splash, CUT
 * Times below are absolute story beats; the timeline is added at beat 9.2.
 */
import { env, vw, vh } from '../core/env.js';
import { DepthScene, createLayer, depthProps, seeded } from '../core/depth.js';
import { aspect, image } from '../core/assets.js';
import { cameraShake, flash, idleFloat } from '../core/fx.js';
import { sizeOf } from '../data/ingredients.js';
import { world } from '../core/world.js';

export const MIX_START = 9.2;

/** What falls into the jar, in order — [asset, x%, rest y%, rot, size%] */
const CONTENTS = [
  ['strawberry-slice', 30, 84, -20, 34], ['banana-slice', 66, 86, 15, 32], ['mango-slice', 50, 78, 8, 52], ['strawberry-slice', 72, 72, 40, 30],
  ['banana-piece', 26, 70, -12, 28], ['mango-cube', 58, 64, 22, 26], ['mango-cube', 36, 58, -30, 24],
  ['strawberry-front', 70, 54, 30, 36], ['strawberry-side', 30, 46, -40, 38], ['blueberry-group', 56, 44, 0, 36],
  ['almond', 44, 36, 60, 18], ['cashew', 66, 34, -20, 20], ['pistachio', 30, 30, 20, 18],
  ['chocolate-chunk', 54, 26, 10, 22], ['cookie-piece', 36, 20, -15, 30], ['ice-cube', 68, 18, 12, 28], ['ice-cube', 42, 12, -8, 26]
];

export function buildMix(stage, { covers, texts }) {
  const rand = seeded(23);
  const T = (beat) => beat - MIX_START;
  const scene = new DepthScene(stage, { pointer: 0.8 });
  const cam = scene.cam;
  const tl = gsap.timeline({ defaults: { ease: 'none' } });

  const jar = stage.querySelector('.jar');
  jar.querySelector('.jar__glass').append(image('jar-empty', { sizes: '40vh', eager: true, alt: '' }));
  const inside = jar.querySelector('.jar__inside');
  const contents = jar.querySelector('.jar__contents');
  const milk = jar.querySelector('.jar__milk');
  const swirl = jar.querySelector('.jar__swirl');
  // the jar rides the same virtual camera as the photographic layers (via a rig,
  // so the camera and the jar's own animation never share a transform)
  const rig = document.createElement('div');
  rig.className = 'jar-rig';
  jar.replaceWith(rig);
  rig.append(jar);
  scene.layers.push({ el: rig, par: depthProps(0.72).parallax, depth: 0.72 });

  // geometry (matches the CSS: width = min(40vh, 64vw), aspect 0.62, centre at 52%)
  const jarW = () => Math.min(vh(40), vw(64));
  const jarH = () => jarW() / 0.62;
  const inW = () => jarW() * 0.76;
  const inH = () => jarH() * 0.71;
  const mouthY = () => vh(2) - jarH() * 0.465;

  // ── contents (inside the glass, clipped) + their outside twins ───────
  const list = env.tier === 'low' ? CONTENTS.filter((_, i) => i % 3 !== 2) : CONTENTS;
  const items = list.map(([id, x, y, rot, size], i) => {
    const l = createLayer(id, { parent: contents, depth: 0.5, size, units: '%', blur: false, light: false });
    l.el.style.left = `${x}%`;
    l.el.style.top = `${y}%`;
    l.el.style.zIndex = 10 + i;
    gsap.set(l.m, { y: () => -inH() * (y / 100) - vh(12), rotation: rot - 90, opacity: 1 });
    const twin = scene.add(id, { depth: rand.range(0.6, 0.78), size: sizeOf(id), opacity: 0, z: 60 });
    return { l, twin, x, y, rot };
  });

  // milk stream + splashes
  const stream = scene.add('milk-stream', { depth: 0.74, size: 11, opacity: 0, z: 80, light: false });
  const splashIn = createLayer('milk-splash', { parent: inside, units: '%', size: 62, depth: 0.5, blur: false, light: false });
  splashIn.el.style.left = '50%';
  splashIn.el.style.zIndex = 30;
  gsap.set(splashIn.m, { opacity: 0, scale: 0.2 });
  const bubbles = createLayer('milk-bubbles', { parent: inside, units: '%', size: 40, depth: 0.5, blur: false, light: false });
  bubbles.el.style.left = '50%';
  bubbles.el.style.zIndex = 31;
  gsap.set(bubbles.m, { opacity: 0 });
  const creamBurst = ['cream-droplets', 'milk-droplets', 'milk-splash'].map((id) => scene.add(id, { depth: 0.95, size: sizeOf(id), opacity: 0, z: 95, light: false }));
  const around = ['strawberry-slice', 'banana-slice', 'blueberry-single', 'mango-cube', 'chocolate-chunk', 'almond']
    .slice(0, env.count(6))
    .map((id, i) => scene.add(id, { depth: rand.range(0.2, 0.45), size: sizeOf(id), x: (i % 2 ? 1 : -1) * rand.range(28, 44) * vw(1), y: rand.range(-30, 30) * vh(1), rot: rand.range(-90, 90), opacity: 0 }));
  around.forEach((l) => idleFloat(l, { amp: 14 }));

  // ── 9.2–10: the jar appears ─────────────────────────────────────────
  tl.set(stage, { visibility: 'visible' }, 0)
    .fromTo(jar, { opacity: 0, scale: 0.55, filter: env.blur ? 'blur(14px)' : 'none' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power3.out' }, T(9.2))
    .fromTo(texts.jar, { opacity: 0, y: vh(4) }, { opacity: 1, y: 0, duration: 0.5 }, T(9.3))
    .to(around.map((l) => l.m), { opacity: 0.9, duration: 0.6, stagger: 0.05 }, T(9.4))
    .add(() => world.atmos.setTheme('#ffe2c8', 0.9), T(9.4));

  // ── 10–13: slices fly in, then everything else falls in ─────────────
  items.forEach(({ l, twin, rot }, i) => {
    const t0 = i < 4 ? 10 + i * 0.16 : 11 + (i - 4) * (1.8 / (items.length - 4));
    const fromLeft = i % 2 === 0;
    const sx = i < 4 ? (fromLeft ? -vw(60) : vw(60)) : rand.range(-8, 8) * vw(1);
    const sy = i < 4 ? rand.range(-30, 10) * vh(1) : -vh(75);
    tl.fromTo(twin.m, { opacity: 0, x: sx, y: sy, rotation: rand.range(-160, 160), scale: i < 4 ? 1.4 : 1 },
      { opacity: 1, x: rand.range(-2, 2) * vw(1), y: mouthY, rotation: rot, scale: 0.55, duration: 0.42, ease: i < 4 ? 'power2.inOut' : 'power2.in' }, T(t0))
      .to(twin.m, { opacity: 0, duration: 0.06 }, T(t0 + 0.4))
      .to(l.m, { y: 0, rotation: rot, duration: 0.34, ease: 'bounce.out' }, T(t0 + 0.38));
  });
  tl.to(texts.jar, { opacity: 0, duration: 0.4 }, T(10.4))
    .to(cam, { zoom: 1.08, duration: 3, ease: 'sine.inOut' }, T(10));

  // ── 13–14.2: milk ────────────────────────────────────────────────────
  const streamY = () => mouthY() + inH() * 0.55 - (vmin(11 * depthProps(0.74).scale) * aspect('milk-stream')) / 2;
  tl.set(stream.m, { y: streamY, opacity: 1, clipPath: 'inset(0% 0% 100% 0%)' }, T(12.9))
    .to(stream.m, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.35, ease: 'power2.in' }, T(12.95))
    .fromTo(texts.milk, { opacity: 0, y: vh(4) }, { opacity: 1, y: 0, duration: 0.5 }, T(13))
    .fromTo(milk, { '--level': '0%' }, { '--level': '62%', duration: 1.1, ease: 'power1.inOut' }, T(13.25))
    .fromTo(splashIn.m, { opacity: 0, scale: 0.2, y: () => inH() * 0.4 }, { opacity: 0.85, scale: 1, y: () => inH() * 0.25, duration: 0.35, ease: 'expo.out' }, T(13.28))
    .to(splashIn.m, { y: () => -inH() * 0.02, duration: 0.8 }, T(13.6))
    .to(splashIn.m, { opacity: 0, duration: 0.3 }, T(14))
    .fromTo(bubbles.m, { opacity: 0, y: () => inH() * 0.3 }, { opacity: 0.9, y: () => -inH() * 0.08, duration: 0.9 }, T(13.4))
    .to(stream.m, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.3, ease: 'power2.in' }, T(14.05))
    .to(texts.milk, { opacity: 0, duration: 0.3 }, T(14.1));

  // ── 14.2–15.6: BLEND ─────────────────────────────────────────────────
  tl.to(cam, { zoom: 1.45, duration: 1.4, ease: 'power2.in' }, T(14.2))
    .add(() => world.atmos.burst(1.6), T(14.3))
    .to(swirl, { opacity: 0.9, rotation: 1080, duration: 1.4, ease: 'power2.in' }, T(14.2))
    .to(milk, { '--milk': '#f5b1c0', '--level': '94%', duration: 1.2, ease: 'power1.in' }, T(14.3))
    .to(bubbles.m, { opacity: 0, duration: 0.3 }, T(14.3))
    .add(cameraShake(cam, { strength: vw(0.5), duration: 1.3, steps: 26 }), T(14.3))
    .add(flash(covers.flash, { peak: 0.45, duration: 0.3 }), T(14.6))
    .add(flash(covers.flash, { peak: 0.55, duration: 0.3 }), T(15))
    .add(flash(covers.flash, { peak: 0.7, duration: 0.3 }), T(15.3))
    .to(around.map((l) => l.m), { x: 0, y: 0, scale: 0.2, opacity: 0, rotation: '+=360', duration: 1.1, ease: 'power3.in', stagger: 0.04 }, T(14.3));
  items.forEach(({ l, x, y }, i) => {
    const r = inW() * 0.25;
    const dx = () => ((50 - x) / 100) * inW();
    const dy = () => ((50 - y) / 100) * inH();
    tl.to(l.m, {
      keyframes: [
        { x: () => dx() + Math.cos(i) * r, y: () => dy() + Math.sin(i) * r * 0.6, duration: 0.35 },
        { x: () => dx() - Math.sin(i) * r, y: () => dy() + Math.cos(i) * r * 0.6, duration: 0.35 },
        { x: () => dx() - Math.cos(i) * r * 0.7, y: () => dy() - Math.sin(i) * r * 0.4, duration: 0.35 }
      ],
      rotation: `+=${720 + i * 40}`, duration: 1.05, ease: 'power1.in'
    }, T(14.35));
    if (env.blur) tl.to(l.i, { filter: 'blur(7px)', duration: 0.5 }, T(14.6));
    // converge
    tl.to(l.m, { x: dx, y: dy, scale: 0, duration: 0.3, ease: 'power3.in' }, T(15.45 + (i % 5) * 0.015));
  });

  // ── 15.6–16: FAST PUSH, cream splash, CUT ────────────────────────────
  tl.to(milk, { '--level': '100%', duration: 0.2 }, T(15.5))
    .to(cam, { zoom: 5.5, duration: 0.42, ease: 'expo.in' }, T(15.55))
    .add(() => world.atmos.burst(3), T(15.7));
  creamBurst.forEach((l, i) => {
    tl.fromTo(l.m, { opacity: 0, scale: 0.3, rotation: i * 40 }, { opacity: 1, scale: 3.4 + i, rotation: i * 40 + 30, duration: 0.35, ease: 'expo.out' }, T(15.75 + i * 0.04));
  });
  tl.fromTo(covers.cream, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(150% at 50% 50%)', duration: 0.28, ease: 'power3.in' }, T(15.78))
    .set(stage, { visibility: 'hidden' }, T(16.05))
    .set(cam, { zoom: 1 }, T(16.05));

  return { tl, scene };
}

const vmin = (n) => (n * Math.min(window.innerWidth, window.innerHeight)) / 100;
