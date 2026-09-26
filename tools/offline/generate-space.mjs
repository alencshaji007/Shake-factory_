// Generates originals through the free FLUX.1-Krea-dev Space (Inference Provider credits are depleted).
import fs from 'node:fs';
import path from 'node:path';
const ROOT = new URL('../..', import.meta.url).pathname.replace(/\/$/, ''), RAW = process.env.RAW;
const { ASSETS, NEGATIVE, promptFor } = await import(ROOT + '/tools/assets.config.mjs');
const S = 'https://black-forest-labs-flux-1-krea-dev.hf.space', STEPS = 28, GUIDANCE = 4.5;
const only = process.argv[2] ? process.argv[2].split(',') : null;
const have = (a) => fs.existsSync(`${ROOT}/assets-src/originals/${a.category}/${a.id}.png`) || fs.existsSync(`${RAW}/${a.id}.webp`);
const todo = ASSETS.filter((a) => (!only || only.includes(a.id)) && !have(a));
console.log(`${todo.length} to generate`);
let fails = 0;
for (const a of todo) {
  const [width, height] = a.size; const seed = Math.floor(Math.random() * 2 ** 31);
  try {
    const r1 = await fetch(`${S}/gradio_api/call/infer`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data: [promptFor(a), seed, false, width, height, GUIDANCE, STEPS] }) });
    const { event_id } = await r1.json();
    const sse = await (await fetch(`${S}/gradio_api/call/infer/${event_id}`)).text();
    const m = sse.match(/event: complete\ndata: (.*)/);
    if (!m) throw new Error(sse.match(/event: error\ndata: (.*)/)?.[1] || sse.slice(-300));
    const url = JSON.parse(m[1])[0].url;
    const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
    fs.writeFileSync(`${RAW}/${a.id}.webp`, buf);
    fs.writeFileSync(`${RAW}/${a.id}.json`, JSON.stringify({ id: a.id, category: a.category, model: 'black-forest-labs/FLUX.1-Krea-dev', provider: 'space:black-forest-labs/FLUX.1-Krea-dev', seed, width, height, steps: STEPS, guidance: GUIDANCE, prompt: promptFor(a), negative: NEGATIVE }, null, 2));
    console.log(`ok ${a.category}/${a.id} ${new Date().toISOString().slice(11, 19)}`); fails = 0;
  } catch (e) {
    console.log(`!! ${a.id}: ${String(e.message).slice(0, 300)}`);
    if (++fails >= 3) { console.log('stopping: 3 consecutive failures'); break; }
  }
}
