# SHAKE FACTORY — Crafted to Crave

A cinematic, scroll-driven 3D website for **Shake Factory**: a premium food commercial you scroll through. Photographic ingredients fly, explode, crash, splash, get sliced, fall into a blender and become a milkshake. Then the brand lands.

Static site: **HTML5 + CSS3 + vanilla JavaScript (ES modules)** with **GSAP + ScrollTrigger**, **Lenis** and **Three.js**. No backend, no database, no build step.

> **Asset status:** 15 of 75 assets are photographs. From Hugging Face (FLUX.1-Krea-dev): strawberry front/side/close-up, blueberry single/group/close-up, raspberry single and milk splash. Supplied photos: mango half/cut/slice, almond, pistachio, and the Strawberry Cloud and Cookie Monster shakes. The rest are still locally rendered **stand-ins** under the exact file names the photographs will use. Run the pipeline below (it skips everything already generated), or generate the photos by hand from [`PROMPTS.md`](PROMPTS.md), and the photographs replace every stand-in automatically. No code changes are needed.
>
> These were exported where no AVIF encoder was available, so their manifest entries carry `avif: false` and the site serves them as WebP. `npm run assets:process` (with `sharp`) re-exports them with AVIF and clears the flag.

---

## Run it

```bash
npm install          # dev tooling only (sharp, Hugging Face clients); the site itself needs nothing
npm run serve        # → http://localhost:5173
```

Any static server works (`npx serve`, `python3 -m http.server`, Netlify, Vercel, GitHub Pages, S3…). ES modules don't load from `file://`, so serve the folder over http(s).

**Deploy** these paths: `index.html`, `css/`, `js/`, `vendor/`, `assets/`. `tools/`, `assets-src/` and `node_modules/` are production tooling only.

---

## The experience

| # | Scene | What happens |
|---|-------|--------------|
| 1 | **The film** (`#story`, one pinned 20-beat timeline) | Black → one perfect strawberry, extreme close-up; the camera orbits it → banana → mango → blueberries, strawberries, almonds, cashews, pistachios, chocolate, ice burst out, each family faster than the last, passing in front of and behind *"EVERYTHING GOES IN."* → everything crashes together (flash, camera shake) → falls into water → splash floods the frame → a knife enters → **the cut** → halves split → slices fly through the lens → the jar rises → slices and ingredients fall in → milk pours (stream, splash, bubbles) → **blend** (push-in, whirl, flashes, liquid turns pink) → converge → cream splash → **cut** → a huge Strawberry Cloud shake, 2.5D camera drift and light sweep → pull back → **SHAKE FACTORY — Crafted to crave.** |
| 2 | About | Editorial statement; a strawberry flies across, a banana turns behind the heading, cashews float in the foreground |
| 3 | **The Factory Favorites** | Six pinned mini-commercials: each shake arrives out of depth with its ingredients orbiting, a hero ingredient sweeping in from the side, the type landing beside it, price and ingredients, then the set moves away. Mouse tilt on the active shake |
| 4 | **Real ingredients. Real cravings.** | About 30 photographic ingredients on many depths, behind and in front of the headline, rising, falling, spinning, entering and leaving the frame |
| 5 | **Made fresh. Made loaded.** | Video used as a transition. A strawberry flies into the lens until it fills the frame, and the reel (fruit jumping → falling → water crash → knife → milk pour → shake pour → cream topping) appears behind it. It exits through a water splash that floods into the next scene |
| 6 | **Meet the signature** | Huge Choco Overload, camera drifting around it. *THICK.* slams in, *Creamy.* rises letter by letter, *LOADED.* wipes in with an ingredient burst |
| 7 | Finale | Calm cream scene: ingredients settle, shake centred, **What's your shake?** / Mix. Shake. Repeat. / Explore the shakes · Find a factory |

Ingredients keep moving through the whole site: fixed **drift layers** (behind and in front of the content) fly photographic ingredients through the About, Favorites, Ingredients and Signature sections.

---

## Project structure

