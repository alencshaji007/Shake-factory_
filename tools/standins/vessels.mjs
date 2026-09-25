import { Doc, blurFilter, contactShadow, f, linear, mottle, place, profile, radial, rng, smoothPath, texture, uid } from './lib.mjs';
import * as F from './fruits.mjs';
import * as P from './pantry.mjs';
import { airDrop, creamPart } from './liquids.mjs';

/** Glass silhouette from a half-width profile over [y0, y1]. */
function glassOutline(cx, y0, y1, widthFn, steps = 40) {
  const R = [], L = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, y = y0 + (y1 - y0) * t, w = widthFn(t);
    R.push([cx + w, y]);
    L.unshift([cx - w, y]);
  }
  return { d: smoothPath([...R, ...L]), R, L };
}

/** Condensation: tiny droplets + a few runs, heavier where the drink is cold. */
function condensation(d, clipId, cx, y0, y1, widthFn, rand, { count = 260, fillFrom = 0 } = {}) {
  let body = `<g clip-path="url(#${clipId})">`;
  const g = uid('g'), s = uid('g');
  d.def(radial(g, [[0, '#fff', 0.05], [0.75, '#fff', 0.12], [1, '#fff', 0.55]], { cx: 0.5, cy: 0.6 }), radial(s, [[0, '#fff', 0.95], [1, '#fff', 0]]));
  for (let i = 0; i < count; i++) {
    const t = fillFrom + Math.pow(rand(), 0.8) * (1 - fillFrom);
    const y = y0 + (y1 - y0) * t;
    const w = widthFn(t);
    const u = rand.range(-0.95, 0.95);
    const x = cx + Math.sin((u * Math.PI) / 2) * w;
    const r = rand.range(1.6, 6.5) * (1 - Math.abs(u) * 0.5);
    body += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * (1 - Math.abs(u) * 0.5))}" ry="${f(r * 1.1)}" fill="url(#${g})"/><circle cx="${f(x - r * 0.3)}" cy="${f(y - r * 0.4)}" r="${f(r * 0.28)}" fill="url(#${s})"/>`;
  }
  for (let i = 0; i < 7; i++) {
    const u = rand.range(-0.7, 0.7), t0 = rand.range(fillFrom + 0.05, 0.6), t1 = Math.min(0.98, t0 + rand.range(0.12, 0.35));
    const ya = y0 + (y1 - y0) * t0, yb = y0 + (y1 - y0) * t1;
    const x = cx + Math.sin((u * Math.PI) / 2) * widthFn(t0);
    body += `<path d="M${f(x)},${f(ya)} Q${f(x + rand.range(-6, 6))},${f((ya + yb) / 2)} ${f(x + rand.range(-4, 4))},${f(yb)}" stroke="#fff" stroke-opacity=".35" stroke-width="${f(rand.range(3, 6))}" fill="none" stroke-linecap="round"/>`;
    body += `<ellipse cx="${f(x)}" cy="${f(yb + 4)}" rx="5" ry="7" fill="url(#${g})"/><circle cx="${f(x - 1.5)}" cy="${f(yb + 2)}" r="2" fill="#fff" opacity=".8"/>`;
  }
  d.add(body + '</g>');
}

/**
 * Renders a filled glass: liquid (cylindrical shading + inner details), glass
 * highlights, rim, frost, condensation. Returns geometry for placing toppings.
 */
