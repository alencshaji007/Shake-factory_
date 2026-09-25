/**
 * The ingredients never stop. After the film, fixed back/front drift layers
 * keep photographic ingredients moving through every section: flying across,
 * rotating behind headings, scattering, falling from the top, bouncing,
 * entering from outside the viewport and leaving it again.
 *
 * Each section with data-drift="<name>" gets its flights, scrubbed by its
 * own scroll range. Back layers pass behind the content, front layers over it.
 */
import { env, vw, vh } from '../core/env.js';
import { DepthScene } from '../core/depth.js';
import { sizeOf } from '../data/ingredients.js';

/** flight = [asset, layer, depth, from{x,y,r}, to{x,y,r}, extra] — x/y in vw/vh from centre */
const FLIGHTS = {
  about: [
    ['strawberry-front', 'front', 0.95, { x: -75, y: 25, r: -60 }, { x: 80, y: -35, r: 220 }],
    ['banana-whole', 'back', 0.4, { x: 26, y: -8, r: -20 }, { x: 14, y: -26, r: 320 }],
    ['mango-slice', 'back', 0.35, { x: -60, y: -20, r: 10 }, { x: -18, y: -30, r: -30 }],
    ['cashew', 'front', 0.9, { x: -34, y: 50, r: 0 }, { x: -26, y: -40, r: 160 }],
    ['blueberry-single', 'front', 0.7, { x: 70, y: 30, r: 0 }, { x: -70, y: 30, r: -540 }, 'bounce'],
    ['pistachio', 'back', 0.3, { x: 40, y: 40, r: 0 }, { x: 34, y: -50, r: 200 }]
  ],
  products: [
    ['pistachio', 'front', 0.85, { x: 0, y: 10, r: 0 }, { x: -55, y: -40, r: -300 }],
    ['pistachio', 'back', 0.35, { x: 0, y: 10, r: 0 }, { x: 45, y: -30, r: 260 }],
    ['pistachio', 'front', 0.92, { x: 0, y: 10, r: 0 }, { x: 60, y: 45, r: 380 }],
    ['nut-pieces', 'back', 0.3, { x: 0, y: 10, r: 0 }, { x: -40, y: 38, r: -200 }],
    ['almond', 'back', 0.25, { x: 0, y: 10, r: 0 }, { x: 20, y: -48, r: 150 }]
  ],
  ingredients: [
    ['chocolate-chunk', 'front', 0.92, { x: -30, y: -70, r: 0 }, { x: -24, y: 70, r: 400 }],
    ['chocolate-dark-piece', 'back', 0.4, { x: 36, y: -70, r: 30 }, { x: 30, y: 70, r: -260 }],
    ['chocolate-shavings', 'front', 0.85, { x: 10, y: -80, r: -20 }, { x: 16, y: 80, r: 200 }]
  ],
  signature: [
    ['blueberry-single', 'front', 0.8, { x: -70, y: 34, r: 0 }, { x: 70, y: 34, r: 600 }, 'bounce'],
    ['blueberry-single', 'front', 0.6, { x: -75, y: 40, r: 0 }, { x: 75, y: 40, r: 500 }, 'bounce'],
    ['mango-slice', 'back', 0.3, { x: 60, y: -30, r: 20 }, { x: -60, y: -20, r: -40 }]
  ]
};

export function buildDrift() {
  const back = new DepthScene(document.querySelector('.drift--back'), { pointer: 1.3 });
  const front = new DepthScene(document.querySelector('.drift--front'), { pointer: 2 });
  let activeCount = 0;
  const setRun = (on) => {
    activeCount += on ? 1 : -1;
    if (activeCount > 0) { back.start(); front.start(); } else { back.stop(); front.stop(); }
  };

  for (const section of document.querySelectorAll('[data-drift]')) {
    const flights = FLIGHTS[section.dataset.drift];
    if (!flights) continue;
    const list = flights.slice(0, Math.max(2, env.count(flights.length)));
    const tl = gsap.timeline({ defaults: { ease: 'none' } });
    for (const [id, layer, depth, from, to, extra] of list) {
      const scene = layer === 'front' ? front : back;
      const l = scene.add(id, { depth, size: sizeOf(id), opacity: 0 });
      tl.fromTo(l.m, { x: vw(from.x), y: vh(from.y), rotation: from.r, opacity: 0 }, { x: vw(to.x), rotation: to.r, duration: 1 }, 0)
        .to(l.m, { opacity: 1, duration: 0.12 }, 0)
        .to(l.m, { opacity: 0, duration: 0.12 }, 0.88);
      if (extra === 'bounce') {
        // blueberries bounce across the viewport
        const hops = 4;
        for (let k = 0; k < hops; k++) {
          tl.to(l.m, { y: vh(to.y - 26 / (k + 1)), duration: 0.5 / hops, ease: 'power2.out' }, k / hops)
            .to(l.m, { y: vh(to.y), duration: 0.5 / hops, ease: 'power2.in' }, k / hops + 0.5 / hops);
        }
      } else {
        tl.fromTo(l.m, { y: vh(from.y) }, { y: vh(to.y), duration: 1 }, 0);
      }
    }
    ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.2,
      animation: tl,
      invalidateOnRefresh: true,
      onToggle: (self) => setRun(self.isActive)
    });
  }
}
