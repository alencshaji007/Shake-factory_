/** Ingredient families used to populate fields, explosions and drifts. */
export const FRUIT = ['strawberry-front', 'strawberry-side', 'blueberry-single', 'blueberry-group', 'raspberry-single', 'mango-cube', 'banana-slice', 'strawberry-slice', 'mango-slice', 'pineapple-piece'];
export const NUTS = ['almond', 'cashew', 'pistachio', 'hazelnut', 'almond-sliced', 'nut-pieces'];
export const CHOC = ['chocolate-chunk', 'chocolate-dark-piece', 'chocolate-milk-piece', 'chocolate-shavings'];
export const COOKIE = ['cookie-piece', 'cookie-chunks', 'cookie-half'];
export const ICE = ['ice-cube', 'ice-cube-group', 'ice-melting'];
export const ALL = [...FRUIT, ...NUTS, ...CHOC, ...COOKIE, ...ICE];

/** Rough "hero" size (vmin at depth 1) per asset, so everything reads at a believable scale. */
export const SIZE = {
  'strawberry-front': 22, 'strawberry-side': 24, 'strawberry-closeup': 60, 'strawberry-half': 22, 'strawberry-cut': 30, 'strawberry-slice': 18, 'strawberry-small-piece': 12,
  'blueberry-single': 9, 'blueberry-group': 20, 'blueberry-closeup': 16, 'raspberry-single': 12, 'raspberry-group': 22,
  'banana-whole': 44, 'banana-side': 44, 'banana-piece': 16, 'banana-slice': 15,
  'mango-whole': 34, 'mango-cut': 32, 'mango-half': 30, 'mango-slice': 34, 'mango-cube': 13,
  'pineapple-piece': 22, 'pineapple-slice': 26,
  almond: 10, 'almond-sliced': 14, cashew: 11, pistachio: 10, hazelnut: 9, 'nut-group-small': 24, 'nuts-scattered': 40, 'nuts-crushed': 24, 'nut-pieces': 16,
  'chocolate-dark-piece': 18, 'chocolate-milk-piece': 18, 'chocolate-chunk': 13, 'chocolate-shavings': 18, 'chocolate-crumbs': 30, 'chocolate-drizzle': 70, 'caramel-drizzle': 70,
  'cookie-whole': 26, 'cookie-half': 22, 'cookie-piece': 16, 'cookie-chunks': 22, 'cookie-crumbs': 30,
  'ice-cube': 16, 'ice-cube-group': 26, 'ice-crushed': 26, 'ice-melting': 16, 'ice-droplets': 26,
  'milk-stream': 40, 'milk-splash': 70, 'milk-droplets': 50, 'milk-wave': 70, 'milk-foam': 40, 'milk-bubbles': 18,
  'cream-swirl': 26, 'cream-peak': 18, 'cream-topping': 30, 'cream-droplets': 24,
  'knife-chef': 90, 'water-splash-crown': 90, 'water-splash-wide': 110, 'water-droplets': 70
};
export const sizeOf = (id) => SIZE[id] ?? 16;
