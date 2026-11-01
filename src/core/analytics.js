// Google Analytics 4 through gtag.js, on the same Firebase web app stream the earlier versions of
// this site reported to (project mehfooz-ur-rehman). Off on localhost and in automated playtests.
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID ?? 'G-S9SYWJQ9RE';

const enabled =
  typeof window !== 'undefined' &&
  !navigator.webdriver &&
  !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

if (enabled) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID);
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(s);
}

export function track(event, params = {}) {
  if (enabled) window.gtag('event', event, params);
}