function filledGlass(d, spec, rand) {
  const { cx, y0, y1, width, liquid, fillTop = 0.04, details, stem, flutes = 0 } = spec;
  const outer = glassOutline(cx, y0, y1, width);
  const inset = (t) => Math.max(0, width(t) - 10);
  const inner = glassOutline(cx, y0 + (y1 - y0) * fillTop, y1 - (spec.base ?? 40), (t) => inset(fillTop + t * (1 - fillTop - (spec.base ?? 40) / (y1 - y0))));
  const clipO = uid('c'), clipI = uid('c'), gl = uid('g'), glass = uid('g'), bl = uid('b'), bl2 = uid('b'), fr = uid('m'), tx = uid('t');
  d.def(`<clipPath id="${clipO}"><path d="${outer.d}"/></clipPath>`, `<clipPath id="${clipI}"><path d="${inner.d}"/></clipPath>`,
    linear(gl, liquid.map((c, i) => [i / (liquid.length - 1), c]), { x1: 0, y1: 0, x2: 1, y2: 0 }),
    linear(glass, [[0, '#fff', 0.3], [0.1, '#fff', 0.06], [0.5, '#fff', 0.02], [0.9, '#fff', 0.08], [1, '#fff', 0.3]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
    blurFilter(bl, 5), blurFilter(bl2, 1.5), mottle(fr, { freq: 0.03, oct: 3, seed: rand() * 90 | 0, alpha: 0.4, bias: -0.1 }),
    texture(tx, { freq: 0.01, oct: 2, depth: 0.6, spec: 0.3, exp: 20, seed: rand() * 90 | 0, diffuse: 1.12 }));

  if (stem) d.add(stem);
  d.add(`<path d="${outer.d}" fill="url(#${glass})"/>`);
  d.add(`<path d="${inner.d}" fill="url(#${gl})" filter="url(#${tx})"/>`);
  if (details) d.add(`<g clip-path="url(#${clipI})">${details(inner)}</g>`);
  // cylindrical shading on the liquid
  const sh = uid('g');
  d.def(linear(sh, [[0, '#000', 0.45], [0.18, '#000', 0.05], [0.4, '#fff', 0.12], [0.62, '#000', 0], [1, '#000', 0.5]], { x1: 0, y1: 0, x2: 1, y2: 0 }));
  d.add(`<path d="${inner.d}" fill="url(#${sh})"/>`);
  // glass: frost, highlights, rim
  d.add(`<path d="${outer.d}" fill="#fff" opacity=".1" filter="url(#${fr})"/>`);
  let hl = `<g clip-path="url(#${clipO})">`;
  const hlPts = outer.L.map(([x, y]) => [x + 26, y]).slice(4, -6);
  hl += `<path d="${smoothPath(hlPts, false)}" stroke="#fff" stroke-opacity=".55" stroke-width="16" fill="none" filter="url(#${bl})"/>`;
  hl += `<path d="${smoothPath(hlPts.map(([x, y]) => [x + 26, y]), false)}" stroke="#fff" stroke-opacity=".35" stroke-width="4" fill="none" filter="url(#${bl2})"/>`;
  hl += `<path d="${smoothPath(outer.R.map(([x, y]) => [x - 20, y]).slice(6, -8), false)}" stroke="#fff" stroke-opacity=".3" stroke-width="7" fill="none" filter="url(#${bl})"/>`;
  for (let k = 0; k < flutes; k++) {
    const u = -0.8 + (1.6 * k) / (flutes - 1);
    hl += `<path d="${smoothPath(outer.R.map(([x, y], i) => [cx + (x - cx) * Math.sin((u * Math.PI) / 2), y]).slice(2, -4), false)}" stroke="#fff" stroke-opacity=".16" stroke-width="3" fill="none"/>`;
  }
  hl += '</g>';
  d.add(hl);
  d.add(`<path d="${outer.d}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>`);
  const topW = width(0);
  d.add(`<ellipse cx="${cx}" cy="${y0}" rx="${f(topW)}" ry="${f(topW * 0.12)}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="4"/>`);
  // thick glass base
  const bw = width(0.99);
  const gb = uid('g');
  d.def(linear(gb, [[0, '#fff', 0.35], [1, '#fff', 0.08]], { x1: 0, y1: 0, x2: 0, y2: 1 }));
  d.add(`<path d="M${f(cx - bw + 6)},${f(y1 - (spec.base ?? 40))} L${f(cx + bw - 6)},${f(y1 - (spec.base ?? 40))} L${f(cx + bw - 2)},${f(y1 - 4)} L${f(cx - bw + 2)},${f(y1 - 4)}Z" fill="url(#${gb})"/>`);
  condensation(d, clipO, cx, y0, y1, width, rand, { count: spec.drops ?? 260, fillFrom: fillTop + 0.02 });
  return { outer, inner, topW };
}

function straw(d, x, y, len, angle, colors, w = 26) {
  const g = uid('g');
  d.def(linear(g, [[0, colors[0]], [0.5, colors[1]], [1, colors[0]]], { x1: 0, y1: 0, x2: 1, y2: 0 }));
  let body = `<g transform="translate(${x} ${y}) rotate(${angle})"><rect x="${-w / 2}" y="0" width="${w}" height="${len}" fill="url(#${g})"/>`;
  if (colors[2]) for (let k = 0; k < len; k += 44) body += `<path d="M${-w / 2},${k} L${w / 2},${k + 20} L${w / 2},${k + 36} L${-w / 2},${k + 16}Z" fill="${colors[2]}" opacity=".9"/>`;
  body += `<ellipse cx="0" cy="0" rx="${w / 2}" ry="${w * 0.2}" fill="#2a1a12"/><rect x="${-w / 2 + 3}" y="0" width="5" height="${len}" fill="#fff" opacity=".35"/></g>`;
  d.add(body);
}

const streaks = (rand, color, n, x0, x1, y0, y1, width = 14) => {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = rand.range(x0, x1);
    const pts = [];
    for (let y = y0; y <= y0 + (y1 - y0) * rand.range(0.4, 1); y += 40) pts.push([x + Math.sin(y * 0.03 + i) * 10, y]);
    if (pts.length > 1) s += `<path d="${smoothPath(pts, false)}" stroke="${color}" stroke-width="${f(rand.range(width * 0.5, width))}" stroke-linecap="round" fill="none" opacity=".85"/>`;
  }
  return s;
};

// ── SHAKES ────────────────────────────────────────────────────────────────

export function shakeChocoOverload({ seed = 141 } = {}) {
  const rand = rng(seed);
  const d = new Doc(900, 1500);
  d.use(contactShadow(450, 1440, 260, 30, 0.5));
  const width = profile([[0, 230], [0.2, 245], [0.55, 185], [0.85, 130], [0.93, 125], [1, 150]]);
  straw(d, 540, 180, 700, 14, ['#c9a27a', '#f0dcc0', '#7a4a2a']);
  filledGlass(d, {
    cx: 450, y0: 560, y1: 1430, width, liquid: ['#2a130a', '#5a2e1a', '#7a4428', '#4a2414', '#1e0c05'], flutes: 9, base: 70,
    details: () => streaks(rand, '#1a0803', 9, 240, 660, 560, 1300, 22)
  }, rand);
  d.use(place(P.chocolateDrizzle({ seed: 3 }), { x: 450, y: 560, s: 0.33, rot: 0, sy: 0.25 }));
  d.use(creamPart(450, 590, 230, rand, { tiers: 3 }));
  d.use(place(P.chocolateChunk({ seed: 9 }), { x: 520, y: 330, s: 0.4, rot: 20 }));
  d.use(place(P.chocolateShavings({ seed: 4 }), { x: 390, y: 360, s: 0.3, rot: -10 }));
  d.use(place(P.chocolateDrizzle({ seed: 8 }), { x: 450, y: 420, s: 0.35, rot: -8 }));
  return d;
}

export function shakeStrawberryCloud({ seed = 142 } = {}) {
  const rand = rng(seed);
  const d = new Doc(900, 1500);
  d.use(contactShadow(450, 1450, 230, 28, 0.5));
  const foot = uid('g');
  d.def(linear(foot, [[0, '#fff', 0.45], [1, '#fff', 0.1]], { x1: 0, y1: 0, x2: 0, y2: 1 }));
  const stem = `<path d="M420,1260 L480,1260 L476,1395 C560,1400 600,1415 600,1430 C600,1448 300,1448 300,1430 C300,1415 340,1400 424,1395Z" fill="url(#${foot})" stroke="#fff" stroke-opacity=".45" stroke-width="3"/>`;
  const width = profile([[0, 245], [0.15, 225], [0.45, 165], [0.75, 128], [0.92, 110], [1, 40]]);
  straw(d, 360, 150, 700, -14, ['#fff', '#f3f3f3', '#e0303f']);
  filledGlass(d, {
    cx: 450, y0: 600, y1: 1280, width, liquid: ['#d77b90', '#f3a6b8', '#fbc5d0', '#f0a0b3', '#c86a80'], base: 30, stem,
    details: () => streaks(rand, '#b3122d', 7, 250, 650, 600, 1200, 18)
  }, rand);
  d.use(creamPart(450, 640, 250, rand, { tiers: 4 }));
  d.use(place(F.strawberryHalf({ seed: 3 }), { x: 560, y: 360, s: 0.24, rot: 18 }));
  d.use(place(F.strawberry({ seed: 7, drops: 3 }), { x: 400, y: 250, s: 0.26, rot: -12 }));
  return d;
}

export function shakePistachioDream({ seed = 143 } = {}) {
  const rand = rng(seed);
  const d = new Doc(900, 1500);
  d.use(contactShadow(450, 1450, 220, 26, 0.5));
  const foot = uid('g');
  d.def(linear(foot, [[0, '#fff', 0.45], [1, '#fff', 0.12]], { x1: 0, y1: 0, x2: 0, y2: 1 }));
  const stem = `<path d="M430,1120 L470,1120 L466,1390 C560,1398 610,1414 610,1430 C610,1450 290,1450 290,1430 C290,1414 340,1398 434,1390Z" fill="url(#${foot})" stroke="#fff" stroke-opacity=".45" stroke-width="3"/>`;
  const width = profile([[0, 215], [0.25, 235], [0.6, 200], [0.85, 130], [1, 30]]);
  filledGlass(d, {
    cx: 450, y0: 640, y1: 1140, width, liquid: ['#8f9f5a', '#c3d493', '#dfe9b8', '#c0d18c', '#7d8e4a'], base: 30, stem, drops: 200
  }, rand);
  d.use(creamPart(450, 680, 225, rand, { tiers: 3 }));
  d.use(place(P.nutsCrushed({ seed: 5 }), { x: 450, y: 520, s: 0.3 }));
  d.use(place(P.pistachio({ seed: 12 }), { x: 560, y: 430, s: 0.2, rot: 30 }));
  d.use(place(P.pistachio({ seed: 13 }), { x: 360, y: 470, s: 0.18, rot: -40 }));
  return d;
}

export function shakeMangoBlast({ seed = 144 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1000, 1500);
  d.use(contactShadow(470, 1450, 250, 28, 0.5));
  // mason-jar handle
  d.add(`<path d="M660,780 C800,780 820,1000 660,1060" stroke="#fff" stroke-opacity=".35" stroke-width="34" fill="none"/><path d="M660,780 C800,780 820,1000 660,1060" stroke="#fff" stroke-opacity=".55" stroke-width="4" fill="none" transform="translate(-8 0)"/>`);
  const width = profile([[0, 205], [0.06, 212], [0.12, 205], [0.2, 212], [0.9, 212], [1, 190]]);
  straw(d, 540, 170, 700, 16, ['#fff', '#f6f6f6', '#f29f05']);
  filledGlass(d, {
    cx: 460, y0: 620, y1: 1440, width, liquid: ['#d9780a', '#f6a623', '#ffc94d', '#f4a020', '#c86a05'], base: 50,
    details: (inner) => {
      let s = streaks(rand, '#ffb22e', 5, 300, 620, 640, 1300, 20);
      for (let i = 0; i < 70; i++) s += `<ellipse cx="${f(rand.range(280, 640))}" cy="${f(rand.range(640, 1380))}" rx="4" ry="5" fill="#2a1406" opacity=".75"/>`;
      void inner;
      return s;
    }
  }, rand);
  d.add(`<g opacity=".6">${[0, 1, 2].map((k) => `<path d="M${260},${f(660 + k * 22)} Q460,${f(680 + k * 22)} ${660},${f(660 + k * 22)}" stroke="#fff" stroke-width="3" fill="none"/>`).join('')}</g>`);
  d.use(creamPart(460, 650, 215, rand, { tiers: 3, tint: '#fff6e6' }));
  d.use(place(F.mangoCube({ seed: 44 }), { x: 560, y: 420, s: 0.2, rot: 12 }));
  d.use(place(F.mangoCube({ seed: 46 }), { x: 380, y: 460, s: 0.18, rot: -20 }));
  d.use(place(F.mangoCube({ seed: 47 }), { x: 470, y: 350, s: 0.16, rot: 5 }));
  return d;
}

export function shakeNuttyCaramel({ seed = 145 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1000, 1300);
  d.use(contactShadow(500, 1250, 290, 30, 0.5));
  const width = profile([[0, 255], [0.9, 232], [1, 228]]);
  straw(d, 600, 150, 600, 20, ['#c9a27a', '#f0dcc0', '#5a3a1f']);
  filledGlass(d, {
    cx: 500, y0: 640, y1: 1240, width, liquid: ['#8a5226', '#c98b4b', '#e2ac6c', '#c4833f', '#7a441c'], base: 110,
    details: () => streaks(rand, '#f2c071', 6, 280, 720, 640, 1100, 26) + streaks(rand, '#6a3510', 4, 280, 720, 640, 1100, 12)
  }, rand);
  d.use(place(P.caramelDrizzle({ seed: 2 }), { x: 500, y: 640, s: 0.38, sy: 0.22 }));
  d.use(creamPart(500, 670, 250, rand, { tiers: 3, tint: '#fff4e2' }));
  d.use(place(P.caramelDrizzle({ seed: 5 }), { x: 500, y: 520, s: 0.36, rot: 6 }));
  d.use(place(P.nutGroupSmall({ seed: 3 }), { x: 500, y: 380, s: 0.34 }));
  return d;
}

export function shakeCookieMonster({ seed = 146 } = {}) {
  const rand = rng(seed);
  const d = new Doc(900, 1600);
  d.use(contactShadow(450, 1540, 240, 28, 0.5));
  const width = profile([[0, 125], [0.12, 128], [0.2, 150], [0.3, 205], [0.38, 222], [0.95, 222], [1, 200]]);
  straw(d, 520, 250, 650, 10, ['#fff', '#f2f2f2', '#2a1a12']);
  filledGlass(d, {
    cx: 450, y0: 640, y1: 1530, width, liquid: ['#b9b0a3', '#e9e2d6', '#f6f1e8', '#e4dccf', '#a89e90'], base: 50,
    details: () => {
      let s = '';
      for (let i = 0; i < 380; i++) {
        const x = rand.range(220, 680), y = rand.range(660, 1480);
        s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rand.range(2, 9))}" ry="${f(rand.range(2, 7))}" fill="${rand() < 0.75 ? '#2a1a12' : '#5a3a22'}" opacity="${f(rand.range(0.5, 0.95))}" transform="rotate(${f(rand() * 180)} ${f(x)} ${f(y)})"/>`;
      }
      return s;
    }
  }, rand);
  d.use(creamPart(450, 660, 190, rand, { tiers: 3 }));
  d.use(place(P.cookieWhole({ seed: 81 }), { x: 470, y: 370, s: 0.34, rot: -14, sy: 0.34 }));
  d.use(place(P.cookieCrumbs({ seed: 85 }), { x: 450, y: 560, s: 0.3 }));
  return d;
}

