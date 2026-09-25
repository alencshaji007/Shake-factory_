#!/usr/bin/env node
/**
 * Registers a licensed or owned clip for one of the site's video slots.
 *
 *   node tools/add-video.mjs --id water-splash --file ~/footage/splash.mov --credit "Pexels License — Jane Doe"
 *
 * Slots: see VIDEOS in tools/assets.config.mjs (fruit-jump, fruit-fall, water-crash,
 * water-splash, knife-slice, milk-pour, shake-pour, cream-top).
 * Only use footage you own or are licensed to use; never strip watermarks or notices.
 */
import fs from 'node:fs';
import { VIDEOS } from './assets.config.mjs';
import { args } from './lib/env.mjs';
import { transcodeClip } from './lib/video.mjs';

const opts = args();
if (!opts.id || !opts.file) {
  console.error('Usage: node tools/add-video.mjs --id <slot> --file <clip> [--credit "<licence / author>"] [--seconds 8]');
  process.exit(1);
}
if (!VIDEOS.some((v) => v.id === opts.id)) console.warn(`! "${opts.id}" is not a known slot (${VIDEOS.map((v) => v.id).join(', ')}) — registering anyway.`);
if (!fs.existsSync(opts.file)) { console.error(`✖ ${opts.file} not found`); process.exit(1); }
transcodeClip(opts.id, opts.file, { credit: opts.credit || '', maxSeconds: Number(opts.seconds || 8) });
console.log(`✔ ${opts.id} transcoded to assets/video/ and registered in the manifest`);
