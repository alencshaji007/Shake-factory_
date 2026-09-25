import fs from 'node:fs';
import { r } from './paths.mjs';

/**
 * Loads KEY=value pairs from .env into process.env (without overriding).
 * Credentials live only here / in the shell — never in the served site.
 */
export function loadEnv() {
  const file = r('.env');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m || line.trim().startsWith('#')) continue;
    const value = m[2].replace(/^(['"])(.*)\1$/, '$2');
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}

/**
 * Hugging Face auth. Two supported setups:
 *  - HF_TOKEN in the environment / .env (local machine, CI)
 *  - no token in the environment, because a cloud environment "API credential"
 *    makes the network proxy attach it to requests for *.huggingface.co / *.hf.space
 *    (the key then never enters the session). Requests are sent without an
 *    Authorization header and routed through router.huggingface.co.
 */
export function hfToken() {
  loadEnv();
  const token = process.env.HF_TOKEN || process.env.HUGGINGFACEHUB_API_TOKEN;
  if (!token) console.log('ℹ No HF_TOKEN set — assuming an environment API credential authenticates Hugging Face requests.');
  return token || undefined;
}

/** Tiny argv parser: --flag, --key value, --key=value. */
export function args(argv = process.argv.slice(2)) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (!t.startsWith('--')) { out._.push(t); continue; }
    const [k, v] = t.slice(2).split('=');
    if (v !== undefined) out[k] = v;
    else if (argv[i + 1] && !argv[i + 1].startsWith('--')) out[k] = argv[++i];
    else out[k] = true;
  }
  return out;
}

export function selectAssets(all, opts) {
  let list = all;
  if (opts.only) { const ids = String(opts.only).split(','); list = list.filter((x) => ids.includes(x.id)); }
  if (opts.category) { const cats = String(opts.category).split(','); list = list.filter((x) => cats.includes(x.category)); }
  return list;
}