// ── MIXING JAR ────────────────────────────────────────────────────────────

const JAR = { cx: 400, y0: 200, y1: 960 };
const jarWidth = profile([[0, 265], [0.1, 258], [0.8, 222], [0.95, 205], [1, 190]]);

function jarBase(d) {
  const g = uid('g'), gm = uid('g');
  d.def(linear(g, [[0, '#0e0e10'], [0.25, '#3c3d42'], [0.5, '#1b1b1e'], [0.8, '#4a4b50'], [1, '#0c0c0e']], { x1: 0, y1: 0, x2: 1, y2: 0 }),
    linear(gm, [[0, '#6d7075'], [0.2, '#e9ebed'], [0.5, '#9a9ea3'], [0.8, '#f2f3f4'], [1, '#6a6d72']], { x1: 0, y1: 0, x2: 1, y2: 0 }));
  d.add(`<path d="M205,950 L595,950 L610,1010 L190,1010Z" fill="url(#${gm})"/>`);
  d.add(`<path d="M170,1010 L630,1010 C650,1010 660,1030 662,1050 L680,1170 C682,1186 670,1196 650,1196 L150,1196 C130,1196 118,1186 120,1170 L138,1050 C140,1030 150,1010 170,1010Z" fill="url(#${g})"/>`);
  d.add(`<rect x="340" y="1090" width="120" height="40" rx="20" fill="#0a0a0b" stroke="#6d7075" stroke-width="3"/><circle cx="400" cy="1110" r="10" fill="#f29f05" opacity=".9"/>`);
}

