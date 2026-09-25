#!/usr/bin/env node
/**
 * Cutout + optimisation pipeline.
 *
 *   originals (assets-src/originals/<cat>/<id>.png)
 *     → background removal (edge-preserving, optional natural contact shadow)
 *     → transparent master (assets-src/cutouts/<cat>/<id>.png)
 *     → WebP + AVIF, full + small (assets/images/generated/<cat>/<id>[-sm].{webp,avif})
 *     → runtime manifest (assets/images/manifest.js)
 *
 *   node tools/process-images.mjs                     # every original found
 *   node tools/process-images.mjs --only mango-cube --cutout key
 *
 * Cutout providers (--cutout):
 *   auto   (default) rembg CLI if installed → Hugging Face BiRefNet Space → local key
 *   rembg  local `rembg` (pip install "rembg[cli]") with the BiRefNet model
 *   space  Hugging Face Space not-lain/background-removal (BiRefNet) via @gradio/client
 *   key    local colour key against the seamless studio backdrop (no network)
 * Assets marked cutoutMode:'luma' (milk, ice, splashes) always use a luminance
 * key so translucent liquid keeps its natural transparency.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ASSETS } from './assets.config.mjs';
import { CUTOUTS_DIR, GENERATED_DIR, ORIGINALS_DIR, ROOT } from './lib/paths.mjs';
import { args, loadEnv, selectAssets } from './lib/env.mjs';
import { exportResponsive } from './lib/export.mjs';
import { readManifest, setAsset, writeManifest } from './lib/manifest.mjs';

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

// ── Providers ─────────────────────────────────────────────────────────────

function hasRembg() {
  return spawnSync('rembg', ['--help'], { stdio: 'ignore' }).status === 0;
}

async function cutoutRembg(input, output) {
  const res = spawnSync('rembg', ['i', '-m', 'birefnet-general', input, output], { stdio: 'inherit' });
  if (res.status !== 0) throw new Error('rembg failed');
}

let spaceClient;
async function cutoutSpace(input, output) {
  const { Client, handle_file } = await import('@gradio/client');
  const token = process.env.HF_TOKEN;
  spaceClient ??= await Client.connect(process.env.HF_CUTOUT_SPACE || 'not-lain/background-removal', token ? { hf_token: token } : {});
  // Find the first endpoint that takes a single image.
  const api = await spaceClient.view_api();
  const [name] = Object.entries(api.named_endpoints).find(([, e]) => e.parameters.length === 1 && /image/i.test(e.parameters[0].python_type?.type || e.parameters[0].component)) || [];
  if (!name) throw new Error('No image endpoint found on cutout Space');
  const result = await spaceClient.predict(name, [handle_file(fs.readFileSync(input))]);
  const urls = JSON.stringify(result.data).match(/https?:[^"]+?\.(?:png|webp)/g) || [];
  for (const url of urls) {
    const buf = Buffer.from(await (await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} })).arrayBuffer());
    if ((await sharp(buf).metadata()).hasAlpha) { await sharp(buf).png().toFile(output); return; }
  }
  throw new Error('Cutout Space returned no transparent image');
}

/**
 * Local key against a seamless backdrop. Soft threshold on distance from the
 * backdrop colour keeps anti-aliased, natural edges; spill is removed by
 * un-premultiplying against the backdrop.
 */
async function cutoutKey(input, output, backdrop) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bg = backdrop === 'black' ? [0, 0, 0] : [255, 255, 255];
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const d = Math.max(Math.abs(data[i] - bg[0]), Math.abs(data[i + 1] - bg[1]), Math.abs(data[i + 2] - bg[2])) / 255;
    const a = smooth(0.035, 0.16, d);
    for (let c = 0; c < 3; c++) out[j + c] = a > 0.001 ? clamp((data[i + c] - bg[c] * (1 - a)) / a, 0, 255) : 0;
    out[j + 3] = Math.round(a * 255);
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(output);
}

