/**
 * The film conductor: stitches the acts into ONE pinned, scroll-scrubbed
 * timeline so the story is continuous (no section seams), and drives the
 * chapter/timeline UI.
 */
import { env } from '../core/env.js';
import { buildHero } from './hero.js';
import { buildMix, MIX_START } from './mix.js';
import { buildReveal, REVEAL_START } from './reveal.js';
import { world } from '../core/world.js';
import { createLayer } from '../core/depth.js';

export const STORY_BEATS = 20;

const CHAPTERS = [
  [0, 'The strawberry'], [1, 'The fruit'], [2.6, 'The explosion'], [4, 'The crash'], [5, 'The splash'],
  [6.5, 'The knife'], [8.3, 'The slices'], [9.2, 'The mixer'], [12.9, 'The milk'], [14.2, 'The blend'],
  [16, 'The shake'], [18, 'The factory']
];

export function buildStory(root) {
  const q = (s) => root.querySelector(s);
  const covers = { flash: q('.cover--flash'), splash: q('.cover--splash'), cream: q('.cover--cream'), slash: q('.slash') };
  const texts = { giant: q('.story-text--giant'), knife: q('.story-text--knife'), jar: q('.story-text--jar'), milk: q('.story-text--milk') };

  const hero = buildHero(q('[data-stage="hero"]'), { covers, texts });
  const mix = buildMix(q('[data-stage="mix"]'), { covers, texts });
  const reveal = buildReveal(q('[data-stage="reveal"]'), { covers });

  const master = gsap.timeline({ defaults: { ease: 'none' } });
  master.add(hero.tl, 0).add(mix.tl, MIX_START).add(reveal.tl, REVEAL_START);
  master.set(q('[data-stage="hero"]'), { visibility: 'hidden' }, 9.95);
  master.to({}, { duration: Math.max(0, STORY_BEATS - master.duration()) });

  // chapter + timeline UI
  const num = q('.chapter__num'), name = q('.chapter__name'), bar = q('.timeline i'), cue = q('.scroll-cue');
  let current = -1;
  const updateUI = (progress) => {
    const beat = progress * STORY_BEATS;
    let idx = 0;
    for (let i = 0; i < CHAPTERS.length; i++) if (beat >= CHAPTERS[i][0]) idx = i;
    if (idx !== current) {
      current = idx;
      num.textContent = String(idx + 1).padStart(2, '0');
      name.textContent = CHAPTERS[idx][1];
      gsap.fromTo([num, name], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, overwrite: true });
    }
    bar.style.transform = `scaleX(${progress.toFixed(4)})`;
    cue.style.opacity = progress > 0.02 ? 0 : 1;
    world.atmos.setPush(Math.min(1, beat / 10) * 0.35);
  };

  const scenes = [hero.scene, mix.scene, reveal.scene];
  ScrollTrigger.create({
    trigger: root,
    start: 'top top',
    end: () => `+=${STORY_BEATS * env.beat * window.innerHeight}`,
    pin: true,
    scrub: env.touch ? 0.6 : 1.1,
    animation: master,
    invalidateOnRefresh: true,
    onUpdate: (self) => updateUI(self.progress),
    onToggle: (self) => {
      for (const s of scenes) (self.isActive ? s.start() : s.stop());
      document.body.classList.toggle('in-story', self.isActive);
    },
    onLeave: () => world.atmos.setTheme('#ffffff', 0.8),
    onEnterBack: () => world.atmos.setTheme('#ffc4cf', 1)
  });
  for (const s of scenes) s.start();
  updateUI(0);

  return { intro: hero.intro, master };
}

/** Reduced motion: a calm, static three-frame version of the story. */
export function buildStoryStatic(root) {
  root.classList.add('is-static');
  const frame = (stage, id, o) => createLayer(id, { parent: root.querySelector(`[data-stage="${stage}"]`), depth: 0.8, light: false, blur: false, ...o });
  frame('hero', 'strawberry-closeup', { size: 46, eager: true });
  frame('mix', 'jar-with-milk', { size: 34 });
  frame('reveal', 'shake-strawberry-cloud', { size: 24, z: 60 });
}