function jarGlass(d, rand, { lid = true, handle = false } = {}) {
  const { cx, y0, y1 } = JAR;
  const outer = glassOutline(cx, y0, y1, jarWidth);
  const clip = uid('c'), glass = uid('g'), bl = uid('b'), bl2 = uid('b');
  d.def(`<clipPath id="${clip}"><path d="${outer.d}"/></clipPath>`,
    linear(glass, [[0, '#fff', 0.34], [0.08, '#fff', 0.08], [0.5, '#fff', 0.02], [0.92, '#fff', 0.1], [1, '#fff', 0.34]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
    blurFilter(bl, 6), blurFilter(bl2, 1.5));
  if (handle) d.add(`<path d="M640,300 C800,300 800,760 620,800" stroke="#fff" stroke-opacity=".22" stroke-width="60" fill="none"/><path d="M640,300 C800,300 800,760 620,800" stroke="#fff" stroke-opacity=".55" stroke-width="4" fill="none"/>`);
  d.add(`<path d="${outer.d}" fill="url(#${glass})"/>`);
  let hl = `<g clip-path="url(#${clip})">`;
  hl += `<path d="${smoothPath(outer.L.map(([x, y]) => [x + 34, y]).slice(3, -4), false)}" stroke="#fff" stroke-opacity=".6" stroke-width="22" fill="none" filter="url(#${bl})"/>`;
  hl += `<path d="${smoothPath(outer.L.map(([x, y]) => [x + 70, y]).slice(5, -8), false)}" stroke="#fff" stroke-opacity=".3" stroke-width="5" fill="none" filter="url(#${bl2})"/>`;
  hl += `<path d="${smoothPath(outer.R.map(([x, y]) => [x - 26, y]).slice(4, -6), false)}" stroke="#fff" stroke-opacity=".32" stroke-width="10" fill="none" filter="url(#${bl})"/>`;
  for (let k = 0; k < 8; k++) {
    const y = 330 + k * 70;
    hl += `<path d="M${f(cx + jarWidth((y - y0) / (y1 - y0)) - 70)},${y} l40,0" stroke="#fff" stroke-opacity=".5" stroke-width="3"/>`;
    if (k % 2 === 0) hl += `<path d="M${f(cx + jarWidth((y - y0) / (y1 - y0)) - 90)},${y} l60,0" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>`;
  }
  hl += '</g>';
  d.add(hl);
  d.add(`<path d="${outer.d}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="4"/>`);
  d.add(`<ellipse cx="${cx}" cy="${y0}" rx="265" ry="30" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="4"/>`);
  if (lid) {
    const gl = uid('g');
    d.def(linear(gl, [[0, '#0d0d0f'], [0.3, '#3a3b40'], [0.6, '#16161a'], [1, '#050506']], { x1: 0, y1: 0, x2: 1, y2: 0 }));
    d.add(`<path d="M130,170 C130,150 150,140 400,140 C650,140 670,150 670,170 L670,215 C670,232 650,240 400,240 C150,240 130,232 130,215Z" fill="url(#${gl})"/>`);
    d.add(`<rect x="340" y="95" width="120" height="55" rx="14" fill="url(#${gl})"/><path d="M150,160 C300,150 500,150 650,160" stroke="#fff" stroke-opacity=".25" stroke-width="4" fill="none"/>`);
  }
  // blades at the bottom
  const gb = uid('g');
  d.def(linear(gb, [[0, '#f4f5f6'], [1, '#7a7e84']], { x1: 0, y1: 0, x2: 1, y2: 1 }));
  d.add(`<g transform="translate(400 915)"><path d="M-110,-6 C-60,-24 -20,-10 0,0 C-20,10 -60,20 -110,6Z" fill="url(#${gb})"/><path d="M110,-12 C60,-30 20,-10 0,0 C20,8 60,6 110,4Z" fill="url(#${gb})"/><circle r="16" fill="#9a9ea3"/></g>`);
  void rand;
  return { outer, clip };
}

function jarDoc(opts = {}) {
  const rand = rng(opts.seed || 151);
  const d = new Doc(900, 1220);
  d.use(contactShadow(400, 1190, 320, 26, 0.5));
  jarBase(d);
  const { cx, y0, y1 } = JAR;
  const inner = glassOutline(cx, y0 + 12, y1 - 12, (t) => jarWidth(t) - 12);
  const clip = uid('c');
  d.def(`<clipPath id="${clip}"><path d="${inner.d}"/></clipPath>`);
  if (opts.milk) {
    const gm = uid('g');
    d.def(linear(gm, [[0, '#cfcbc3'], [0.3, '#fbf9f5'], [0.6, '#ffffff'], [1, '#bdb8af']], { x1: 0, y1: 0, x2: 1, y2: 0 }));
    d.add(`<g clip-path="url(#${clip})"><path d="M100,560 C220,530 320,590 420,560 C520,530 600,580 720,555 L720,980 L100,980Z" fill="url(#${gm})" opacity=".96"/></g>`);
  }
  if (opts.fruit) {
    const items = [
      [F.strawberry({ seed: 1, drops: 2 }), 300, 800, 0.3, 20], [F.bananaSlice(), 520, 830, 0.26, 0], [F.mangoCube(), 420, 700, 0.26, -12],
      [F.blueberry({ seed: 12, count: 7 }), 270, 640, 0.22, 0], [F.strawberryHalf(), 530, 610, 0.28, 30], [F.bananaSlice({ seed: 40 }), 360, 520, 0.24, 40],
      [F.strawberry({ seed: 5, drops: 1 }), 480, 450, 0.26, -30], [F.mangoCube({ seed: 49 }), 300, 380, 0.22, 20]
    ];
    let body = `<g clip-path="url(#${clip})">`;
    const tmp = new Doc(0, 0);
    for (const [part, x, y, s, r] of items) { const p = place(part, { x, y, s, rot: r }); tmp.def(p.defs); body += p.body; }
    d.def(...tmp.defs);
    d.add(body + '</g>');
  }
  if (opts.milk) {
    const gs = uid('g');
    d.def(linear(gs, [[0, '#c7c3bb'], [0.4, '#ffffff'], [1, '#c7c3bb']], { x1: 0, y1: 0, x2: 1, y2: 0 }));
    d.add(`<g clip-path="url(#${clip})"><path d="M385,0 C382,200 392,420 388,560 L420,560 C416,420 424,200 418,0Z" fill="url(#${gs})"/></g>`);
    for (let i = 0; i < 14; i++) d.use(airDrop(rand.range(300, 520), rand.range(470, 560), rand.range(5, 14), { milk: true }));
  }
  jarGlass(d, rand, { lid: opts.lid !== false && !opts.milk, handle: opts.handle });
  return d;
}

export const jarFront = () => jarDoc({ seed: 151 });
export const jarSide = () => jarDoc({ seed: 152, handle: true });
export const jarEmpty = () => jarDoc({ seed: 153, lid: false });
export const jarWithFruit = () => jarDoc({ seed: 154, fruit: true, lid: false });
export const jarWithMilk = () => jarDoc({ seed: 155, fruit: true, milk: true, lid: false });

export function jarTop({ seed = 156 } = {}) {
  const rand = rng(seed);
  const d = new Doc(900, 900);
  const g = uid('g'), gw = uid('g'), gb = uid('g');
  d.def(radial(g, [[0, '#1c1c20'], [0.8, '#2a2b30'], [1, '#0e0e10']]), radial(gw, [[0, '#fff', 0], [0.8, '#fff', 0.08], [1, '#fff', 0.4]]),
    linear(gb, [[0, '#f4f5f6'], [1, '#7a7e84']], { x1: 0, y1: 0, x2: 1, y2: 1 }));
  d.add(`<ellipse cx="450" cy="470" rx="380" ry="300" fill="url(#${gw})" stroke="#fff" stroke-opacity=".6" stroke-width="6"/>`);
  d.add(`<ellipse cx="450" cy="520" rx="250" ry="190" fill="url(#${g})" opacity=".85"/>`);
  d.add(`<g transform="translate(450 520)">${[0, 90, 180, 270].map((a) => `<path transform="rotate(${a})" d="M0,-10 C60,-40 120,-30 170,-10 C120,6 60,12 0,10Z" fill="url(#${gb})"/>`).join('')}<circle r="26" fill="#9a9ea3"/></g>`);
  d.add(`<path d="M120,380 C200,240 420,180 600,200" stroke="#fff" stroke-opacity=".55" stroke-width="14" fill="none" stroke-linecap="round"/>`);
  void rand;
  return d;
}

export { texture };
