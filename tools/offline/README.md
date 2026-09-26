# Offline asset tools (no npm install)

For environments where `sharp`/`@huggingface/inference` can't be installed. They need Node 22 and a global
`playwright` with Chromium. They write the same paths, sidecars and manifest entries as the main pipeline,
but export WebP only (`avif: false`); run `npm run assets:process` later to add AVIF.

```bash
# 1. generate missing originals with the free FLUX.1-Krea-dev Space (uses your ZeroGPU quota)
RAW=/tmp/raw NODE_USE_ENV_PROXY=1 node tools/offline/generate-space.mjs [id,id,...]
# 2. cut out + export + manifest
RAW=/tmp/raw node tools/offline/process-chromium.mjs [id,id,...]
# supplied photos: edit JOBS in ingest-photos.mjs, then
IM=/path/to/photos node tools/offline/ingest-photos.mjs
```
