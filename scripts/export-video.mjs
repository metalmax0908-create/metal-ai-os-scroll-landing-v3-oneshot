import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'out');
const framesDir = path.join(root, 'frames');
const outputFile = path.join(outDir, 'metal-ai-os-scroll-landing-v2.mp4');
const fps = Number(process.env.FPS || 30);
const duration = Number(process.env.DURATION || 18);
const width = Number(process.env.WIDTH || 1920);
const height = Number(process.env.HEIGHT || 1080);
const frameCount = Math.round(fps * duration);

fs.mkdirSync(outDir, { recursive: true });
fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml'],
]);

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(root, requested));
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'content-type': mime.get(path.extname(filePath)) || 'application/octet-stream' });
    res.end(data);
  });
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

let browser;
try {
  try {
    browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome', headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/?export=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__demoReady === true);

  for (let frame = 0; frame < frameCount; frame += 1) {
    const seconds = frame / fps;
    await page.evaluate((time) => window.renderAt(time), seconds);
    const framePath = path.join(framesDir, `frame${String(frame + 1).padStart(4, '0')}.png`);
    await page.screenshot({ path: framePath, fullPage: false, animations: 'disabled' });
    if ((frame + 1) % fps === 0) {
      process.stdout.write(`captured ${Math.round((frame + 1) / fps)}s / ${duration}s\n`);
    }
  }
} finally {
  if (browser) await browser.close();
  server.close();
}

const ffmpeg = spawnSync('ffmpeg', [
  '-y',
  '-framerate', String(fps),
  '-i', path.join(framesDir, 'frame%04d.png'),
  '-c:v', 'libx264',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  '-r', String(fps),
  outputFile,
], { stdio: 'inherit' });

if (ffmpeg.status !== 0) {
  process.exit(ffmpeg.status ?? 1);
}

const stat = fs.statSync(outputFile);
console.log(`exported ${outputFile}`);
console.log(`size ${(stat.size / 1024 / 1024).toFixed(2)} MB, ${duration}s, ${width}x${height}@${fps}fps`);
