/**
 * prefers-reduced-motion: the same story told with still photographs.
 * No pinning, no scrubbing, no zooms, no autoplaying footage.
 */
import { createLayer } from '../core/depth.js';
import { image, video } from '../core/assets.js';
import { CURRENCY, PRODUCTS } from '../data/products.js';

export function buildStatic() {
  document.documentElement.classList.add('is-static-site');

  // products: a simple, readable list of every shake
  const holder = document.querySelector('[data-products]');
  PRODUCTS.forEach((p, i) => {
    const el = document.createElement('article');
    el.className = 'product product--static';
    el.innerHTML = `<div class="product__visual"><div class="product__shake"><div class="product__tilt"></div></div></div>
      <div class="product__copy"><p class="product__index">${String(i + 1).padStart(2, '0')} / 06</p><h3 class="product__name">${p.name}</h3>
      <p class="product__tagline">${p.tagline}</p><ul class="product__ingredients">${p.ingredients.map((x) => `<li>${x}</li>`).join('')}</ul>
      <div class="product__buy"><span class="product__price">${CURRENCY}${p.price}</span></div></div>`;
    el.querySelector('.product__tilt').append(image(p.shake, { sizes: '30vw', alt: `${p.name} milkshake` }));
    holder.append(el);
  });

  // ingredients: a still composition around the headline
  const back = document.querySelector('.ingredients__field--back');
  [['strawberry-front', -30, -24], ['mango-cube', 32, -28], ['almond', -36, 26], ['chocolate-chunk', 30, 30], ['blueberry-group', 0, 36]].forEach(([id, x, y]) =>
    createLayer(id, { parent: back, depth: 0.6, size: 18, x: (x * window.innerWidth) / 100, y: (y * window.innerHeight) / 100, light: false, blur: false }));

  // reel: poster frames instead of autoplaying video
  const screen = document.querySelector('[data-reel]');
  const clip = video('shake-pour') || video('milk-pour');
  if (clip) {
    const poster = new Image();
    poster.src = clip.poster;
    poster.alt = '';
    poster.className = 'reel__poster';
    screen.append(poster);
  } else {
    createLayer('jar-with-milk', { parent: screen, depth: 0.8, size: 30, x: -window.innerWidth * 0.2, light: false, blur: false });
    createLayer('shake-mango-blast', { parent: screen, depth: 0.8, size: 22, x: window.innerWidth * 0.2, light: false, blur: false });
  }

  // signature + finale products
  const sig = document.querySelector('.signature__product');
  sig.innerHTML = '<div class="product__shake"><div class="product__tilt"></div></div>';
  sig.querySelector('.product__tilt').append(image('shake-choco-overload', { sizes: '40vh', alt: 'Choco Overload milkshake' }));
  const fin = document.querySelector('.finale__product');
  fin.innerHTML = '<div class="product__shake"><div class="product__tilt"></div></div>';
  fin.querySelector('.product__tilt').append(image('shake-strawberry-cloud', { sizes: '24vh', alt: 'Strawberry Cloud milkshake' }));
}
