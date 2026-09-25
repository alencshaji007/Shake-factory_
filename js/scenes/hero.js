/**
 * ACT I + II — the opening shot.
 *
 * beats  0–1   strawberry close-up, camera orbits it
 *        1–2   banana enters          2–3  mango enters
 *        2.6–4 blueberries → strawberries → almonds → cashews → pistachios
 *              → chocolate → ice burst out, each family faster than the last
 *        4–5   everything crashes together (shake + flash)
 *        5–6.4 the cluster falls, hits water — splash covers the frame
 *        6.4–7.7 knife enters          7.7–8.4 the cut, the strawberry splits
 *        8.4–9.4 slices fly through the camera
 *        9.2–10 the mixing jar appears (handed to mix.js)
 */
import { env, VW, VH, vw, vh } from '../core/env.js';
import { DepthScene, seeded } from '../core/depth.js';
import { idleFloat, cameraShake, flash, motionBlur } from '../core/fx.js';
import { revealChars, revealWords, split } from '../core/text.js';
import { sizeOf } from '../data/ingredients.js';
import { world } from '../core/world.js';

/** Families in the order they enter, with how many of each (desktop). */
const FAMILIES = [
  ['blueberry', ['blueberry-single', 'blueberry-single', 'blueberry-group', 'blueberry-closeup'], 7],
  ['strawberry', ['strawberry-front', 'strawberry-side', 'strawberry-half', 'raspberry-single'], 6],
  ['almond', ['almond', 'almond-sliced'], 5],
  ['cashew', ['cashew'], 4],
  ['pistachio', ['pistachio', 'nut-pieces'], 5],
  ['chocolate', ['chocolate-chunk', 'chocolate-dark-piece', 'chocolate-milk-piece', 'chocolate-shavings'], 6],
  ['ice', ['ice-cube', 'ice-cube-group', 'ice-melting'], 4],
  ['extras', ['mango-cube', 'banana-slice', 'cookie-piece', 'strawberry-slice', 'raspberry-group'], 5]
];

