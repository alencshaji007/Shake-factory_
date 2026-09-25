#!/usr/bin/env node
/**
 * Generates short owned clips for the video slots with a Hugging Face
 * text-to-video model, then transcodes them (requires ffmpeg).
 *
 *   node tools/generate-videos.mjs                       # every slot without a clip
 *   node tools/generate-videos.mjs --only water-splash --model Wan-AI/Wan2.2-T2V-A14B
 */
import fs from 'node:fs';
import path from 'node:path';
import { InferenceClient } from '@huggingface/inference';
import { VIDEOS } from './assets.config.mjs';
import { VIDEO_SRC_DIR } from './lib/paths.mjs';
import { args, hfToken, selectAssets } from './lib/env.mjs';
import { readManifest } from './lib/manifest.mjs';
import { transcodeClip } from './lib/video.mjs';

const opts = args();
const MODEL = opts.model || process.env.HF_VIDEO_MODEL || 'Wan-AI/Wan2.2-T2V-A14B';
const PROVIDER = opts.provider || process.env.HF_VIDEO_PROVIDER || 'auto';
const client = new InferenceClient(hfToken());
const existing = readManifest().videos;

for (const clip of selectAssets(VIDEOS, opts)) {
  if (existing[clip.id] && !opts.force) { console.log(`  – ${clip.id}: already has footage`); continue; }
  try {
    console.log(`  ▶ ${clip.id}`);
    const blob = await client.textToVideo({ model: MODEL, provider: PROVIDER, inputs: clip.subject });
    fs.mkdirSync(VIDEO_SRC_DIR, { recursive: true });
    const raw = path.join(VIDEO_SRC_DIR, `${clip.id}.mp4`);
    fs.writeFileSync(raw, Buffer.from(await blob.arrayBuffer()));
    transcodeClip(clip.id, raw, { credit: `Generated with ${MODEL} for Shake Factory` });
    console.log(`  ✔ ${clip.id}`);
  } catch (err) {
    console.warn(`  ! ${clip.id}: ${err.message}`);
  }
}
