/**
 * SHAKE FACTORY — asset production manifest.
 *
 * Single source of truth for every photographic asset the site uses.
 * - tools/generate-assets.mjs   generates each asset with a Hugging Face model
 * - tools/process-images.mjs    cuts it out and exports WebP/AVIF
 * - tools/build-standins.mjs    renders a temporary stand-in with the same id
 * - tools/write-prompt-sheet.mjs writes PROMPTS.md (for manual generation in a Space)
 *
 * Every asset is an independent layer. Nothing on the site is one giant image.
 */

/** Shared photographic direction, appended to every prompt. */
export const STYLE =
  'photorealistic commercial food photography, high-end food advertising, premium studio product photography, ' +
  'macro lens, realistic natural texture with natural imperfections, realistic moisture, physically believable materials, ' +
  'soft directional key light with realistic reflections and shadows, shallow depth of field, tack-sharp subject';

export const BACKDROPS = {
  // Light subjects are shot on black, dark/colourful subjects on white — cleaner cutouts either way.
  white: 'isolated on a seamless pure white studio background, entire subject in frame with generous margin',
  black: 'isolated on a seamless pure black studio background, entire subject in frame with generous margin',
  scene: 'dark moody studio set, cinematic rim light'
};

export const NEGATIVE =
  'cartoon, illustration, anime, painting, drawing, flat design, vector, plastic food, toy-like, obvious CGI, 3d render, ' +
  'unrealistic texture, fantasy food, oversaturated, artificial colours, text, watermark, logo, label, cropped subject, hands';

/** Default generation sizes (multiples of 16, as the FLUX models expect). */
const SQ = [1024, 1024];
const TALL = [832, 1216];
const WIDE = [1216, 832];
const PANO = [1344, 640];

/**
 * @typedef {Object} AssetSpec
 * @property {string} id           file name (without extension)
 * @property {string} category     sub-folder of assets/images/generated/
 * @property {string} subject      what to photograph
 * @property {'white'|'black'|'scene'} [backdrop]
 * @property {[number,number]} [size]  generation size [w,h]
 * @property {boolean} [cutout]     remove background (default true)
 * @property {'model'|'luma'} [cutoutMode] luma = alpha from brightness (milk, ice, splashes)
 * @property {boolean} [shadow]     keep a soft natural contact shadow
 * @property {number} [maxWidth]    largest exported width (default 1400)
 */

