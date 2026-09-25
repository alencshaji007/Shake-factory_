/**
 * MEET THE SIGNATURE — a huge Choco Overload, the camera drifting around it,
 * ingredients floating on every depth, and three words, each with its own
 * cinematic entrance:
 *   THICK.   slams in from the lens (scale + blur + camera shake)
 *   CREAMY.  rises softly, letter by letter
 *   LOADED.  wipes in while ingredients burst around it
 */
import { env, vw, vh } from '../core/env.js';
import { DepthScene, seeded } from '../core/depth.js';
import { image, url } from '../core/assets.js';
import { cameraShake, idleFloat } from '../core/fx.js';
import { tilt } from '../core/pointer.js';
import { split } from '../core/text.js';
import { sizeOf } from '../data/ingredients.js';
import { world } from '../core/world.js';

const BACK = ['chocolate-chunk', 'hazelnut', 'cookie-piece', 'chocolate-dark-piece', 'almond', 'chocolate-shavings', 'cashew'];
const FRONT = ['chocolate-chunk', 'cookie-chunks', 'cream-droplets', 'chocolate-milk-piece', 'hazelnut'];

export function buildSignature(section) {
  const rand = seeded(71);
  const viewport = section.querySelector('.signature__viewport');
  const product = section.querySelector('.signature__product');
  const shakeId = 'shake-choco-overload';
  product.innerHTML = '<div class="product__shake"><div class="product__tilt"></div></div>';
  const shake = product.querySelector('.product__shake');
  const tiltEl = product.querySelector('.product__tilt');
  tiltEl.append(image(shakeId, { sizes: '40vh', alt: 'Choco Overload milkshake' }));
  const sweep = document.createElement('div');
  sweep.className = 'sweep';
  sweep.style.setProperty('--mask', `url("${new URL(url(shakeId), document.baseURI).href}")`);
  tiltEl.append(sweep);
  let active = false;
  tilt(tiltEl, { isActive: () => active, rx: 6, ry: 10 });

  const back = new DepthScene(section.querySelector('.signature__field--back'), { pointer: 1.2 });
  const front = new DepthScene(section.querySelector('.signature__field--front'), { pointer: 1.8 });
  const backLayers = BACK.slice(0, env.count(BACK.length)).map((id) => {
    const l = back.add(id, { depth: rand.range(0.12, 0.5), size: sizeOf(id), x: rand.sign() * rand.range(18, 46) * vw(1), y: rand.range(-38, 38) * vh(1), rot: rand.range(-180, 180) });
    idleFloat(l, { amp: 16, rot: 10, dur: 6 });
    return l;
  });
  const frontLayers = FRONT.slice(0, env.count(FRONT.length)).map((id, i) => {
    const l = front.add(id, { depth: rand.range(0.82, 0.98), size: sizeOf(id), opacity: 0 });
    const a = (i / FRONT.length) * Math.PI * 2 + 0.4;
    l.home = { x: Math.cos(a) * rand.range(26, 44) * vw(1), y: Math.sin(a) * rand.range(24, 38) * vh(1) };
    idleFloat(l, { amp: 22, rot: 14, dur: 5 });
    return l;
  });

  const head = section.querySelector('.signature__head');
  const thick = section.querySelector('.sigword--thick');
  const creamy = section.querySelector('.sigword--creamy');
  const loaded = section.querySelector('.sigword--loaded');
  const creamyChars = split(creamy).chars;

  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  tl.fromTo(head, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.08 }, 0.02)
    .fromTo(shake, { scale: 1.2, y: vh(10), opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.16, ease: 'power3.out' }, 0)
    // slow camera move around the shake (2.5D)
    .fromTo(shake, { rotationY: -16 }, { rotationY: 16, duration: 1, ease: 'sine.inOut' }, 0)
    .fromTo(back.cam, { x: vw(7) }, { x: -vw(7), duration: 1, ease: 'sine.inOut' }, 0)
    .fromTo(front.cam, { x: vw(10), zoom: 1.1 }, { x: -vw(10), zoom: 0.95, duration: 1, ease: 'sine.inOut' }, 0)
    .fromTo(sweep, { backgroundPosition: '160% 0' }, { backgroundPosition: '-60% 0', duration: 0.5 }, 0.1)
    // THICK.
    .fromTo(thick, { opacity: 0, scale: 3.2, filter: env.blur ? 'blur(24px)' : 'none' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.1, ease: 'power4.in' }, 0.14)
    .add(cameraShake(front.cam, { strength: vw(1.2), duration: 0.08, steps: 6 }), 0.24)
    .add(cameraShake(back.cam, { strength: vw(0.8), duration: 0.08, steps: 6 }), 0.24)
    // CREAMY.
    .set(creamy, { opacity: 1 }, 0.36)
    .fromTo(creamyChars, { yPercent: 60, opacity: 0, filter: env.blur ? 'blur(10px)' : 'none' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.14, stagger: 0.015, ease: 'power3.out' }, 0.36)
    // LOADED.
    .set(loaded, { opacity: 1 }, 0.6)
    .fromTo(loaded, { clipPath: 'inset(-20% 100% -20% 0%)' }, { clipPath: 'inset(-20% 0% -20% 0%)', duration: 0.14, ease: 'expo.inOut' }, 0.6)
    .add(() => world.atmos.burst(1), 0.62);
  frontLayers.forEach((l, i) => {
    tl.fromTo(l.m, { x: 0, y: 0, scale: 0.2, opacity: 0, rotation: rand.range(-90, 90) }, { x: l.home.x, y: l.home.y, scale: 1, opacity: 1, rotation: rand.range(-200, 200), duration: 0.16, ease: 'expo.out' }, 0.62 + i * 0.015);
  });
  tl.to([thick, creamy, loaded], { opacity: 0, y: -vh(4), duration: 0.08, stagger: 0.02 }, 0.9);

  // the reel's splash hands over to this scene
  const handover = document.createElement('div');
  handover.className = 'signature__splash';
  viewport.append(handover);
  tl.fromTo(handover, { opacity: 1 }, { opacity: 0, duration: 0.1 }, 0);

  ScrollTrigger.create({
    trigger: viewport,
    start: 'top top',
    end: () => `+=${(env.mobile ? 2 : 2.6) * window.innerHeight}`,
    pin: true,
    scrub: env.touch ? 0.5 : 1,
    animation: tl,
    invalidateOnRefresh: true,
    onToggle: (self) => { active = self.isActive; if (self.isActive) world.atmos.setTheme('#e0b08a', 0.9); }
  });
  back.autoRun(section);
  front.autoRun(section);
  void backLayers;
}
