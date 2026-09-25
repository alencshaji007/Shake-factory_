/**
 * Reusable cinematic animation building blocks shared by every scene.
 */
import { env } from './env.js';

/** Endless, organic idle float on a layer's idle wrapper. */
export function idleFloat(layer, { amp = 12, rot = 6, dur = 5, delay = 0 } = {}) {
  if (env.reduced) return null;
  const k = 0.6 + (layer.depth ?? 0.5);
  return gsap.to(layer.i, {
    y: `+=${(amp * k).toFixed(1)}`, x: `+=${(amp * 0.4 * k).toFixed(1)}`, rotation: `+=${(rot * k).toFixed(1)}`,
    duration: dur * gsap.utils.random(0.8, 1.25), delay, ease: 'sine.inOut', yoyo: true, repeat: -1
  });
}

/**
 * Motion blur keyframes for a fast move: sharp → smeared → sharp.
 * Add to a timeline alongside the move itself.
 */
export function motionBlur(target, { amount = 10, duration = 1, stretch = 0 } = {}) {
  if (!env.blur) return gsap.timeline();
  const tl = gsap.timeline();
  tl.to(target, { filter: `blur(${amount}px)`, duration: duration * 0.45, ease: 'power2.in' })
    .to(target, { filter: 'blur(0px)', duration: duration * 0.55, ease: 'power2.out' });
  if (stretch) tl.to(target, { scaleX: 1 + stretch, duration: duration * 0.45, ease: 'power2.in' }, 0).to(target, { scaleX: 1, duration: duration * 0.55 }, duration * 0.45);
  return tl;
}

/** Camera shake on a DepthScene camera (decaying jitter). */
export function cameraShake(cam, { strength = 24, duration = 0.5, steps = 10 } = {}) {
  const tl = gsap.timeline();
  for (let i = 0; i < steps; i++) {
    const k = 1 - i / steps;
    tl.to(cam, { shakeX: gsap.utils.random(-1, 1) * strength * k, shakeY: gsap.utils.random(-1, 1) * strength * k, duration: duration / steps, ease: 'none' });
  }
  return tl.to(cam, { shakeX: 0, shakeY: 0, duration: duration / steps });
}

/** Quick light flash (impact, cut, blend). */
export function flash(el, { peak = 0.9, duration = 0.5 } = {}) {
  return gsap.timeline().to(el, { opacity: peak, duration: duration * 0.2, ease: 'power2.out' }).to(el, { opacity: 0, duration: duration * 0.8, ease: 'power2.in' });
}

/**
 * Explodes layers outward from a centre to their destinations
 * (layer.dest = { x, y, rot, scale }), near layers faster and larger.
 */
export function burst(layers, { duration = 1, stagger = 0.012, ease = 'expo.out' } = {}) {
  const tl = gsap.timeline();
  layers.forEach((l, idx) => {
    const d = l.dest;
    tl.fromTo(l.m,
      { x: 0, y: 0, scale: 0.15, rotation: d.rot0 ?? 0, opacity: 0 },
      { x: d.x, y: d.y, scale: d.scale ?? 1, rotation: d.rot, opacity: d.opacity ?? 1, duration: duration * (1.15 - l.depth * 0.35), ease }, idx * stagger);
  });
  return tl;
}

/** Layer flies toward (and past) the camera: grows, blurs, fades. */
export function flyThrough(layer, { to = {}, duration = 1, blur = 18 } = {}) {
  const tl = gsap.timeline();
  tl.to(layer.m, { scale: to.scale ?? 6, x: to.x ?? 0, y: to.y ?? 0, rotation: to.rot ?? 90, duration, ease: 'expo.in' }, 0);
  if (env.blur) tl.to(layer.m, { filter: `blur(${blur}px)`, duration: duration * 0.6, ease: 'power2.in' }, duration * 0.4);
  tl.to(layer.m, { opacity: 0, duration: duration * 0.2, ease: 'none' }, duration * 0.8);
  return tl;
}
