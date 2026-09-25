#!/usr/bin/env node
/** Copies the runtime libraries from node_modules into vendor/ (served as-is, no CDN needed). */
import fs from 'node:fs';
import path from 'node:path';
import { r } from './lib/paths.mjs';

const files = {
  'gsap/dist/gsap.min.js': 'gsap.min.js',
  'gsap/dist/ScrollTrigger.min.js': 'ScrollTrigger.min.js',
  'lenis/dist/lenis.min.js': 'lenis.min.js',
  'lenis/dist/lenis.css': 'lenis.css',
  'three/build/three.module.min.js': 'three.module.min.js'
};
fs.mkdirSync(r('vendor'), { recursive: true });
for (const [from, to] of Object.entries(files)) {
  fs.copyFileSync(r('node_modules', from), r('vendor', to));
  console.log(`  ✔ vendor/${to}`);
}
const versions = ['gsap', 'lenis', 'three'].map((p) => `${p}@${JSON.parse(fs.readFileSync(r('node_modules', p, 'package.json'))).version}`);
fs.writeFileSync(r('vendor/VERSIONS.txt'), `${versions.join('\n')}\n\nGSAP: https://gsap.com/standard-license · Lenis: MIT · three.js: MIT\n`);
console.log(`  ${versions.join(', ')}`);
void path;
