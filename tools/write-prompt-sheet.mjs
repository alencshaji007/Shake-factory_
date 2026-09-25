#!/usr/bin/env node
/** Writes PROMPTS.md — every asset's exact prompt + target path, for generating by hand in a Space. */
import fs from 'node:fs';
import { ASSETS, NEGATIVE, VIDEOS, promptFor } from './assets.config.mjs';
import { r } from './lib/paths.mjs';

let md = `# Shake Factory — asset prompt sheet

Generated from \`tools/assets.config.mjs\` by \`node tools/write-prompt-sheet.mjs\`. Do not edit by hand.

**Model:** FLUX.1-Krea-dev (e.g. the Hugging Face Space \`black-forest-labs/FLUX.1-Krea-dev\`) · steps 28 · guidance 4.5
**Negative prompt** (when the UI offers one): ${NEGATIVE}

## How to use

1. Paste a prompt into the Space, set the width × height shown, generate.
2. Save the PNG exactly as the path shown (under \`assets-src/originals/\`).
3. Run \`npm run assets:process\` — it cuts out, exports WebP/AVIF and swaps the stand-in for your photograph.

`;
let cat = '';
for (const a of ASSETS) {
  if (a.category !== cat) { cat = a.category; md += `\n## ${cat}\n`; }
  md += `\n### ${a.id}\n- Save as: \`assets-src/originals/${a.category}/${a.id}.png\`\n- Size: ${a.size[0]} × ${a.size[1]}\n\n\`\`\`text\n${promptFor(a)}\n\`\`\`\n`;
}
md += `\n## Video clips\n\nRegister licensed/owned footage with \`node tools/add-video.mjs --id <slot> --file <clip> --credit "<licence>"\`.\n`;
for (const v of VIDEOS) md += `\n### ${v.id}\n\n\`\`\`text\n${v.subject}\n\`\`\`\n`;
fs.writeFileSync(r('PROMPTS.md'), md);
console.log(`✔ PROMPTS.md (${ASSETS.length} images, ${VIDEOS.length} clips)`);
