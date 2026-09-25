import {
  Doc, blob, blobPoints, blurFilter, clamp, contactShadow, droplet, f, linear, mottle, place, polyPath,
  profile, radial, rng, smoothPath, texture, uid, volume
} from './lib.mjs';

// ── STRAWBERRY ────────────────────────────────────────────────────────────

const strawberryWidth = profile([[0, 0.7], [0.1, 0.9], [0.24, 1], [0.4, 0.95], [0.6, 0.77], [0.78, 0.5], [0.9, 0.25], [0.97, 0.08], [1, 0]]);

function strawberryOutline(cx, top, W, H, rand) {
  const skew = rand.range(-0.06, 0.06);
  const right = [], left = [];
  for (let v = 0; v <= 1.0001; v += 0.05) {
    const w = W * strawberryWidth(v);
    const x = cx + skew * W * v * v;
    right.push([x + w * (1 + rand.range(-0.015, 0.015)), top + H * v]);
    if (v < 0.999) left.unshift([x - w * (1 + rand.range(-0.015, 0.015)), top + H * v]);
  }
  const shoulder = [[cx - W * 0.42, top - H * 0.035], [cx, top - H * 0.012], [cx + W * 0.42, top - H * 0.035]];
  return smoothPath([...shoulder, ...right, ...left]);
}

/** Leafy calyx seen from the front/above (squash = vertical foreshortening). */
function calyx(cx, cy, size, rand, { squash = 0.42, count = 8, stem = true, droop = 0.35 } = {}) {
  const gl = uid('g'), tx = uid('t');
  let defs = linear(gl, [[0, '#7fbf55'], [0.45, '#3e8a2b'], [1, '#1c4a14']], { x1: 0, y1: 0, x2: 1, y2: 0 }) +
    texture(tx, { freq: 0.06, oct: 3, depth: 2.2, spec: 0.35, seed: rand() * 99 | 0 });
  const leaves = [];
  for (let i = 0; i < count; i++) {
    const phi = (i / count) * Math.PI * 2 + rand.range(-0.25, 0.25);
    const L = size * rand.range(0.8, 1.12);
    const dx = Math.cos(phi), dy = Math.sin(phi) * squash;
    const len = L * Math.hypot(dx, dy);
    const ang = (Math.atan2(dy + droop * Math.max(0, Math.sin(phi)) * 0.6, dx) * 180) / Math.PI;
    const w = L * rand.range(0.2, 0.28);
    const curl = rand.range(-0.2, 0.2) * w;
    const d = `M0,0 C${f(len * 0.3)},${f(-w + curl)} ${f(len * 0.72)},${f(-w * 0.7 + curl)} ${f(len)},${f(curl * 0.5)} C${f(len * 0.72)},${f(w * 0.55 + curl)} ${f(len * 0.3)},${f(w * 0.9)} 0,0Z`;
    leaves.push({ z: Math.sin(phi), body: `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(ang)})"><path d="${d}" fill="url(#${gl})" filter="url(#${tx})"/><path d="M${f(len * 0.05)},0 Q${f(len * 0.5)},${f(curl * 0.4)} ${f(len * 0.92)},${f(curl * 0.45)}" stroke="#a8d37f" stroke-opacity=".45" stroke-width="${f(Math.max(1.5, w * 0.06))}" fill="none"/></g>` });
  }
  leaves.sort((a, b) => a.z - b.z);
  let body = leaves.map((l) => l.body).join('');
  if (stem) {
    const gs = uid('g');
    defs += linear(gs, [[0, '#9ccc6a'], [0.5, '#4f8f33'], [1, '#2a5a1c']], { x1: 0, y1: 0, x2: 1, y2: 0 });
    body += `<path d="M${f(cx - size * 0.06)},${f(cy)} C${f(cx - size * 0.07)},${f(cy - size * 0.3)} ${f(cx + size * 0.02)},${f(cy - size * 0.42)} ${f(cx + size * 0.12)},${f(cy - size * 0.5)} L${f(cx + size * 0.17)},${f(cy - size * 0.45)} C${f(cx + size * 0.08)},${f(cy - size * 0.34)} ${f(cx + size * 0.06)},${f(cy - size * 0.2)} ${f(cx + size * 0.06)},${f(cy)}Z" fill="url(#${gs})"/>`;
  }
  return { defs, body };
}