```
index.html
css/        base.css (tokens, type, loader, grain) · layout.css (nav, menu, about, footer) · scenes.css
js/
  main.js               loader → scenes (in page order) → Lenis → intro → lazy three.js
  core/env.js           reduced motion, touch, device tier (?tier=low|mid|high to override)
  core/assets.js        manifest resolver, AVIF/WebP detection, responsive <img>, preload
  core/depth.js         ★ the 2.5D depth system (createLayer, DepthScene)
  core/pointer.js       smoothed pointer + product tilt
  core/scroll.js        Lenis ⇄ ScrollTrigger, anchor navigation
  core/text.js          accessible char/word splitting and reveals
  core/fx.js            idleFloat, motionBlur, cameraShake, flash, burst, flyThrough
  fx/atmosphere.js      Three.js particles: bokeh, dust, sparks (enhances, never replaces, the photos)
  scenes/               story (conductor) · hero · mix · reveal · products · ingredients · reel · signature · finale · drift · nav · static
  data/products.js      names, prices, copy, colours, orbiting ingredients: edit freely
  data/ingredients.js   ingredient families + believable relative sizes
vendor/                 gsap, ScrollTrigger, lenis, three (copied from node_modules by `npm run vendor`)
assets/images/manifest.js   generated: every asset id → photo or stand-in
assets/images/generated/<category>/   photographs: <id>.avif/.webp (+ -sm variants)
assets/images/standin/<category>/     stand-ins (same ids, same formats)
assets/video/                          web clips + CREDITS.md
assets-src/originals/                  high-res originals straight from the model (+ JSON sidecar with seed/prompt)
assets-src/cutouts/                    transparent full-res masters
tools/                  asset production (see below)
```

### The depth system (`js/core/depth.js`)

Every ingredient is an independent photographic layer with a `depth` from **0** (far) to **1** (touching the lens). Depth drives **scale**, **depth-of-field blur**, **atmospheric darkening**, **parallax** (camera and pointer), **z-order** (in front of or behind text) and **spin**. Each layer has three nested transform owners, so scroll timelines, the virtual camera and idle float never fight:

```
.ing (camera + pointer, per depth)  >  .ing__m (scene timelines)  >  .ing__i (idle float)  >  <img>
```

`DepthScene` gives a group of layers one virtual camera `{ x, y, zoom, rot }`. Moving the camera moves near layers more than far ones, which gives real 2.5D parallax from flat photographs.

---

## Asset production (Hugging Face)

Every asset is its own photograph (fruit, slices, nuts, chocolate, cookies, ice, milk, cream, jar, knife, splashes, six unique shakes) and is animated as its own layer. The site is **never** one generated hero image. The single source of truth is [`tools/assets.config.mjs`](tools/assets.config.mjs): 75 assets, each with its prompt, backdrop, size and cutout mode. Every prompt carries the shared photographic direction (commercial food photography, macro, real texture and moisture, studio light, shallow depth of field) and a negative list (cartoon, CGI, plastic, oversaturated…).

### Option A: automatic (recommended)

Authentication, either one:

- **Local machine / CI:** `cp .env.example .env` and set `HF_TOKEN=hf_…` (a fine-grained token with *Make calls to Inference Providers*).
- **Claude Code cloud environment (Pro/Max):** add the token as an **API credential** (Bearer, allowed websites `huggingface.co`, `*.huggingface.co`, `*.hf.space`). The network proxy attaches it and the token never enters the session. Leave `HF_TOKEN` unset.

The token is used only by these scripts. The static site never sees it.

```bash
npm run assets:generate     # generate → cut out → WebP/AVIF → manifest, for everything missing
npm run assets:generate -- --category shakes --force
npm run assets:generate -- --only strawberry-closeup --seed 7
npm run assets:generate -- --dry-run          # print prompts
```

Defaults: `black-forest-labs/FLUX.1-Krea-dev` through Hugging Face Inference Providers (`--model`, `--provider`, `--steps`, `--guidance` to change). Each original is saved with a JSON sidecar (model, seed, prompt), so any asset can be regenerated exactly.

