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
const progress = document.querySelector<HTMLElement>('[data-progress]');
const spyLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-spy]')];
const spyIds = [...new Set([...spyLinks.map((a) => a.hash.slice(1)), 'contact'])];
const spyTargets = spyIds.map((id) => document.getElementById(id));

let ticking = false;
function onScroll() {
  ticking = false;
  const y = scrollY;
  topBtn?.setAttribute('data-visible', String(y > 320));
  nav?.setAttribute('data-scrolled', String(y > 24));
  const max = root.scrollHeight - innerHeight;
  progress?.style.setProperty('--progress', String(max > 0 ? Math.min(1, y / max) : 0));
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

// --- Smooth scrolling ---------------------------------------------------------
// One eased, slower scroll for every in-page link (CSS smooth scrolling is too abrupt).
let scrollFrame = 0;
function cancelScroll() {
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
  scrollFrame = 0;
}
['wheel', 'touchstart', 'keydown'].forEach((type) => addEventListener(type, cancelScroll, { passive: true }));

function smoothScrollTo(targetY: number) {
  cancelScroll();
  const startY = scrollY;
  const maxY = root.scrollHeight - innerHeight;
  const endY = Math.max(0, Math.min(targetY, maxY));
  const distance = endY - startY;
  if (reduceMotion || Math.abs(distance) < 2) {
    scrollTo(0, endY);
    return;
  }
  const duration = Math.min(1400, Math.max(700, Math.abs(distance) * 0.45));
  const start = performance.now();
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    scrollTo(0, startY + distance * ease(t));
    scrollFrame = t < 1 ? requestAnimationFrame(step) : 0;
  };
  scrollFrame = requestAnimationFrame(step);
}

function scrollToHash(hash: string, updateUrl = true) {
  const id = decodeURIComponent(hash.slice(1));
  const el = id ? document.getElementById(id) : null;
  if (!el && id) return false;
  const offset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
  smoothScrollTo(el ? el.getBoundingClientRect().top + scrollY - (id === 'page-top' ? 0 : offset) : 0);
  if (updateUrl) history.replaceState(null, '', id && id !== 'page-top' ? hash : location.pathname);
  return true;
}

const isHome = (path: string) => path === '/' || path === '/index' || path === '/index.html';

document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]');
  if (!a || a.target === '_blank' || !a.hash) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;

  if (url.pathname === location.pathname) {
    if (scrollToHash(url.hash)) e.preventDefault();
  } else if (isHome(url.pathname) && !isHome(location.pathname)) {
    // From a case study: load home at the top, then glide to the section.
    e.preventDefault();
    try {
      sessionStorage.setItem('smooth-to', url.hash);
    } catch {}
    location.href = '/';
  }
});

try {
  const pending = sessionStorage.getItem('smooth-to');
  if (pending && isHome(location.pathname)) {
    sessionStorage.removeItem('smooth-to');
    scrollTo(0, 0);
    setTimeout(() => scrollToHash(pending), 350);
  }
} catch {}

function scrollTop() {
  smoothScrollTo(0);
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

// --- Copy to clipboard ---------------------------------------------------------
document.querySelectorAll<HTMLButtonElement>('[data-copy]').forEach((btn) =>
  btn.addEventListener('click', async () => {
    const label = btn.querySelector<HTMLElement>('[data-copy-label]');
    const original = label?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(btn.dataset.copy ?? '');
      if (label) label.textContent = 'Copied ✓';
    } catch {
      if (label) label.textContent = 'Press Ctrl+C to copy';
    }
    setTimeout(() => label && (label.textContent = original), 2000);
  }),
);
