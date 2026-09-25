import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

export const SMALL_WIDTH = 640;

/**
 * Writes <base>.webp + <base>.avif (and -sm variants for large images) from a
 * transparent or opaque source. Returns the full export's size and whether -sm exists.
 */
export async function exportResponsive(input, base, { maxWidth = 1400 } = {}) {
  fs.mkdirSync(path.dirname(base), { recursive: true });
  const meta = await sharp(input).metadata();
  const full = Math.min(maxWidth, meta.width);
  // A small variant only pays off when it is meaningfully smaller.
  const sm = full > SMALL_WIDTH * 1.25;
  const jobs = [];
  for (const [suffix, width] of sm ? [['', full], ['-sm', SMALL_WIDTH]] : [['', full]]) {
    const img = () => sharp(input).resize({ width, withoutEnlargement: true });
    jobs.push(img().webp({ quality: 82, alphaQuality: 90, effort: 5 }).toFile(`${base}${suffix}.webp`));
    jobs.push(img().avif({ quality: 52, effort: 4 }).toFile(`${base}${suffix}.avif`));
  }
  await Promise.all(jobs);
  return { w: full, h: Math.round((meta.height * full) / meta.width), sm };
}
