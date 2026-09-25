/**
 * Stand-in renderer helpers.
 *
 * Stand-ins are temporary, locally rendered layers with the exact ids of the
 * photographic assets, so the whole site works before the Hugging Face
 * photographs exist. They are drawn as SVG (volume gradients + lighting
 * filters for surface texture) and rasterised with sharp/librsvg.
 */

/** Deterministic PRNG (mulberry32). */
export function rng(seed = 1) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  next.range = (lo, hi) => lo + next() * (hi - lo);
  next.pick = (arr) => arr[Math.floor(next() * arr.length)];
  next.sign = () => (next() < 0.5 ? -1 : 1);
  return next;
}

let counter = 0;
/** Unique id for defs (gradients, filters, clip paths). */
export const uid = (p = 'd') => `${p}${(++counter).toString(36)}`;

export const f = (n) => Math.round(n * 10) / 10;
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Catmull-Rom spline through points → SVG path (closed by default). */
export function smoothPath(pts, closed = true, tension = 1) {
  const n = pts.length;
  const p = (i) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
    const c1 = [p1[0] + ((p2[0] - p0[0]) / 6) * tension, p1[1] + ((p2[1] - p0[1]) / 6) * tension];
    const c2 = [p2[0] - ((p3[0] - p1[0]) / 6) * tension, p2[1] - ((p3[1] - p1[1]) / 6) * tension];
    d += `C${f(c1[0])},${f(c1[1])} ${f(c2[0])},${f(c2[1])} ${f(p2[0])},${f(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}

/** Straight polygon path. */
export const polyPath = (pts) => `M${pts.map(([x, y]) => `${f(x)},${f(y)}`).join('L')}Z`;

/** Irregular organic outline around (cx, cy). */
export function blobPoints(cx, cy, rx, ry, { n = 14, jitter = 0.08, rot = 0, rand = Math.random } = {}) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const k = 1 + (rand() * 2 - 1) * jitter;
    const x = Math.cos(t) * rx * k, y = Math.sin(t) * ry * k;
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return pts;
}
export const blob = (cx, cy, rx, ry, o) => smoothPath(blobPoints(cx, cy, rx, ry, o));

/** Smooth 1-D profile from [t, value] control points (monotone t). */
export function profile(ctrl) {
  return (t) => {
    if (t <= ctrl[0][0]) return ctrl[0][1];
    for (let i = 1; i < ctrl.length; i++) {
      if (t <= ctrl[i][0]) {
        const [t0, v0] = ctrl[i - 1], [t1, v1] = ctrl[i];
        const u = (t - t0) / (t1 - t0);
        const s = u * u * (3 - 2 * u);
        return v0 + (v1 - v0) * s;
      }
    }
    return ctrl[ctrl.length - 1][1];
  };
}

// ── defs ──────────────────────────────────────────────────────────────────

export function radial(id, stops, { cx = 0.5, cy = 0.5, r = 0.5, fx, fy, units } = {}) {
  const u = units ? ` gradientUnits="${units}"` : '';
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}"${fx !== undefined ? ` fx="${fx}" fy="${fy}"` : ''}${u}>${stopsXml(stops)}</radialGradient>`;
}
export function linear(id, stops, { x1 = 0, y1 = 0, x2 = 0, y2 = 1, units } = {}) {
  const u = units ? ` gradientUnits="${units}"` : '';
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${u}>${stopsXml(stops)}</linearGradient>`;
}
function stopsXml(stops) {
  return stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}"${a !== 1 ? ` stop-opacity="${a}"` : ''}/>`)
    .join('');
}

/**
 * Surface texture: fractal noise as a height map, lit with diffuse +
 * specular lighting, multiplied onto the source. The workhorse that makes
 * cookies crumbly, chocolate satin, nuts grainy and fruit glossy.
 */
export function texture(id, {
  freq = 0.04, oct = 4, seed = 1, depth = 5, diffuse = 1.22, spec = 0.5, exp = 20,
  az = 225, el = 52, specColor = '#fff', type = 'fractalNoise', contrast = 1.4, bias = -0.2
} = {}) {
  return `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%" color-interpolation-filters="sRGB">
  <feTurbulence type="${type}" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}" result="n"/>
  <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${contrast} ${bias}" result="h"/>
  <feDiffuseLighting in="h" surfaceScale="${depth}" lighting-color="#fff" result="d"><feDistantLight azimuth="${az}" elevation="${el}"/></feDiffuseLighting>
  <feSpecularLighting in="h" surfaceScale="${depth}" specularConstant="${spec}" specularExponent="${exp}" lighting-color="${specColor}" result="s"><feDistantLight azimuth="${az}" elevation="${el + 6}"/></feSpecularLighting>
  <feComposite in="SourceGraphic" in2="d" operator="arithmetic" k1="${diffuse}" result="lit"/>
  <feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>
  <feComposite in="lit" in2="s2" operator="arithmetic" k2="1" k3="0.55" result="o"/>
  <feComposite in="o" in2="SourceAlpha" operator="in"/>
</filter>`;
}

