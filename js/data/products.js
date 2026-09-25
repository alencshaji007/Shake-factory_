/**
 * The factory favorites. Prices and copy live here — edit freely.
 * `float` = ingredient layers orbiting the shake in its mini-commercial.
 * `side`  = the hero ingredient that sweeps in from the side (drizzle etc.).
 */
export const CURRENCY = '$';

export const PRODUCTS = [
  {
    id: 'choco-overload', name: 'Choco Overload', shake: 'shake-choco-overload', price: '8.50',
    tagline: 'Three chocolates. Zero restraint.',
    ingredients: ['Dark couverture', 'Cocoa milk', 'Brownie chunks', 'Chocolate shavings', 'Fudge drizzle'],
    color: '#4a2416', accent: '#e0b08a',
    float: ['chocolate-chunk', 'chocolate-dark-piece', 'chocolate-shavings', 'chocolate-milk-piece', 'chocolate-crumbs', 'chocolate-chunk'],
    side: 'chocolate-drizzle'
  },
  {
    id: 'strawberry-cloud', name: 'Strawberry Cloud', shake: 'shake-strawberry-cloud', price: '7.90',
    tagline: 'Fresh strawberries, whipped into a cloud.',
    ingredients: ['Fresh strawberries', 'Vanilla bean ice cream', 'Strawberry sauce', 'Whipped cream'],
    color: '#7a1c2c', accent: '#ffb4c0',
    float: ['strawberry-front', 'strawberry-half', 'strawberry-slice', 'raspberry-single', 'cream-droplets', 'strawberry-small-piece'],
    side: 'cream-peak'
  },
  {
    id: 'pistachio-dream', name: 'Pistachio Dream', shake: 'shake-pistachio-dream', price: '8.90',
    tagline: 'Roasted pistachio, white chocolate, pure calm.',
    ingredients: ['Roasted pistachio paste', 'White chocolate', 'Crushed pistachios', 'Fresh milk'],
    color: '#2f4a1c', accent: '#cfe39a',
    float: ['pistachio', 'pistachio', 'nut-pieces', 'nuts-crushed', 'almond-sliced', 'pistachio'],
    side: 'nuts-scattered'
  },
  {
    id: 'mango-blast', name: 'Mango Blast', shake: 'shake-mango-blast', price: '7.90',
    tagline: 'Alphonso mango with a passion-fruit kick.',
    ingredients: ['Alphonso mango', 'Passion fruit', 'Mango cubes', 'Vanilla ice cream'],
    color: '#8a4508', accent: '#ffd27a',
    float: ['mango-cube', 'mango-slice', 'mango-cube', 'pineapple-piece', 'mango-half', 'ice-cube'],
    side: 'mango-slice'
  },
  {
    id: 'nutty-caramel', name: 'Nutty Caramel', shake: 'shake-nutty-caramel', price: '8.50',
    tagline: 'Salted caramel, loaded with roasted nuts.',
    ingredients: ['Salted caramel', 'Almonds', 'Cashews', 'Hazelnuts', 'Caramel drizzle'],
    color: '#6a3a14', accent: '#f2c071',
    float: ['almond', 'cashew', 'hazelnut', 'almond', 'cashew', 'nut-pieces'],
    side: 'caramel-drizzle'
  },
  {
    id: 'cookie-monster', name: 'Cookie Monster', shake: 'shake-cookie-monster', price: '8.90',
    tagline: 'A whole cookie on top. More cookie inside.',
    ingredients: ['Chocolate chip cookies', 'Cookies & cream', 'Cookie crumble', 'Whipped cream'],
    color: '#3a2a22', accent: '#e8d2b0',
    float: ['cookie-piece', 'cookie-chunks', 'cookie-half', 'chocolate-chunk', 'cookie-crumbs', 'cookie-piece'],
    side: 'cookie-whole'
  }
];