### Option B: by hand in a Space

Open [`PROMPTS.md`](PROMPTS.md). For each asset, paste its prompt into the FLUX.1-Krea-dev Space at the size shown and save the PNG to the listed path (`assets-src/originals/<category>/<id>.png`). Then run:

```bash
npm run assets:process      # cut out + optimise + swap in, for every original found
```

### Cutout pipeline (`tools/process-images.mjs`)

1. original → background removal, edge-preserving
   - `rembg` CLI (BiRefNet) if installed: `pip install "rembg[cli]"`
   - otherwise the Hugging Face Space `not-lain/background-removal` (BiRefNet) with your token
   - otherwise a local soft colour key against the seamless backdrop
   - milk, ice and splashes use a **luminance key**, so liquid stays naturally translucent
2. optional natural contact shadow re-extracted from the original (shakes, cookie, nut group)
3. trim + pad → transparent master in `assets-src/cutouts/`
4. **AVIF + WebP**, full (≤1400 px) and `-sm` (640 px) → `assets/images/generated/`
5. manifest updated: the photograph replaces the stand-in everywhere

### Video

The reel and transitions use real clips when they exist and fall back to animated photographic layers when they don't. Clips are loaded only when the section approaches, and play muted, looped (per slot), inline, with a poster. `-sm` versions are served on mobile. Requires `ffmpeg`.

```bash
# licensed or owned footage (keep all watermarks and notices intact; credits go to assets/video/CREDITS.md)
node tools/add-video.mjs --id water-splash --file ~/footage/splash.mov --credit "Pexels License — Jane Doe"
# or generate owned clips with a Hugging Face text-to-video model
npm run assets:video -- --only milk-pour
```

Slots: `fruit-jump`, `fruit-fall`, `water-crash`, `water-splash`, `knife-slice`, `milk-pour`, `shake-pour`, `cream-top`.

### Stand-ins

`npm run assets:standins` re-renders the temporary stand-ins (SVG + lighting filters → WebP/AVIF). It never overwrites a photograph.

---

## Customising

- **Menu, prices, copy, colours**: `js/data/products.js` (currency symbol at the top).
- **Locations and contact**: the footer in `index.html` holds placeholder factories and links. Replace them with the real ones.
- **Palette and type**: CSS custom properties in `css/base.css` (warm cream, off-white, chocolate, strawberry red, mango orange, pistachio green, caramel, cocoa). Fonts: Archivo (variable width, used condensed for display) + Instrument Serif italic.
- **Jar interior**: if your jar photograph's proportions differ, tweak `--jar-top`, `--jar-side` and `--jar-bottom` on `.jar` in `css/scenes.css` so the contents and milk sit inside the glass.
- **Story pacing**: beat timings live at the top of each act in `js/scenes/hero.js`, `mix.js`, `reveal.js`. `env.beat` sets scroll length per beat.

## Performance and accessibility

- AVIF with WebP fallback, responsive `srcset`/`sizes`, `-sm` variants, lazy loading. Only the opening shot's assets are preloaded.
- GPU transforms only, three owners per layer, and render loops that run only while their section is on screen.
- Device tiers (`low` on phones / ≤4 cores / ≤4 GB) scale particle counts, floating objects, blur and scroll length, while keeping every major story moment. Test any tier with `?tier=low|mid|high`.
- Three.js loads lazily after first paint (pixel ratio capped) and pauses in background tabs.
- `prefers-reduced-motion`: no smooth scroll, pinning, zooms or autoplay. The film becomes three still frames and the shakes become a simple list.
- Semantic landmarks, skip link, accessible split text (`aria-label`), keyboard-operable menu (Esc closes), visible focus.

## Credits and licences

GSAP (Standard "no charge" licence), Lenis (MIT), three.js (MIT): versions in `vendor/VERSIONS.txt`. Fonts from Google Fonts (OFL). The reference commercial was used only for pacing inspiration; no branding, scenes or footage from it are used.
