/**
 * Asset resolver. Reads the generated manifest (assets/images/manifest.js):
 * every id points at a photograph (source "hf") or its stand-in, exported as
 * AVIF + WebP in full and small sizes. The site never references a file path
 * directly — swap the photographs and nothing else changes.
 */
const MANIFEST = window.SF_MANIFEST || { assets: {}, videos: {} };
let ext = 'webp';

/** Picks AVIF when the browser decodes it, otherwise WebP. */
export async function detectFormats() {
  const avif = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  ext = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width > 0 ? 'avif' : 'webp');
    img.onerror = () => resolve('webp');
    img.src = avif;
  });
  return ext;
}

export function asset(id) {
  const a = MANIFEST.assets[id];
  if (!a) console.warn(`[assets] unknown asset "${id}"`);
  return a || { src: '', w: 1, h: 1 };
}

/** Entries exported without AVIF (no encoder available) fall back to WebP. */
const extOf = (a) => (a.avif === false ? 'webp' : ext);

export const aspect = (id) => { const a = asset(id); return a.h / a.w; };
export const isPhoto = (id) => asset(id).source === 'hf';

export function srcset(id) {
  const a = asset(id);
  const e = extOf(a);
  return a.sm ? `${a.src}-sm.${e} 640w, ${a.src}.${e} ${a.w}w` : `${a.src}.${e} ${a.w}w`;
}

export function url(id, small = false) {
  const a = asset(id);
  return `${a.src}${small && a.sm ? '-sm' : ''}.${extOf(a)}`;
}

/** <img> for an asset. `sizes` should describe its rendered width. */
export function image(id, { sizes = '30vw', eager = false, alt = '', className = '' } = {}) {
  const a = asset(id);
  const img = new Image(a.w, a.h);
  img.decoding = 'async';
  img.loading = eager ? 'eager' : 'lazy';
  img.alt = alt;
  img.draggable = false;
  if (className) img.className = className;
  img.sizes = sizes;
  img.srcset = srcset(id);
  img.src = url(id);
  img.dataset.asset = id;
  return img;
}

/** Preloads + decodes assets (same srcset/sizes as the rendered images → cache hits). */
export function preload(ids, onProgress = () => {}) {
  let done = 0;
  const unique = [...new Set(ids)];
  return Promise.all(unique.map((id) => {
    const img = image(id, { eager: true, sizes: '60vw' });
    return img.decode().catch(() => {}).finally(() => onProgress(++done / unique.length));
  }));
}

export const video = (id) => MANIFEST.videos[id];