/** @type {AssetSpec[]} */
export const ASSETS = [
  // ── FRUITS ────────────────────────────────────────────────────────────
  a('strawberry-front', 'fruits', 'one perfect ripe red strawberry with fresh green leafy calyx, front view, glossy skin with golden seeds, tiny water droplets'),
  a('strawberry-side', 'fruits', 'one ripe red strawberry lying on its side, three-quarter side view, green calyx, glossy skin, golden seeds, fine water droplets'),
  a('strawberry-closeup', 'fruits', 'extreme macro close-up of one glossy ripe strawberry filling the frame, visible seed dimples, fine hairs and water droplets'),
  a('blueberry-single', 'fruits', 'one single fresh blueberry with natural dusty bloom and star-shaped crown, macro'),
  a('blueberry-group', 'fruits', 'small loose cluster of seven fresh blueberries with natural dusty bloom, a few water droplets'),
  a('blueberry-closeup', 'fruits', 'extreme macro of two fresh blueberries, dusty waxy bloom, crown detail, droplets'),
  a('raspberry-single', 'fruits', 'one single fresh red raspberry, plump drupelets, fine hairs, macro'),
  a('raspberry-group', 'fruits', 'small group of five fresh red raspberries, plump drupelets, natural variation'),
  a('banana-whole', 'fruits', 'one whole ripe yellow banana, slight brown speckles, natural curve, three-quarter view', { size: WIDE }),
  a('banana-side', 'fruits', 'one ripe yellow banana, side profile, stem up, subtle ridges and speckles', { size: WIDE }),
  a('mango-whole', 'fruits', 'one whole ripe Alphonso mango, red-orange blush fading to yellow-green, natural skin pores'),

  // ── SLICES (cut fruit) ────────────────────────────────────────────────
  a('strawberry-cut', 'slices', 'one ripe strawberry freshly cut lengthwise, both halves slightly apart, juicy pale-pink core and red flesh'),
  a('strawberry-half', 'slices', 'one strawberry half, cut face toward camera, juicy white-pink heart and red flesh, glistening juice'),
  a('strawberry-slice', 'slices', 'one thin round strawberry slice, translucent red flesh with white star pattern, glistening, backlit'),
  a('strawberry-small-piece', 'slices', 'one small diced piece of strawberry, juicy red flesh, glistening'),
  a('banana-piece', 'slices', 'one thick chunk of peeled banana, creamy cut faces, soft seed dots in the centre'),
  a('banana-slice', 'slices', 'one round slice of banana, creamy ivory flesh, tiny seed star in the centre, moist'),
  a('mango-cut', 'slices', 'mango hedgehog cut, one half scored into cubes and pushed outward, vivid juicy orange flesh'),
  a('mango-half', 'slices', 'one mango cheek cut off, juicy glossy deep orange flesh facing camera'),
  a('mango-slice', 'slices', 'one long juicy mango slice, curved, glossy deep orange flesh, skin edge', { size: WIDE }),
  a('mango-cube', 'slices', 'one juicy cube of ripe mango flesh, glossy saturated orange, fibres visible'),
  a('pineapple-piece', 'slices', 'one juicy wedge of fresh pineapple, golden fibrous flesh, droplets'),
  a('pineapple-slice', 'slices', 'one round slice of fresh pineapple with rind and core ring, golden translucent fibres'),

  // ── NUTS ──────────────────────────────────────────────────────────────
  a('almond', 'nuts', 'one whole raw almond, brown textured skin with natural grooves'),
  a('almond-sliced', 'nuts', 'a few thin almond slivers, pale ivory with brown skin edges'),
  a('cashew', 'nuts', 'one whole roasted cashew, creamy golden, kidney shape, fine surface detail'),
  a('pistachio', 'nuts', 'one pistachio in its split cream shell, vivid green-purple kernel visible'),
  a('hazelnut', 'nuts', 'one whole roasted hazelnut, glossy brown shell, pale cap'),
  a('nut-group-small', 'nuts', 'small group of mixed nuts: two almonds, a cashew, a pistachio and a hazelnut', { shadow: true }),
  a('nuts-scattered', 'nuts', 'scattered mixed nuts, almonds, cashews, pistachios and hazelnuts spread loosely', { size: WIDE }),
  a('nuts-crushed', 'nuts', 'small pile of crushed roasted nuts, mixed coarse pieces and crumbs'),
  a('nut-pieces', 'nuts', 'a few broken pieces of almond and pistachio, rough fractured edges'),

  // ── CHOCOLATE ─────────────────────────────────────────────────────────
  a('chocolate-dark-piece', 'chocolate', 'one snapped square piece of glossy dark chocolate, sharp broken edge, embossed segments'),
  a('chocolate-milk-piece', 'chocolate', 'one piece of milk chocolate bar, two segments, satin sheen, broken edge'),
  a('chocolate-chunk', 'chocolate', 'one irregular rough chunk of dark chocolate, fractured facets, matte and glossy areas'),
  a('chocolate-shavings', 'chocolate', 'a few delicate curled dark chocolate shavings'),
  a('chocolate-crumbs', 'chocolate', 'small scattering of dark chocolate crumbs and flakes', { size: WIDE }),
  a('chocolate-drizzle', 'chocolate', 'a single thick glossy ribbon of melted dark chocolate flowing through the air, liquid highlights', { size: PANO }),
  a('caramel-drizzle', 'chocolate', 'a single thick glossy ribbon of golden salted caramel sauce flowing through the air', { size: PANO }),

  // ── COOKIES ───────────────────────────────────────────────────────────
  a('cookie-whole', 'cookies', 'one whole chewy chocolate chip cookie, golden cracked surface, melted dark chocolate chunks', { shadow: true }),
  a('cookie-half', 'cookies', 'one chocolate chip cookie broken in half, crumbly broken edge, gooey chocolate'),
  a('cookie-piece', 'cookies', 'one broken piece of chocolate chip cookie, jagged edge, chocolate chunk'),
  a('cookie-chunks', 'cookies', 'three rough chunks of chocolate chip cookie'),
  a('cookie-crumbs', 'cookies', 'scattered golden cookie crumbs with tiny chocolate bits', { size: WIDE }),

  // ── ICE ───────────────────────────────────────────────────────────────
  a('ice-cube', 'ice', 'one crystal-clear transparent ice cube, frosty edges, internal bubbles, refractions, backlit', { backdrop: 'black', cutoutMode: 'luma' }),
  a('ice-cube-group', 'ice', 'three transparent ice cubes stacked, refractions, frost, backlit', { backdrop: 'black', cutoutMode: 'luma' }),
  a('ice-crushed', 'ice', 'small heap of crushed ice, glittering transparent shards, backlit', { backdrop: 'black', cutoutMode: 'luma' }),
  a('ice-melting', 'ice', 'one melting ice cube with a running droplet and wet sheen, backlit', { backdrop: 'black', cutoutMode: 'luma' }),
  a('ice-droplets', 'ice', 'cluster of clear water droplets frozen mid-air, backlit, sparkling', { backdrop: 'black', cutoutMode: 'luma' }),

  // ── MILK ──────────────────────────────────────────────────────────────
  a('milk-stream', 'milk', 'a single smooth vertical stream of fresh white milk pouring, glossy liquid, high-speed photography', { backdrop: 'black', cutoutMode: 'luma', size: [640, 1344] }),
  a('milk-splash', 'milk', 'crown-shaped splash of fresh white milk frozen mid-air, droplets, high-speed flash photography', { backdrop: 'black', cutoutMode: 'luma', size: WIDE }),
  a('milk-droplets', 'milk', 'scattered spherical droplets of white milk frozen in mid-air, high-speed photography', { backdrop: 'black', cutoutMode: 'luma', size: WIDE }),
  a('milk-wave', 'milk', 'a curling wave of fresh white milk frozen mid-motion, silky glossy surface', { backdrop: 'black', cutoutMode: 'luma', size: PANO }),
  a('milk-foam', 'milk', 'close-up of thick creamy white milk foam with fine micro-bubbles', { backdrop: 'black', cutoutMode: 'luma', size: WIDE }),
  a('milk-bubbles', 'milk', 'a few glossy white milk bubbles and small droplets', { backdrop: 'black', cutoutMode: 'luma' }),

  // ── CREAM ─────────────────────────────────────────────────────────────
  a('cream-swirl', 'cream', 'tall piped swirl of fresh whipped cream, sharp ridged star-tip texture, soft sheen', { backdrop: 'black' }),
  a('cream-peak', 'cream', 'a single soft peak of fresh whipped cream, glossy folds', { backdrop: 'black' }),
  a('cream-topping', 'cream', 'generous dome of whipped cream topping with ridges, as on a milkshake', { backdrop: 'black', size: WIDE }),
  a('cream-droplets', 'cream', 'a few blobs and droplets of fresh cream flying mid-air', { backdrop: 'black', cutoutMode: 'luma' }),

  // ── MIXING JAR ────────────────────────────────────────────────────────
  a('jar-front', 'jar', 'premium empty transparent glass blender jar with lid and brushed steel base, front view, crisp reflections', { size: TALL, cutoutMode: 'model' }),
  a('jar-side', 'jar', 'premium transparent glass blender jar with handle, side view, crisp reflections, brushed steel base', { size: TALL }),
  a('jar-top', 'jar', 'premium glass blender jar seen from above at an angle, open top, steel blades inside', { size: SQ }),
  a('jar-empty', 'jar', 'premium empty transparent glass mixing jar without lid, front view, measurement marks', { size: TALL }),
  a('jar-with-fruit', 'jar', 'premium transparent glass blender jar filled with strawberries, banana, mango and blueberries', { size: TALL }),
  a('jar-with-milk', 'jar', 'premium transparent glass blender jar with fruit and fresh milk pouring in, bubbles', { size: TALL }),

  // ── FINISHED SHAKES (each a unique product photograph) ────────────────
  a('shake-choco-overload', 'shakes', 'thick dark chocolate milkshake in a tall fluted glass, chocolate drizzle running down the inside, whipped cream, brownie chunk and chocolate shavings on top, condensation droplets, paper straw', { size: TALL, shadow: true }),
  a('shake-strawberry-cloud', 'shakes', 'thick pastel pink strawberry milkshake in a tall classic soda glass, cloud of whipped cream, fresh strawberry halves, strawberry sauce streaks, condensation, striped straw', { size: TALL, shadow: true }),
  a('shake-pistachio-dream', 'shakes', 'thick pale green pistachio milkshake in a stemmed tulip glass, whipped cream, crushed pistachios, white chocolate curls, condensation droplets', { size: TALL, shadow: true }),
  a('shake-mango-blast', 'shakes', 'thick golden mango milkshake in a tall mason jar glass, whipped cream, mango cubes, passion fruit drizzle, condensation, sunny', { size: TALL, shadow: true }),
  a('shake-nutty-caramel', 'shakes', 'thick caramel milkshake in a heavy tumbler glass, salted caramel ribbons, whipped cream, candied almonds, cashews and hazelnuts, condensation', { size: TALL, shadow: true }),
  a('shake-cookie-monster', 'shakes', 'thick cookies-and-cream milkshake in a big milk bottle glass, speckled with cookie crumbs, whipped cream, whole chocolate chip cookie on top, condensation', { size: TALL, shadow: true }),

  // ── PROPS + SPLASH ────────────────────────────────────────────────────
  a('knife-chef', 'props', 'professional chef knife, polished steel blade with fine edge reflections, dark pakkawood handle, side view', { size: PANO }),
  a('water-splash-crown', 'splash', 'huge crown splash of crystal-clear water frozen mid-air, droplets, high-speed flash photography', { backdrop: 'black', cutoutMode: 'luma', size: WIDE }),
  a('water-splash-wide', 'splash', 'wide sheet splash of clear water spraying outward, thousands of droplets, high-speed photography', { backdrop: 'black', cutoutMode: 'luma', size: PANO }),
  a('water-droplets', 'splash', 'cloud of clear water droplets frozen mid-air, sparkling highlights', { backdrop: 'black', cutoutMode: 'luma', size: WIDE })
];

