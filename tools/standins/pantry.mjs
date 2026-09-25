import {
  Doc, blob, blobPoints, blurFilter, contactShadow, f, linear, place, polyPath, profile, radial, rng, smoothPath, texture, uid, volume
} from './lib.mjs';

/** Outline of a tapered tube along a quadratic curve (cashews, drizzles). */
export function tube(P, W, widthFn, { N = 48, offset = null } = {}) {
  const q = (t) => { const u = 1 - t; return [u * u * P[0][0] + 2 * u * t * P[1][0] + t * t * P[2][0], u * u * P[0][1] + 2 * u * t * P[1][1] + t * t * P[2][1]]; };
  const top = [], bot = [], center = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = q(t), a = q(Math.max(0, t - 0.002)), b = q(Math.min(1, t + 0.002));
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    const n = [-dy / l, dx / l], w = W * widthFn(t) + (offset ? offset(t) : 0);
    center.push(p);
    top.push([p[0] + n[0] * w, p[1] + n[1] * w]);
    bot.unshift([p[0] - n[0] * w, p[1] - n[1] * w]);
  }
  return { d: smoothPath([...top, ...bot]), center };
}

// ── NUTS ──────────────────────────────────────────────────────────────────

function almondPart(cx, cy, L, rand, rot = 0) {
  const w = profile([[0, 0], [0.08, 0.4], [0.35, 0.86], [0.65, 1], [0.88, 0.82], [0.97, 0.45], [1, 0]]);
  const W = L * 0.33;
  const right = [], left = [];
  for (let v = 0; v <= 1.0001; v += 0.04) { right.push([W * w(v), -L / 2 + L * v]); left.unshift([-W * w(v) * 0.96, -L / 2 + L * v]); }
  const shape = smoothPath([...right, ...left.slice(1, -1)]);
  const g = uid('g'), tx = uid('t');
  let defs = radial(g, [[0, '#c27a45'], [0.5, '#95522a'], [1, '#562a10']], { cx: 0.4, cy: 0.4, r: 0.7 }) +
    texture(tx, { freq: '0.05 0.012', oct: 3, depth: 3, spec: 0.35, exp: 18, seed: rand() * 90 | 0, diffuse: 1.25 });
  const vol = volume(shape, { box: [-W, -L / 2, W * 2, L], rim: 0.5, hi: 0.25 });
  defs += vol.defs;
  const body = `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})"><path d="${shape}" fill="url(#${g})" filter="url(#${tx})"/>${vol.body}</g>`;
  return { defs, body };
}

function almondSliver(cx, cy, s, rand, rot) {
  const shape = blob(0, 0, s, s * 0.55, { n: 10, jitter: 0.06, rand });
  const g = uid('g'), tx = uid('t');
  const defs = radial(g, [[0, '#fbf1dc'], [0.8, '#efdcb6'], [1, '#d7b98a']]) + texture(tx, { freq: 0.06, oct: 2, depth: 1, spec: 0.3, seed: rand() * 90 | 0, diffuse: 1.15 });
  return { defs, body: `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})"><path d="${shape}" fill="url(#${g})" filter="url(#${tx})"/><path d="${shape}" fill="none" stroke="#8a5530" stroke-width="${f(s * 0.07)}" stroke-dasharray="${f(s * 1.5)} ${f(s * 2)}"/></g>` };
}

