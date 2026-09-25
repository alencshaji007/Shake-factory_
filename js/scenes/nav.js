/**
 * Minimal navigation: transparent → slightly solid once scrolling, a
 * full-screen menu board, and a mobile menu.
 */
import { env } from '../core/env.js';
import { image } from '../core/assets.js';
import { lockScroll, scrollTo, unlockScroll } from '../core/scroll.js';
import { CURRENCY, PRODUCTS } from '../data/products.js';

export function buildNav() {
  const nav = document.querySelector('.nav');
  const menu = document.querySelector('.menu');
  const mnav = document.querySelector('.mnav');
  const burger = document.querySelector('[data-open-mobile]');
  const list = menu.querySelector('[data-menu-list]');

  // menu board built from the product data
  PRODUCTS.forEach((p) => {
    const li = document.createElement('li');
    li.className = 'menu__item';
    li.tabIndex = 0;
    li.setAttribute('role', 'link');
    li.innerHTML = `<span class="menu__thumbwrap"></span><span><span class="menu__name">${p.name}</span><span class="menu__desc">${p.tagline}</span></span><span class="menu__price">${CURRENCY}${p.price}</span>`;
    li.querySelector('.menu__thumbwrap').append(image(p.shake, { sizes: '64px', className: 'menu__thumb', alt: '' }));
    const go = () => { closeMenu(); setTimeout(() => scrollTo('#shakes'), 450); };
    li.addEventListener('click', go);
    li.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    list.append(li);
  });

  let lastFocus = null;
  const openMenu = () => {
    lastFocus = document.activeElement;
    closeMobile();
    menu.hidden = false;
    lockScroll();
    gsap.fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: env.reduced ? 0 : 0.9, ease: 'expo.inOut' });
    gsap.fromTo(menu.querySelectorAll('.menu__item'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.06, delay: 0.35, ease: 'power3.out' });
    menu.querySelector('[data-close-menu]').focus();
  };
  const closeMenu = () => {
    if (menu.hidden) return;
    gsap.to(menu, { clipPath: 'inset(100% 0 0% 0)', duration: env.reduced ? 0 : 0.7, ease: 'expo.inOut', onComplete: () => { menu.hidden = true; } });
    unlockScroll();
    lastFocus?.focus?.();
  };
  const openMobile = () => { mnav.hidden = false; burger.setAttribute('aria-expanded', 'true'); gsap.fromTo(mnav.children, { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.6, ease: 'power3.out' }); };
  const closeMobile = () => { mnav.hidden = true; burger.setAttribute('aria-expanded', 'false'); };

  document.querySelectorAll('[data-open-menu]').forEach((b) => b.addEventListener('click', openMenu));
  menu.querySelector('[data-close-menu]').addEventListener('click', closeMenu);
  burger.addEventListener('click', () => (mnav.hidden ? openMobile() : closeMobile()));
  mnav.addEventListener('click', (e) => { if (e.target.closest('a')) closeMobile(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMenu(); closeMobile(); } });

  // transparent → slightly solid
  ScrollTrigger.create({ start: 60, end: 'max', onToggle: (self) => nav.classList.toggle('is-solid', self.isActive) });

  // active section highlight
  for (const link of nav.querySelectorAll('a.nav__link')) {
    const target = document.querySelector(link.getAttribute('href'));
    if (!target) continue;
    ScrollTrigger.create({ trigger: target, start: 'top 50%', end: 'bottom 50%', onToggle: (self) => link.classList.toggle('is-active', self.isActive) });
  }

  // cursor-following glow on buttons
  document.addEventListener('pointermove', (e) => {
    const btn = e.target.closest?.('.btn');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', `${e.clientX - r.left}px`);
    btn.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });

  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
}
