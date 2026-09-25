/**
 * SHAKE FACTORY — bootstrap.
 * Loader → build scenes in page order (so pins measure correctly) →
 * smooth scroll → intro → three.js atmosphere (lazy, after first paint).
 */
import { env } from './core/env.js';
import { detectFormats, preload } from './core/assets.js';
import { initPointer } from './core/pointer.js';
import { initScroll } from './core/scroll.js';
import { autoReveal } from './core/text.js';
import { world } from './core/world.js';
import { buildNav } from './scenes/nav.js';
import { buildStory, buildStoryStatic } from './scenes/story.js';
import { buildProducts } from './scenes/products.js';
import { buildIngredients } from './scenes/ingredients.js';
import { buildReel } from './scenes/reel.js';
import { buildSignature } from './scenes/signature.js';
import { buildFinale } from './scenes/finale.js';
import { buildDrift } from './scenes/drift.js';
import { buildStatic } from './scenes/static.js';

/** What must be decoded before the first frame of the film. */
const CRITICAL = ['strawberry-closeup', 'strawberry-side', 'banana-whole', 'mango-whole', 'blueberry-single', 'strawberry-front', 'almond', 'cashew', 'pistachio', 'chocolate-chunk', 'ice-cube'];

function loader(progressEl) {
  const count = progressEl.querySelector('.loader__count b');
  const word = progressEl.querySelector('.loader__word');
  const bar = progressEl.querySelector('.loader__bar i');
  const shown = { p: 0 };
  const render = () => {
    const p = Math.round(shown.p * 100);
    count.textContent = p;
    word.style.setProperty('--p', `${p}%`);
    bar.style.setProperty('--s', shown.p);
  };
  return {
    set: (p) => gsap.to(shown, { p, duration: 0.6, ease: 'power2.out', onUpdate: render }),
    done: () => new Promise((resolve) => {
      gsap.to(shown, { p: 1, duration: 0.5, onUpdate: render, onComplete: () => {
        gsap.to(progressEl, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut', delay: 0.15, onComplete: () => { progressEl.remove(); resolve(); } });
      } });
    })
  };
}

async function loadAtmosphere() {
  if (env.reduced) return;
  try {
    const { createAtmosphere } = await import('./fx/atmosphere.js');
    world.atmos = createAtmosphere(document.querySelector('.atmos'));
    world.atmos.setTheme('#ffd9c4', 1);
  } catch (err) {
    console.warn('[atmosphere] WebGL unavailable — continuing without particles', err);
  }
}

async function boot() {
  gsap.registerPlugin(ScrollTrigger);
  const ld = loader(document.querySelector('.loader'));
  const started = performance.now();
  await detectFormats();
  initPointer();
  initScroll();
  buildNav();

  const pre = preload(CRITICAL, (p) => ld.set(p * 0.9));

  let story = null;
  if (env.reduced) {
    buildStoryStatic(document.querySelector('#story'));
    buildStatic();
  } else {
    // build in page order — each pin measures the page above it
    story = buildStory(document.querySelector('#story'));
    buildProducts(document.querySelector('#shakes'));
    buildIngredients(document.querySelector('#ingredients'));
    buildReel(document.querySelector('#reel'));
    buildSignature(document.querySelector('#signature'));
    buildFinale(document.querySelector('#finale'));
    buildDrift();
  }
  autoReveal();

  await pre;
  // keep the loader up long enough to read the wordmark
  const wait = Math.max(0, 1300 - (performance.now() - started));
  await new Promise((r) => setTimeout(r, wait));
  await ld.done();
  document.body.classList.remove('is-loading');
  ScrollTrigger.refresh();
  story?.intro();
  requestAnimationFrame(() => setTimeout(loadAtmosphere, 300));
}

boot();
