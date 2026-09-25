/**
 * MADE FRESH. MADE LOADED. — a full-screen cinematic reel used as a
 * transition, not a rectangle:
 *   in:  a strawberry flies at the lens until it fills the frame → the reel
 *        appears behind it
 *   out: a water splash floods the frame → the next section appears behind it
 *
 * Footage: every slot plays its real clip (assets/video, registered in the
 * manifest) when one exists — autoplay, muted, loop, playsinline, poster,
 * loaded only when the section approaches. Missing clips fall back to a
 * photographic montage made of the same ingredient layers.
 */
import { env, vw, vh } from '../core/env.js';
import { createLayer, seeded } from '../core/depth.js';
import { video } from '../core/assets.js';
import { split } from '../core/text.js';
import { sizeOf } from '../data/ingredients.js';
import { world } from '../core/world.js';

const SLOTS = [
  ['fruit-jump', 'Fruit jumping'], ['fruit-fall', 'Fruit falling'], ['water-crash', 'Water crash'], ['knife-slice', 'Knife slicing'],
  ['milk-pour', 'Milk pouring'], ['shake-pour', 'Shake pouring'], ['cream-top', 'Cream topping']
];

// ── photographic montage shots (fallback per slot) ─────────────────────
const L = (shot, id, o = {}) => createLayer(id, { parent: shot, size: sizeOf(id), depth: 0.6, ...o });

const SHOTS = {
  'fruit-jump'(shot, r) {
    const ids = ['strawberry-front', 'blueberry-single', 'mango-cube', 'raspberry-single', 'strawberry-side', 'banana-slice', 'blueberry-single'];
    const tl = gsap.timeline();
    ids.forEach((id, i) => {
      const l = L(shot, id, { depth: r.range(0.4, 0.9), x: (i - 3) * vw(12), y: vh(70) });
      tl.to(l.m, { y: -vh(r.range(10, 30)), rotation: r.range(-180, 180), duration: 0.9, ease: 'power2.out' }, i * 0.08)
        .to(l.m, { y: vh(70), rotation: '+=120', duration: 0.9, ease: 'power2.in' }, 0.9 + i * 0.08);
    });
    return tl;
  },
  'fruit-fall'(shot, r) {
    const tl = gsap.timeline();
    for (let i = 0; i < 9; i++) {
      const id = r.pick(['strawberry-front', 'banana-slice', 'strawberry-slice', 'blueberry-group', 'mango-slice', 'raspberry-single']);
      const l = L(shot, id, { depth: r.range(0.2, 1), x: r.range(-40, 40) * vw(1), y: -vh(70) });
      tl.to(l.m, { y: vh(75), rotation: r.range(-360, 360), duration: r.range(1.2, 2), ease: 'none' }, r.range(0, 0.6));
    }
    return tl;
  },
  'water-crash'(shot) {
    const water = document.createElement('div');
    water.className = 'shot__water';
    shot.append(water);
    const berry = L(shot, 'strawberry-front', { depth: 0.85, y: -vh(70), rot: -20 });
    const crown = L(shot, 'water-splash-crown', { depth: 0.9, y: vh(18), opacity: 0, light: false });
    const drops = L(shot, 'water-droplets', { depth: 1, y: vh(4), opacity: 0, light: false });
    return gsap.timeline()
      .to(berry.m, { y: vh(22), rotation: 30, duration: 0.7, ease: 'power2.in' })
      .to(berry.m, { opacity: 0, duration: 0.05 })
      .fromTo(crown.m, { opacity: 0, scale: 0.2 }, { opacity: 1, scale: 1.2, duration: 1.2, ease: 'expo.out' }, 0.7)
      .fromTo(drops.m, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1.5, y: -vh(12), duration: 1.4, ease: 'expo.out' }, 0.72);
  },
  'knife-slice'(shot) {
    const a = L(shot, 'strawberry-front', { depth: 0.85, size: 30, alt: 'strawberry-half' });
    const b = L(shot, 'strawberry-front', { depth: 0.85, size: 30, alt: 'strawberry-half' });
    a.i.style.clipPath = 'polygon(0 0, 60% 0, 40% 100%, 0 100%)';
    b.i.style.clipPath = 'polygon(60% 0, 100% 0, 100% 100%, 40% 100%)';
    gsap.set(b.alt, { scaleX: -1 });
    const knife = L(shot, 'knife-chef', { depth: 0.9, size: 62, x: vw(40), y: -vh(40), rot: -58, light: false });
    return gsap.timeline()
      .to(knife.m, { x: -vw(40), y: vh(45), duration: 0.35, ease: 'power3.in' }, 0.5)
      .to(a.m, { x: -vw(8), rotation: -16, duration: 0.8, ease: 'expo.out' }, 0.72)
      .to(b.m, { x: vw(8), rotation: 14, duration: 0.8, ease: 'expo.out' }, 0.72)
      .to([a.alt, b.alt], { opacity: 1, duration: 0.2 }, 0.72);
  },
  'milk-pour'(shot) {
    const jar = L(shot, 'jar-with-fruit', { depth: 0.7, size: 40, y: vh(6), light: false });
    const full = L(shot, 'jar-with-milk', { depth: 0.7, size: 40, y: vh(6), opacity: 0, light: false });
    const stream = L(shot, 'milk-stream', { depth: 0.72, size: 12, y: -vh(40), light: false });
    return gsap.timeline()
      .fromTo(stream.m, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'power2.in' })
      .to(full.m, { opacity: 1, duration: 1.2 }, 0.5)
      .to(jar.m, { opacity: 0, duration: 1.2 }, 0.5)
      .to(stream.m, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.4 }, 1.6);
  },
  'shake-pour'(shot) {
    const glass = L(shot, 'shake-strawberry-cloud', { depth: 0.8, size: 26, y: vh(4), light: false });
    const stream = L(shot, 'milk-stream', { depth: 0.8, size: 10, y: -vh(38), light: false, filter: 'sepia(1) saturate(3.2) hue-rotate(-38deg) brightness(1.05)' });
    return gsap.timeline()
      .fromTo(stream.m, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4 })
      .fromTo(glass.i, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'power1.inOut' }, 0.2)
      .to(stream.m, { clipPath: 'inset(100% 0% 0% 0%)', duration: 0.3 }, 1.7);
  },
  'cream-top'(shot) {
    const glass = L(shot, 'shake-mango-blast', { depth: 0.85, size: 34, y: vh(36), light: false });
    const cream = L(shot, 'cream-swirl', { depth: 0.85, size: 24, y: -vh(70), light: false });
    const drops = L(shot, 'cream-droplets', { depth: 0.95, size: 30, y: -vh(10), opacity: 0, light: false });
    void glass;
    return gsap.timeline()
      .to(cream.m, { y: -vh(14), duration: 0.8, ease: 'power3.in' })
      .to(cream.m, { scaleY: 0.86, scaleX: 1.08, duration: 0.12, yoyo: true, repeat: 1 })
      .fromTo(drops.m, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1.4, duration: 0.9, ease: 'expo.out' }, 0.8);
  }
};

