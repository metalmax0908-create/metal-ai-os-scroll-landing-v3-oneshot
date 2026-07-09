import http from 'node:http';
import fs from 'node:fs/promises';
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
  ['.css', 'text/css; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
]);

if (!baseUrl) {
  server = http.createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const filePath = path.normalize(path.join(root, requested));
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }
    try {
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'content-type': mime.get(path.extname(filePath)) || 'application/octet-stream' });
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

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const consoleMessages = [];
const pageErrors = [];
page.on('console', (message) => {
  if (['error', 'warning'].includes(message.type())) {
    consoleMessages.push(`${message.type()}: ${message.text()}`);
  }
});
page.on('pageerror', (error) => pageErrors.push(error.stack || error.message));

await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__demoReady === true, null, { timeout: 10_000 });

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
const publicText = await page.evaluate(() => document.body.innerText);
const visibleBlockedTerms = blockedPublicTerms.filter((term) => publicText.includes(term));
if (visibleBlockedTerms.length) {
  throw new Error(`Public page shows internal labels: ${visibleBlockedTerms.join(', ')}`);
}

const manifest = await page.evaluate(() => ({
  slideCount: window.__slideManifest.slides.length,
  groupCount: window.__slideManifest.sceneGroups.length,
  templateCount: window.__slideManifest.templates.length,
  title: document.title,
}));

if (manifest.slideCount !== 32 || manifest.groupCount !== 8) {
  throw new Error(`Unexpected manifest counts: ${JSON.stringify(manifest)}`);
}

const captures = [];
for (let index = 0; index < manifest.slideCount; index += 1) {
  const seconds = index / (manifest.slideCount - 1) * manifest.slideCount;
  const active = await page.evaluate(async ({ seconds }) => {
    window.renderAt(seconds);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const manifestSlide = window.__slideManifest.slides[Math.round((seconds / window.__slideManifest.slides.length) * (window.__slideManifest.slides.length - 1))];
    const visible = [...document.querySelectorAll('[data-slide-number]')]
      .map((el) => ({
        number: Number(el.dataset.slideNumber),
        opacity: Number.parseFloat(el.style.opacity || '0'),
        title: el.getAttribute('aria-label'),
      }))
      .sort((a, b) => b.opacity - a.opacity)[0];
    return { manifestSlide, visible };
  }, { seconds });
  const expected = index + 1;
  if (active.visible.number !== expected) {
    throw new Error(`renderAt mismatch for slide ${expected}: visible ${active.visible.number}`);
  }
  const file = `slide-${String(expected).padStart(2, '0')}.png`;
  await page.screenshot({ path: path.join(outDir, file), animations: 'disabled' });
  captures.push({
    file,
    number: expected,
    source: active.manifestSlide.source,
    group: active.manifestSlide.sceneGroup,
    template: active.manifestSlide.template,
    title: active.manifestSlide.title,
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
${captures.map((capture) => `<article class="card"><img src="${capture.file}" alt="Slide ${capture.number}"><div class="meta"><div class="kicker">${String(capture.number).padStart(2, '0')} · ${capture.source} · ${capture.group} · ${capture.template}</div><div class="title">${capture.title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</div></div></article>`).join('\n')}
</div>
</body>
</html>`;

const contactHtmlPath = path.join(outDir, 'contact-sheet.html');
await fs.writeFile(contactHtmlPath, contactHtml, 'utf8');
const sheetPage = await browser.newPage({ viewport: { width: 1440, height: 2200 }, deviceScaleFactor: 1 });
await sheetPage.goto(pathToFileURL(contactHtmlPath).href, { waitUntil: 'networkidle' });
await sheetPage.screenshot({ path: path.join(outDir, 'contact-sheet.png'), fullPage: true });
await browser.close();
server?.close();

const result = {
  baseUrl,
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
