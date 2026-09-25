/**
 * Three.js atmosphere — it *enhances* the photography, never replaces it:
 * warm bokeh, floating dust/sugar motes and soft light, rendered behind the
 * photographic layers. Its camera is driven by scroll + pointer so the whole
 * site shares one sense of depth. No fake 3D food here.
 */
import * as THREE from '../../vendor/three.module.min.js';
import { env } from '../core/env.js';
import { pointer } from '../core/pointer.js';

function spriteTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.8)');
  grad.addColorStop(0.6, 'rgba(255,255,255,0.18)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makePoints({ count, spread, size, opacity, palette, map }) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const speed = new Float32Array(count);
  const color = new THREE.Color();
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread[0];
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread[1];
    pos[i * 3 + 2] = -Math.random() * spread[2] + 12;
    color.set(palette[Math.floor(Math.random() * palette.length)]);
    col.set([color.r, color.g, color.b], i * 3);
    speed[i] = 0.3 + Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size, map, vertexColors: true, transparent: true, opacity, depthWrite: false,
    blending: THREE.AdditiveBlending, sizeAttenuation: true
  });
  const pts = new THREE.Points(geo, mat);
  pts.userData = { speed, spread };
  return pts;
}

export function createAtmosphere(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(env.dpr);
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x120a07, 0.018);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
  camera.position.set(0, 0, 30);

  const map = spriteTexture();
  const warm = ['#ffb38a', '#ff8f7a', '#ffd6a8', '#f59e1b', '#ffe9d6'];
  const bokeh = makePoints({ count: env.count(90), spread: [90, 60, 70], size: 3.4, opacity: 0.22, palette: warm, map });
  const dust = makePoints({ count: env.count(1100), spread: [80, 55, 80], size: 0.22, opacity: 0.7, palette: ['#fff4e6', '#ffe0c4', '#ffd0d6'], map });
  const sparks = makePoints({ count: env.count(160), spread: [70, 45, 50], size: 0.55, opacity: 0.9, palette: ['#ffffff', '#fff1d8'], map });
  scene.add(bokeh, dust, sparks);

  const state = {
    tint: new THREE.Color('#ffffff'), tintTarget: new THREE.Color('#ffffff'),
    push: 0, drift: 0, speed: 1, burst: 0, camX: 0, camY: 0, visible: true, intensity: 1
  };

  const resize = () => {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  const animate = (pts, dt, rise) => {
    const p = pts.geometry.attributes.position;
    const { speed, spread } = pts.userData;
    for (let i = 0; i < p.count; i++) {
      let y = p.array[i * 3 + 1] + speed[i] * dt * rise * state.speed;
      let z = p.array[i * 3 + 2] + state.burst * speed[i] * dt * 30;
      if (y > spread[1] / 2) y = -spread[1] / 2;
      if (z > 20) z = -spread[2] + 12;
      p.array[i * 3 + 1] = y;
      p.array[i * 3 + 2] = z;
    }
    p.needsUpdate = true;
  };

  let last = performance.now();
  const tick = () => {
    if (!state.visible || document.hidden) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    animate(dust, dt, 0.6);
    animate(sparks, dt, 1.2);
    animate(bokeh, dt, 0.25);
    state.burst *= 0.94;
    state.tint.lerp(state.tintTarget, 0.04);
    for (const pts of [bokeh, dust, sparks]) pts.material.color.copy(state.tint);
    bokeh.material.opacity = 0.22 * state.intensity;
    dust.material.opacity = 0.7 * state.intensity;
    camera.position.x += (pointer.x * 2.4 + state.camX - camera.position.x) * 0.05;
    camera.position.y += (-pointer.y * 1.6 + state.camY - camera.position.y) * 0.05;
    camera.position.z = 30 - state.push * 22;
    camera.lookAt(0, 0, -30);
    renderer.render(scene, camera);
  };
  gsap.ticker.add(tick);
  canvas.classList.add('is-ready');

  return {
    state,
    /** Tint the particles for the current scene. */
    setTheme(hex, intensity = 1) { state.tintTarget.set(hex); gsap.to(state, { intensity, duration: 1.2 }); },
    /** Dolly the particle camera (0 … 1). */
    setPush(v) { state.push = v; },
    setCamera(x, y) { state.camX = x; state.camY = y; },
    /** Particles rush toward the lens (explosions, blends). */
    burst(amount = 1) { state.burst = amount; },
    setSpeed(v) { state.speed = v; },
    setVisible(v) { state.visible = v; canvas.style.visibility = v ? '' : 'hidden'; }
  };
}
