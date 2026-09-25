/**
 * REAL INGREDIENTS. REAL CRAVINGS.
 * The viewport fills with photographic ingredients on many depths — some
 * behind the headline, some in front, some crossing, falling, rotating,
 * entering from outside the frame — all scrubbed by scroll.
 */
import { env, vw, vh } from '../core/env.js';
import { DepthScene, seeded } from '../core/depth.js';
import { idleFloat } from '../core/fx.js';
import { split } from '../core/text.js';
import { ALL, sizeOf } from '../data/ingredients.js';
import { world } from '../core/world.js';

const MOTIONS = ['rise', 'rise', 'enter', 'fall', 'spin', 'rise', 'enter'];

export function buildIngredients(section) {
  const rand = seeded(53);
  const back = section.querySelector('.ingredients__field--back');
  const front = section.querySelector('.ingredients__field--front');
  const stage = section.querySelector('.ingredients__stage');
  const sceneBack = new DepthScene(back, { pointer: 1.2 });
  const sceneFront = new DepthScene(front, { pointer: 1.6 });
  const tl = gsap.timeline({ defaults: { ease: 'none' } });

  const total = env.count(30);
  for (let i = 0; i < total; i++) {
    const id = ALL[(i * 7) % ALL.length];
    const isFront = i % 3 === 0;
    const depth = isFront ? rand.range(0.78, 1) : rand.range(0.1, 0.62);
    const scene = isFront ? sceneFront : sceneBack;
    const x = rand.range(-50, 50), y = rand.range(-46, 46);
    const l = scene.add(id, { depth, size: sizeOf(id) * (isFront ? 1.1 : 1), x: x * vw(1), y: y * vh(1), rot: rand.range(-180, 180) });
    idleFloat(l, { amp: 14, rot: 8 });
    const motion = MOTIONS[i % MOTIONS.length];
    const travel = 30 + depth * 90; // near things travel further (parallax)
    if (motion === 'rise') {
      tl.fromTo(l.m, { y: (y + travel * 0.5) * vh(1) }, { y: (y - travel * 0.5) * vh(1), rotation: `+=${rand.range(-90, 90) * l.dp.spin}`, duration: 1 }, 0);
    } else if (motion === 'enter') {
      const side = x < 0 ? -1 : 1;
      tl.fromTo(l.m, { x: side * vw(75), rotation: rand.range(-200, 200) }, { x: x * vw(1), rotation: rand.range(-40, 40), duration: 0.5, ease: 'power3.out' }, rand.range(0, 0.3))
        .to(l.m, { x: -side * vw(70), y: `-=${vh(travel * 0.3)}`, duration: 0.5, ease: 'power2.in' }, 0.6 + rand.range(0, 0.2));
    } else if (motion === 'fall') {
      tl.fromTo(l.m, { y: -vh(75) }, { y: vh(80), rotation: `+=${rand.range(180, 540)}`, duration: 1 }, 0);
    } else {
      tl.to(l.m, { rotation: `+=${rand.range(240, 480) * (rand() < 0.5 ? -1 : 1)}`, y: `-=${vh(travel * 0.4)}`, duration: 1 }, 0);
    }
  }

  const title = section.querySelector('.ingredients__title');
  const lines = [...title.querySelectorAll('.line')];
  lines.forEach((line) => split(line, { mask: true }));
  const chars = lines.map((line) => line.querySelectorAll('.split-char'));
  tl.fromTo(chars[0], { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.18, stagger: 0.006, ease: 'expo.out' }, 0.08)
    .fromTo(chars[1], { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.18, stagger: 0.006, ease: 'expo.out' }, 0.18)
    .fromTo(title, { scale: 0.94 }, { scale: 1.06, duration: 1 }, 0);

  ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    end: () => `+=${(env.mobile ? 1.4 : 1.8) * window.innerHeight}`,
    pin: true,
    scrub: env.touch ? 0.5 : 1,
    animation: tl,
    invalidateOnRefresh: true,
    onToggle: (self) => { if (self.isActive) world.atmos.setTheme('#ffd27a', 0.9); }
  });
  // render loops run whenever the section is on screen (pinned or not)
  sceneBack.autoRun(section);
  sceneFront.autoRun(section);
}