function cashewPart(cx, cy, s, rand, rot = 0) {
  const P = (x, y) => `${f(x * s)},${f(y * s)}`;
  const shape = `M${P(-0.42, -0.3)} C${P(-0.64, 0.12)} ${P(-0.36, 0.56)} ${P(0.05, 0.53)} C${P(0.46, 0.5)} ${P(0.64, 0.14)} ${P(0.5, -0.22)} C${P(0.45, -0.38)} ${P(0.26, -0.38)} ${P(0.23, -0.2)} C${P(0.21, 0.03)} ${P(0.12, 0.2)} ${P(0, 0.2)} C${P(-0.14, 0.2)} ${P(-0.23, 0.03)} ${P(-0.2, -0.2)} C${P(-0.2, -0.37)} ${P(-0.38, -0.44)} ${P(-0.42, -0.3)}Z`;
  const g = uid('g'), tx = uid('t'), bl = uid('b');
  let defs = radial(g, [[0, '#f8e2b3'], [0.55, '#e4bb78'], [1, '#b27d3c']], { cx: 0.4, cy: 0.35, r: 0.7 }) +
    texture(tx, { freq: 0.03, oct: 3, depth: 1.2, spec: 0.3, seed: rand() * 90 | 0, diffuse: 1.15 }) + blurFilter(bl, 2.5);
  const vol = volume(shape, { box: [-s * 0.6, -s * 0.4, s * 1.2, s * 0.95], rim: 0.4, hi: 0.35, light: [0.3, 0.55] });
  defs += vol.defs;
  const seam = `M${P(-0.3, -0.25)} C${P(-0.45, 0.2)} ${P(-0.1, 0.38)} ${P(0.06, 0.37)} C${P(0.3, 0.35)} ${P(0.44, 0.1)} ${P(0.37, -0.26)}`;
  const body = `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})"><path d="${shape}" fill="url(#${g})" filter="url(#${tx})"/><path d="${seam}" stroke="#a8743a" stroke-opacity=".3" stroke-width="3" fill="none" filter="url(#${bl})"/>${vol.body}</g>`;
  return { defs, body };
}

function pistachioPart(cx, cy, s, rand, rot = 0) {
  const gk = uid('g'), gs = uid('g'), tx = uid('t'), txs = uid('t'), bl = uid('b');
  let defs = radial(gk, [[0, '#b8d65a'], [0.5, '#7fa62f'], [1, '#3f5e14']], { cx: 0.45, cy: 0.4 }) +
    linear(gs, [[0, '#f3e6c6'], [0.6, '#dcc79a'], [1, '#a88c5c']], { x1: 0, y1: 0, x2: 1, y2: 1 }) +
    texture(tx, { freq: 0.05, oct: 2, depth: 1.2, spec: 0.35, seed: rand() * 90 | 0, diffuse: 1.15 }) +
    texture(txs, { freq: '0.02 0.08', oct: 3, depth: 2, spec: 0.3, seed: rand() * 90 | 0, diffuse: 1.18 }) + blurFilter(bl, s * 0.06);
  const kernel = blob(0, 0, s * 0.33, s * 0.55, { n: 10, jitter: 0.04, rand });
  const shellL = `M${f(-s * 0.1)},${f(-s * 0.66)} C${f(-s * 0.62)},${f(-s * 0.6)} ${f(-s * 0.62)},${f(s * 0.6)} ${f(-s * 0.06)},${f(s * 0.68)} C${f(-s * 0.3)},${f(s * 0.35)} ${f(-s * 0.3)},${f(-s * 0.35)} ${f(-s * 0.1)},${f(-s * 0.66)}Z`;
  const shellR = `M${f(s * 0.08)},${f(-s * 0.66)} C${f(s * 0.62)},${f(-s * 0.58)} ${f(s * 0.6)},${f(s * 0.62)} ${f(s * 0.04)},${f(s * 0.68)} C${f(s * 0.24)},${f(s * 0.35)} ${f(s * 0.26)},${f(-s * 0.35)} ${f(s * 0.08)},${f(-s * 0.66)}Z`;
  let body = `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})"><path d="${kernel}" fill="url(#${gk})" filter="url(#${tx})"/>`;
  for (let i = 0; i < 4; i++) body += `<ellipse cx="${f(rand.range(-s * 0.2, s * 0.2))}" cy="${f(rand.range(-s * 0.4, s * 0.4))}" rx="${f(s * rand.range(0.06, 0.14))}" ry="${f(s * rand.range(0.1, 0.2))}" fill="#7a3552" opacity=".55" filter="url(#${bl})"/>`;
  body += `<path d="${shellL}" fill="url(#${gs})" filter="url(#${txs})"/><path d="${shellR}" fill="url(#${gs})" filter="url(#${txs})"/></g>`;
  return { defs, body };
}

