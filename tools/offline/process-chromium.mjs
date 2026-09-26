// sharp is unavailable here (npm blocked), so this ports tools/process-images.mjs (local key path) + tools/lib/export.mjs
// into headless Chromium: decode → key/luma cutout → contact shadow → trim+pad → WebP full + -sm. AVIF can't be encoded
// by Chromium, so entries get `avif: false`; re-running `npm run assets:process` with sharp restores AVIF.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, ''), RAW = process.env.RAW;
const { ASSETS } = await import(ROOT + '/tools/assets.config.mjs');
const { readManifest, setAsset, writeManifest } = await import(ROOT + '/tools/lib/manifest.mjs');
const only = process.argv[2] ? process.argv[2].split(',') : null;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
await page.evaluate(() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  const load = (b64, type) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = `data:${type};base64,${b64}`; });
  const canvasOf = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const toB64 = (c, type, q) => c.toDataURL(type, q).split(',')[1];
  function resize(src, width) {
    let cur = src;
    while (cur.width / 2 >= width) { const c = canvasOf(Math.round(cur.width / 2), Math.round(cur.height / 2)); const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, c.width, c.height); cur = c; }
    const c = canvasOf(width, Math.round((src.height * width) / src.width)); const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(cur, 0, 0, c.width, c.height); return c;
  }
  function backdropMask(px, W, H) {
    const N = W * H, lum = new Float32Array(N), chroma = new Float32Array(N);
    for (let p = 0, j = 0; p < N; p++, j += 4) { const r = px[j], g = px[j + 1], b = px[j + 2]; lum[p] = (r + g + b) / 3; chroma[p] = (Math.max(r, g, b) - Math.min(r, g, b)) / 255; }
    // 3x3 box blur of luminance to ignore compression noise
    const sm = new Float32Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let t = 0, c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) { t += lum[yy * W + xx]; c++; } } sm[y * W + x] = t / c; }
    const bg = new Uint8Array(N), q = new Int32Array(N); let head = 0, tail = 0;
    const ok = (p) => chroma[p] < 0.12;
    const push = (p) => { if (!bg[p] && ok(p)) { bg[p] = 1; q[tail++] = p; } };
    for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
    while (head < tail) {
      const p = q[head++], x = p % W, y = (p / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const n = yy * W + xx; if (!bg[n] && Math.abs(sm[n] - sm[p]) < 2.5) push(n);
      }
    }
    // shrink the background by 1px and feather over ~3px so edges stay soft
    const f = new Float32Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let t = 0, c = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < W && yy < H) { t += bg[yy * W + xx]; c++; } } const v = t / c; f[y * W + x] = bg[y * W + x] ? Math.min(1, v * 1.25) : v * 0.6; }
    return f;
  }
  window.proc = async ({ b64, type, cutout, mode, backdrop, shadow, maxWidth }) => {
    const img = await load(b64, type);
    const W = img.naturalWidth, H = img.naturalHeight;
    const base = canvasOf(W, H); const bx = base.getContext('2d', { willReadFrequently: true }); bx.drawImage(img, 0, 0);
    const original = bx.getImageData(0, 0, W, H).data; // opaque source
    const originalPng = toB64(base, 'image/png');
    let master = base;
    if (cutout) {
      const out = new ImageData(W, H); const o = out.data;
      if (mode === 'luma') {
        for (let j = 0; j < o.length; j += 4) {
          const r = original[j], g = original[j + 1], b = original[j + 2];
          const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255, a = smooth(0.03, 0.62, l), k = a > 0.001 ? 1 / Math.max(a, l) : 0;
          o[j] = clamp(r * k, 0, 255); o[j + 1] = clamp(g * k, 0, 255); o[j + 2] = clamp(b * k, 0, 255); o[j + 3] = Math.round(a * 255);
        }
      } else {
        const bg = backdrop === 'black' ? [0, 0, 0] : [255, 255, 255];
        for (let j = 0; j < o.length; j += 4) {
          const d = Math.max(Math.abs(original[j] - bg[0]), Math.abs(original[j + 1] - bg[1]), Math.abs(original[j + 2] - bg[2])) / 255;
          const a = smooth(0.035, 0.16, d);
          for (let c = 0; c < 3; c++) o[j + c] = a > 0.001 ? clamp((original[j + c] - bg[c] * (1 - a)) / a, 0, 255) : 0;
          o[j + 3] = Math.round(a * 255);
        }
        // Backdrop region: smooth, near-neutral pixels connected to the border (catches floor shadows and
        // grey sweeps the plain key keeps). Removed with a feathered mask; the key still anti-aliases edges.
        const bgm = backdropMask(original, W, H);
        for (let j = 0, p = 0; j < o.length; j += 4, p++) o[j + 3] = Math.round(o[j + 3] * (1 - bgm[p]));
        if (shadow && backdrop === 'white') {
          for (let j = 0; j < o.length; j += 4) {
            const a = o[j + 3] / 255; if (a > 0.98) continue;
            const l = (original[j] + original[j + 1] + original[j + 2]) / 765, s = clamp((0.97 - l) * 1.6) * 0.7 * (1 - a), outA = a + s;
            if (outA <= 0) continue;
            for (let c = 0; c < 3; c++) o[j + c] = (o[j + c] * a + 22 * s) / outA;
            o[j + 3] = Math.round(clamp(outA) * 255);
          }
        }
      }
      // trim (alpha > 2) + 3% pad
      let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (o[(y * W + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) { x0 = 0; y0 = 0; x1 = W - 1; y1 = H - 1; }
      const tw = x1 - x0 + 1, th = y1 - y0 + 1, pad = Math.round(Math.max(tw, th) * 0.03);
      const keyed = canvasOf(W, H); keyed.getContext('2d').putImageData(out, 0, 0);
      master = canvasOf(tw + 2 * pad, th + 2 * pad); master.getContext('2d').drawImage(keyed, x0, y0, tw, th, pad, pad, tw, th);
    }
    const full = Math.min(maxWidth || 1400, master.width), sm = full > 640 * 1.25;
    const res = { originalPng, masterPng: toB64(master, 'image/png'), w: full, h: Math.round((master.height * full) / master.width), sm, files: {} };
    res.files[''] = toB64(full === master.width ? master : resize(master, full), 'image/webp', 0.82);
    if (sm) res.files['-sm'] = toB64(resize(master, 640), 'image/webp', 0.82);
    return res;
  };
});

