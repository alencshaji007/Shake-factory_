// Ingests user-supplied photos: crop → alpha (existing, or chroma key against a baked-in grey checkerboard) → trim+pad → WebP.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const { chromium } = createRequire('/opt/node22/lib/node_modules/')('playwright');
const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, ''), IM = process.env.IM;
const { ASSETS } = await import(ROOT + '/tools/assets.config.mjs');
const { readManifest, setAsset, writeManifest } = await import(ROOT + '/tools/lib/manifest.mjs');
const JOBS = [
  { id: 'mango-half', file: '1.jpg', mode: 'chroma', crop: [70, 175, 900, 540] },
  { id: 'mango-cut', file: '1.jpg', mode: 'chroma', crop: [165, 1460, 720, 540] },
  { id: 'mango-slice', file: '1.jpg', mode: 'chroma', crop: [1105, 1475, 760, 480] },
  { id: 'almond', file: '2.jpg', mode: 'chroma' },
  { id: 'pistachio', file: '4.webp', mode: 'alpha' },
  { id: 'shake-strawberry-cloud', file: '3.png', mode: 'alpha' },
  { id: 'shake-cookie-monster', file: '5.webp', mode: 'alpha' },
];
const only = process.argv[2]?.split(',');
const b = await chromium.launch(); const page = await b.newPage();
const manifest = readManifest();
for (const j of JOBS) {
  if (only && !only.includes(j.id)) continue;
  const a = ASSETS.find((x) => x.id === j.id);
  const t = j.file.endsWith('png') ? 'png' : j.file.endsWith('webp') ? 'webp' : 'jpeg';
  const r = await page.evaluate(async ({ d, j, maxWidth }) => {
    const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
    const smooth = (e0, e1, x) => { const q = clamp((x - e0) / (e1 - e0)); return q * q * (3 - 2 * q); };
    const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const img = new Image(); img.src = d; await img.decode();
    const [cx, cy, cw, ch] = j.crop || [0, 0, img.naturalWidth, img.naturalHeight];
    const c = cv(cw, ch); const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
    const id = x.getImageData(0, 0, cw, ch), o = id.data;
    if (j.mode === 'chroma') for (let k = 0; k < o.length; k += 4) {
      const chroma = (Math.max(o[k], o[k + 1], o[k + 2]) - Math.min(o[k], o[k + 1], o[k + 2])) / 255;
      o[k + 3] = Math.round(255 * smooth(0.07, 0.17, chroma));
    }
    // keep only the largest opaque component (drops neighbouring pieces and specks)
    const W = cw, H = ch, lab = new Int32Array(W * H), q = new Int32Array(W * H); let best = 0, bestN = 0, n = 0;
    for (let s = 0; s < W * H; s++) { if (lab[s] || o[s * 4 + 3] < 40) continue; n++; let h = 0, tl = 0, cnt = 0; lab[s] = n; q[tl++] = s;
      while (h < tl) { const p = q[h++]; cnt++; const px = p % W, py = (p / W) | 0; for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const m = ny * W + nx; if (!lab[m] && o[m * 4 + 3] >= 40) { lab[m] = n; q[tl++] = m; } } }
      if (cnt > bestN) { bestN = cnt; best = n; } }
    // dilate the kept component by 3px so soft edges survive, zero everything else
    const keep = new Uint8Array(W * H); for (let p = 0; p < W * H; p++) if (lab[p] === best) keep[p] = 1;
    for (let it = 0; it < 3; it++) { const k2 = keep.slice(); for (let p = 0; p < W * H; p++) if (!keep[p]) { const px = p % W; if ((px > 0 && keep[p - 1]) || (px < W - 1 && keep[p + 1]) || (p >= W && keep[p - W]) || (p < W * H - W && keep[p + W])) k2[p] = 1; } keep.set(k2); }
    for (let p = 0; p < W * H; p++) if (!keep[p]) o[p * 4 + 3] = 0;
    x.putImageData(id, 0, 0);
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) if (o[(y * W + xx) * 4 + 3] > 2) { x0 = Math.min(x0, xx); x1 = Math.max(x1, xx); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    const tw = x1 - x0 + 1, th = y1 - y0 + 1, pad = Math.round(Math.max(tw, th) * 0.03);
    const m = cv(tw + 2 * pad, th + 2 * pad); m.getContext('2d').drawImage(c, x0, y0, tw, th, pad, pad, tw, th);
    const resize = (src, width) => { let cur = src; while (cur.width / 2 >= width) { const r = cv(Math.round(cur.width / 2), Math.round(cur.height / 2)); const rx = r.getContext('2d'); rx.imageSmoothingQuality = 'high'; rx.drawImage(cur, 0, 0, r.width, r.height); cur = r; } const r = cv(width, Math.round(src.height * width / src.width)); const rx = r.getContext('2d'); rx.imageSmoothingQuality = 'high'; rx.drawImage(cur, 0, 0, r.width, r.height); return r; };
    const b64 = (cc) => cc.toDataURL('image/webp', 0.86).split(',')[1];
    const full = Math.min(maxWidth, m.width), sm = full > 800;
    return { master: m.toDataURL('image/png').split(',')[1], full: b64(full === m.width ? m : resize(m, full)), small: sm ? b64(resize(m, 640)) : null, w: full, h: Math.round(m.height * full / m.width), sm };
  }, { d: `data:image/${t};base64,${fs.readFileSync(path.join(IM, j.file)).toString('base64')}`, j, maxWidth: a.maxWidth || 1400 });
  const orig = `${ROOT}/assets-src/originals/${a.category}/${a.id}.png`;
  fs.mkdirSync(path.dirname(orig), { recursive: true });
  fs.writeFileSync(orig, Buffer.from(r.master, 'base64'));
  fs.writeFileSync(orig.replace(/\.png$/, '.json'), JSON.stringify({ id: a.id, source: 'user-supplied photo', file: j.file, crop: j.crop || null, cutout: j.mode === 'chroma' ? 'chroma key (baked-in checkerboard)' : 'supplied alpha' }, null, 2));
  const base = `${ROOT}/assets/images/generated/${a.category}/${a.id}`;
  fs.mkdirSync(path.dirname(base), { recursive: true });
  fs.writeFileSync(`${base}.webp`, Buffer.from(r.full, 'base64'));
  if (r.small) fs.writeFileSync(`${base}-sm.webp`, Buffer.from(r.small, 'base64'));
  setAsset(manifest, a.id, { src: path.relative(ROOT, base), w: r.w, h: r.h, sm: r.sm, source: 'hf', avif: false });
  console.log(`✔ ${a.category}/${a.id} ${r.w}x${r.h}`);
}
writeManifest(manifest); await b.close();