function hazelnutPart(cx, cy, s, rand, rot = 0) {
  const shape = smoothPath([[0, -s * 0.62], [s * 0.3, -s * 0.42], [s * 0.52, -s * 0.05], [s * 0.48, s * 0.35], [s * 0.2, s * 0.56], [-s * 0.2, s * 0.56], [-s * 0.5, s * 0.35], [-s * 0.52, -s * 0.05], [-s * 0.3, -s * 0.42]]);
  const g = uid('g'), gc = uid('g'), tx = uid('t'), txc = uid('t'), clip = uid('c'), bl = uid('b');
  let defs = radial(g, [[0, '#b0703b'], [0.5, '#7a4219'], [1, '#3a1c08']], { cx: 0.38, cy: 0.35, r: 0.7 }) +
    radial(gc, [[0, '#e6d0a4'], [1, '#b99762']]) +
    texture(tx, { freq: 0.02, oct: 2, depth: 1, spec: 0.8, exp: 30, seed: rand() * 90 | 0, diffuse: 1.15 }) +
    texture(txc, { freq: 0.12, oct: 3, depth: 2.5, spec: 0.1, seed: rand() * 90 | 0, diffuse: 1.2 }) +
    `<clipPath id="${clip}"><path d="${shape}"/></clipPath>` + blurFilter(bl, 2);
  let body = `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})"><path d="${shape}" fill="url(#${g})" filter="url(#${tx})"/><g clip-path="url(#${clip})">`;
  for (let i = -5; i <= 5; i++) body += `<path d="M0,${f(-s * 0.62)} Q${f(i * s * 0.12)},${f(-s * 0.1)} ${f(i * s * 0.09)},${f(s * 0.6)}" stroke="#2e1406" stroke-opacity=".35" stroke-width="${f(s * 0.02)}" fill="none" filter="url(#${bl})"/>`;
  body += `<ellipse cx="0" cy="${f(s * 0.52)}" rx="${f(s * 0.46)}" ry="${f(s * 0.2)}" fill="url(#${gc})" filter="url(#${txc})"/></g>`;
  const vol = volume(shape, { box: [-s * 0.52, -s * 0.62, s * 1.04, s * 1.18], rim: 0.45, hi: 0.45, hiSize: 0.22 });
  defs += vol.defs; body += vol.body + '</g>';
  return { defs, body };
}

const NUT = { almond: almondPart, cashew: cashewPart, pistachio: pistachioPart, hazelnut: hazelnutPart };

function nutDoc(kind, seed) {
  const rand = rng(seed);
  const d = new Doc(800, 800);
  d.use(contactShadow(400, 640, 230, 34, 0.3));
  const size = { almond: 560, cashew: 560, pistachio: 560, hazelnut: 560 }[kind];
  d.use(NUT[kind](400, 400, size, rand, rand.range(-30, 30)));
  return d;
}

export const almond = ({ seed = 61 } = {}) => nutDoc('almond', seed);
export const cashew = ({ seed = 62 } = {}) => nutDoc('cashew', seed);
export const pistachio = ({ seed = 63 } = {}) => nutDoc('pistachio', seed);
export const hazelnut = ({ seed = 64 } = {}) => nutDoc('hazelnut', seed);

export function almondSliced({ seed = 65 } = {}) {
  const rand = rng(seed);
  const d = new Doc(900, 700);
  for (const [x, y, s, r] of [[260, 300, 170, -20], [520, 260, 160, 35], [420, 450, 175, 10], [680, 440, 150, -40]]) d.use(almondSliver(x, y, s, rand, r));
  return d;
}

/** Arranged group of nuts; items = [kind, x, y, size, rot]. */
function nutGroup(w, h, items, seed) {
  const rand = rng(seed);
  const d = new Doc(w, h);
  for (const [k, x, y, s, r] of items) d.use(contactShadow(x, y + s * 0.3, s * 0.4, s * 0.08, 0.28));
  for (const [k, x, y, s, r] of items) d.use(NUT[k](x, y, s, rand, r));
  return d;
}

export const nutGroupSmall = ({ seed = 66 } = {}) => nutGroup(1000, 800, [
  ['hazelnut', 700, 320, 260, 10], ['almond', 330, 300, 330, -60], ['pistachio', 560, 470, 280, 30], ['cashew', 330, 520, 300, 15], ['almond', 700, 560, 300, 70]
], seed);

export const nutsScattered = ({ seed = 67 } = {}) => nutGroup(1400, 800, [
  ['almond', 160, 300, 260, -40], ['cashew', 420, 230, 250, 20], ['pistachio', 690, 330, 240, -15], ['hazelnut', 940, 250, 220, 0],
  ['almond', 1210, 380, 260, 60], ['hazelnut', 300, 560, 210, 20], ['pistachio', 560, 570, 230, 50], ['cashew', 850, 560, 240, -30], ['almond', 1100, 600, 250, 10]
], seed);

