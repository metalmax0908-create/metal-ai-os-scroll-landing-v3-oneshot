/**
 * Capture 32 stable slide screenshots + contact-sheet.html/png.
 *
 * Usage:
 *   node scripts/capture-contact-sheet.mjs
 *   node scripts/capture-contact-sheet.mjs http://127.0.0.1:4174/
 *
 * Browser launch order:
 *   1. Playwright bundled Chromium (if installed)
 *   2. System Chromium / Chrome fallbacks (incl. /usr/bin/chromium)
 *   3. PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH / CHROMIUM_PATH env override
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'artifacts', 'contact-sheet');
let baseUrl = process.argv[2];
let server;

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
  ['.mp4', 'video/mp4'],
  ['.webp', 'image/webp'],
  ['.json', 'application/json'],
]);

const SYSTEM_CHROMIUM_CANDIDATES = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  process.env.CHROMIUM_PATH,
  process.env.CHROME_PATH,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/snap/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
].filter(Boolean);

function resolveSystemChromium() {
  for (const candidate of SYSTEM_CHROMIUM_CANDIDATES) {
    try {
      if (fsSync.existsSync(candidate)) return candidate;
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function launchBrowser() {
  const launchErrors = [];

  // 1) Prefer Playwright's own Chromium when the browser package is present.
  try {
    const browser = await chromium.launch({ headless: true });
    return { browser, mode: 'playwright-bundled' };
  } catch (err) {
    launchErrors.push(`playwright-bundled: ${err.message}`);
  }

  // 2) System Chromium / Chrome fallback (required by Review Mode handoff).
  const executablePath = resolveSystemChromium();
  if (executablePath) {
    try {
      const browser = await chromium.launch({
        headless: true,
        executablePath,
      });
      return { browser, mode: `system:${executablePath}` };
    } catch (err) {
      launchErrors.push(`system(${executablePath}): ${err.message}`);
    }
  } else {
    launchErrors.push('system: no executable found among candidates');
  }

  const help = [
    'Could not launch a Chromium-compatible browser for contact sheet.',
    'Tried Playwright bundled browser + system fallbacks.',
    ...launchErrors.map((line) => `  - ${line}`),
    'Fix options:',
    '  npx playwright install chromium',
    '  or install system Chromium/Chrome and ensure one of:',
    '    /usr/bin/chromium',
    '    /Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '  or set CHROMIUM_PATH / PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH',
  ].join('\n');
  throw new Error(help);
}

if (!baseUrl) {
  server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const filePath = path.normalize(path.join(root, requested.split('?')[0]));
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    try {
      const data = await fs.readFile(filePath);
      const headers = {
        'content-type': mime.get(path.extname(filePath)) || 'application/octet-stream',
        'accept-ranges': 'bytes',
      };
      // Basic Range support so prerender video can seek during capture.
      const range = req.headers.range;
      if (range && data.length) {
        const match = /bytes=(\d*)-(\d*)/.exec(range);
        if (match) {
          const start = match[1] ? Number(match[1]) : 0;
          const end = match[2] ? Number(match[2]) : data.length - 1;
          const chunk = data.subarray(start, end + 1);
          res.writeHead(206, {
            ...headers,
            'content-range': `bytes ${start}-${end}/${data.length}`,
            'content-length': chunk.length,
          });
          res.end(chunk);
          return;
        }
      }
      res.writeHead(200, { ...headers, 'content-length': data.length });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/`;
}

await fs.mkdir(outDir, { recursive: true });

const { browser, mode: browserMode } = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const consoleMessages = [];
const pageErrors = [];
page.on('console', (message) => {
  if (['error', 'warning'].includes(message.type())) {
    consoleMessages.push(`${message.type()}: ${message.text()}`);
  }
});
page.on('pageerror', (error) => pageErrors.push(error.stack || error.message));

const reviewUrl = new URL(baseUrl);
reviewUrl.searchParams.set('review', '1');
reviewUrl.searchParams.set('contact', '1');
// Preserve optional cache-bust style params if already present on baseUrl; default v=pr4 is fine if absent.
if (!reviewUrl.searchParams.has('v')) reviewUrl.searchParams.set('v', 'pr4');

await page.goto(reviewUrl.toString(), { waitUntil: 'domcontentloaded', timeout: 60_000 });
await page.waitForFunction(() => window.__demoReady === true, null, { timeout: 30_000 });
// Allow prerender seek prep / fonts a moment without hard-failing.
await page.waitForTimeout(400);

const blockedPublicTerms = [
  'Manifest driven',
  '32 slides / 8 scene groups',
  'Not a video background',
  'Prototype note',
  'S01 /',
  'S13 /',
  'H0 ·',
  'DEMO MOMENT',
  'INQUIRY-BRANCH',
  'APPROVAL-GATE',
  'Customer inquiry',
];
// Contact mode hides review HUD; public debug labels stay gated by is-debug.
const publicText = await page.evaluate(() => document.body.innerText);
const visibleBlockedTerms = blockedPublicTerms.filter((term) => publicText.includes(term));
if (visibleBlockedTerms.length) {
  await browser.close();
  server?.close();
  throw new Error(`Public page shows internal labels: ${visibleBlockedTerms.join(', ')}`);
}

const manifest = await page.evaluate(() => ({
  slideCount: window.__slideManifest.slides.length,
  groupCount: window.__slideManifest.sceneGroups.length,
  templateCount: window.__slideManifest.templates.length,
  title: document.title,
  review: Boolean(window.__reviewMode?.enabled),
  hasGoToSlide: typeof window.goToSlide === 'function',
}));

if (manifest.slideCount !== 32 || manifest.groupCount !== 8) {
  await browser.close();
  server?.close();
  throw new Error(`Unexpected manifest counts: ${JSON.stringify(manifest)}`);
}
if (!manifest.hasGoToSlide) {
  await browser.close();
  server?.close();
  throw new Error('window.goToSlide missing — review mode not wired in index.html');
}

const captures = [];
for (let index = 0; index < manifest.slideCount; index += 1) {
  const expected = index + 1;
  const active = await page.evaluate(async (slideNumber) => {
    const result = window.goToSlide(slideNumber);
    // Double rAF so opacity/transform + video seek settle.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await new Promise((resolve) => setTimeout(resolve, 80));
    const manifestSlide = window.__slideManifest.slides[slideNumber - 1];
    const cards = [...document.querySelectorAll('[data-slide-number]')].map((el) => ({
      number: Number(el.dataset.slideNumber),
      opacity: Number.parseFloat(el.style.opacity || '0'),
      title: el.getAttribute('aria-label'),
    }));
    const visible = [...cards].sort((a, b) => b.opacity - a.opacity)[0];
    return {
      result,
      manifestSlide,
      visible,
      reviewTarget: window.__reviewMode?.targetIndex ?? null,
    };
  }, expected);

  if (active.reviewTarget !== index) {
    await browser.close();
    server?.close();
    throw new Error(
      `goToSlide target mismatch for slide ${expected}: targetIndex=${active.reviewTarget}`,
    );
  }

  if (active.visible?.number !== expected) {
    await browser.close();
    server?.close();
    throw new Error(
      `renderAt/goToSlide mismatch for slide ${expected}: visible ${active.visible?.number} opacity=${active.visible?.opacity}`,
    );
  }

  const file = `slide-${String(expected).padStart(2, '0')}.png`;
  await page.screenshot({ path: path.join(outDir, file), animations: 'disabled' });
  captures.push({
    file,
    number: expected,
    source: active.manifestSlide.source,
    group: active.manifestSlide.sceneGroup,
    pageType: active.manifestSlide.pageType,
    template: active.manifestSlide.template,
    title: active.manifestSlide.title,
    seconds: active.result?.seconds ?? null,
    progress: active.result?.progress ?? null,
  });
}

const contactHtml = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<title>Metal AI OS contact sheet</title>
<style>
  body { margin: 0; background: #05070b; color: #eef6fb; font-family: -apple-system, BlinkMacSystemFont, "PingFang HK", sans-serif; }
  .sheet { width: 1440px; padding: 24px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
  .card { border: 1px solid rgba(235,245,252,.16); border-radius: 16px; overflow: hidden; background: rgba(255,255,255,.04); }
  img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; object-position: center; }
  .meta { padding: 11px 12px 13px; min-height: 86px; }
  .kicker { color: #f4c66b; font: 11px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 6px; }
  .title { font-size: 15px; line-height: 1.25; letter-spacing: -.02em; }
</style>
</head>
<body>
<div class="sheet">
${captures.map((capture) => `<article class="card"><img src="${capture.file}" alt="Slide ${capture.number}"><div class="meta"><div class="kicker">${String(capture.number).padStart(2, '0')} · ${capture.source} · ${capture.group} · ${escapeHtml(capture.pageType || capture.template)}</div><div class="title">${escapeHtml(capture.title)}</div></div></article>`).join('\n')}
</div>
</body>
</html>`;

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

const contactHtmlPath = path.join(outDir, 'contact-sheet.html');
await fs.writeFile(contactHtmlPath, contactHtml, 'utf8');
const sheetPage = await browser.newPage({ viewport: { width: 1440, height: 2200 }, deviceScaleFactor: 1 });
await sheetPage.goto(pathToFileURL(contactHtmlPath).href, { waitUntil: 'networkidle' });
await sheetPage.screenshot({ path: path.join(outDir, 'contact-sheet.png'), fullPage: true });
await browser.close();
server?.close();

const result = {
  baseUrl: reviewUrl.toString(),
  browserMode,
  manifest,
  captures: captures.length,
  contactSheet: path.join(outDir, 'contact-sheet.png'),
  contactHtml: contactHtmlPath,
  warnings: consoleMessages,
  pageErrors,
};

if (pageErrors.length || consoleMessages.some((message) => message.startsWith('error:'))) {
  console.error(JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log(JSON.stringify(result, null, 2));
