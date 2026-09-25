/**
 * Accessible text splitting + cinematic reveals (chars, words, clip, blur).
 * The original text stays available to assistive tech via aria-label.
 */
import { env } from './env.js';

export function split(el, { mask = false } = {}) {
  if (el._split) return el._split;
  const label = el.getAttribute('aria-label') || el.textContent.replace(/\s+/g, ' ').trim();
  const words = [], chars = [];
  const walk = (node, target) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const parts = child.textContent.split(/(\s+)/);
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { target.append(document.createTextNode(' ')); continue; }
          const w = document.createElement('span');
          w.className = 'split-word';
          for (const ch of part) {
            const c = document.createElement('span');
            c.className = 'split-char';
            c.textContent = ch;
            chars.push(c);
            w.append(c);
          }
          words.push(w);
          if (mask) {
            const m = document.createElement('span');
            m.className = 'split-mask';
            m.append(w);
            target.append(m);
          } else target.append(w);
        }
      } else if (child.nodeType === 1) {
        const clone = child.cloneNode(false);
        walk(child, clone);
        target.append(clone);
      }
    }
  };
  const frag = document.createElement('div');
  walk(el, frag);
  el.replaceChildren(...frag.childNodes);
  el.setAttribute('aria-label', label);
  for (const c of el.children) c.setAttribute('aria-hidden', 'true');
  el._split = { words, chars };
  return el._split;
}

/** Characters rise out of a mask with a soft blur and 3D tilt. */
export function revealChars(el, { stagger = 0.025, duration = 1.1, delay = 0, blur = true } = {}) {
  const { chars } = split(el, { mask: true });
  return gsap.fromTo(chars,
    { yPercent: 110, rotationX: -70, opacity: 0, filter: blur && env.blur ? 'blur(8px)' : 'none' },
    { yPercent: 0, rotationX: 0, opacity: 1, filter: 'blur(0px)', duration, delay, stagger, ease: 'expo.out', transformOrigin: '50% 100%' });
}

/** Words fade up with blur, like a title card. */
export function revealWords(el, { stagger = 0.06, duration = 1.2, delay = 0 } = {}) {
  const { words } = split(el);
  return gsap.fromTo(words,
    { y: 40, opacity: 0, filter: env.blur ? 'blur(10px)' : 'none' },
    { y: 0, opacity: 1, filter: 'blur(0px)', duration, delay, stagger, ease: 'power3.out' });
}

/** Clip-path wipe from the left. */
export function clipReveal(el, { duration = 1.2, delay = 0 } = {}) {
  return gsap.fromTo(el, { clipPath: 'inset(-10% 100% -10% 0%)' }, { clipPath: 'inset(-10% 0% -10% 0%)', duration, delay, ease: 'expo.inOut' });
}

/** Scroll-triggered reveals for any element with data-reveal="chars|words". */
export function autoReveal(root = document) {
  for (const el of root.querySelectorAll('[data-reveal]')) {
    if (el.closest('.film-story')) continue;
    const type = el.dataset.reveal;
    if (env.reduced) continue;
    const tween = type === 'words' ? revealWords(el) : revealChars(el);
    tween.pause(0);
    ScrollTrigger.create({ trigger: el, start: 'top 85%', once: true, onEnter: () => tween.play() });
  }
}
