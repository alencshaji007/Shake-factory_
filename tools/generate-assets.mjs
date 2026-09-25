#!/usr/bin/env node
/**
 * Generates every photographic asset with a Hugging Face text-to-image model,
 * then hands it to the cutout/optimisation pipeline.
 *
 *   HF_TOKEN=hf_xxx node tools/generate-assets.mjs                 # everything missing
 *   node tools/generate-assets.mjs --category fruits,slices
 *   node tools/generate-assets.mjs --only strawberry-front --force --seed 7
 *   node tools/generate-assets.mjs --model black-forest-labs/FLUX.1-dev --provider fal-ai
 *   node tools/generate-assets.mjs --dry-run                       # print prompts only
 *
 * The token is read from the environment / .env and is only ever used here,
 * at asset-production time. The static site never sees it.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { InferenceClient } from '@huggingface/inference';
import { ASSETS, NEGATIVE, promptFor } from './assets.config.mjs';
import { ORIGINALS_DIR } from './lib/paths.mjs';
import { args, requireToken, selectAssets } from './lib/env.mjs';
import { processAssets } from './process-images.mjs';

const opts = args();
const MODEL = opts.model || process.env.HF_IMAGE_MODEL || 'black-forest-labs/FLUX.1-Krea-dev';
const PROVIDER = opts.provider || process.env.HF_IMAGE_PROVIDER || 'auto';
const CONCURRENCY = Number(opts.concurrency || 2);
const STEPS = Number(opts.steps || 28);
const GUIDANCE = Number(opts.guidance || 4.5);

const list = selectAssets(ASSETS, opts);

if (opts['dry-run']) {
  for (const a of list) console.log(`\n# ${a.category}/${a.id}  ${a.size.join('x')}\n${promptFor(a)}`);
  process.exit(0);
}

const token = requireToken();
const client = new InferenceClient(token);
const originalPath = (a) => path.join(ORIGINALS_DIR, a.category, `${a.id}.png`);

const todo = list.filter((a) => opts.force || !fs.existsSync(originalPath(a)));
console.log(`▶ ${todo.length} of ${list.length} assets to generate with ${MODEL} (provider: ${PROVIDER})`);

const done = [];
const failed = [];
let cursor = 0;

async function generate(a) {
  const seed = opts.seed !== undefined ? Number(opts.seed) : Math.floor(Math.random() * 2 ** 31);
  const [width, height] = a.size;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const blob = await client.textToImage({
        model: MODEL,
        provider: PROVIDER,
        inputs: promptFor(a),
        parameters: { width, height, num_inference_steps: STEPS, guidance_scale: GUIDANCE, seed, negative_prompt: NEGATIVE }
      });
      const buf = Buffer.from(await blob.arrayBuffer());
      const out = originalPath(a);
      fs.mkdirSync(path.dirname(out), { recursive: true });
      await sharp(buf).png().toFile(out);
      // Sidecar so any asset can be regenerated exactly.
      fs.writeFileSync(out.replace(/\.png$/, '.json'), JSON.stringify({ id: a.id, model: MODEL, provider: PROVIDER, seed, width, height, steps: STEPS, guidance: GUIDANCE, prompt: promptFor(a), negative: NEGATIVE }, null, 2));
      console.log(`  ✔ ${a.category}/${a.id} (seed ${seed})`);
      return true;
    } catch (err) {
      const wait = 2000 * 2 ** (attempt - 1);
      console.warn(`  … ${a.id} attempt ${attempt} failed: ${err.message}${attempt < 4 ? ` — retrying in ${wait / 1000}s` : ''}`);
      if (attempt < 4) await new Promise((res) => setTimeout(res, wait));
    }
  }
  return false;
}

async function worker() {
  while (cursor < todo.length) {
    const a = todo[cursor++];
    (await generate(a) ? done : failed).push(a);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

if (done.length && !opts['no-process']) {
  console.log(`\n▶ Cutting out + optimising ${done.length} new originals`);
  await processAssets(done, { cutout: opts.cutout });
}

console.log(`\nGenerated ${done.length}, failed ${failed.length}${failed.length ? `: ${failed.map((a) => a.id).join(', ')}` : ''}`);
process.exitCode = failed.length ? 1 : 0;
