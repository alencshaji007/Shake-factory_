import {
  Doc, blob, blobPoints, blurFilter, contactShadow, f, linear, mottle, place, polyPath, radial, rng, smoothPath, texture, uid
} from './lib.mjs';

/** A droplet in mid-air, backlit: bright rim, dark lens band, specular. */
export function airDrop(x, y, r, { tint = '#cfe6ff', milk = false, stretch = 1, rot = 0 } = {}) {
  const g = uid('g'), s = uid('g');
  const defs = milk
    ? radial(g, [[0, '#ffffff'], [0.55, '#f4f1ea'], [0.85, '#d6d2ca'], [1, '#a9a59e']], { cx: 0.38, cy: 0.34 }) + radial(s, [[0, '#fff', 0.95], [1, '#fff', 0]])
    : radial(g, [[0, tint, 0.05], [0.7, tint, 0.18], [0.9, '#ffffff', 0.55], [1, '#ffffff', 0.85]], { cx: 0.5, cy: 0.55 }) + radial(s, [[0, '#fff', 1], [1, '#fff', 0]]);
  const body = `<g transform="rotate(${f(rot)} ${f(x)} ${f(y)})"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * stretch)}" fill="url(#${g})"/><ellipse cx="${f(x - r * 0.32)}" cy="${f(y - r * stretch * 0.36)}" rx="${f(r * 0.26)}" ry="${f(r * 0.18 * stretch)}" fill="url(#${s})"/></g>`;
  return { defs, body };
}

// ── ICE ───────────────────────────────────────────────────────────────────

