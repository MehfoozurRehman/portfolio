// One-off asset generator: PWA icons, apple-touch-icon and the 1200x630 social card.
// Run with `pnpm generate:icons`; outputs are committed to /public.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const pub = path.join(root, 'public');

const markPath = fs.readFileSync(path.join(pub, 'logo.svg'), 'utf8');
const paths = [...markPath.matchAll(/<path[^>]*d="([^"]+)"/g)].map((m) => m[1]);
const [outline, letters] = paths;

const mark = (accent, ink) =>
  `<g><path d="${outline}" stroke="${accent}" stroke-width="8" stroke-linejoin="round" fill="none"/><path d="${letters}" fill="${ink}"/></g>`;

function iconSvg(size, { padding = 0.14, bg = '#efece2' } = {}) {
  const inner = size * (1 - padding * 2);
  const scale = inner / 169;
  const offset = size * padding;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="${bg}"/><g transform="translate(${offset} ${offset}) scale(${scale})">${mark('#d9531e', '#17140f')}</g></svg>`;
}

for (const [file, size, padding] of [
  ['icon-192.png', 192, 0.14],
  ['icon-512.png', 512, 0.14],
  ['icon-maskable-512.png', 512, 0.26],
  ['apple-touch-icon.png', 180, 0.14],
]) {
  await sharp(Buffer.from(iconSvg(size, { padding }))).png({ compressionLevel: 9 }).toFile(path.join(pub, file));
}

// Social card: portrait on the right, headline on the left.
const W = 1200;
const H = 630;
const portrait = await sharp(path.join(root, 'src/assets/pic.webp'))
  .resize(420, 525, { fit: 'cover', position: 'top' })
  .composite([
    {
      input: Buffer.from(`<svg width="420" height="525"><rect width="420" height="525" rx="28" ry="28"/></svg>`),
      blend: 'dest-in',
    },
  ])
  .png()
  .toBuffer();

const card = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="a" cx="0" cy="0" r="1"><stop offset="0" stop-color="#d9531e" stop-opacity=".22"/><stop offset="1" stop-color="#d9531e" stop-opacity="0"/></radialGradient>
    <radialGradient id="b" cx="1" cy="1" r="1"><stop offset="0" stop-color="#1c6b56" stop-opacity=".2"/><stop offset="1" stop-color="#1c6b56" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="#efece2"/>
  <rect width="700" height="700" fill="url(#a)"/>
  <rect x="500" y="0" width="700" height="630" fill="url(#b)"/>
  <g transform="translate(72 70) scale(.42)">${mark('#d9531e', '#17140f')}</g>
  <text x="152" y="108" font-family="Verdana, Arial, sans-serif" font-size="22" font-weight="700" letter-spacing="5" fill="#17140f">MEHFOOZ</text>
  <text x="72" y="290" font-family="Verdana, Arial, sans-serif" font-size="68" font-weight="800" fill="#17140f">Products built</text>
  <text x="72" y="370" font-family="Verdana, Arial, sans-serif" font-size="68" font-weight="800" fill="#17140f">from <tspan fill="#d9531e">idea</tspan> to launch.</text>
  <text x="72" y="440" font-family="Verdana, Arial, sans-serif" font-size="26" fill="#574f45">Full-stack product developer — web, mobile,</text>
  <text x="72" y="478" font-family="Verdana, Arial, sans-serif" font-size="26" fill="#574f45">desktop and AI-powered business systems.</text>
  <text x="72" y="562" font-family="Verdana, Arial, sans-serif" font-size="20" font-weight="700" letter-spacing="3" fill="#d9531e">MEHFOOZURREHMANV8.WEB.APP</text>
</svg>`;

await sharp(Buffer.from(card))
  .composite([{ input: portrait, left: 720, top: 52 }])
  .png({ compressionLevel: 9 })
  .toFile(path.join(pub, 'og.png'));

console.log('icons + og.png written to public/');