export function buildHero(stage, { covers, texts }) {
  const rand = seeded(11);
  const scene = new DepthScene(stage, { pointer: 1 });
  const cam = scene.cam;
  const tl = gsap.timeline({ defaults: { ease: 'none' } });

  // ── cast ────────────────────────────────────────────────────────────
  // far background life from the very first frame
  const far = [];
  for (let i = 0; i < env.count(8); i++) {
    const id = rand.pick(['blueberry-single', 'strawberry-front', 'raspberry-single', 'almond', 'chocolate-chunk', 'mango-cube']);
    far.push(scene.add(id, { depth: rand.range(0.06, 0.2), size: sizeOf(id), x: rand.range(-48, 48) * vw(1), y: rand.range(-40, 40) * vh(1), rot: rand.range(-180, 180) }));
  }

  const berry = scene.add('strawberry-closeup', { depth: 0.86, size: sizeOf('strawberry-closeup'), alt: 'strawberry-side', eager: true, z: 70, x: env.mobile ? 0 : vw(12) });
  const banana = scene.add('banana-whole', { depth: 0.72, size: sizeOf('banana-whole'), x: -vw(95), y: -vh(10), rot: -40, eager: true, z: 72 });
  const mango = scene.add('mango-whole', { depth: 0.76, size: sizeOf('mango-whole'), x: vw(70), y: vh(70), rot: 30, eager: true, z: 73 });

  // explosion cast, grouped by family
  const groups = FAMILIES.map(([name, ids, n]) => {
    const layers = [];
    for (let i = 0; i < env.count(n); i++) {
      const r = rand();
      const depth = r < 0.3 ? rand.range(0.12, 0.38) : r < 0.76 ? rand.range(0.42, 0.78) : rand.range(0.84, 1);
      const id = ids[i % ids.length];
      const l = scene.add(id, { depth, size: sizeOf(id) * (depth > 0.84 ? 1.25 : 1.45), opacity: 0, eager: true });
      const ang = rand() * Math.PI * 2;
      const radius = depth < 0.4 ? rand.range(14, 42) : depth < 0.8 ? rand.range(22, 58) : rand.range(46, 80);
      l.dest = {
        x: () => Math.cos(ang) * radius * vw(1) * 1.1,
        y: () => Math.sin(ang) * radius * vh(1),
        rot: rand.range(-200, 200) * l.dp.spin,
        rot0: rand.range(-90, 90),
        scale: depth > 0.84 ? rand.range(1.3, 2.2) : rand.range(0.85, 1.15)
      };
      layers.push(l);
    }
    return { name, layers };
  });
  const cast = groups.flatMap((g) => g.layers);

  // splash + knife act
  const splashCrown = scene.add('water-splash-crown', { depth: 0.82, size: sizeOf('water-splash-crown'), y: vh(22), opacity: 0, z: 90, light: false });
  const splashWide = scene.add('water-splash-wide', { depth: 0.9, size: sizeOf('water-splash-wide'), y: vh(26), opacity: 0, z: 92, light: false });
  const drops = scene.add('water-droplets', { depth: 0.95, size: sizeOf('water-droplets'), y: vh(10), opacity: 0, z: 94, light: false });

  const halfA = scene.add('strawberry-front', { depth: 0.8, size: 28, alt: 'strawberry-half', opacity: 0, z: 70 });
  const halfB = scene.add('strawberry-front', { depth: 0.8, size: 28, alt: 'strawberry-half', opacity: 0, z: 70 });
  halfA.i.style.clipPath = 'polygon(0 0, 60% 0, 40% 100%, 0 100%)';
  halfB.i.style.clipPath = 'polygon(60% 0, 100% 0, 100% 100%, 40% 100%)';
  gsap.set(halfB.alt, { scaleX: -1 });
  const knife = scene.add('knife-chef', { depth: 0.9, size: 64, x: vw(80), y: -vh(70), rot: -38, opacity: 0, z: 96, light: false });
  const juice = ['strawberry-small-piece', 'strawberry-small-piece', 'ice-droplets', 'strawberry-small-piece'].map((id) => scene.add(id, { depth: 0.88, size: sizeOf(id), opacity: 0, z: 95 }));
  const slices = ['strawberry-slice', 'banana-slice', 'mango-slice', 'strawberry-slice', 'banana-slice', 'mango-cube', 'strawberry-slice', 'strawberry-small-piece']
    .slice(0, env.count(8) + 2)
    .map((id) => scene.add(id, { depth: rand.range(0.55, 0.8), size: sizeOf(id), opacity: 0, z: 97 }));

  // berry.i is owned by the intro's breathing motion; everything else floats
  for (const l of [...far, banana, mango, ...cast]) idleFloat(l, { amp: 10, rot: 5 });

  // ── ACT I ────────────────────────────────────────────────────────────
  const intro = stage.querySelector('.story-text--intro');
  const giant = texts.giant;
  const glow = stage.querySelector('.hero__glow');
  const water = stage.querySelector('.hero__water');

  // 0–1: orbit around the strawberry
  tl.to(cam, { x: -vw(9), duration: 1, ease: 'sine.inOut' }, 0)
    .fromTo(berry.m, { rotationY: 0, rotation: -4, scale: 1.18 }, { rotationY: 38, rotation: 8, scale: 1.02, duration: 1, ease: 'sine.inOut' }, 0)
    .to(berry.alt, { opacity: 1, duration: 0.45 }, 0.45)
    .to(berry.m, { rotationY: 0, duration: 0.5, ease: 'sine.out' }, 1)
    .to(intro, { opacity: 0, y: -vh(6), duration: 0.6 }, 0.55);

  // 1–2 banana, 2–3 mango
  tl.to(berry.m, { x: VW(16), y: -vh(4), scale: 0.56, duration: 1.2, ease: 'power2.inOut' }, 1)
    .to(banana.m, { x: -vw(20), y: vh(6), rotation: -14, duration: 1.1, ease: 'expo.out' }, 1.1)
    .to(cam, { x: vw(4), zoom: 0.92, duration: 1.4, ease: 'sine.inOut' }, 1.2)
    .to(mango.m, { x: VW(24), y: VH(18), rotation: 6, duration: 1.1, ease: 'expo.out' }, 2)
    .to(berry.m, { x: VW(2), y: -vh(16), scale: 0.4, duration: 1, ease: 'power2.inOut' }, 2);

  // 2.6–4: the explosion — each family faster than the one before
  let t = 2.6, gap = 0.3;
  for (const g of groups) {
    tl.add(explode(g.layers, { duration: 0.9 * (gap / 0.3 + 0.2) }), t);
    t += gap;
    gap *= 0.78;
  }
  tl.add(() => world.atmos.burst(1.2), 2.9)
    .to(cam, { zoom: 1.08, rot: -2, duration: 1.2, ease: 'power1.inOut' }, 2.8)
    .to(glow, { opacity: 1.2, scale: 1.3, duration: 1 }, 2.7)
    .fromTo(giant, { opacity: 0, scale: 1.25, filter: env.blur ? 'blur(14px)' : 'none' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' }, 3.1)
    .to(giant, { scale: 0.9, duration: 1, ease: 'none' }, 3.7);

  // 4–5: CRASH — everything converges
  const converge = [berry, banana, mango, ...cast];
  converge.forEach((l, i) => {
    tl.to(l.m, { x: rand.range(-3, 3) * vw(1), y: vh(3) + rand.range(-3, 3) * vh(1), scale: 0.26, rotation: `+=${rand.range(120, 300)}`, duration: 0.62, ease: 'power4.in' }, 4.05 + (i % 7) * 0.012);
  });
  tl.to(giant, { opacity: 0, scale: 0.6, filter: env.blur ? 'blur(20px)' : 'none', duration: 0.45, ease: 'power3.in' }, 4.15)
    .to(cam, { zoom: 1.22, rot: 0, duration: 0.6, ease: 'power3.in' }, 4.1)
    .add(flash(covers.flash, { peak: 0.95, duration: 0.5 }), 4.66)
    .add(cameraShake(cam, { strength: vw(1.6), duration: 0.5 }), 4.66)
    .add(() => world.atmos.burst(2), 4.68)
    .to(far.map((l) => l.m), { opacity: 0, duration: 0.3 }, 4.7);

  // 5–6.4: the fruit falls into water — crash, splash, slow motion, cover
  const fallers = [berry, banana, mango];
  tl.set(cast.map((l) => l.m), { opacity: 0 }, 4.95)
    .to(fallers.map((l) => l.m), { scale: 0.42, duration: 0.3 }, 4.75)
    .to(berry.m, { x: -vw(3), duration: 0.2 }, 4.9)
    .to(banana.m, { x: vw(5), duration: 0.2 }, 4.9)
    .to(fallers.map((l) => l.m), { y: VH(26), rotation: '+=70', duration: 0.55, ease: 'power2.in', stagger: 0.04 }, 5)
    .to(cam, { y: -vh(8), zoom: 1, duration: 0.6, ease: 'power2.inOut' }, 4.95)
    .to(water, { opacity: 1, duration: 0.4 }, 4.95)
    .to(fallers.map((l) => l.m), { opacity: 0, duration: 0.12 }, 5.5)
    .fromTo(splashCrown.m, { opacity: 0, scale: 0.2, y: VH(24) }, { opacity: 1, scale: 1.1, y: VH(12), duration: 0.9, ease: 'expo.out' }, 5.5)
    .fromTo(drops.m, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1.4, y: -vh(8), duration: 0.9, ease: 'expo.out' }, 5.52)
    .fromTo(splashWide.m, { opacity: 0, scale: 0.3 }, { opacity: 0.95, scale: 2.4, y: -vh(10), duration: 0.65, ease: 'power2.in' }, 5.75)
    .add(cameraShake(cam, { strength: vw(0.8), duration: 0.4 }), 5.5)
    .fromTo(covers.splash, { '--r': '0vmax', '--cy': '72%' }, { '--r': '190vmax', duration: 0.55, ease: 'power2.in' }, 5.95)
    .set([splashCrown.m, splashWide.m, drops.m, water, glow], { opacity: 0 }, 6.5)
    .set(cam, { x: 0, y: 0, zoom: 1, rot: 0 }, 6.5)
    .to(covers.splash, { '--r': '0vmax', '--cy': '-30%', duration: 0.45, ease: 'power2.inOut' }, 6.55);

  // 6.4–7.7: the knife
  tl.set([halfA.m, halfB.m], { opacity: 1, x: 0, y: -vh(2), scale: 1, rotation: 0 }, 6.5)
    .fromTo(texts.knife, { opacity: 0, y: vh(4) }, { opacity: 1, y: 0, duration: 0.5 }, 6.8)
    .to(knife.m, { opacity: 1, duration: 0.15 }, 6.7)
    .to(knife.m, { x: VW(15), y: -vh(24), rotation: -58, duration: 0.95, ease: 'power2.out' }, 6.7)
    .to(cam, { zoom: 1.12, duration: 1.2, ease: 'sine.inOut' }, 6.6);

  // 7.7–8.4: THE CUT
  const slash = covers.slash;
  tl.to(knife.m, { x: -vw(42), y: VH(55), duration: 0.24, ease: 'power3.in' }, 7.7)
    .add(motionBlur(knife.i, { amount: 14, duration: 0.24 }), 7.7)
    .fromTo(slash, { opacity: 0, rotation: -68, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: 0.1, ease: 'power4.out' }, 7.8)
    .to(slash, { opacity: 0, duration: 0.3 }, 7.92)
    .add(cameraShake(cam, { strength: vw(1.1), duration: 0.35 }), 7.82)
    .add(flash(covers.flash, { peak: 0.5, duration: 0.3 }), 7.82)
    .to(halfA.m, { x: -vw(9), y: vh(3), rotation: -18, duration: 0.55, ease: 'expo.out' }, 7.86)
    .to(halfB.m, { x: vw(9), y: -vh(4), rotation: 16, duration: 0.55, ease: 'expo.out' }, 7.86)
    .to([halfA.alt, halfB.alt], { opacity: 1, duration: 0.2 }, 7.9)
    .to(knife.m, { opacity: 0, duration: 0.1 }, 7.95)
    .to(texts.knife, { opacity: 0, duration: 0.3 }, 8.1);
  juice.forEach((l, i) => {
    const a = -Math.PI / 2 + (i - 1.5) * 0.7;
    tl.fromTo(l.m, { opacity: 0, x: 0, y: 0, scale: 0.3 }, { opacity: 1, x: Math.cos(a) * vw(22), y: Math.sin(a) * vh(26), scale: 1, rotation: rand.range(-200, 200), duration: 0.5, ease: 'expo.out' }, 7.88)
      .to(l.m, { opacity: 0, y: `+=${vh(12)}`, duration: 0.3 }, 8.3);
  });

  // 8.4–9.4: slices fly through the camera (speed ramp)
  slices.forEach((l, i) => {
    const a = rand() * Math.PI * 2;
    const start = 8.35 + i * 0.07;
    tl.fromTo(l.m, { opacity: 0, x: 0, y: 0, scale: 0.18, rotation: rand.range(-90, 90) }, { opacity: 1, scale: 0.6, x: Math.cos(a) * vw(6), y: Math.sin(a) * vh(6), duration: 0.2, ease: 'power2.out' }, start)
      .to(l.m, { scale: rand.range(4.5, 7), x: Math.cos(a) * vw(70), y: Math.sin(a) * vh(70), rotation: `+=${rand.range(120, 260)}`, duration: 0.6, ease: 'expo.in' }, start + 0.2)
      .to(l.m, { opacity: 0, duration: 0.12 }, start + 0.68);
    if (env.blur) tl.to(l.i, { filter: 'blur(14px)', duration: 0.3, ease: 'power2.in' }, start + 0.45);
  });
  tl.to(halfA.m, { x: -vw(80), y: vh(30), scale: 2.2, rotation: -80, duration: 0.7, ease: 'expo.in' }, 8.45)
    .to(halfB.m, { x: vw(80), y: -vh(40), scale: 2.2, rotation: 80, duration: 0.7, ease: 'expo.in' }, 8.45)
    .to(cam, { zoom: 1.35, duration: 0.8, ease: 'power2.in' }, 8.4)
    .add(() => world.atmos.burst(1.5), 8.5)
    .set(cam, { zoom: 1 }, 9.3);

  return { tl, scene, intro: () => playIntro({ stage, berry, far, glow, intro }), berry };
}

/** Layers of a family burst out from behind the strawberry. */
function explode(layers, { duration }) {
  const tl = gsap.timeline();
  layers.forEach((l, i) => {
    const d = l.dest;
    tl.fromTo(l.m,
      { x: 0, y: 0, scale: 0.12, rotation: d.rot0, opacity: 0 },
      { x: d.x, y: d.y, scale: d.scale, rotation: d.rot, opacity: 1, duration: duration * (1.15 - l.depth * 0.4), ease: 'expo.out' }, i * 0.02);
    // the nearest ones keep coming — past the lens
    if (l.depth > 0.9) tl.to(l.m, { scale: d.scale * 2.4, x: () => (typeof d.x === 'function' ? d.x() : d.x) * 1.8, y: () => (typeof d.y === 'function' ? d.y() : d.y) * 1.8, duration: 0.8, ease: 'power2.in' }, duration * 0.8);
  });
  return tl;
}

/** Time-based opening (first 10 seconds): black → one perfect strawberry. */
function playIntro({ stage, berry, far, glow, intro }) {
  const kicker = intro.querySelector('.kicker');
  const line = intro.querySelector('.intro-line');
  split(line);
  const tl = gsap.timeline();
  tl.fromTo(berry.i, { opacity: 0, scale: 1.45, filter: env.blur ? 'blur(26px)' : 'none' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 3.2, ease: 'expo.out' }, 0.1)
    .fromTo(glow, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 3, ease: 'power2.out' }, 0.3)
    .fromTo(far.map((l) => l.i), { opacity: 0 }, { opacity: 0.85, duration: 2.4, stagger: 0.15 }, 1)
    .add(revealChars(kicker, { stagger: 0.03, duration: 1 }), 1.2)
    .add(revealWords(line, { stagger: 0.08, duration: 1.3 }), 1.6)
    .fromTo('.story__ui', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 2.4);
  // slow breathing push-in on the hero strawberry while the visitor reads
  gsap.to(berry.i, { rotation: 4, x: 8, duration: 6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 3.2 });
  void stage;
  return tl;
}
