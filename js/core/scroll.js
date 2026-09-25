/**
 * Smooth scrolling (Lenis) wired into GSAP's ticker + ScrollTrigger, and
 * anchor navigation that works across pinned sections.
 */
import { env } from './env.js';

export let lenis = null;

export function initScroll() {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  if (!env.reduced && window.Lenis) {
    lenis = new window.Lenis({ lerp: env.touch ? 0.12 : 0.085, wheelMultiplier: 0.95, smoothWheel: true, syncTouch: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-scroll-to]');
    if (!link) return;
    const hash = link.getAttribute('href');
    if (!hash || !hash.startsWith('#')) return;
    e.preventDefault();
    scrollTo(hash);
  });
}

export function scrollTo(target, { immediate = false } = {}) {
  const el = typeof target === 'string' ? (target === '#top' ? 0 : document.querySelector(target)) : target;
  if (el === null) return;
  if (lenis) lenis.scrollTo(el, { duration: immediate ? 0 : 2.2, immediate, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else if (el === 0) window.scrollTo({ top: 0 });
  else el.scrollIntoView({ behavior: env.reduced ? 'auto' : 'smooth' });
}

export const lockScroll = () => { lenis?.stop(); document.documentElement.style.overflow = 'hidden'; };
export const unlockScroll = () => { lenis?.start(); document.documentElement.style.overflow = ''; };
