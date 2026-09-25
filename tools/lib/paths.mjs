import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const r = (...p) => path.join(ROOT, ...p);

/** Web-served, optimised images (WebP + AVIF, full + small). */
export const GENERATED_DIR = r('assets/images/generated');
/** Temporary stand-ins rendered locally until the photographs exist. */
export const STANDIN_DIR = r('assets/images/standin');
/** High-resolution originals straight from the model (never served). */
export const ORIGINALS_DIR = r('assets-src/originals');
/** Transparent full-resolution cutouts (never served). */
export const CUTOUTS_DIR = r('assets-src/cutouts');
export const VIDEO_SRC_DIR = r('assets-src/video');
export const VIDEO_DIR = r('assets/video');
export const MANIFEST_FILE = r('assets/images/manifest.js');