function strawberrySeeds(cx, top, W, H, rand, { scale = 1 } = {}) {
  const gs = uid('g'), bl = uid('b');
  let defs = radial(gs, [[0, '#fbe38a'], [0.6, '#d9a93c'], [1, '#8c5a14']], { cx: 0.4, cy: 0.35 }) + blurFilter(bl, 1.6 * scale);
  let body = '';
  let row = 0;
  for (let v = 0.07; v < 0.95; v += 0.052, row++) {
    const w = W * strawberryWidth(v) * 0.97;
    const count = Math.max(3, Math.round(strawberryWidth(v) * 13));
    for (let i = 0; i < count; i++) {
      const th = -1.42 + (2.84 * (i + (row % 2 ? 0.5 : 0) + rand.range(-0.15, 0.15))) / count;
      if (Math.abs(th) > 1.45) continue;
      const x = cx + Math.sin(th) * w;
      const y = top + H * v + Math.cos(th) * H * 0.018 + rand.range(-3, 3) * scale;
      const k = Math.cos(th) * 0.85 + 0.15;
      const rx = 8.5 * k * scale * (1 - v * 0.35), ry = 10 * scale * (1 - v * 0.35);
      const rot = (th * 22) + rand.range(-8, 8);
      body += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><ellipse rx="${f(rx * 1.25)}" ry="${f(ry * 1.2)}" fill="#6a0613" opacity=".5" filter="url(#${bl})"/><ellipse cy="${f(-ry * 0.12)}" rx="${f(rx * 0.55)}" ry="${f(ry * 0.66)}" fill="url(#${gs})"/><ellipse cx="${f(-rx * 0.15)}" cy="${f(-ry * 0.4)}" rx="${f(rx * 0.18)}" ry="${f(ry * 0.16)}" fill="#fff" opacity=".7"/></g>`;
    }
  }
  return { defs, body };
}

/** Sharp glossy specular streaks following the curvature. */
function gloss(cx, top, W, H, rand, { count = 7, opacity = 0.75 } = {}) {
  const bl = uid('b'), bl2 = uid('b');
  let body = '';
  for (let i = 0; i < count; i++) {
    const v = rand.range(0.08, 0.55);
    const th = rand.range(-1.1, -0.1);
    const x = cx + Math.sin(th) * W * strawberryWidth(v) * 0.8;
    const y = top + H * v;
    body += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rand.range(4, 16))}" ry="${f(rand.range(10, 36))}" transform="rotate(${f(th * 30 + rand.range(-10, 10))} ${f(x)} ${f(y)})" fill="#fff" opacity="${f(opacity * rand.range(0.5, 1))}" filter="url(#${i % 2 ? bl : bl2})"/>`;
  }
  return { defs: blurFilter(bl, 2.2) + blurFilter(bl2, 5), body };
}

export function strawberry({ seed = 1, view = 'front', drops = 6 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1000, 1100);
  const cx = 500, top = 250, W = 300, H = 640;
  const shape = strawberryOutline(cx, top, W, H, rand);
  const gb = uid('g'), tx = uid('t'), clip = uid('c');
  d.def(
    radial(gb, [[0, '#ff5a4c'], [0.3, '#e8182f'], [0.7, '#a8061f'], [1, '#560210']], { cx: 0.38, cy: 0.3, r: 0.75 }),
    texture(tx, { freq: 0.022, oct: 2, depth: 0.9, spec: 0.35, exp: 40, seed: seed * 7, diffuse: 1.22 }),
    `<clipPath id="${clip}"><path d="${shape}"/></clipPath>`
  );
  const g = [];
  g.push(`<path d="${shape}" fill="url(#${gb})" filter="url(#${tx})"/>`);
  const seeds = strawberrySeeds(cx, top, W, H, rand);
  d.def(seeds.defs);
  g.push(`<g clip-path="url(#${clip})">${seeds.body}</g>`);
  const vol = volume(shape, { box: [cx - W, top - 20, W * 2, H + 20], rim: 0.55, hi: 0.28, light: [0.32, 0.22], bounce: '#ff8a70' });
  d.def(vol.defs); g.push(vol.body);
  const gl = gloss(cx, top, W, H, rand); d.def(gl.defs); g.push(`<g clip-path="url(#${clip})">${gl.body}</g>`);
  for (let i = 0; i < drops; i++) {
    const v = rand.range(0.15, 0.8), th = rand.range(-1.1, 1.1);
    const dr = droplet(cx + Math.sin(th) * W * strawberryWidth(v) * 0.75, top + H * v, rand.range(9, 22), { tint: '#5a0010', rot: rand.range(-20, 20) });
    d.def(dr.defs); g.push(dr.body);
  }
  const cal = calyx(cx, top - 6, W * 0.78, rand, view === 'side' ? { squash: 0.2, droop: 0.2 } : {});
  d.def(cal.defs); g.push(cal.body);

  const t = view === 'side' ? `rotate(-68 500 560) scale(0.94 0.9)` : view === 'closeup' ? 'rotate(10 500 560)' : `rotate(${rand.range(-6, 6)} 500 560)`;
  d.add(`<g transform="${t}">${g.join('')}</g>`);
  return d;
}

/** Lengthwise cut face (juicy pith, radial fibres, red rim). */
function strawberryCutFace(cx, top, W, H, rand) {
  const shape = strawberryOutline(cx, top, W, H, rand);
  const gf = uid('g'), gp = uid('g'), bl = uid('b'), clip = uid('c'), tx = uid('t');
  let defs =
    radial(gf, [[0, '#ffe9e6'], [0.3, '#ffb3b8'], [0.62, '#f2475c'], [0.85, '#c3102c'], [1, '#8f0a1d']], { cx: 0.5, cy: 0.46, r: 0.62 }) +
    radial(gp, [[0, '#fffaf7', 0.95], [0.7, '#ffe0dc', 0.6], [1, '#ffd0d0', 0]]) +
    blurFilter(bl, 6) + `<clipPath id="${clip}"><path d="${shape}"/></clipPath>` +
    texture(tx, { freq: 0.03, oct: 2, depth: 0.8, spec: 0.5, exp: 36, seed: rand() * 90 | 0, diffuse: 1.18 });
  let body = `<path d="${shape}" fill="url(#${gf})" filter="url(#${tx})"/><g clip-path="url(#${clip})">`;
  // radial fibres from the central axis toward the skin
  for (let i = 0; i < 70; i++) {
    const v = rand.range(0.05, 0.92);
    const side = rand.sign();
    const x0 = cx + rand.range(-8, 8), y0 = top + H * clamp(v * 0.85 + 0.05);
    const x1 = cx + side * W * strawberryWidth(v) * 1.05, y1 = top + H * clamp(v + rand.range(0.02, 0.1));
    body += `<path d="M${f(x0)},${f(y0)} Q${f((x0 + x1) / 2)},${f(y0 + 8)} ${f(x1)},${f(y1)}" stroke="${rand() < 0.5 ? '#fff' : '#c8182f'}" stroke-opacity="${f(rand.range(0.12, 0.35))}" stroke-width="${f(rand.range(1.5, 4))}" fill="none" filter="url(#${bl})"/>`;
  }
  body += `<ellipse cx="${cx}" cy="${f(top + H * 0.4)}" rx="${f(W * 0.2)}" ry="${f(H * 0.3)}" fill="url(#${gp})" filter="url(#${bl})"/>`;
  // seeds peeking at the rim
  for (let v = 0.08; v < 0.92; v += 0.06) {
    for (const s of [-1, 1]) {
      const x = cx + s * W * strawberryWidth(v) * 0.965, y = top + H * v;
      body += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="4" ry="6" fill="#e5c05a"/>`;
    }
  }
  body += '</g>';
  body += `<path d="${shape}" fill="none" stroke="#a30b22" stroke-width="7" opacity=".85"/>`;
  const gl = gloss(cx, top, W, H, rand, { count: 9, opacity: 0.6 });
  defs += gl.defs; body += `<g clip-path="url(#${clip})">${gl.body}</g>`;
  return { defs, body, shape };
}

export function strawberryHalf({ seed = 3 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1000, 1100);
  const face = strawberryCutFace(500, 250, 300, 640, rand);
  const cal = calyx(500, 244, 230, rand, { squash: 0.12, count: 6, droop: 0.1 });
  d.def(face.defs, cal.defs);
  d.add(`<g transform="rotate(-8 500 560)">${cal.body}${face.body}</g>`);
  return d;
}

export function strawberryCut({ seed = 4 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1300, 1100);
  const back = strawberry({ seed: seed + 1, drops: 2 });
  const face = strawberryCutFace(500, 250, 300, 640, rand);
  const inner = new Doc(1000, 1100); inner.def(face.defs); inner.add(face.body);
  d.use(place(back, { x: 790, y: 560, s: 0.92, rot: 14 }));
  d.use(place(inner, { x: 480, y: 540, s: 0.95, rot: -12 }));
  return d;
}

export function strawberrySlice({ seed = 5 } = {}) {
  const rand = rng(seed);
  const d = new Doc(900, 900);
  const cx = 450, cy = 450;
  const pts = blobPoints(cx, cy, 330, 300, { n: 16, jitter: 0.025, rand });
  pts[4] = [cx + 30, cy + 350]; // gentle point toward the tip
  const shape = smoothPath(pts);
  const gf = uid('g'), bl = uid('b'), tx = uid('t'), clip = uid('c');
  d.def(
    radial(gf, [[0, '#fff1ee'], [0.28, '#ffc4c4'], [0.55, '#f7667a'], [0.82, '#d31634'], [1, '#98091f']], { cx: 0.5, cy: 0.5, r: 0.55 }),
    blurFilter(bl, 5), texture(tx, { freq: 0.025, oct: 2, depth: 0.8, spec: 0.5, exp: 36, seed, diffuse: 1.18 }),
    `<clipPath id="${clip}"><path d="${shape}"/></clipPath>`
  );
  let body = `<path d="${shape}" fill="url(#${gf})" filter="url(#${tx})"/><g clip-path="url(#${clip})">`;
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * 360 + rand.range(-8, 8);
    body += `<ellipse cx="${cx}" cy="${f(cy - 95)}" rx="${f(rand.range(10, 18))}" ry="${f(rand.range(80, 110))}" transform="rotate(${f(a)} ${cx} ${cy})" fill="#fff" opacity=".55" filter="url(#${bl})"/>`;
  }
  body += `<circle cx="${cx}" cy="${cy}" r="62" fill="#fff6f3" opacity=".8" filter="url(#${bl})"/>`;
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2;
    body += `<ellipse cx="${f(cx + Math.cos(a) * 292)}" cy="${f(cy + Math.sin(a) * 268)}" rx="5" ry="7" fill="#eccb62" transform="rotate(${f((a * 180) / Math.PI + 90)} ${f(cx + Math.cos(a) * 292)} ${f(cy + Math.sin(a) * 268)})"/>`;
  }
  body += `</g><path d="${shape}" fill="none" stroke="#9a0a20" stroke-width="10"/>`;
  const gl = uid('g');
  d.def(radial(gl, [[0, '#fff', 0.6], [1, '#fff', 0]]));
  body += `<ellipse cx="350" cy="330" rx="140" ry="80" fill="url(#${gl})" transform="rotate(-30 350 330)"/>`;
  d.add(body);
  for (let i = 0; i < 4; i++) { const dr = droplet(rand.range(300, 600), rand.range(300, 600), rand.range(8, 16), { tint: '#700015' }); d.use(dr); }
  return d;
}

export function strawberryPiece({ seed = 6 } = {}) {
  const rand = rng(seed);
  const d = new Doc(700, 700);
  const face = strawberryCutFace(420, 120, 300, 640, rand);
  const clip = uid('c');
  const chunk = smoothPath([[210, 250], [430, 170], [600, 260], [590, 470], [400, 560], [220, 470]], true, 0.6);
  d.def(face.defs, `<clipPath id="${clip}"><path d="${chunk}"/></clipPath>`);
  d.add(`<g clip-path="url(#${clip})">${face.body}</g>`);
  const skin = uid('g');
  d.def(linear(skin, [[0, '#d5152f'], [1, '#6d0513']], { x1: 0, y1: 0, x2: 1, y2: 1 }));
  d.add(`<path d="M600,260 C650,320 650,420 590,470 L400,560 C470,540 560,500 600,440 Z" fill="url(#${skin})"/>`);
  return d;
}

// ── BLUEBERRY ─────────────────────────────────────────────────────────────

export function blueberryPart(cx, cy, r, rand, { crown = true } = {}) {
  const gb = uid('g'), mb = uid('m'), gc = uid('g'), bl = uid('b');
  const shape = blob(cx, cy, r, r * 0.94, { n: 12, jitter: 0.025, rand });
  let defs =
    radial(gb, [[0, '#3d4a7a'], [0.35, '#1f2850'], [0.75, '#0f1433'], [1, '#04060f']], { cx: 0.38, cy: 0.32, r: 0.72 }) +
    mottle(mb, { freq: 7 / r, oct: 2, seed: rand() * 99 | 0, alpha: 0.6, bias: -0.25 }) +
    radial(gc, [[0, '#05060e'], [0.6, '#1a2040'], [1, '#6f7aa3']]) + blurFilter(bl, r * 0.02 + 0.8);
  let body = `<path d="${shape}" fill="url(#${gb})"/>`;
  body += `<path d="${shape}" fill="#9eabcf" opacity=".3" filter="url(#${mb})"/>`;
  const vol = volume(shape, { box: [cx - r, cy - r, r * 2, r * 2], rim: 0.45, hi: 0.22, hiSize: 0.4, rimColor: '#02030a' });
  defs += vol.defs; body += vol.body;
  if (crown) {
    const ccx = cx + r * rand.range(-0.15, 0.15), ccy = cy - r * rand.range(0.35, 0.55);
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + rand() * 0.2;
      const rr = (i % 2 ? 0.1 : 0.22) * r;
      pts.push([ccx + Math.cos(a) * rr, ccy + Math.sin(a) * rr * 0.55]);
    }
    body += `<path d="${polyPath(pts)}" fill="url(#${gc})" filter="url(#${bl})"/><ellipse cx="${f(ccx)}" cy="${f(ccy)}" rx="${f(r * 0.06)}" ry="${f(r * 0.035)}" fill="#020308"/>`;
  }
  return { defs, body };
}

export function blueberry({ seed = 11, count = 1 } = {}) {
  const rand = rng(seed);
  const layouts = {
    1: [[400, 400, 300]],
    2: [[330, 420, 250], [610, 470, 220]],
    7: [[250, 330, 125], [420, 290, 130], [590, 320, 120], [320, 470, 135], [500, 460, 140], [680, 450, 118], [440, 610, 128]]
  };
  const L = layouts[count];
  const d = new Doc(count === 1 ? 800 : count === 2 ? 900 : 900, count === 1 ? 800 : 800);
  for (const [x, y, r] of L) {
    d.use(contactShadow(x + r * 0.1, y + r * 0.85, r * 0.8, r * 0.18, 0.3));
    d.use(blueberryPart(x, y, r, rand));
  }
  if (count > 1) for (let i = 0; i < 3; i++) d.use(droplet(rand.range(250, 650), rand.range(280, 560), rand.range(8, 14), { tint: '#000' }));
  return d;
}

// ── RASPBERRY ─────────────────────────────────────────────────────────────

export function raspberryPart(cx, cy, R, rand) {
  const g = uid('g'), bl = uid('b'), sh = uid('g');
  let defs = radial(g, [[0, '#f0476c'], [0.4, '#c8173f'], [0.8, '#8a0a2c'], [1, '#4a0316']], { cx: 0.36, cy: 0.3 }) + blurFilter(bl, R * 0.01 + 0.8) +
    linear(sh, [[0, '#000', 0], [0.55, '#000', 0], [1, '#000', 0.45]]);
  const drupes = [];
  const H = R * 1.45;
  const rings = 10;
  for (let i = 0; i < rings; i++) {
    const v = i / (rings - 1); // 0 bottom .. 1 top
    const ringR = R * Math.pow(Math.max(0.03, 1 - Math.pow(v, 2.2)), 0.5) * (v < 0.08 ? 0.88 : 1);
    const y = cy + H * 0.5 - v * H;
    const n = Math.max(3, Math.round((ringR / R) * 12));
    for (let j = 0; j < n; j++) {
      const th = (j / n) * Math.PI * 2 + (i % 2) * (Math.PI / n) + rand.range(-0.06, 0.06);
      const z = Math.cos(th);
      if (z < -0.1) continue;
      const x = cx + Math.sin(th) * ringR;
      const yy = y + z * R * 0.08;
      const r = R * 0.2 * (0.5 + 0.5 * Math.max(0, z)) * rand.range(0.92, 1.08);
      drupes.push({ z: z + v * 0.2, x, y: yy, r });
    }
  }
  drupes.sort((a, b) => a.z - b.z);
  let body = `<ellipse cx="${cx}" cy="${cy}" rx="${f(R * 0.96)}" ry="${f(H * 0.52)}" fill="#3e0212"/>`;
  for (const p of drupes) {
    body += `<ellipse cx="${f(p.x)}" cy="${f(p.y)}" rx="${f(p.r)}" ry="${f(p.r * 1.05)}" fill="url(#${g})"/><ellipse cx="${f(p.x - p.r * 0.3)}" cy="${f(p.y - p.r * 0.38)}" rx="${f(p.r * 0.22)}" ry="${f(p.r * 0.14)}" fill="#fff" opacity=".55" filter="url(#${bl})"/>`;
  }
  body += `<ellipse cx="${cx}" cy="${cy}" rx="${f(R * 1.02)}" ry="${f(H * 0.56)}" fill="url(#${sh})"/>`;
  for (let i = 0; i < 26; i++) {
    const x = cx + rand.range(-R * 0.8, R * 0.8), y = cy + rand.range(-H * 0.45, H * 0.4);
    body += `<path d="M${f(x)},${f(y)} q${f(rand.range(-6, 6))},${f(-rand.range(5, 10))} ${f(rand.range(-12, 12))},${f(-rand.range(10, 20))}" stroke="#ffe3ea" stroke-opacity=".55" stroke-width="1.1" fill="none"/>`;
  }
  return { defs, body };
}

export function raspberry({ seed = 21, count = 1 } = {}) {
  const rand = rng(seed);
  const L = count === 1 ? [[400, 420, 250]] : [[260, 330, 140], [520, 300, 150], [390, 470, 150], [650, 470, 140], [230, 540, 120]];
  const d = new Doc(count === 1 ? 800 : 900, 800);
  for (const [x, y, r] of L) {
    d.use(contactShadow(x, y + r * 0.75, r * 0.85, r * 0.16, 0.3));
    d.use(raspberryPart(x, y, r, rand));
  }
  return d;
}

// ── BANANA ────────────────────────────────────────────────────────────────

function quad(p0, p1, p2, t) {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]];
}

export function banana({ seed = 31, view = 'whole' } = {}) {
  const rand = rng(seed);
  const d = new Doc(1300, 900);
  const P = view === 'side' ? [[180, 330], [640, 860], [1130, 300]] : [[170, 420], [620, 780], [1110, 250]];
  const width = profile([[0, 0.22], [0.1, 0.72], [0.45, 1], [0.85, 0.78], [1, 0.16]]);
  const W = view === 'side' ? 92 : 100;
  const N = 60;
  const center = [], normal = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const p = quad(...P, t), q = quad(...P, Math.min(1, t + 0.001)), p0 = quad(...P, Math.max(0, t - 0.001));
    const dx = q[0] - p0[0], dy = q[1] - p0[1], l = Math.hypot(dx, dy);
    center.push(p); normal.push([-dy / l, dx / l]);
  }
  const strip = (a, b) => {
    const top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const w = W * width(i / N);
      top.push([center[i][0] + normal[i][0] * w * a, center[i][1] + normal[i][1] * w * a]);
      bot.unshift([center[i][0] + normal[i][0] * w * b, center[i][1] + normal[i][1] * w * b]);
    }
    return smoothPath([...top, ...bot]);
  };
  const outline = strip(-1, 1);
  const tx = uid('t'), clip = uid('c'), bl = uid('b'), bl2 = uid('b');
  d.def(texture(tx, { freq: '0.006 0.03', oct: 2, depth: 0.9, spec: 0.35, exp: 30, seed, diffuse: 1.18 }), `<clipPath id="${clip}"><path d="${outline}"/></clipPath>`, blurFilter(bl, 1.2), blurFilter(bl2, 6));
  const faces = [[-1, -0.3, '#fbe36a', '#e9c537'], [-0.3, 0.35, '#f4cf3c', '#dcae1f'], [0.35, 1, '#d9ad22', '#a97c0f']];
  let body = contactShadow(640, 720, 380, 34, 0.25).body;
  d.def(contactShadow(0, 0, 1, 1).defs);
  body = '';
  const g = [];
  for (const [a, b, c1, c2] of faces) {
    const gid = uid('g');
    d.def(linear(gid, [[0, c1], [1, c2]], { x1: 0, y1: 0, x2: 1, y2: 0.2 }));
    g.push(`<path d="${strip(a, b)}" fill="url(#${gid})" filter="url(#${tx})"/>`);
  }
  body += g.join('');
  body += `<g clip-path="url(#${clip})">`;
  for (const k of [-0.3, 0.35]) {
    const line = center.map((p, i) => [p[0] + normal[i][0] * W * width(i / N) * k, p[1] + normal[i][1] * W * width(i / N) * k]);
    body += `<path d="${smoothPath(line, false)}" stroke="#8a6410" stroke-opacity=".35" stroke-width="5" fill="none" filter="url(#${bl2})"/>`;
    body += `<path d="${smoothPath(line, false)}" stroke="#fff6b0" stroke-opacity=".35" stroke-width="2" fill="none" transform="translate(-2 -3)"/>`;
  }
  for (let i = 0; i < 70; i++) {
    const t = rand.range(0.08, 0.92), k = rand.range(-0.9, 0.9);
    const p = center[Math.round(t * N)], n = normal[Math.round(t * N)], w = W * width(t);
    body += `<ellipse cx="${f(p[0] + n[0] * w * k)}" cy="${f(p[1] + n[1] * w * k)}" rx="${f(rand.range(1.5, 5))}" ry="${f(rand.range(1.5, 3.5))}" fill="#5a3a0e" opacity="${f(rand.range(0.25, 0.7))}" filter="url(#${bl})"/>`;
  }
  // soft specular along the top ridge
  const hl = center.map((p, i) => [p[0] + normal[i][0] * W * width(i / N) * -0.6, p[1] + normal[i][1] * W * width(i / N) * -0.6]).slice(8, 48);
  body += `<path d="${smoothPath(hl, false)}" stroke="#fff" stroke-opacity=".45" stroke-width="10" fill="none" filter="url(#${bl2})"/>`;
  body += '</g>';
  const vol = volume(outline, { box: [150, 240, 980, 560], rim: 0.25, hi: 0.1 });
  d.def(vol.defs); body += vol.body;
  // stem + tip
  const s0 = center[N], n0 = normal[N];
  const sg = uid('g');
  d.def(linear(sg, [[0, '#8a7a3a'], [1, '#3e3414']], { x1: 0, y1: 0, x2: 1, y2: 1 }));
  const dir = [s0[0] - center[N - 3][0], s0[1] - center[N - 3][1]]; const dl = Math.hypot(...dir);
  const ux = dir[0] / dl, uy = dir[1] / dl;
  body += `<path d="M${f(s0[0] + n0[0] * 14)},${f(s0[1] + n0[1] * 14)} L${f(s0[0] + ux * 85 + n0[0] * 10)},${f(s0[1] + uy * 85 + n0[1] * 10)} L${f(s0[0] + ux * 92 - n0[0] * 11)},${f(s0[1] + uy * 92 - n0[1] * 11)} L${f(s0[0] - n0[0] * 16)},${f(s0[1] - n0[1] * 16)}Z" fill="url(#${sg})"/>`;
  const t0 = center[0];
  body += `<ellipse cx="${f(t0[0] + 6)}" cy="${f(t0[1] + 2)}" rx="18" ry="14" fill="#2a1d0a"/>`;
  d.add(body);
  return d;
}

function bananaFace(cx, cy, rx, ry, rand) {
  const g = uid('g'), bl = uid('b'), tx = uid('t');
  let defs = radial(g, [[0, '#f3e3b4'], [0.55, '#f7ecca'], [0.9, '#eddcaa'], [1, '#d8c182']]) + blurFilter(bl, 2.5) +
    texture(tx, { freq: 0.03, oct: 2, depth: 0.6, spec: 0.4, exp: 30, seed: rand() * 90 | 0, diffuse: 1.15 });
  const shape = blob(cx, cy, rx, ry, { n: 10, jitter: 0.035, rand });
  let body = `<path d="${shape}" fill="url(#${g})" filter="url(#${tx})"/>`;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
    body += `<ellipse cx="${f(cx + Math.cos(a) * rx * 0.14)}" cy="${f(cy + Math.sin(a) * ry * 0.14)}" rx="${f(rx * 0.1)}" ry="${f(ry * 0.05)}" transform="rotate(${f((a * 180) / Math.PI)} ${f(cx + Math.cos(a) * rx * 0.14)} ${f(cy + Math.sin(a) * ry * 0.14)})" fill="#c9a86a" opacity=".6" filter="url(#${bl})"/>`;
  }
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2, rr = rand.range(0.05, 0.22);
    body += `<circle cx="${f(cx + Math.cos(a) * rx * rr)}" cy="${f(cy + Math.sin(a) * ry * rr)}" r="${f(rand.range(1.5, 3))}" fill="#4a3514" opacity=".7"/>`;
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    body += `<path d="M${f(cx + Math.cos(a) * rx * 0.3)},${f(cy + Math.sin(a) * ry * 0.3)} L${f(cx + Math.cos(a) * rx * 0.92)},${f(cy + Math.sin(a) * ry * 0.92)}" stroke="#fffaf0" stroke-opacity=".25" stroke-width="3" filter="url(#${bl})"/>`;
  }
  return { defs, body, shape };
}

export function bananaSlice({ seed = 33 } = {}) {
  const rand = rng(seed);
  const d = new Doc(800, 800);
  const e = uid('g');
  d.def(linear(e, [[0, '#e9d69c'], [1, '#c6ab63']], { x1: 0, y1: 0, x2: 0, y2: 1 }));
  d.add(`<ellipse cx="400" cy="425" rx="300" ry="262" fill="url(#${e})"/>`);
  d.use(bananaFace(400, 395, 300, 262, rand));
  d.use(droplet(300, 330, 14, { tint: '#5a4a20' }));
  return d;
}

export function bananaPiece({ seed = 34 } = {}) {
  const rand = rng(seed);
  const d = new Doc(800, 900);
  const side = uid('g'), tx = uid('t');
  d.def(linear(side, [[0, '#f6edcf'], [0.4, '#efe0b2'], [1, '#bda064']], { x1: 0, y1: 0, x2: 1, y2: 0 }), texture(tx, { freq: '0.06 0.01', oct: 2, depth: 0.6, spec: 0.25, seed, diffuse: 1.15 }));
  d.use(contactShadow(410, 760, 250, 40, 0.3));
  d.add(`<path d="M160,300 L170,700 C200,800 610,800 640,700 L650,300 Z" fill="url(#${side})" filter="url(#${tx})"/>`);
  d.use(bananaFace(405, 300, 245, 110, rand));
  return d;
}

// ── MANGO ─────────────────────────────────────────────────────────────────

export function mango({ seed = 41 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1000, 1000);
  const shape = smoothPath([[500, 150], [700, 210], [820, 400], [790, 640], [640, 830], [430, 860], [240, 740], [190, 520], [260, 300], [380, 190]]);
  const gb = uid('g'), gr = uid('g'), tx = uid('t'), clip = uid('c'), bl = uid('b');
  d.def(
    linear(gb, [[0, '#e83f24'], [0.35, '#f2842a'], [0.62, '#f3c23b'], [1, '#93b83a']], { x1: 0.85, y1: 0.05, x2: 0.15, y2: 0.95 }),
    radial(gr, [[0, '#d2261c', 0.75], [1, '#d2261c', 0]]),
    texture(tx, { freq: 0.015, oct: 2, depth: 0.8, spec: 0.45, exp: 34, seed, diffuse: 1.18 }),
    `<clipPath id="${clip}"><path d="${shape}"/></clipPath>`, blurFilter(bl, 0.8)
  );
  let body = contactShadow(520, 860, 300, 40, 0.28).body;
  d.def(contactShadow(0, 0, 1, 1).defs);
  body = `<path d="${shape}" fill="url(#${gb})" filter="url(#${tx})"/><g clip-path="url(#${clip})"><ellipse cx="700" cy="260" rx="300" ry="240" fill="url(#${gr})"/>`;
  for (let i = 0; i < 260; i++) body += `<circle cx="${f(rand.range(180, 830))}" cy="${f(rand.range(150, 870))}" r="${f(rand.range(1.2, 2.6))}" fill="#fff4c4" opacity="${f(rand.range(0.2, 0.55))}" filter="url(#${bl})"/>`;
  body += '</g>';
  const vol = volume(shape, { box: [190, 150, 630, 710], rim: 0.5, hi: 0.4, hiSize: 0.28, light: [0.36, 0.25] });
  d.def(vol.defs); body += vol.body;
  body += `<path d="M492,160 C488,120 500,95 520,80 L534,92 C516,108 510,130 512,160Z" fill="#5a3b1a"/>`;
  d.add(body);
  return d;
}

function mangoFlesh(id) {
  return radial(id, [[0, '#ffd257'], [0.45, '#ffae2b'], [0.85, '#f2850f'], [1, '#d96a08']], { cx: 0.4, cy: 0.35, r: 0.7 });
}

export function mangoHalf({ seed = 42 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1000, 900);
  const shape = blob(500, 450, 360, 280, { n: 14, jitter: 0.03, rand, rot: -0.2 });
  const gf = uid('g'), tx = uid('t'), sk = uid('g'), clip = uid('c'), bl = uid('b');
  d.def(mangoFlesh(gf), texture(tx, { freq: '0.03 0.006', oct: 2, depth: 0.9, spec: 0.7, exp: 36, seed, diffuse: 1.15 }),
    linear(sk, [[0, '#c9361f'], [0.5, '#e38b2a'], [1, '#7ea434']], { x1: 0, y1: 0, x2: 1, y2: 1 }), `<clipPath id="${clip}"><path d="${shape}"/></clipPath>`, blurFilter(bl, 8));
  d.use(contactShadow(520, 740, 330, 36, 0.28));
  d.add(`<path d="${shape}" fill="url(#${sk})" transform="translate(10 22)"/><path d="${shape}" fill="url(#${gf})" filter="url(#${tx})"/>`);
  d.add(`<g clip-path="url(#${clip})"><ellipse cx="420" cy="340" rx="190" ry="90" fill="#fff" opacity=".35" filter="url(#${bl})" transform="rotate(-18 420 340)"/></g>`);
  d.add(`<path d="${shape}" fill="none" stroke="#f7b54a" stroke-width="6" opacity=".6"/>`);
  for (let i = 0; i < 5; i++) d.use(droplet(rand.range(330, 680), rand.range(320, 560), rand.range(9, 18), { tint: '#8a3a00' }));
  return d;
}

export function mangoSlice({ seed = 43 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1200, 700);
  const outer = [], inner = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30, a = Math.PI * (0.1 + 0.8 * t);
    const w = Math.sin(t * Math.PI);
    outer.push([600 - Math.cos(a) * 520, 620 - Math.sin(a) * 420]);
    inner.unshift([600 - Math.cos(a) * 500, 620 - Math.sin(a) * (420 - 170 * w)]);
  }
  const shape = smoothPath([...outer, ...inner]);
  const skin = smoothPath([...outer, ...outer.map(([x, y]) => [x, y + 16]).reverse()]);
  const gf = uid('g'), tx = uid('t'), bl = uid('b');
  d.def(mangoFlesh(gf), texture(tx, { freq: '0.006 0.03', oct: 2, depth: 0.9, spec: 0.7, exp: 36, seed, diffuse: 1.15 }), blurFilter(bl, 7));
  d.add(`<path d="${shape}" fill="url(#${gf})" filter="url(#${tx})"/><path d="${smoothPath(outer, false)}" stroke="#6c9a2d" stroke-width="16" fill="none"/><path d="${smoothPath(outer, false)}" stroke="#d2542a" stroke-width="8" fill="none" transform="translate(0 6)"/>`);
  d.add(`<path d="${smoothPath(outer.slice(6, 22).map(([x, y]) => [x, y + 50]), false)}" stroke="#fff" stroke-opacity=".45" stroke-width="18" fill="none" filter="url(#${bl})"/>`);
  void skin;
  for (let i = 0; i < 3; i++) d.use(droplet(rand.range(350, 850), rand.range(330, 420), rand.range(8, 14), { tint: '#8a3a00' }));
  return d;
}

/** Rounded isometric cube (mango cube / cookie chunk base). */
export function isoCube(cx, cy, s, colors, rand, { tex = null, round = 0.55 } = {}) {
  const h = s * 0.5, w = s * 0.87;
  const j = () => rand.range(-s * 0.035, s * 0.035);
  // shared vertices jittered once so faces stay watertight
  const T = [cx + j(), cy - h + j()], R = [cx + w + j(), cy + j()], C = [cx + j() * 0.3, cy + h + j() * 0.3], L = [cx - w + j(), cy + j()];
  const RB = [R[0] + j() * 0.5, R[1] + s], CB = [C[0] + j() * 0.5, C[1] + s], LB = [L[0] + j() * 0.5, L[1] + s];
  const faces = [[[L, C, CB, LB], colors[1]], [[C, R, RB, CB], colors[2]], [[T, R, C, L], colors[0]]];
  let body = '';
  for (const [pts, c] of faces) body += `<path d="${smoothPath(pts, true, round)}" fill="${c}"${tex ? ` filter="url(#${tex})"` : ''}/>`;
  return body;
}

export function mangoCube({ seed = 44 } = {}) {
  const rand = rng(seed);
  const d = new Doc(800, 800);
  const tx = uid('t'), bl = uid('b');
  d.def(texture(tx, { freq: '0.04 0.008', oct: 2, depth: 0.9, spec: 0.7, exp: 36, seed, diffuse: 1.15 }), blurFilter(bl, 5));
  d.use(contactShadow(400, 660, 260, 40, 0.3));
  d.add(isoCube(400, 300, 250, ['#ffc54a', '#f39a1c', '#d8760c'], rand, { tex: tx }));
  d.add(`<path d="M190,300 L400,190 L610,300" stroke="#fff" stroke-opacity=".5" stroke-width="10" fill="none" filter="url(#${bl})"/>`);
  d.use(droplet(470, 290, 16, { tint: '#8a3a00' }));
  d.use(droplet(300, 470, 12, { tint: '#8a3a00' }));
  return d;
}

export function mangoCut({ seed = 45 } = {}) {
  const rand = rng(seed);
  const d = new Doc(1000, 900);
  const tx = uid('t'), sk = uid('g');
  d.def(texture(tx, { freq: '0.04 0.008', oct: 2, depth: 0.9, spec: 0.7, exp: 36, seed, diffuse: 1.15 }),
    linear(sk, [[0, '#d23a20'], [0.5, '#e98f2c'], [1, '#6e9a2f']], { x1: 0, y1: 0, x2: 1, y2: 0 }));
  d.use(contactShadow(500, 780, 360, 40, 0.3));
  d.add(`<path d="M150,560 C170,760 830,760 850,560 C700,640 300,640 150,560Z" fill="url(#${sk})"/>`);
  const cubes = [];
  const rows = [7, 6, 5, 4, 3];
  rows.forEach((n, row) => {
    for (let col = 0; col < n; col++) {
      const u = (col - (n - 1) / 2) / 3.2;
      const x = 500 + u * 330;
      const y = 560 - row * 72 + u * u * 120;
      cubes.push({ x, y, z: -row * 10 + (1 - Math.abs(u)), s: 58 - row * 2 });
    }
  });
  cubes.sort((a, b) => a.z - b.z);
  for (const c of cubes) d.add(isoCube(c.x, c.y, c.s, ['#ffc54a', '#f39a1c', '#d8760c'], rand, { tex: tx }));
  return d;
}

// ── PINEAPPLE ─────────────────────────────────────────────────────────────

function pineappleDisc(cx, cy, R, rand, { tilt = 0.9 } = {}) {
  const gf = uid('g'), gc = uid('g'), bl = uid('b'), tx = uid('t');
  let defs = radial(gf, [[0, '#fff0a8'], [0.35, '#ffe06a'], [0.8, '#f6c12d'], [1, '#e2a013']]) +
    radial(gc, [[0, '#fff6cf'], [1, '#f6de8c']]) + blurFilter(bl, 1.5) +
    texture(tx, { freq: 0.04, oct: 2, depth: 0.7, spec: 0.5, exp: 34, seed: rand() * 90 | 0, diffuse: 1.15 });
  let body = `<ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${f(R * tilt)}" fill="#6c5520"/>`;
  body += `<ellipse cx="${cx}" cy="${cy}" rx="${f(R * 0.93)}" ry="${f(R * tilt * 0.93)}" fill="url(#${gf})" filter="url(#${tx})"/>`;
  for (let i = 0; i < 150; i++) {
    const a = (i / 150) * Math.PI * 2 + rand.range(-0.01, 0.01);
    const r0 = R * 0.2, r1 = R * 0.9;
    body += `<path d="M${f(cx + Math.cos(a) * r0)},${f(cy + Math.sin(a) * r0 * tilt)} L${f(cx + Math.cos(a) * r1)},${f(cy + Math.sin(a) * r1 * tilt)}" stroke="${i % 3 ? '#fff6c0' : '#d8960c'}" stroke-opacity="${i % 3 ? 0.35 : 0.3}" stroke-width="${f(rand.range(1.5, 3.5))}" filter="url(#${bl})"/>`;
  }
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    body += `<ellipse cx="${f(cx + Math.cos(a) * R * 0.84)}" cy="${f(cy + Math.sin(a) * R * 0.84 * tilt)}" rx="6" ry="4" fill="#8a5a14" opacity=".6"/>`;
  }
  body += `<ellipse cx="${cx}" cy="${cy}" rx="${f(R * 0.2)}" ry="${f(R * 0.2 * tilt)}" fill="url(#${gc})"/>`;
  return { defs, body };
}

export function pineappleSlice({ seed = 51 } = {}) {
  const rand = rng(seed);
  const d = new Doc(900, 900);
  d.add(`<ellipse cx="450" cy="480" rx="360" ry="330" fill="#4d3a12"/>`);
  d.use(pineappleDisc(450, 450, 360, rand, { tilt: 0.9 }));
  d.use(droplet(360, 360, 14, { tint: '#6a4a00' }));
  d.use(droplet(540, 520, 10, { tint: '#6a4a00' }));
  return d;
}

export function pineapplePiece({ seed = 52 } = {}) {
  const rand = rng(seed);
  const d = new Doc(900, 800);
  const clip = uid('c');
  const R = 520;
  const cx = 160, cy = 420;
  const a0 = -0.34, a1 = 0.34;
  const wedge = `M${cx},${cy} L${f(cx + Math.cos(a0) * R)},${f(cy + Math.sin(a0) * R)} A${R},${R} 0 0 1 ${f(cx + Math.cos(a1) * R)},${f(cy + Math.sin(a1) * R)}Z`;
  d.def(`<clipPath id="${clip}"><path d="${wedge}"/></clipPath>`);
  const side = uid('g');
  d.def(linear(side, [[0, '#f0bb2a'], [1, '#b98010']], { x1: 0, y1: 0, x2: 0, y2: 1 }));
  d.use(contactShadow(460, 680, 320, 36, 0.3));
  d.add(`<path d="M${cx},${cy} L${f(cx + Math.cos(a1) * R)},${f(cy + Math.sin(a1) * R)} l0,70 L${cx},${cy + 70}Z" fill="url(#${side})"/>`);
  const disc = pineappleDisc(cx, cy, R, rand, { tilt: 1 });
  d.def(disc.defs);
  d.add(`<g clip-path="url(#${clip})">${disc.body}</g>`);
  return d;
}