/** Luminance key for liquids/ice shot on black: brightness becomes opacity. */
async function cutoutLuma(input, output) {
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const a = smooth(0.03, 0.62, l);
    const k = a > 0.001 ? 1 / Math.max(a, l) : 0;
    out[j] = clamp(r * k, 0, 255); out[j + 1] = clamp(g * k, 0, 255); out[j + 2] = clamp(b * k, 0, 255);
    out[j + 3] = Math.round(a * 255);
  }
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(output);
}

/**
 * Re-adds the natural contact shadow that was cast on a white backdrop:
 * darkening of the original outside the subject mask becomes a soft shadow.
 */
async function keepShadow(original, cutout) {
  const orig = await sharp(original).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const cut = await sharp(cutout).ensureAlpha().resize(orig.info.width, orig.info.height).raw().toBuffer();
  const out = Buffer.from(cut);
  for (let i = 0, j = 0; i < orig.data.length; i += 3, j += 4) {
    const a = cut[j + 3] / 255;
    if (a > 0.98) continue;
    const l = (orig.data[i] + orig.data[i + 1] + orig.data[i + 2]) / 765;
    const s = clamp((0.97 - l) * 1.6) * 0.7 * (1 - a);
    const outA = a + s;
    if (outA <= 0) continue;
    for (let c = 0; c < 3; c++) out[j + c] = (cut[j + c] * a + 22 * s) / outA; // warm near-black shadow
    out[j + 3] = Math.round(clamp(outA) * 255);
  }
  await sharp(out, { raw: { width: orig.info.width, height: orig.info.height, channels: 4 } }).png().toFile(cutout);
}

/** Trim transparent margins and add a small uniform padding. */
async function trimPad(file) {
  const buf = await sharp(file).trim({ threshold: 2 }).png().toBuffer();
  const { width, height } = await sharp(buf).metadata();
  const pad = Math.round(Math.max(width, height) * 0.03);
  await sharp(buf).extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(file);
}

// ── Pipeline ──────────────────────────────────────────────────────────────

export async function processAssets(list, { cutout = 'auto' } = {}) {
  loadEnv();
  const manifest = readManifest();
  let provider = cutout === 'auto' ? (hasRembg() ? 'rembg' : 'space') : cutout;

  for (const a of list) {
    const original = path.join(ORIGINALS_DIR, a.category, `${a.id}.png`);
    if (!fs.existsSync(original)) { console.warn(`  – ${a.id}: no original, skipped`); continue; }
    const master = path.join(CUTOUTS_DIR, a.category, `${a.id}.png`);
    fs.mkdirSync(path.dirname(master), { recursive: true });

    try {
      if (!a.cutout) fs.copyFileSync(original, master);
      else if (a.cutoutMode === 'luma') await cutoutLuma(original, master);
      else if (provider === 'rembg') await cutoutRembg(original, master);
      else if (provider === 'space') await cutoutSpace(original, master);
      else await cutoutKey(original, master, a.backdrop);
    } catch (err) {
      console.warn(`  ! ${a.id}: ${provider} cutout failed (${err.message}) — using local key${cutout === 'auto' ? ' from now on' : ''}`);
      if (cutout === 'auto') provider = 'key'; // don't retry an unreachable provider for every asset
      await cutoutKey(original, master, a.backdrop);
    }
    if (a.cutout && a.shadow && a.backdrop === 'white') await keepShadow(original, master);
    if (a.cutout) await trimPad(master);

    const base = path.join(GENERATED_DIR, a.category, a.id);
    const { w, h, sm } = await exportResponsive(master, base, { maxWidth: a.maxWidth });
    setAsset(manifest, a.id, { src: path.relative(ROOT, base).split(path.sep).join('/'), w, h, sm, source: 'hf' });
    console.log(`  ✔ ${a.category}/${a.id} → webp/avif ${w}×${h}`);
  }
  writeManifest(manifest);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const opts = args();
  const list = selectAssets(ASSETS, opts).filter((a) => fs.existsSync(path.join(ORIGINALS_DIR, a.category, `${a.id}.png`)));
  console.log(`▶ Processing ${list.length} originals (${os.cpus().length} cpus)`);
  await processAssets(list, { cutout: opts.cutout || 'auto' });
}
