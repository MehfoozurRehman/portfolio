// Render a built concept in headless Edge and save screenshots you can look at.
//
// Usage:
//   node tools/shoot.mjs <dir-or-url> <out-dir> [options]
//
// Options:
//   --scroll 0,0.2,0.4,0.6,0.8,1   scroll positions as fractions of the page (default shown)
//   --only desktop|mobile          one viewport only
//   --wait 2500                    ms to wait after load before the first shot
//   --click "<css selector>"       after the scroll shots, click this element on desktop and shoot again
//                                  (repeat --click for several states; each starts from a fresh load)
//
// Output in <out-dir>: desktop-000.png ... mobile-100.png, click-1.png ..., report.json
// report.json lists console errors, failed requests, the WebGL renderer, and horizontal overflow.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream',
  '.ktx2': 'image/ktx2', '.hdr': 'application/octet-stream', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.wasm': 'application/wasm',
};

const args = process.argv.slice(2);
const target = args[0];
const outDir = args[1];
if (!target || !outDir) {
  console.error('Usage: node tools/shoot.mjs <dir-or-url> <out-dir> [--scroll ...] [--only desktop|mobile] [--wait ms] [--click selector]');
  process.exit(1);
}
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i > -1 ? args[i + 1] : fallback;
};
const clicks = args.flatMap((a, i) => (a === '--click' ? [args[i + 1]] : []));
const scrolls = opt('scroll', '0,0.2,0.4,0.6,0.8,1').split(',').map(Number);
const only = opt('only', null);
const waitMs = Number(opt('wait', 2500));

fs.mkdirSync(outDir, { recursive: true });

function serve(dir) {
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(root, p);
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    const headers = { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' };
    // Approximate the claude.ai artifact frame's policy so blocked loads show up here as console errors.
    if (!args.includes('--no-csp') && file.endsWith('.html')) {
      headers['Content-Security-Policy'] = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src https://fonts.gstatic.com data:",
        "img-src 'self' data: blob:",
        "media-src 'self' data: blob:",
        "connect-src 'self'",
        "worker-src 'self' blob:",
      ].join('; ');
    }
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const isUrl = /^https?:\/\//.test(target);
const server = isUrl ? null : await serve(target);
const baseUrl = (isUrl ? target : `http://127.0.0.1:${server.address().port}/`) + (opt('query', '') ? `?${opt('query', '')}` : '');

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-angle=d3d11', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--no-first-run'],
});

const report = { url: baseUrl, viewports: {}, clicks: [] };
const viewports = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
  mobile: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

