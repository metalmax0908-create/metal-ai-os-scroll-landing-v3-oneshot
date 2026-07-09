import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const mustHave = [
  'Metal AI OS',
  'scroll-driven cinematic landing page',
  'data-scroll-stage',
  'window.renderAt',
  "import { sceneGroups, slides, templates } from './content/slides.js';",
  'const DURATION = slides.length',
  'window.__slideManifest',
  'data-deck',
  'data-edit-fields',
  'content/slides.js',
];

const missing = mustHave.filter((needle) => !html.includes(needle));
if (missing.length) {
  console.error('Missing required markers:', missing.join(', '));
  process.exit(1);
}

if (/<video\b/i.test(html) || /\.mp4/i.test(html)) {
  console.error('This prototype must not embed a video or MP4 background.');
  process.exit(1);
}

if (/TODO|lorem ipsum|\[必填\]|placeholder text/i.test(html)) {
  console.error('Found placeholder text.');
  process.exit(1);
}

const assetMatches = [...html.matchAll(/assets\/images\/[a-z0-9-]+\.png/g)].map((m) => m[0]);
const uniqueAssets = [...new Set(assetMatches)];
const missingAssets = uniqueAssets.filter((asset) => !fs.existsSync(path.join(root, asset)));
if (missingAssets.length) {
  console.error('Missing image assets:', missingAssets.join(', '));
  process.exit(1);
}

console.log(`static check ok: ${uniqueAssets.length} image assets, live scroll page markers present, no video embed`);