function icePart(cx, cy, s, rand, { round = 0.35, rot = 0 } = {}) {
  const h = s * 0.5, w = s * 0.87;
  const j = () => rand.range(-s * 0.03, s * 0.03);
  const T = [j(), -h + j()], R = [w + j(), j()], C = [j() * 0.3, h + j() * 0.3], L = [-w + j(), j()];
  const RB = [R[0], R[1] + s * 0.92], CB = [C[0], C[1] + s * 0.92], LB = [L[0], L[1] + s * 0.92];
  const gt = uid('g'), gl = uid('g'), gr = uid('g'), fr = uid('m'), bl = uid('b'), bl2 = uid('b');
  let defs =
    linear(gt, [[0, '#f4fbff', 0.62], [1, '#cfe7f7', 0.3]], { x1: 0, y1: 0, x2: 1, y2: 1 }) +
    linear(gl, [[0, '#e0f1fc', 0.42], [1, '#a9cde6', 0.18]], { x1: 0, y1: 0, x2: 0, y2: 1 }) +
    linear(gr, [[0, '#cfe6f6', 0.26], [1, '#8fb9d8', 0.1]], { x1: 0, y1: 0, x2: 1, y2: 1 }) +
    mottle(fr, { freq: 0.04, oct: 3, seed: rand() * 90 | 0, alpha: 0.5, bias: -0.2 }) + blurFilter(bl, 2) + blurFilter(bl2, 6);
  const faces = [[[L, C, CB, LB], gl], [[C, R, RB, CB], gr], [[T, R, C, L], gt]];
  let body = `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot)})">`;
  for (const [pts, g] of faces) {
    const d = smoothPath(pts, true, round);
    body += `<path d="${d}" fill="url(#${g})"/><path d="${d}" fill="#fff" opacity=".22" filter="url(#${fr})"/>`;
  }
  // bright refracting edges
  body += `<path d="${smoothPath([L, T, R], false, round)}" stroke="#fff" stroke-opacity=".85" stroke-width="${f(s * 0.02)}" fill="none" filter="url(#${bl})"/>`;
  body += `<path d="${smoothPath([L, C, R], false, round)}" stroke="#fff" stroke-opacity=".7" stroke-width="${f(s * 0.018)}" fill="none" filter="url(#${bl})"/>`;
  body += `<path d="M${f(C[0])},${f(C[1])} L${f(CB[0])},${f(CB[1])}" stroke="#fff" stroke-opacity=".75" stroke-width="${f(s * 0.02)}" filter="url(#${bl})"/>`;
  body += `<path d="${smoothPath([LB, CB, RB], false, round)}" stroke="#fff" stroke-opacity=".45" stroke-width="${f(s * 0.02)}" fill="none" filter="url(#${bl})"/>`;
  // inner refraction ghost + bubbles
  body += `<path d="${polyPath([[L[0] * 0.5, L[1] * 0.5 + s * 0.3], [0, h * 0.5 + s * 0.3], [R[0] * 0.5, R[1] * 0.5 + s * 0.3]])}" stroke="#fff" stroke-opacity=".25" stroke-width="${f(s * 0.03)}" fill="none" filter="url(#${bl2})"/>`;
  for (let i = 0; i < 10; i++) {
    const x = rand.range(-w * 0.6, w * 0.6), y = rand.range(-h * 0.2, s * 0.9);
    body += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rand.range(1.5, s * 0.022))}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>`;
  }
  body += `<ellipse cx="${f(-w * 0.35)}" cy="${f(-h * 0.2)}" rx="${f(s * 0.18)}" ry="${f(s * 0.06)}" fill="#fff" opacity=".6" filter="url(#${bl2})" transform="rotate(-28 ${f(-w * 0.35)} ${f(-h * 0.2)})"/>`;
  body += '</g>';
  return { defs, body };
}

export function iceCube({ seed = 91 } = {}) {
  const rand = rng(seed);
  const d = new Doc(800, 800);
  d.use(icePart(400, 330, 300, rand, { rot: -6 }));
  return d;
}

export function iceCubeGroup({ seed = 92 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1000, 900);
  d.use(icePart(330, 520, 240, rand, { rot: -10 }));
  d.use(icePart(660, 540, 230, rand, { rot: 12 }));
  d.use(icePart(500, 290, 220, rand, { rot: 4 }));
  return d;
}

export function iceCrushed({ seed = 93 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1000, 700);
  const g = uid('g'), bl = uid('b');
  d.def(linear(g, [[0, '#f2fbff', 0.6], [1, '#9fc6e2', 0.15]], { x1: 0, y1: 0, x2: 1, y2: 1 }), blurFilter(bl, 1.5));
  for (let i = 0; i < 140; i++) {
    const x = rand.range(120, 880);
    const u = (x - 500) / 380;
    const y = 600 - 380 * (1 - u * u) * rand();
    const pts = blobPoints(x, y, rand.range(14, 42), rand.range(10, 30), { n: rand.pick([4, 5, 6]), jitter: 0.3, rand, rot: rand() * 6 });
    const dd = polyPath(pts);
    d.add(`<path d="${dd}" fill="url(#${g})"/><path d="${dd}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6" filter="url(#${bl})"/>`);
  }
  return d;
}

export function iceMelting({ seed = 94 } = {}) {
  const rand = rng(seed);
  const d = new Doc(800, 900);
  d.use(icePart(400, 330, 300, rand, { round: 0.9, rot: 8 }));
  d.use(airDrop(430, 760, 26, { stretch: 1.3 }));
  d.add(`<path d="M425,610 C420,660 440,690 430,720" stroke="#fff" stroke-opacity=".6" stroke-width="8" fill="none" stroke-linecap="round"/>`);
  return d;
}

export function iceDroplets({ seed = 95 } = {}) {
  const rand = rng(seed);
  const d = new Doc(900, 900);
  for (let i = 0; i < 26; i++) d.use(airDrop(rand.range(120, 780), rand.range(120, 780), rand.range(8, 40), { stretch: rand.range(1, 1.25), rot: rand.range(-20, 20) }));
  return d;
}

// ── MILK ──────────────────────────────────────────────────────────────────

const MILK = [[0, '#b8b6b1'], [0.18, '#f3f1ec'], [0.4, '#ffffff'], [0.7, '#efece6'], [1, '#a9a69f']];

export function milkStream({ seed = 101 } = {}) {
  const rand = rng(seed);
  const d = new Doc(640, 1400);
  const L = [], R = [];
  for (let y = 0; y <= 1330; y += 70) {
    const wob = Math.sin(y * 0.01 + 1) * 10 + rand.range(-3, 3);
    const w = 46 - y * 0.012 + Math.sin(y * 0.02) * 4;
    L.push([320 + wob - w, y]);
    R.unshift([320 + wob + w, y]);
  }
  const tip = [[330, 1395]];
  const shape = smoothPath([...L, ...tip, ...R]);
  const g = uid('g'), bl = uid('b');
  d.def(linear(g, MILK, { x1: 0, y1: 0, x2: 1, y2: 0 }), blurFilter(bl, 3));
  d.add(`<path d="${shape}" fill="url(#${g})"/>`);
  d.add(`<path d="${smoothPath(L.map(([x, y]) => [x + 22, y]), false)}" stroke="#fff" stroke-width="9" fill="none" filter="url(#${bl})"/>`);
  for (let i = 0; i < 8; i++) d.use(airDrop(rand.range(200, 440), rand.range(400, 1350), rand.range(5, 14), { milk: true, stretch: 1.3 }));
  return d;
}

export function milkSplash({ seed = 102 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1200, 900);
  const cx = 600, base = 660, rx = 440;
  const gPool = uid('g'), gWall = uid('g'), gIn = uid('g'), bl = uid('b');
  d.def(radial(gPool, [[0, '#ffffff'], [0.7, '#f1eee8'], [1, '#bdb9b1']], { cx: 0.45, cy: 0.35 }),
    linear(gWall, [[0, '#a9a69f'], [0.2, '#f6f4ef'], [0.45, '#ffffff'], [0.8, '#eceae4'], [1, '#9f9c95']], { x1: 0, y1: 0, x2: 1, y2: 0 }),
    linear(gIn, [[0, '#d8d5ce'], [1, '#f7f5f0']], { x1: 0, y1: 0, x2: 0, y2: 1 }), blurFilter(bl, 3));
  // pool
  d.add(`<ellipse cx="${cx}" cy="${base + 60}" rx="${rx + 120}" ry="80" fill="url(#${gPool})"/>`);
  // crown: spiky top boundary, bottom along the front arc
  const top = [];
  const spikes = 13;
  for (let i = 0; i <= spikes * 2; i++) {
    const t = i / (spikes * 2);
    const x = cx - rx + t * rx * 2;
    const arc = Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
    const hgt = i % 2 ? rand.range(170, 300) * (0.55 + 0.45 * arc) : rand.range(60, 110);
    top.push([x, base - 40 * arc - hgt]);
  }
  const bottom = [];
  for (let i = 20; i >= 0; i--) { const t = i / 20; const x = cx - rx + t * rx * 2; bottom.push([x, base + 50 * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2))]); }
  d.add(`<ellipse cx="${cx}" cy="${base - 40}" rx="${rx - 30}" ry="58" fill="url(#${gIn})"/>`);
  d.add(`<path d="${smoothPath([...top, ...bottom], true, 0.8)}" fill="url(#${gWall})"/>`);
  d.add(`<path d="${smoothPath(top.filter((_, i) => i % 2), false, 0.8)}" stroke="#fff" stroke-width="10" fill="none" opacity=".7" filter="url(#${bl})"/>`);
  for (let i = 1; i < top.length; i += 2) {
    const [x, y] = top[i];
    d.use(airDrop(x + rand.range(-8, 8), y - rand.range(30, 70), rand.range(12, 24), { milk: true, stretch: 1.15 }));
  }
  for (let i = 0; i < 16; i++) d.use(airDrop(rand.range(120, 1080), rand.range(60, 380), rand.range(6, 18), { milk: true, stretch: rand.range(1, 1.4), rot: rand.range(-30, 30) }));
  return d;
}

export function milkDroplets({ seed = 103 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1200, 800);
  for (let i = 0; i < 34; i++) d.use(airDrop(rand.range(80, 1120), rand.range(80, 720), rand.range(8, 46), { milk: true, stretch: rand.range(1, 1.35), rot: rand.range(-40, 40) }));
  return d;
}

export function milkWave({ seed = 104 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1400, 700);
  const shape = 'M40,560 C260,520 420,470 620,380 C820,290 960,160 1120,150 C1260,145 1330,230 1290,320 C1260,380 1180,370 1170,320 C1165,280 1210,270 1215,300 C1150,250 1040,300 960,380 C860,480 700,600 460,640 C300,665 150,650 40,640 Z';
  const g = uid('g'), bl = uid('b');
  d.def(linear(g, [[0, '#ffffff'], [0.5, '#f1eee8'], [1, '#aeaba4']], { x1: 0, y1: 0, x2: 0.3, y2: 1 }), blurFilter(bl, 5));
  d.add(`<path d="${shape}" fill="url(#${g})"/>`);
  d.add(`<path d="M100,560 C380,500 620,400 820,280 C940,210 1060,170 1150,180" stroke="#fff" stroke-width="14" fill="none" filter="url(#${bl})"/>`);
  for (let i = 0; i < 20; i++) d.use(airDrop(rand.range(900, 1360), rand.range(40, 320), rand.range(5, 16), { milk: true, stretch: 1.2 }));
  return d;
}

function bubbleField(d, rand, { count, x0, x1, y0, y1, rmin, rmax, blobMask = null }) {
  const g = uid('g'), s = uid('g');
  d.def(radial(g, [[0, '#ffffff', 0.9], [0.8, '#f1ede6', 0.95], [1, '#c9c4bb', 1]], { cx: 0.4, cy: 0.35 }), radial(s, [[0, '#fff', 1], [1, '#fff', 0]]));
  const items = [];
  for (let i = 0; i < count; i++) {
    const x = rand.range(x0, x1), y = rand.range(y0, y1);
    if (blobMask && !blobMask(x, y)) continue;
    items.push([x, y, rand.range(rmin, rmax)]);
  }
  items.sort((a, b) => a[1] - b[1]);
  for (const [x, y, r] of items) d.add(`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="url(#${g})" stroke="#bdb7ad" stroke-opacity=".5" stroke-width="1.2"/><ellipse cx="${f(x - r * 0.35)}" cy="${f(y - r * 0.4)}" rx="${f(r * 0.25)}" ry="${f(r * 0.16)}" fill="url(#${s})"/>`);
}

export function milkFoam({ seed = 105 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1200, 700);
  d.add(`<ellipse cx="600" cy="400" rx="520" ry="200" fill="#f3f0ea"/>`);
  bubbleField(d, rand, { count: 520, x0: 90, x1: 1110, y0: 200, y1: 600, rmin: 5, rmax: 26, blobMask: (x, y) => ((x - 600) / 520) ** 2 + ((y - 400) / 200) ** 2 < 1 });
  return d;
}

export function milkBubbles({ seed = 106 } = {}) {
  const rand = rng(seed);
  const d = new Doc(800, 800);
  bubbleField(d, rand, { count: 9, x0: 160, x1: 640, y0: 160, y1: 640, rmin: 30, rmax: 90 });
  return d;
}

// ── CREAM ─────────────────────────────────────────────────────────────────

/** Piped whipped cream: stacked ridged tiers + curled peak. */
export function creamPart(cx, baseY, W, rand, { tiers = 4, peak = 1, tint = '#fffaf2' } = {}) {
  const g = uid('g'), sh = uid('g'), bl = uid('b'), bl2 = uid('b'), tx = uid('t');
  let defs = radial(g, [[0, '#ffffff'], [0.5, tint], [0.85, '#f1e8da'], [1, '#d8cbb4']], { cx: 0.38, cy: 0.35, r: 0.7 }) +
    linear(sh, [[0, '#6b4a2a', 0], [0.6, '#6b4a2a', 0], [1, '#6b4a2a', 0.22]], { x1: 0, y1: 0, x2: 0, y2: 1 }) + blurFilter(bl, 6) + blurFilter(bl2, 1.6) +
    texture(tx, { freq: 0.02, oct: 2, depth: 0.6, spec: 0.3, exp: 20, seed: rand() * 90 | 0, diffuse: 1.22 });
  let body = '';
  let y = baseY, w = W;
  for (let i = 0; i < tiers; i++) {
    const h = w * 0.42;
    const top = y - h;
    const shape = `M${f(cx - w)},${f(y)} C${f(cx - w * 1.08)},${f(top + h * 0.1)} ${f(cx - w * 0.6)},${f(top - h * 0.12)} ${f(cx)},${f(top)} C${f(cx + w * 0.6)},${f(top - h * 0.12)} ${f(cx + w * 1.08)},${f(top + h * 0.1)} ${f(cx + w)},${f(y)} C${f(cx + w * 0.6)},${f(y + h * 0.22)} ${f(cx - w * 0.6)},${f(y + h * 0.22)} ${f(cx - w)},${f(y)}Z`;
    const clip = uid('c');
    defs += `<clipPath id="${clip}"><path d="${shape}"/></clipPath>`;
    body += `<ellipse cx="${f(cx)}" cy="${f(y + h * 0.1)}" rx="${f(w * 0.95)}" ry="${f(h * 0.2)}" fill="#5a3a1c" opacity=".25" filter="url(#${bl})"/>`;
    body += `<path d="${shape}" fill="url(#${g})" filter="url(#${tx})"/><g clip-path="url(#${clip})">`;
    const ridges = 11;
    for (let k = 0; k < ridges; k++) {
      const u = -1 + (2 * (k + 0.5)) / ridges;
      const x = cx + Math.sin((u * Math.PI) / 2) * w;
      const twist = w * 0.18;
      body += `<path d="M${f(x - twist)},${f(top - 10)} Q${f(x + twist * 0.3)},${f((top + y) / 2)} ${f(x + twist)},${f(y + h * 0.2)}" stroke="#cdbfa6" stroke-opacity="${f(0.22 + Math.abs(u) * 0.2)}" stroke-width="${f(w * 0.05)}" fill="none" filter="url(#${bl2})"/>`;
      body += `<path d="M${f(x - twist - w * 0.05)},${f(top - 10)} Q${f(x + twist * 0.3 - w * 0.05)},${f((top + y) / 2)} ${f(x + twist - w * 0.05)},${f(y + h * 0.2)}" stroke="#fff" stroke-opacity=".7" stroke-width="${f(w * 0.03)}" fill="none" filter="url(#${bl2})"/>`;
    }
    body += `<rect x="${f(cx - w * 1.1)}" y="${f(top)}" width="${f(w * 2.2)}" height="${f(h * 1.3)}" fill="url(#${sh})"/></g>`;
    y = top + h * 0.38;
    w *= 0.74;
  }
  if (peak) {
    const h = w * 1.3;
    body += `<path d="M${f(cx - w * 0.8)},${f(y)} C${f(cx - w * 0.7)},${f(y - h * 0.6)} ${f(cx - w * 0.1)},${f(y - h * 0.8)} ${f(cx + w * 0.35)},${f(y - h)} C${f(cx + w * 0.2)},${f(y - h * 0.7)} ${f(cx + w * 0.9)},${f(y - h * 0.4)} ${f(cx + w * 0.8)},${f(y)} Z" fill="url(#${g})" filter="url(#${tx})"/>`;
    body += `<path d="M${f(cx - w * 0.4)},${f(y - h * 0.1)} C${f(cx - w * 0.3)},${f(y - h * 0.5)} ${f(cx)},${f(y - h * 0.7)} ${f(cx + w * 0.3)},${f(y - h * 0.95)}" stroke="#fff" stroke-width="${f(w * 0.08)}" fill="none" filter="url(#${bl2})" opacity=".9"/>`;
  }
  return { defs, body };
}

export function creamSwirl({ seed = 111 } = {}) {
  const rand = rng(seed);
  const d = new Doc(900, 1000);
  d.use(creamPart(450, 860, 330, rand, { tiers: 4 }));
  return d;
}

export function creamPeak({ seed = 112 } = {}) {
  const rand = rng(seed);
  const d = new Doc(800, 800);
  d.use(creamPart(400, 700, 260, rand, { tiers: 1 }));
  return d;
}

export function creamTopping({ seed = 113 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1200, 800);
  d.use(creamPart(600, 700, 480, rand, { tiers: 3 }));
  return d;
}

export function creamDroplets({ seed = 114 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1000, 800);
  const g = uid('g');
  d.def(radial(g, [[0, '#ffffff'], [0.6, '#f5efe4'], [1, '#c9bba3']], { cx: 0.38, cy: 0.34 }));
  for (let i = 0; i < 12; i++) {
    const x = rand.range(120, 880), y = rand.range(120, 680), r = rand.range(16, 70);
    d.add(`<path d="${blob(x, y, r, r * rand.range(0.7, 1.1), { n: 8, jitter: 0.15, rand })}" fill="url(#${g})"/>`);
    d.use(airDrop(x - r * 0.2, y - r * 0.2, r * 0.25, { milk: true }));
  }
  return d;
}

// ── WATER SPLASH ──────────────────────────────────────────────────────────

function waterSheet(d, pts, rand) {
  const g = uid('g'), bl = uid('b');
  d.def(linear(g, [[0, '#e9f6ff', 0.4], [0.5, '#bcdcf2', 0.12], [1, '#e9f6ff', 0.4]], { x1: 0, y1: 0, x2: 1, y2: 0 }), blurFilter(bl, 2));
  const dd = smoothPath(pts, true, 0.85);
  d.add(`<path d="${dd}" fill="url(#${g})"/><path d="${dd}" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="4" filter="url(#${bl})"/>`);
  void rand;
}

export function waterSplashCrown({ seed = 121 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1200, 900);
  const cx = 600, base = 700, rx = 400;
  const spikes = 18;
  const top = [];
  for (let i = 0; i <= spikes * 2; i++) {
    const t = i / (spikes * 2), x0 = cx - rx + t * rx * 2;
    const arc = Math.sqrt(Math.max(0, 1 - ((x0 - cx) / rx) ** 2));
    const tip = i % 2 === 1;
    const h = tip ? rand.range(150, 300) * (0.45 + 0.55 * arc) : rand.range(40, 90) * (0.5 + 0.5 * arc);
    const lean = tip ? (x0 - cx) * 0.22 : 0; // spikes lean outward like a real crown
    top.push([x0 + lean, base - 26 * arc - h]);
  }
  const bottom = [];
  for (let i = 16; i >= 0; i--) { const x = cx - rx + (i / 16) * rx * 2; bottom.push([x, base + 36 * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2))]); }
  const gp = uid('g'), gw = uid('g'), bl = uid('b');
  d.def(radial(gp, [[0, '#dff1ff', 0.35], [1, '#9cc8e8', 0]]),
    linear(gw, [[0, '#e9f6ff', 0.55], [0.18, '#cfe8fb', 0.14], [0.5, '#bcdcf2', 0.06], [0.82, '#cfe8fb', 0.14], [1, '#e9f6ff', 0.55]], { x1: 0, y1: 0, x2: 1, y2: 0 }),
    blurFilter(bl, 2.5));
  d.add(`<ellipse cx="${cx}" cy="${base + 36}" rx="${rx + 170}" ry="86" fill="url(#${gp})"/>`);
  const wall = smoothPath([...top, ...bottom], true, 0.95);
  d.add(`<path d="${wall}" fill="url(#${gw})"/>`);
  d.add(`<path d="${smoothPath(top, false, 0.95)}" stroke="#fff" stroke-opacity=".8" stroke-width="4" fill="none" filter="url(#${bl})"/>`);
  d.add(`<ellipse cx="${cx}" cy="${base}" rx="${rx}" ry="34" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="3" filter="url(#${bl})"/>`);
  for (let i = 1; i < top.length; i += 2) {
    const [x, y] = top[i];
    d.use(airDrop(x + (x - cx) * 0.08, y - rand.range(24, 70), rand.range(8, 20), { stretch: 1.25, rot: (x - cx) * 0.05 }));
  }
  for (let i = 0; i < 46; i++) {
    const a = rand.range(Math.PI * 1.05, Math.PI * 1.95), r = rand.range(320, 560);
    d.use(airDrop(cx + Math.cos(a) * r * 1.1, base - 60 + Math.sin(a) * r * 0.9, rand.range(4, 16), { stretch: rand.range(1, 1.4), rot: (a * 180) / Math.PI + 90 }));
  }
  return d;
}

export function waterSplashWide({ seed = 122 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1400, 700);
  for (let k = 0; k < 7; k++) {
    const a0 = -Math.PI * (0.12 + k * 0.11), a1 = a0 - 0.08;
    const L = rand.range(420, 640);
    const ox = 700, oy = 640;
    waterSheet(d, [[ox - 20, oy], [ox + Math.cos(a0) * L * 0.5, oy + Math.sin(a0) * L * 0.5], [ox + Math.cos(a0) * L, oy + Math.sin(a0) * L], [ox + Math.cos(a1) * L * 1.02, oy + Math.sin(a1) * L * 1.02], [ox + Math.cos(a1) * L * 0.5, oy + Math.sin(a1) * L * 0.5], [ox + 20, oy]], rand);
    for (let i = 0; i < 8; i++) { const t = rand.range(0.85, 1.25); d.use(airDrop(ox + Math.cos(a0) * L * t, oy + Math.sin(a0) * L * t, rand.range(5, 16), { stretch: 1.3, rot: (a0 * 180) / Math.PI + 90 })); }
  }
  return d;
}

export function waterDroplets({ seed = 123 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1200, 800);
  for (let i = 0; i < 60; i++) d.use(airDrop(rand.range(60, 1140), rand.range(60, 740), rand.range(4, 30), { stretch: rand.range(1, 1.3), rot: rand.range(-30, 30) }));
  return d;
}

// ── KNIFE ─────────────────────────────────────────────────────────────────

export function knifeChef({ seed = 131 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1400, 520);
  const steel = uid('g'), bevel = uid('g'), wood = uid('g'), tx = uid('t'), bl = uid('b'), refl = uid('g'), bol = uid('g'), riv = uid('g');
  d.def(
    linear(steel, [[0, '#8b9197'], [0.12, '#f2f4f6'], [0.45, '#b9bec3'], [0.7, '#dfe3e6'], [1, '#6c7278']], { x1: 0, y1: 0, x2: 0, y2: 1 }),
    linear(bevel, [[0, '#ffffff', 0.0], [0.5, '#ffffff', 0.6], [1, '#5a6066', 0.6]], { x1: 0, y1: 0, x2: 0, y2: 1 }),
    linear(wood, [[0, '#4a2a1a'], [0.4, '#2a140b'], [1, '#120804']], { x1: 0, y1: 0, x2: 0, y2: 1 }),
    linear(refl, [[0, '#fff', 0], [0.5, '#fff', 0.55], [1, '#fff', 0]], { x1: 0, y1: 0, x2: 1, y2: 0.3 }),
    linear(bol, [[0, '#e8ebee'], [0.5, '#7d848a'], [1, '#c9ced2']], { x1: 0, y1: 0, x2: 0, y2: 1 }),
    radial(riv, [[0, '#ffffff'], [0.5, '#b8bdc2'], [1, '#5a6066']], { cx: 0.35, cy: 0.35 }),
    texture(tx, { freq: '0.006 0.09', oct: 3, depth: 2, spec: 0.5, exp: 20, seed, diffuse: 1.3 }), blurFilter(bl, 6)
  );
  const blade = 'M500,190 L1330,215 C1360,218 1372,232 1355,248 C1200,330 1000,382 740,392 L500,392 Z';
  d.add(`<path d="${blade}" fill="url(#${steel})"/>`);
  d.add(`<path d="M500,352 L740,356 C990,346 1180,300 1340,236 L1355,248 C1200,330 1000,382 740,392 L500,392Z" fill="url(#${bevel})"/>`);
  d.add(`<path d="M520,190 L1330,215" stroke="#fff" stroke-opacity=".8" stroke-width="3"/>`);
  d.add(`<path d="M560,240 L900,250 L820,330 L540,330Z" fill="url(#${refl})" opacity=".6" filter="url(#${bl})"/>`);
  d.add(`<path d="M470,180 C500,178 515,190 515,210 L515,380 C515,398 500,406 470,404 C455,340 455,250 470,180Z" fill="url(#${bol})"/>`);
  d.add(`<path d="M40,230 C40,205 60,195 90,196 L470,196 L470,392 L90,396 C58,398 40,380 40,360 Z" fill="url(#${wood})" filter="url(#${tx})"/>`);
  d.add(`<path d="M60,214 L460,210" stroke="#8a5a3a" stroke-opacity=".5" stroke-width="3"/>`);
  for (const x of [140, 270, 400]) d.add(`<circle cx="${x}" cy="296" r="15" fill="url(#${riv})"/><circle cx="${x}" cy="296" r="15" fill="none" stroke="#2a2a2a" stroke-opacity=".5" stroke-width="2"/>`);
  void rand; void place;
  return d;
}
