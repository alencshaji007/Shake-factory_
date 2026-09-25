/**
 * Environment: motion preference, input type and a device tier that every
 * scene uses to scale particle counts, blur and scroll lengths.
 */
const mq = (q) => window.matchMedia(q).matches;

const reduced = mq('(prefers-reduced-motion: reduce)');
const touch = mq('(hover: none), (pointer: coarse)');
const mobile = mq('(max-width: 860px)');
const cores = navigator.hardwareConcurrency || 4;
const memory = navigator.deviceMemory || 4;

const forced = new URLSearchParams(location.search).get('tier'); // QA override: ?tier=low|mid|high
const tier = ['low', 'mid', 'high'].includes(forced) ? forced : mobile || cores <= 4 || memory <= 4 ? 'low' : cores >= 8 && memory >= 8 ? 'high' : 'mid';
const density = { low: 0.45, mid: 0.75, high: 1 }[tier];

export const env = {
  reduced,
  touch,
  mobile,
  tier,
  density,
  /** Scale a desktop object count down for the current device. */
  count: (n) => Math.max(1, Math.round(n * density)),
  /** Depth-of-field blur is expensive — only on capable devices. */
  blur: tier !== 'low',
  /** Viewport heights of scroll per story "beat". */
  beat: mobile ? 0.62 : 0.8,
  dpr: Math.min(window.devicePixelRatio || 1, tier === 'high' ? 1.75 : 1.4)
};

document.documentElement.dataset.tier = tier;
if (reduced) document.documentElement.classList.add('reduced-motion');

export const vw = (n) => (n * window.innerWidth) / 100;
export const vh = (n) => (n * window.innerHeight) / 100;
/** Function-based values re-evaluate on ScrollTrigger refresh (resize-safe). */
export const VW = (n) => () => vw(n);
export const VH = (n) => () => vh(n);