function fragments(d, rand, { count, x0, x1, y0, y1, smin, smax, palette, mound = false }) {
  for (let i = 0; i < count; i++) {
    let x = rand.range(x0, x1), y = rand.range(y0, y1);
    if (mound) { const u = (x - (x0 + x1) / 2) / ((x1 - x0) / 2); y = y1 - (y1 - y0) * (1 - u * u) * rand(); }
    const s = rand.range(smin, smax);
    const [c1, c2] = rand.pick(palette);
    const g = uid('g'), tx = uid('t');
    const pts = blobPoints(x, y, s, s * rand.range(0.5, 0.9), { n: rand.pick([5, 6, 7]), jitter: 0.25, rand, rot: rand() * 6 });
    d.def(linear(g, [[0, c1], [1, c2]], { x1: 0, y1: 0, x2: 1, y2: 1 }), texture(tx, { freq: 0.08, oct: 2, depth: 1.5, spec: 0.25, seed: i, diffuse: 1.15 }));
    d.add(`<path d="${smoothPath(pts, true, 0.35)}" fill="url(#${g})" filter="url(#${tx})"/>`);
  }
}

const NUT_PALETTE = [['#f3e2bd', '#c9a36a'], ['#b0703b', '#5a2d10'], ['#9cc14a', '#4f7420'], ['#e9c98f', '#b0803f']];

export function nutsCrushed({ seed = 68 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1000, 700);
  d.use(contactShadow(500, 600, 400, 40, 0.3));
  fragments(d, rand, { count: 220, x0: 120, x1: 880, y0: 200, y1: 600, smin: 10, smax: 38, palette: NUT_PALETTE, mound: true });
  return d;
}

export function nutPieces({ seed = 69 } = {}) {
  const rand = rng(seed);
  const d = new Doc(900, 700);
  fragments(d, rand, { count: 7, x0: 200, x1: 700, y0: 200, y1: 500, smin: 60, smax: 110, palette: NUT_PALETTE });
  return d;
}

// ── CHOCOLATE ─────────────────────────────────────────────────────────────

const CHOC = {
  dark: { base: '#2c150c', light: '#6e3a22', dark: '#120603', face: ['#3e2014', '#26110a'] },
  milk: { base: '#6b3f24', light: '#b57a4d', dark: '#3a1d0e', face: ['#85522f', '#5f3720'] }
};

function chocolateBar(kind, seed) {
  const rand = rng(seed);
  const c = CHOC[kind];
  const d = new Doc(900, 900);
  const S = 250, gap = 14, x0 = 450 - S - gap / 2, y0 = 450 - S - gap / 2;
  const edge = uid('g'), face = uid('g'), tx = uid('t'), clip = uid('c'), gl = uid('g');
  // jagged broken edge along the right side
  const brk = [[x0 - 20, y0 - 20], [x0 + S * 2 + gap - 10, y0 - 20]];
  for (let y = y0; y <= y0 + S * 2 + gap; y += 34) brk.push([x0 + S * 2 + gap - rand.range(0, 60), y]);
  brk.push([x0 + S * 2 + gap - 30, y0 + S * 2 + gap + 20], [x0 - 20, y0 + S * 2 + gap + 20]);
  d.def(linear(edge, [[0, c.light], [0.5, c.base], [1, c.dark]], { x1: 0, y1: 0, x2: 1, y2: 1 }),
    linear(face, [[0, c.face[0]], [1, c.face[1]]], { x1: 0, y1: 0, x2: 1, y2: 1 }),
    linear(gl, [[0, '#fff', 0], [0.45, '#fff', 0.16], [0.55, '#fff', 0.16], [1, '#fff', 0]], { x1: 0, y1: 0, x2: 1, y2: 1 }),
    texture(tx, { freq: 0.015, oct: 2, depth: 0.8, spec: 0.5, exp: 26, seed, diffuse: 1.12 }),
    `<clipPath id="${clip}"><path d="${polyPath(brk)}"/></clipPath>`);
  d.use(contactShadow(450, 740, 320, 40, 0.35));
  let body = `<g clip-path="url(#${clip})" transform="rotate(${f(rand.range(-12, 12))} 450 450)">`;
  body += `<rect x="${x0 - 6}" y="${y0 - 6}" width="${S * 2 + gap + 12}" height="${S * 2 + gap + 12}" rx="16" fill="${c.dark}"/>`;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const x = x0 + i * (S + gap), y = y0 + j * (S + gap), ins = 30;
    body += `<rect x="${x}" y="${y}" width="${S}" height="${S}" rx="14" fill="url(#${edge})" filter="url(#${tx})"/>`;
    body += `<rect x="${x + ins}" y="${y + ins}" width="${S - ins * 2}" height="${S - ins * 2}" rx="8" fill="url(#${face})" filter="url(#${tx})"/>`;
    body += `<rect x="${x}" y="${y}" width="${S}" height="${S}" rx="14" fill="url(#${gl})"/>`;
  }
  body += '</g>';
  d.add(body);
  return d;
}

