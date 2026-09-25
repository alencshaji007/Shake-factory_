import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, VIDEO_DIR } from './paths.mjs';
import { readManifest, writeManifest } from './manifest.mjs';

export const hasFfmpeg = () => spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0;

function ff(argv) {
  const res = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', ...argv], { stdio: 'inherit' });
  if (res.status !== 0) throw new Error(`ffmpeg failed: ${argv.join(' ')}`);
}

/**
 * Short, muted, loop-friendly web clips: 1280p + 720p in WebM (VP9) and MP4
 * (H.264, faststart) plus a WebP poster — then registered in the manifest.
 */
export function transcodeClip(id, input, { credit = '', maxSeconds = 8 } = {}) {
  if (!hasFfmpeg()) throw new Error('ffmpeg is required to transcode clips (https://ffmpeg.org)');
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
  const base = path.join(VIDEO_DIR, id);
  const common = ['-i', input, '-t', String(maxSeconds), '-an'];
  for (const [suffix, h, crf] of [['', 1080, 30], ['-sm', 720, 34]]) {
    const vf = `scale=-2:'min(${h},ih)',fps=30`;
    ff([...common, '-vf', vf, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', String(crf + 4), '-row-mt', '1', `${base}${suffix}.webm`]);
    ff([...common, '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf - 6), '-pix_fmt', 'yuv420p', '-movflags', '+faststart', `${base}${suffix}.mp4`]);
  }
  ff(['-i', input, '-vframes', '1', '-vf', "scale=-2:'min(1080,ih)'", '-c:v', 'libwebp', '-quality', '80', `${base}-poster.webp`]);

  const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
  const m = readManifest();
  m.videos[id] = {
    webm: rel(`${base}.webm`), mp4: rel(`${base}.mp4`),
    webmSm: rel(`${base}-sm.webm`), mp4Sm: rel(`${base}-sm.mp4`),
    poster: rel(`${base}-poster.webp`), credit
  };
  writeManifest(m);

  // Keep licensing visible next to the footage.
  const credits = path.join(VIDEO_DIR, 'CREDITS.md');
  const line = `- **${id}** — ${credit || 'owned / generated footage'}\n`;
  const prev = fs.existsSync(credits) ? fs.readFileSync(credits, 'utf8').split('\n').filter((l) => !l.startsWith(`- **${id}**`)).join('\n') : '# Footage credits\n\n';
  fs.writeFileSync(credits, prev.replace(/\n*$/, '\n') + line);
}