const manifest = readManifest();
let n = 0;
for (const a of ASSETS) {
  if (only && !only.includes(a.id)) continue;
  const origPath = `${ROOT}/assets-src/originals/${a.category}/${a.id}.png`;
  const rawPath = `${RAW}/${a.id}.webp`;
  const src = fs.existsSync(rawPath) ? rawPath : fs.existsSync(origPath) ? origPath : null;
  if (!src) continue;
  const r = await page.evaluate((o) => window.proc(o), { b64: fs.readFileSync(src).toString('base64'), type: src.endsWith('.webp') ? 'image/webp' : 'image/png', cutout: a.cutout, mode: a.cutoutMode, backdrop: a.backdrop, shadow: a.shadow, maxWidth: a.maxWidth });
  fs.mkdirSync(path.dirname(origPath), { recursive: true });
  if (src === rawPath) { fs.writeFileSync(origPath, Buffer.from(r.originalPng, 'base64')); fs.copyFileSync(`${RAW}/${a.id}.json`, origPath.replace(/\.png$/, '.json')); }
  const master = `${ROOT}/assets-src/cutouts/${a.category}/${a.id}.png`;
  fs.mkdirSync(path.dirname(master), { recursive: true }); fs.writeFileSync(master, Buffer.from(r.masterPng, 'base64'));
  const base = `${ROOT}/assets/images/generated/${a.category}/${a.id}`;
  fs.mkdirSync(path.dirname(base), { recursive: true });
  for (const [suffix, b64] of Object.entries(r.files)) fs.writeFileSync(`${base}${suffix}.webp`, Buffer.from(b64, 'base64'));
  setAsset(manifest, a.id, { src: path.relative(ROOT, base), w: r.w, h: r.h, sm: r.sm, source: 'hf', avif: false });
  console.log(`✔ ${a.category}/${a.id} ${r.w}x${r.h}`); n++;
}
writeManifest(manifest);
await browser.close();
console.log(`processed ${n}`);