export function buildReel(section) {
  const r = seeded(61);
  const screen = section.querySelector('[data-reel]');
  const viewport = section.querySelector('.reel__viewport');
  const hudShot = section.querySelector('[data-shot]');
  const hudTime = section.querySelector('[data-timecode]');
  const small = env.mobile || env.tier === 'low';

  // slots: real clip when available, montage otherwise
  const slots = SLOTS.map(([id, label], i) => {
    const clip = video(id);
    if (clip) {
      const v = document.createElement('video');
      Object.assign(v, { muted: true, playsInline: true, loop: false, preload: 'none', poster: clip.poster });
      v.setAttribute('muted', '');
      v.setAttribute('playsinline', '');
      v.dataset.webm = small ? clip.webmSm : clip.webm;
      v.dataset.mp4 = small ? clip.mp4Sm : clip.mp4;
      screen.append(v);
      return { type: 'video', el: v, label: `${String(i + 1).padStart(2, '0')} — ${label}` };
    }
    const shot = document.createElement('div');
    shot.className = `shot shot--${id}`;
    shot.innerHTML = '<div class="shot__bg"></div>';
    screen.append(shot);
    const anim = SHOTS[id](shot, r);
    anim.pause(0);
    return { type: 'shot', el: shot, anim, label: `${String(i + 1).padStart(2, '0')} — ${label}` };
  });

  // single slot plays at a time; clips advance on `ended`, montage shots on complete
  let idx = -1, running = false, timer = null, loaded = false, t0 = performance.now();
  const loadVideos = () => {
    if (loaded) return;
    loaded = true;
    for (const s of slots) if (s.type === 'video') {
      for (const [type, src] of [['video/webm', s.el.dataset.webm], ['video/mp4', s.el.dataset.mp4]]) {
        const source = document.createElement('source');
        source.type = type;
        source.src = src;
        s.el.append(source);
      }
      s.el.load();
    }
  };
  const next = () => {
    if (!running) return;
    const prev = slots[idx];
    idx = (idx + 1) % slots.length;
    const s = slots[idx];
    hudShot.textContent = s.label;
    clearTimeout(timer);
    if (s.type === 'video') {
      s.el.currentTime = 0;
      s.el.play().catch(() => {});
      s.el.classList.add('is-on');
      s.el.onended = next;
      timer = setTimeout(next, 7000);
    } else {
      gsap.fromTo(s.el, { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' });
      s.anim.restart();
      timer = setTimeout(next, (s.anim.duration() + 0.35) * 1000);
    }
    if (prev && prev !== s) {
      if (prev.type === 'video') { prev.el.classList.remove('is-on'); setTimeout(() => prev.el.pause(), 800); }
      else gsap.to(prev.el, { opacity: 0, duration: 0.5 });
    }
  };
  const start = () => { if (running) return; running = true; loadVideos(); next(); };
  const stop = () => {
    running = false;
    clearTimeout(timer);
    for (const s of slots) if (s.type === 'video') s.el.pause(); else s.anim.pause();
  };
  gsap.ticker.add(() => {
    if (!running) return;
    const f = Math.floor(((performance.now() - t0) / 1000) * 24);
    const pad = (n) => String(n).padStart(2, '0');
    hudTime.textContent = `00:${pad(Math.floor(f / 1440) % 60)}:${pad(Math.floor(f / 24) % 60)}:${pad(f % 24)}`;
  });

  // ── transitions (scrubbed) ────────────────────────────────────────────
  const intro = section.querySelector('.reel__intro');
  const outro = section.querySelector('.reel__outro');
  const cover = document.createElement('div');
  cover.className = 'reel__cover';
  intro.append(cover);
  const berry = createLayer('strawberry-closeup', { parent: intro, depth: 0.85, size: 60, light: false });
  const splashes = ['water-splash-wide', 'water-splash-crown', 'water-droplets'].map((id, i) =>
    createLayer(id, { parent: outro, depth: 0.9, size: sizeOf(id), y: vh(20 - i * 10), light: false }));
  const lineA = section.querySelector('.reel__line--a');
  const lineB = section.querySelector('.reel__line--b');
  const charsA = split(lineA, { mask: true }).chars;
  const charsB = split(lineB, { mask: true }).chars;

  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  tl.fromTo(berry.m, { scale: 0.35, rotation: -12, y: vh(8) }, { scale: 9, rotation: 18, y: 0, duration: 0.24, ease: 'power3.in' }, 0)
    .fromTo(cover, { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.16)
    .set(berry.el, { visibility: 'hidden' }, 0.23)
    .to(cover, { opacity: 0, scale: 1.2, duration: 0.08 }, 0.24)
    .fromTo(screen, { scale: 1.25 }, { scale: 1, duration: 0.5, ease: 'power2.out' }, 0.22)
    .fromTo(charsA, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.08, stagger: 0.006, ease: 'expo.out' }, 0.3)
    .to(lineA, { opacity: 0, y: -vh(6), duration: 0.06 }, 0.46)
    .fromTo(charsB, { yPercent: 110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.08, stagger: 0.006, ease: 'expo.out' }, 0.52)
    .to(lineB, { opacity: 0, y: -vh(6), duration: 0.06 }, 0.72);
  splashes.forEach((l, i) => {
    tl.fromTo(l.m, { scale: 0.2, opacity: 0 }, { scale: 3.2 + i, opacity: 1, y: -vh(20), duration: 0.2, ease: 'power2.in' }, 0.74 + i * 0.02);
  });
  tl.fromTo(outro, { clipPath: 'circle(0% at 50% 100%)' }, { clipPath: 'circle(150% at 50% 100%)', duration: 0.16, ease: 'power2.in' }, 0.78)
    .to({}, { duration: 0.06 }, 0.94);

  ScrollTrigger.create({
    trigger: viewport,
    start: 'top top',
    end: () => `+=${(env.mobile ? 2.4 : 3.2) * window.innerHeight}`,
    pin: true,
    scrub: env.touch ? 0.5 : 1,
    animation: tl,
    invalidateOnRefresh: true,
    onToggle: (self) => { if (self.isActive) world.atmos.setTheme('#9fd3ff', 0.6); }
  });
  ScrollTrigger.create({
    trigger: section, start: 'top 150%', end: 'bottom top',
    onEnter: loadVideos, onEnterBack: loadVideos
  });
  ScrollTrigger.create({
    trigger: section, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => (self.isActive ? start() : stop())
  });
}