export const blurFilter = (id, sd, pad = 30) =>
  `<filter id="${id}" x="-${pad}%" y="-${pad}%" width="${100 + pad * 2}%" height="${100 + pad * 2}%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;

/** Grain/mottling mask (e.g. blueberry bloom, frost on glass). */
export function mottle(id, { freq = 0.05, oct = 3, seed = 2, alpha = 1, bias = -0.3 } = {}) {
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%">
  <feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}"/>
  <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 ${alpha * 2.2} ${bias}"/>
  <feComposite in2="SourceAlpha" operator="in"/>
  <feComposite in="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0"/>
</filter>`;
}

// ── building blocks ───────────────────────────────────────────────────────

/**
 * Volume shading for a convex shape: rim occlusion + soft key highlight +
 * bounce light, all clipped to the shape. Adds the "real object" roundness.
 */
export function volume(shapeD, { box, light = [0.34, 0.28], rim = 0.5, hi = 0.5, hiSize = 0.32, bounce = null, rimColor = '#000' }) {
  const [x, y, w, h] = box;
  const clip = uid('c'), gr = uid('g'), gh = uid('g'), bl = uid('b');
  const defs = [
    `<clipPath id="${clip}"><path d="${shapeD}"/></clipPath>`,
    radial(gr, [[0, rimColor, 0], [0.62, rimColor, 0], [1, rimColor, rim]], { cx: 0.46, cy: 0.44, r: 0.62 }),
    radial(gh, [[0, '#fff', hi], [1, '#fff', 0]]),
    blurFilter(bl, Math.max(w, h) * 0.04)
  ];
  let body = `<g clip-path="url(#${clip})"><rect x="${f(x - w * 0.1)}" y="${f(y - h * 0.1)}" width="${f(w * 1.2)}" height="${f(h * 1.2)}" fill="url(#${gr})"/>`;
  body += `<ellipse cx="${f(x + w * light[0])}" cy="${f(y + h * light[1])}" rx="${f(w * hiSize)}" ry="${f(h * hiSize * 0.8)}" fill="url(#${gh})" filter="url(#${bl})"/>`;
  if (bounce) {
    const gb = uid('g');
    defs.push(radial(gb, [[0, bounce, 0.45], [1, bounce, 0]]));
    body += `<ellipse cx="${f(x + w * 0.62)}" cy="${f(y + h * 0.95)}" rx="${f(w * 0.45)}" ry="${f(h * 0.18)}" fill="url(#${gb})"/>`;
  }
  body += '</g>';
  return { defs: defs.join(''), body };
}

/** A water droplet resting on a surface: lens-dark edge, caustic, specular. */
export function droplet(x, y, r, { tint = '#000', rot = 0 } = {}) {
  const g1 = uid('g'), g2 = uid('g');
  const defs =
    radial(g1, [[0, '#fff', 0.05], [0.7, tint, 0.12], [1, tint, 0.45]], { cx: 0.45, cy: 0.4 }) +
    radial(g2, [[0, '#fff', 0.85], [1, '#fff', 0]]);
  const ry = r * 0.86;
  const body = `<g transform="rotate(${f(rot)} ${f(x)} ${f(y)})">
<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(ry)}" fill="url(#${g1})"/>
<path d="M${f(x - r * 0.55)},${f(y + ry * 0.45)} Q${f(x)},${f(y + ry * 1.05)} ${f(x + r * 0.6)},${f(y + ry * 0.42)}" stroke="#fff" stroke-opacity="0.55" stroke-width="${f(r * 0.16)}" fill="none" stroke-linecap="round"/>
<ellipse cx="${f(x - r * 0.35)}" cy="${f(y - ry * 0.38)}" rx="${f(r * 0.28)}" ry="${f(r * 0.2)}" fill="url(#${g2})"/>
</g>`;
  return { defs, body };
}

/** Collects defs + body fragments, then serialises a complete SVG document. */
export class Doc {
  constructor(w, h) { this.w = w; this.h = h; this.defs = []; this.body = []; }
  def(...d) { this.defs.push(...d); return this; }
  add(...b) { this.body.push(...b); return this; }
  use(part) { if (part.defs) this.defs.push(part.defs); if (part.body) this.body.push(part.body); return this; }
  toString() {
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${this.w}" height="${this.h}" viewBox="0 0 ${this.w} ${this.h}"><defs>${this.defs.join('')}</defs>${this.body.join('')}</svg>`;
  }
}

/** Soft contact shadow ellipse. */
export function contactShadow(cx, cy, rx, ry, opacity = 0.35) {
  const g = uid('g'), bl = uid('b');
  return {
    defs: radial(g, [[0, '#1a0d08', opacity], [1, '#1a0d08', 0]]) + blurFilter(bl, ry * 0.4, 50),
    body: `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${g})" filter="url(#${bl})"/>`
  };
}

/**
 * Places a finished part (a Doc rendered at its own size) into another doc
 * via nesting: wraps its body in a transformed group and merges its defs.
 */
export function place(part, { x = 0, y = 0, s = 1, rot = 0, sx, sy, opacity = 1, cx, cy } = {}) {
  const ox = cx ?? part.w / 2, oy = cy ?? part.h / 2;
  const scale = sx !== undefined ? `${sx} ${sy ?? sx}` : `${s}`;
  return {
    defs: part.defs.join(''),
    body: `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${scale}) translate(${f(-ox)} ${f(-oy)})"${opacity !== 1 ? ` opacity="${opacity}"` : ''}>${part.body.join('')}</g>`
  };
}