export const chocolateDark = ({ seed = 71 } = {}) => chocolateBar('dark', seed);
export const chocolateMilk = ({ seed = 72 } = {}) => chocolateBar('milk', seed);

function chunkPart(cx, cy, s, rand, pal = ['#1f0d06', '#7a4529']) {
  const n = 8;
  const rim = blobPoints(cx, cy, s, s * 0.8, { n, jitter: 0.22, rand, rot: rand() * 6 });
  const peak = [cx - s * 0.12 + rand.range(-s * 0.1, s * 0.1), cy - s * 0.15 + rand.range(-s * 0.1, s * 0.1)];
  const tx = uid('t');
  let defs = texture(tx, { freq: 0.03, oct: 3, depth: 1.6, spec: 0.5, exp: 22, seed: rand() * 90 | 0, diffuse: 1.15 });
  let body = '';
  const lerpHex = (a, b, t) => {
    const pa = a.match(/\w\w/g).map((h) => parseInt(h, 16)), pb = b.match(/\w\w/g).map((h) => parseInt(h, 16));
    return `#${pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('')}`;
  };
  for (let i = 0; i < n; i++) {
    const a = rim[i], b = rim[(i + 1) % n];
    const mx = (a[0] + b[0]) / 2 - peak[0], my = (a[1] + b[1]) / 2 - peak[1];
    const ang = Math.atan2(my, mx);
    const lit = 0.5 + 0.5 * Math.cos(ang - Math.PI * 1.25);
    body += `<path d="${polyPath([peak, a, b])}" fill="${lerpHex(pal[0], pal[1], lit * 0.9)}" stroke="${lerpHex(pal[0], pal[1], lit * 0.9)}" stroke-width="1.5" stroke-linejoin="round" filter="url(#${tx})"/>`;
  }
  return { defs, body };
}

export function chocolateChunk({ seed = 73 } = {}) {
  const rand = rng(seed);
  const d = new Doc(800, 800);
  d.use(contactShadow(400, 640, 260, 36, 0.35));
  d.use(chunkPart(400, 400, 290, rand));
  return d;
}

export function chocolateShavings({ seed = 74 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1000, 800);
  const g = uid('g'), st = uid('g');
  d.def(linear(g, [[0, '#1a0904'], [0.35, '#6e3b22'], [0.55, '#8a5030'], [1, '#1f0b05']], { x1: 0, y1: 0, x2: 0, y2: 1 }),
    linear(st, [[0, '#caa084', 0], [0.5, '#caa084', 0.55], [1, '#caa084', 0]]));
  for (const [x, y, l, r, rot] of [[300, 280, 330, 46, -25], [620, 250, 280, 40, 20], [460, 470, 360, 52, 8], [720, 540, 240, 38, -40]]) {
    let body = `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="${-l / 2}" y="${-r}" width="${l}" height="${r * 2}" rx="${r}" fill="url(#${g})"/>`;
    for (let k = -l / 2 + 20; k < l / 2 - 10; k += 26) body += `<path d="M${f(k)},${-r + 4} q${f(r * 0.5)},${r} 0,${r * 2 - 8}" stroke="url(#${st})" stroke-width="3" fill="none" opacity=".7"/>`;
    body += `<ellipse cx="${-l / 2 + r * 0.55}" cy="0" rx="${f(r * 0.45)}" ry="${f(r * 0.9)}" fill="#3a1a0c"/><path d="M${-l / 2 + r * 0.55},${-r * 0.5} a${r * 0.3},${r * 0.45} 0 1 1 0,${r}" stroke="#7a4527" stroke-width="3" fill="none"/></g>`;
    d.add(body);
  }
  void rand;
  return d;
}