async function openPage(vp) {
  const page = await browser.newPage();
  const log = { errors: [], warnings: [], failed: [] };
  page.on('console', (m) => {
    if (m.type() === 'error') log.errors.push(m.text());
    else if (m.type() === 'warning') log.warnings.push(m.text());
  });
  page.on('pageerror', (e) => log.errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => log.failed.push(`${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => { if (r.status() >= 400) log.failed.push(`${r.status()} ${r.url()}`); });
  await page.setViewport(vp);
  const t0 = Date.now();
  await page.goto(baseUrl, { waitUntil: scenarioPath ? 'load' : 'networkidle0', timeout: 90000 }).catch((e) => log.errors.push(`goto: ${e.message}`));
  log.loadMs = Date.now() - t0;
  await new Promise((r) => setTimeout(r, waitMs));
  return { page, log };
}

async function scrollTo(page, frac) {
  await page.evaluate(async (f) => {
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const y = Math.round(max * f);
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true });
    else window.scrollTo(0, y);
    window.dispatchEvent(new Event('scroll'));
  }, frac);
  await new Promise((r) => setTimeout(r, 1400));
}

// Scenario mode: --scenario steps.json runs scripted steps and saves named shots, instead of scroll shots.
// Steps: {wait: ms} | {eval: "js"} | {key: "w", hold: ms} | {keys: ["w","shift"], hold: ms} | {press: "e"}
//        | {click: [x, y]} | {clickSel: "css"} | {shot: "name"} | {log: "js expression"}
const scenarioPath = opt('scenario', null);
if (scenarioPath) {
  const steps = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'));
  const runs = only ? [only] : ['desktop'];
  for (const vpName of runs) {
    const { page, log } = await openPage(viewports[vpName]);
    const notes = [];
    for (const s of steps) {
      try {
        if (s.waitFor) {
          const t0 = Date.now();
          await page.waitForFunction(s.waitFor, { timeout: s.timeout || 120000, polling: 200 });
          notes.push(`waitFor ${s.waitFor} => ${Date.now() - t0} ms`);
        }
        if (s.wait) await new Promise((r) => setTimeout(r, s.wait));
        if (s.eval) await page.evaluate(s.eval);
        if (s.log) notes.push(`${s.log} => ${JSON.stringify(await page.evaluate(s.log))}`);
        if (s.key || s.keys) {
          const ks = s.keys || [s.key];
          const map = (k) => ({ w: 'KeyW', a: 'KeyA', s: 'KeyS', d: 'KeyD', e: 'KeyE', shift: 'Shift', space: 'Space', up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', enter: 'Enter', m: 'KeyM', esc: 'Escape' }[k] || k);
          for (const k of ks) await page.keyboard.down(map(k));
          await new Promise((r) => setTimeout(r, s.hold || 500));
          for (const k of ks.reverse()) await page.keyboard.up(map(k));
        }
        if (s.press) { const k = { e: 'KeyE', space: 'Space', esc: 'Escape', m: 'KeyM', enter: 'Enter' }[s.press] || s.press; await page.keyboard.press(k); }
        if (s.click) await page.mouse.click(s.click[0], s.click[1]);
        if (s.clickSel) await page.click(s.clickSel);
        if (s.shot) await page.screenshot({ path: path.join(outDir, `${vpName}-${s.shot}.png`) });
      } catch (e) { log.errors.push(`step ${JSON.stringify(s).slice(0, 80)}: ${e.message}`); }
    }
    report.viewports[vpName] = { shots: steps.filter((s) => s.shot).map((s) => `${vpName}-${s.shot}.png`), notes, ...log };
    await page.close();
  }
  await browser.close();
  server?.close();
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  for (const [n, v] of Object.entries(report.viewports)) {
    console.log(`${n}: ${v.shots.length} shots, errors ${v.errors.length}, failed ${v.failed.length}`);
    for (const e of v.errors.slice(0, 12)) console.log(`  [error] ${e}`);
    for (const e of v.failed.slice(0, 6)) console.log(`  [failed] ${e}`);
    for (const nn of v.notes) console.log(`  ${nn}`);
  }
  process.exit(0);
}

for (const [name, vp] of Object.entries(viewports)) {
  if (only && only !== name) continue;
  const { page, log } = await openPage(vp);
  const info = await page.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    let renderer = 'none';
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    }
    return {
      renderer,
      pageHeight: document.documentElement.scrollHeight,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      title: document.title,
    };
  });
  const shots = [];
  for (const f of scrolls) {
    await scrollTo(page, f);
    const file = `${name}-${String(Math.round(f * 100)).padStart(3, '0')}.png`;
    await page.screenshot({ path: path.join(outDir, file) });
    shots.push(file);
  }
  report.viewports[name] = { ...info, shots, ...log };
  await page.close();
}

for (const [i, sel] of clicks.entries()) {
  if (only === 'mobile') break;
  const { page, log } = await openPage(viewports.desktop);
  let ok = true;
  try {
    await page.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center' }), sel);
    await new Promise((r) => setTimeout(r, 900));
    await page.click(sel);
    await new Promise((r) => setTimeout(r, 1500));
  } catch (e) {
    ok = false;
    log.errors.push(`click ${sel}: ${e.message}`);
  }
  const file = `click-${i + 1}.png`;
  await page.screenshot({ path: path.join(outDir, file) });
  report.clicks.push({ selector: sel, ok, file, ...log });
  await page.close();
}

await browser.close();
server?.close();
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));

const sum = Object.entries(report.viewports)
  .map(([n, v]) => `${n}: ${v.shots.length} shots, height ${v.pageHeight}px, overflowX ${v.overflowX}, errors ${v.errors.length}, failed ${v.failed.length}, webgl "${v.renderer}"`)
  .join('\n');
console.log(sum);
for (const [n, v] of Object.entries(report.viewports)) {
  for (const e of v.errors.slice(0, 8)) console.log(`  [${n} error] ${e}`);
  for (const e of v.failed.slice(0, 8)) console.log(`  [${n} failed] ${e}`);
}
for (const c of report.clicks) console.log(`click ${c.selector}: ${c.ok ? 'ok' : 'FAILED'} -> ${c.file}`);
console.log(`Saved to ${outDir}`);