/**
 * Real-footage clips. Drop licensed/owned footage into the pipeline with
 * tools/add-video.mjs, or generate owned clips with tools/generate-videos.mjs.
 * The site falls back to animated photographic layers when a clip is missing.
 */
export const VIDEOS = [
  v('fruit-jump', 'fresh strawberries, blueberries and mango cubes bouncing upward in slow motion against a dark studio background, macro, 120fps'),
  v('fruit-fall', 'ripe strawberries and banana slices falling in slow motion through dark space, rim light, commercial'),
  v('water-crash', 'a strawberry crashing into clear water in super slow motion, huge splash and droplets, dark background'),
  v('water-splash', 'crystal-clear water splash expanding toward the camera in slow motion, backlit droplets, black background'),
  v('knife-slice', 'a chef knife slicing a ripe strawberry in half in slow motion, juice droplets, dark studio'),
  v('milk-pour', 'fresh white milk pouring into a glass blender jar full of fruit, slow motion, bubbles, studio light'),
  v('shake-pour', 'thick pink strawberry milkshake pouring into a tall glass in slow motion, glossy, condensation'),
  v('cream-top', 'whipped cream being piped on top of a milkshake in slow motion, fresh strawberry dropped on top')
];

function a(id, category, subject, opts = {}) {
  return { id, category, subject, backdrop: 'white', size: SQ, cutout: true, cutoutMode: 'model', shadow: false, maxWidth: 1400, ...opts };
}
function v(id, subject) {
  return { id, subject: `${subject}, photorealistic premium food commercial, cinematic lighting, shallow depth of field` };
}

/** Full prompt for an asset. */
export function promptFor(asset) {
  return `${asset.subject}, ${BACKDROPS[asset.backdrop]}, ${STYLE}`;
}

export const CATEGORIES = [...new Set(ASSETS.map((x) => x.category))];