export function chocolateCrumbs({ seed = 75 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1200, 700);
  fragments(d, rand, { count: 90, x0: 100, x1: 1100, y0: 180, y1: 560, smin: 6, smax: 30, palette: [['#5a2e1a', '#1a0904'], ['#7a4529', '#2a1209']] });
  return d;
}

function drizzle(seed, colors) {
  const rand = rng(seed);
  const d = new Doc(1400, 700);
  const pts = [];
  for (let x = 40; x <= 1360; x += 60) pts.push([x, 330 + Math.sin(x * 0.005 + 1) * 90 + Math.sin(x * 0.014) * 22]);
  const W = (x) => 52 + Math.sin(x * 0.008) * 16;
  const top = pts.map(([x, y]) => [x, y - W(x)]);
  const bot = pts.map(([x, y]) => [x, y + W(x) * 0.9]).reverse();
  const g = uid('g'), bl = uid('b'), bl2 = uid('b');
  d.def(linear(g, [[0, colors[0]], [0.4, colors[1]], [1, colors[2]]], { x1: 0, y1: 0, x2: 0, y2: 1 }), blurFilter(bl, 3), blurFilter(bl2, 1.2));
  const tapered = [[0, pts[0][1]], ...top, [1400, pts[pts.length - 1][1]], ...bot];
  d.add(`<path d="${smoothPath(tapered, true, 0.9)}" fill="url(#${g})"/>`);
  // drips hanging off the ribbon
  for (let i = 0; i < 7; i++) {
    const [x, y] = pts[2 + Math.floor(rand() * (pts.length - 4))];
    const len = rand.range(60, 200), w = rand.range(14, 24);
    d.add(`<path d="M${f(x - w)},${f(y + 10)} C${f(x - w * 0.6)},${f(y + len * 0.6)} ${f(x - w * 1.3)},${f(y + len)} ${f(x)},${f(y + len + w)} C${f(x + w * 1.3)},${f(y + len)} ${f(x + w * 0.6)},${f(y + len * 0.6)} ${f(x + w)},${f(y + 10)}Z" fill="url(#${g})"/>`);
    d.add(`<ellipse cx="${f(x - w * 0.3)}" cy="${f(y + len + w * 0.2)}" rx="${f(w * 0.25)}" ry="${f(w * 0.4)}" fill="#fff" opacity=".5" filter="url(#${bl2})"/>`);
  }
  d.add(`<path d="${smoothPath(pts.map(([x, y]) => [x, y - W(x) * 0.45]), false)}" stroke="${colors[3]}" stroke-opacity=".7" stroke-width="6" fill="none" filter="url(#${bl2})"/>`);
  d.add(`<path d="${smoothPath(pts.map(([x, y]) => [x, y - W(x) * 0.2]), false)}" stroke="#fff" stroke-opacity=".25" stroke-width="16" fill="none" filter="url(#${bl})"/>`);
  return d;
}

export const chocolateDrizzle = ({ seed = 76 } = {}) => drizzle(seed, ['#5a2c16', '#2c1208', '#140602', '#c08a66']);
export const caramelDrizzle = ({ seed = 77 } = {}) => drizzle(seed, ['#f0b060', '#c47420', '#7a3e0c', '#fff0c8']);

// ── COOKIES ───────────────────────────────────────────────────────────────

