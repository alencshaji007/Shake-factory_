#!/usr/bin/env node
/**
 * Renders a stand-in for every asset id in tools/assets.config.mjs, so the
 * site is complete before the Hugging Face photographs exist. Stand-ins are
 * exported exactly like photographs (transparent WebP + AVIF, full + small)
 * to assets/images/standin/ and registered in the runtime manifest with
 * source "standin". A real photograph (source "hf") is never overwritten.
 *
 *   node tools/build-standins.mjs                 # all
 *   node tools/build-standins.mjs --only cookie-whole,ice-cube
 *   node tools/build-standins.mjs --preview out.png [--only …]   # contact sheet only
 */
import path from 'node:path';
import sharp from 'sharp';
import { ASSETS } from './assets.config.mjs';
import { ROOT, STANDIN_DIR } from './lib/paths.mjs';
import { args, selectAssets } from './lib/env.mjs';
import { exportResponsive } from './lib/export.mjs';
import { readManifest, setAsset, writeManifest } from './lib/manifest.mjs';
import { RENDERERS } from './standins/index.mjs';

const opts = args();
const list = selectAssets(ASSETS, opts);

const missing = list.filter((a) => !RENDERERS[a.id]);
if (missing.length) console.warn(`! no stand-in renderer for: ${missing.map((a) => a.id).join(', ')}`);

async function rasterise(a) {
  const svg = String(RENDERERS[a.id]());
  const png = await sharp(Buffer.from(svg), { density: opts.preview ? 72 : 108 }).png().toBuffer(); // 1.5× for crisp close-ups
  const trimmed = await sharp(png).trim({ threshold: 1 }).png().toBuffer();
  const { width, height } = await sharp(trimmed).metadata();
  const pad = Math.round(Math.max(width, height) * 0.03);
  return sharp(trimmed).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

if (opts.preview) {
  const tiles = [];
  for (const a of list.filter((x) => RENDERERS[x.id])) {
    const buf = await sharp(await rasterise(a)).resize(300, 300, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
    tiles.push(buf);
  }
  const cols = Math.min(6, tiles.length), rows = Math.ceil(tiles.length / cols);
  const bg = opts.bg === 'light' ? { r: 236, g: 228, b: 214 } : { r: 38, g: 26, b: 22 };
  await sharp({ create: { width: cols * 310, height: rows * 310, channels: 3, background: bg } })
    .composite(tiles.map((input, i) => ({ input, left: (i % cols) * 310 + 5, top: Math.floor(i / cols) * 310 + 5 })))
    .png().toFile(opts.preview);
  console.log(`✔ preview ${opts.preview} (${tiles.length} tiles)`);
  process.exit(0);
}

const manifest = readManifest();
let n = 0;
for (const a of list) {
  if (!RENDERERS[a.id]) continue;
  const base = path.join(STANDIN_DIR, a.category, a.id);
  const { w, h, sm } = await exportResponsive(await rasterise(a), base, { maxWidth: Math.min(a.maxWidth, 1200) });
  if (setAsset(manifest, a.id, { src: path.relative(ROOT, base).split(path.sep).join('/'), w, h, sm, source: 'standin' })) n++;
  process.stdout.write(`  ✔ ${a.category}/${a.id} ${w}×${h}\n`);
}
writeManifest(manifest);
console.log(`\n✔ ${n} stand-ins registered (${list.length - n} kept as photographs or skipped)`);
