/** Maps every asset id to the function that renders its stand-in. */
import * as F from './fruits.mjs';
import * as P from './pantry.mjs';
import * as L from './liquids.mjs';
import * as V from './vessels.mjs';

export const RENDERERS = {
  'strawberry-front': () => F.strawberry({ seed: 1 }),
  'strawberry-side': () => F.strawberry({ seed: 2, view: 'side' }),
  'strawberry-closeup': () => F.strawberry({ seed: 9, view: 'closeup', drops: 12 }),
  'blueberry-single': () => F.blueberry({ seed: 11 }),
  'blueberry-group': () => F.blueberry({ seed: 12, count: 7 }),
  'blueberry-closeup': () => F.blueberry({ seed: 13, count: 2 }),
  'raspberry-single': () => F.raspberry({ seed: 21 }),
  'raspberry-group': () => F.raspberry({ seed: 22, count: 5 }),
  'banana-whole': () => F.banana({ seed: 31 }),
  'banana-side': () => F.banana({ seed: 32, view: 'side' }),
  'mango-whole': () => F.mango({ seed: 41 }),

  'strawberry-cut': () => F.strawberryCut({ seed: 4 }),
  'strawberry-half': () => F.strawberryHalf({ seed: 3 }),
  'strawberry-slice': () => F.strawberrySlice({ seed: 5 }),
  'strawberry-small-piece': () => F.strawberryPiece({ seed: 6 }),
  'banana-piece': () => F.bananaPiece({ seed: 34 }),
  'banana-slice': () => F.bananaSlice({ seed: 33 }),
  'mango-cut': () => F.mangoCut({ seed: 45 }),
  'mango-half': () => F.mangoHalf({ seed: 42 }),
  'mango-slice': () => F.mangoSlice({ seed: 43 }),
  'mango-cube': () => F.mangoCube({ seed: 44 }),
  'pineapple-piece': () => F.pineapplePiece({ seed: 52 }),
  'pineapple-slice': () => F.pineappleSlice({ seed: 51 }),

  almond: () => P.almond(),
  'almond-sliced': () => P.almondSliced(),
  cashew: () => P.cashew(),
  pistachio: () => P.pistachio(),
  hazelnut: () => P.hazelnut(),
  'nut-group-small': () => P.nutGroupSmall(),
  'nuts-scattered': () => P.nutsScattered(),
  'nuts-crushed': () => P.nutsCrushed(),
  'nut-pieces': () => P.nutPieces(),

  'chocolate-dark-piece': () => P.chocolateDark(),
  'chocolate-milk-piece': () => P.chocolateMilk(),
  'chocolate-chunk': () => P.chocolateChunk(),
  'chocolate-shavings': () => P.chocolateShavings(),
  'chocolate-crumbs': () => P.chocolateCrumbs(),
  'chocolate-drizzle': () => P.chocolateDrizzle(),
  'caramel-drizzle': () => P.caramelDrizzle(),

  'cookie-whole': () => P.cookieWhole(),
  'cookie-half': () => P.cookieHalf(),
  'cookie-piece': () => P.cookiePiece(),
  'cookie-chunks': () => P.cookieChunks(),
  'cookie-crumbs': () => P.cookieCrumbs(),

  'ice-cube': () => L.iceCube(),
  'ice-cube-group': () => L.iceCubeGroup(),
  'ice-crushed': () => L.iceCrushed(),
  'ice-melting': () => L.iceMelting(),
  'ice-droplets': () => L.iceDroplets(),

  'milk-stream': () => L.milkStream(),
  'milk-splash': () => L.milkSplash(),
  'milk-droplets': () => L.milkDroplets(),
  'milk-wave': () => L.milkWave(),
  'milk-foam': () => L.milkFoam(),
  'milk-bubbles': () => L.milkBubbles(),

  'cream-swirl': () => L.creamSwirl(),
  'cream-peak': () => L.creamPeak(),
  'cream-topping': () => L.creamTopping(),
  'cream-droplets': () => L.creamDroplets(),

  'jar-front': () => V.jarFront(),
  'jar-side': () => V.jarSide(),
  'jar-top': () => V.jarTop(),
  'jar-empty': () => V.jarEmpty(),
  'jar-with-fruit': () => V.jarWithFruit(),
  'jar-with-milk': () => V.jarWithMilk(),

  'shake-choco-overload': () => V.shakeChocoOverload(),
  'shake-strawberry-cloud': () => V.shakeStrawberryCloud(),
  'shake-pistachio-dream': () => V.shakePistachioDream(),
  'shake-mango-blast': () => V.shakeMangoBlast(),
  'shake-nutty-caramel': () => V.shakeNuttyCaramel(),
  'shake-cookie-monster': () => V.shakeCookieMonster(),

  'knife-chef': () => L.knifeChef(),
  'water-splash-crown': () => L.waterSplashCrown(),
  'water-splash-wide': () => L.waterSplashWide(),
  'water-droplets': () => L.waterDroplets()
};