function cookieBody(cx, cy, R, rand) {
  const shape = blob(cx, cy, R, R * 0.96, { n: 30, jitter: 0.045, rand });
  const g = uid('g'), tx = uid('t'), clip = uid('c'), bl = uid('b'), rim = uid('g');
  let defs = radial(g, [[0, '#e6b674'], [0.55, '#d09550'], [0.85, '#b27034'], [1, '#86491c']], { cx: 0.46, cy: 0.44, r: 0.56 }) +
    texture(tx, { freq: 0.03, oct: 5, depth: 5, spec: 0.3, exp: 18, seed: rand() * 90 | 0, diffuse: 1.28 }) +
    radial(rim, [[0, '#5a2a0c', 0], [0.8, '#5a2a0c', 0], [1, '#5a2a0c', 0.55]]) +
    `<clipPath id="${clip}"><path d="${shape}"/></clipPath>` + blurFilter(bl, 1);
  let body = `<path d="${shape}" fill="url(#${g})" filter="url(#${tx})"/><g clip-path="url(#${clip})"><ellipse cx="${cx}" cy="${cy}" rx="${R * 1.02}" ry="${R}" fill="url(#${rim})"/>`;
  for (let i = 0; i < 9; i++) {
    let x = cx + rand.range(-R * 0.6, R * 0.6), y = cy + rand.range(-R * 0.6, R * 0.6);
    let path = `M${f(x)},${f(y)}`;
    let a = rand() * Math.PI * 2;
    for (let k = 0; k < 6; k++) { a += rand.range(-0.7, 0.7); x += Math.cos(a) * R * 0.07; y += Math.sin(a) * R * 0.07; path += ` L${f(x)},${f(y)}`; }
    body += `<path d="${path}" stroke="#5a2c10" stroke-width="${f(rand.range(3, 7))}" fill="none" stroke-linejoin="round" filter="url(#${bl})" opacity=".8"/>`;
    body += `<path d="${path}" stroke="#f3cf95" stroke-width="2" fill="none" transform="translate(-3 -3)" opacity=".45"/>`;
  }
  body += '</g>';
  // chocolate chunks
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2, rr = Math.sqrt(rand()) * R * 0.78;
    const ch = chunkPart(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, R * rand.range(0.07, 0.13), rand, ['#1a0904', '#5e3320']);
    defs += ch.defs; body += ch.body;
    if (rand() < 0.35) body += `<ellipse cx="${f(cx + Math.cos(a) * rr - 4)}" cy="${f(cy + Math.sin(a) * rr - 6)}" rx="${f(R * 0.03)}" ry="${f(R * 0.018)}" fill="#fff" opacity=".35"/>`;
  }
  return { defs, body, shape };
}

export function cookieWhole({ seed = 81 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1000, 1000);
  d.use(contactShadow(510, 860, 400, 50, 0.4));
  d.use(cookieBody(500, 480, 400, rand));
  return d;
}

function cookieBroken(w, h, cx, cy, R, rand, cut) {
  const d = new Doc(w, h);
  const body = cookieBody(cx, cy, R, rand);
  const clip = uid('c'), crumb = uid('g'), tx = uid('t');
  d.def(body.defs, `<clipPath id="${clip}"><path d="${polyPath(cut)}"/></clipPath>`,
    linear(crumb, [[0, '#e9c48a'], [1, '#b7813f']], { x1: 0, y1: 0, x2: 1, y2: 0 }), texture(tx, { freq: 0.09, oct: 4, depth: 4, spec: 0.2, seed: 5, diffuse: 1.25 }));
  d.add(`<g clip-path="url(#${clip})">${body.body}</g>`);
  return d;
}

function jagged(ax, ay, bx, by, rand, steps = 14, amp = 18) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([ax + (bx - ax) * t + rand.range(-amp, amp), ay + (by - ay) * t + rand.range(-amp, amp)]);
  }
  return pts;
}

export function cookieHalf({ seed = 82 } = {}) {
  const rand = rng(seed);
  const cut = [[40, 40], ...jagged(560, 40, 470, 960, rand), [40, 960]];
  return cookieBroken(1000, 1000, 500, 500, 420, rand, cut);
}

export function cookiePiece({ seed = 83 } = {}) {
  const rand = rng(seed);
  const cut = [[500, 500], ...jagged(500, 500, 960, 300, rand, 8, 16).slice(1), [990, 990], ...jagged(760, 990, 500, 500, rand, 8, 16)];
  return cookieBroken(1000, 1000, 500, 500, 420, rand, cut);
}

export function cookieChunks({ seed = 84 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1200, 800);
  const pieces = [[300, 400, 0.52, -20], [640, 330, 0.46, 25], [900, 470, 0.4, 70]];
  for (const [x, y, s, r] of pieces) {
    const cut = blobPoints(500, 500, 330, 280, { n: 7, jitter: 0.25, rand });
    const part = cookieBroken(1000, 1000, 500, 500, 420, rand, cut);
    d.use(contactShadow(x, y + 150 * s * 2, 220 * s * 2, 30, 0.3));
    d.use(place(part, { x, y, s, rot: r }));
  }
  return d;
}

export function cookieCrumbs({ seed = 85 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1200, 700);
  fragments(d, rand, { count: 110, x0: 100, x1: 1100, y0: 200, y1: 560, smin: 6, smax: 34, palette: [['#e6b674', '#a8662c'], ['#d09550', '#86491c'], ['#e6b674', '#b27034'], ['#3a1a0c', '#140602']] });
  return d;
}
