/**
 * Smoothed, normalised pointer (-1 … 1). One listener for the whole site;
 * scenes read `pointer.x / pointer.y` in their render loops.
 */
import { env } from './env.js';

export const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

export function initPointer() {
  if (env.touch || env.reduced) return;
  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.tx = 0; pointer.ty = 0; });
  gsap.ticker.add(() => {
    pointer.x += (pointer.tx - pointer.x) * 0.075;
    pointer.y += (pointer.ty - pointer.y) * 0.075;
  });
}

/**
 * Elegant product tilt: mouse right → rotateY, mouse up → rotateX,
 * plus a whisper of translate/scale. Runs only while `isActive()`.
 */
export function tilt(el, { rx = 9, ry = 14, move = 16, scale = 0.025, isActive = () => true } = {}) {
  if (env.touch || env.reduced) return () => {};
  const set = {
    rx: gsap.quickTo(el, 'rotationX', { duration: 0.9, ease: 'power3' }),
    ry: gsap.quickTo(el, 'rotationY', { duration: 0.9, ease: 'power3' }),
    x: gsap.quickTo(el, 'x', { duration: 1.1, ease: 'power3' }),
    y: gsap.quickTo(el, 'y', { duration: 1.1, ease: 'power3' }),
    s: gsap.quickTo(el, 'scale', { duration: 1.1, ease: 'power3' })
  };
  const tick = () => {
    if (!isActive()) return;
    set.ry(pointer.x * ry);
    set.rx(-pointer.y * rx);
    set.x(pointer.x * move);
    set.y(pointer.y * move * 0.6);
    set.s(1 + (Math.abs(pointer.x) + Math.abs(pointer.y)) * scale * 0.5);
  };
  gsap.ticker.add(tick);
  return () => gsap.ticker.remove(tick);
}
