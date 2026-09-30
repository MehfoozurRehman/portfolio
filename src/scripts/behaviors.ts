// Small vanilla behaviours shared by every page: scroll reveal, cursor glow,
// scroll-to-top, nav state and the theme toggle. No framework runtime needed.

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Scroll reveal ---------------------------------------------------------
const revealEls = document.querySelectorAll<HTMLElement>('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach((el) => (el.dataset.shown = 'true'));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).dataset.shown = 'true';
          io.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );
  revealEls.forEach((el) => io.observe(el));
}

// --- Cursor glow (fine pointers only) --------------------------------------
const glow = document.querySelector<HTMLElement>('[data-cursor-glow]');
if (glow && matchMedia('(pointer: fine)').matches && !reduceMotion) {
  glow.style.cssText +=
    ';background:radial-gradient(circle at center,var(--cursor-glow) 0%,transparent 36%),radial-gradient(circle at center,var(--cursor-glow-soft) 0%,transparent 72%);filter:blur(18px);opacity:0;transition:opacity 180ms ease;transform:translate3d(calc(var(--cursor-x,50vw) - 50%),calc(var(--cursor-y,50vh) - 50%),0)';
  let frame = 0;
  let x = 0;
  let y = 0;
  addEventListener(
    'pointermove',
    (e) => {
      x = e.clientX;
      y = e.clientY;
      glow.style.opacity = '1';
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          glow.style.setProperty('--cursor-x', `${x}px`);
          glow.style.setProperty('--cursor-y', `${y}px`);
        });
      }
    },
    { passive: true },
  );
  root.addEventListener('mouseleave', () => (glow.style.opacity = '0'));
} else {
  glow?.remove();
}

// --- Scroll-dependent UI (scroll-to-top, nav background, scroll-spy) -------
const topBtn = document.querySelector<HTMLElement>('[data-scroll-top]');
const nav = document.querySelector<HTMLElement>('[data-nav]');
const spyLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-spy]')];
const spyIds = [...new Set([...spyLinks.map((a) => a.hash.slice(1)), 'contact'])];
const spyTargets = spyIds.map((id) => document.getElementById(id));

let ticking = false;
function onScroll() {
  ticking = false;
  const y = scrollY;
  topBtn?.setAttribute('data-visible', String(y > 320));
  nav?.setAttribute('data-scrolled', String(y > 24));
  if (!spyLinks.length) return;

  let current = '';
  if (y >= 120) {
    if (innerHeight + y >= root.scrollHeight - 4) current = '#contact';
    else {
      spyTargets.forEach((el) => {
        if (el && el.getBoundingClientRect().top <= 130) current = `#${el.id}`;
      });
    }
  }
  spyLinks.forEach((a) => a.toggleAttribute('data-active', a.hash === current));
}
addEventListener(
  'scroll',
  () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  },
  { passive: true },
);
addEventListener('resize', onScroll);
onScroll();

function scrollTop() {
  scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
}
topBtn?.addEventListener('click', scrollTop);

// --- Mobile menu -------------------------------------------------------------
const menu = document.querySelector<HTMLElement>('[data-menu]');
const menuBtn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
function setMenu(open: boolean) {
  menu?.setAttribute('data-open', String(open));
  menuBtn?.setAttribute('aria-expanded', String(open));
}
menuBtn?.addEventListener('click', () => setMenu(menu?.getAttribute('data-open') !== 'true'));
menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));

document.querySelectorAll('[data-home]').forEach((el) =>
  el.addEventListener('click', (e) => {
    if (location.pathname !== '/' && location.pathname !== '/index') return;
    e.preventDefault();
    scrollTop();
    history.replaceState(null, '', '#page-top');
    setMenu(false);
  }),
);

// --- Theme -------------------------------------------------------------------
function applyTheme(t: 'dark' | 'light') {
  root.dataset.theme = t;
  root.style.colorScheme = t;
  root.style.backgroundColor = t === 'dark' ? '#08090b' : '#efece2';
}
document.querySelectorAll('[data-theme-toggle]').forEach((btn) =>
  btn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try {
      localStorage.setItem('portfolio-theme', next);
    } catch {}
  }),
);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  try {
    if (localStorage.getItem('portfolio-theme')) return;
  } catch {}
  applyTheme(e.matches ? 'dark' : 'light');
});
