import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const briefPath = path.join(root, 'HERO_SHOT_BRIEF_v0.1.md');
const outDir = path.join(root, 'artifacts', 'hero-generated');
const envPaths = [
  path.join(root, '.env'),
  '/Users/metalmax/Documents/Codex/substack-growth-loop/.env',
];

const frames = {
  '1': { heading: '## 7. Keyframe 1 Prompt: Sky Entry', label: 'keyframe-01-sky-entry' },
  '2': { heading: '## 8. Keyframe 2 Prompt: City / Title Lock', label: 'keyframe-02-city-title-lock' },
  '3': { heading: '## 9. Keyframe 3 Prompt: Street Freeze', label: 'keyframe-03-street-freeze' },
};

const wanted = process.argv[2] || '2';
const frame = frames[wanted];
if (!frame) throw new Error(`Unknown frame "${wanted}". Use 1, 2, or 3.`);
const variant = (process.argv[3] || '').trim();
if (variant && !/^[a-z0-9-]+$/.test(variant)) {
  throw new Error('Variant may only contain lowercase letters, numbers, and hyphens.');
}

function parseEnv(text) {
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

async function loadEnv() {
  const merged = { ...process.env };
  for (const envPath of envPaths) {
    try {
      Object.assign(merged, parseEnv(await fs.readFile(envPath, 'utf8')));
    } catch {}
  }
  return merged;
}

function sectionAfter(markdown, heading) {
  const start = markdown.indexOf(heading);
  if (start < 0) throw new Error(`Missing heading: ${heading}`);
  const rest = markdown.slice(start + heading.length);
  const next = rest.search(/\n## \d+\. /);
  return next >= 0 ? rest.slice(0, next) : rest;
}

function fencedText(section) {
  const match = section.match(/```text\n([\s\S]*?)\n```/);
  if (!match) throw new Error('Missing fenced text prompt.');
  return match[1].trim();
}

async function saveImageFromResponse(body, basePath) {
  const first = (body.data || [])[0] || {};
  if (first.b64_json) {
    await fs.writeFile(`${basePath}.png`, Buffer.from(first.b64_json, 'base64'));
    return `${basePath}.png`;
  }
  if (first.url) {
    const response = await fetch(first.url);
    if (!response.ok) throw new Error(`Image URL download failed with HTTP ${response.status}`);
    await fs.writeFile(`${basePath}.png`, Buffer.from(await response.arrayBuffer()));
    return `${basePath}.png`;
  }
  throw new Error('Metaldady response contained no b64_json or url.');
}

async function requestImage(endpoint, key, payload) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

await fs.mkdir(outDir, { recursive: true });
const markdown = await fs.readFile(briefPath, 'utf8');
const shared = fencedText(sectionAfter(markdown, '## 6. Shared Prompt Contract'));
const specific = fencedText(sectionAfter(markdown, frame.heading));
const variantAddendums = {
  '3:luxury-brands-private': `Variant Addendum:
For this private reference candidate only, allow selected ad panels and shopfront signs to contain real luxury brand advertising that would plausibly appear in Central Hong Kong, such as Louis Vuitton, Chanel, Dior, Gucci, Cartier, Prada, Hermes, Rolex, and Tiffany. Treat the brands as background environmental signage, not as the subject of the image. Use a small number of physically believable storefront signs, backlit ad panels, and window display posters. Keep them subtle, spatially integrated, and partially secondary to the street scene. Avoid fake gibberish, malformed duplicate wordmarks, giant dominant billboards, endorsement framing, product claims, prices, promotional slogans, or people posing as the main ad subject. Keep all Metal AI and landing page text out of the image.`,
};
const addendum = variantAddendums[`${wanted}:${variant}`] || '';
const prompt = [shared, specific, addendum].filter(Boolean).join('\n\n');
const env = await loadEnv();
const endpoint = env.METALDADY_IMAGE_ENDPOINT || 'https://api.metaldadyapi.com/v1/images/generations';
const key = env.METALDADY_API_KEY;
const model = env.METALDADY_IMAGE_MODEL || 'gpt-image-2';
if (!key) throw new Error('Missing METALDADY_API_KEY.');

const outputLabel = variant ? `${frame.label}-${variant}` : frame.label;
const basePath = path.join(outDir, outputLabel);
const primaryPayload = { model, prompt, aspect_ratio: '16:9', size: '2560x1440', quality: 'high' };
const compactPayload = { model, prompt, aspect_ratio: '16:9' };
let body;
let payloadMode = process.env.METALDADY_COMPACT_ONLY === '1' ? 'compact_only' : 'primary';
try {
  body = await requestImage(endpoint, key, payloadMode === 'compact_only' ? compactPayload : primaryPayload);
} catch (error) {
  payloadMode = `compact_after_${error.message}`;
  body = await requestImage(endpoint, key, compactPayload);
}
const imagePath = await saveImageFromResponse(body, basePath);
await fs.writeFile(`${basePath}.prompt.txt`, prompt, 'utf8');
await fs.writeFile(`${basePath}.metadata.json`, JSON.stringify({
  provider: 'metaldady',
  model,
  frame: wanted,
  label: outputLabel,
  baseLabel: frame.label,
  variant: variant || null,
  endpoint,
  payloadMode,
  imagePath,
  generatedAt: new Date().toISOString(),
}, null, 2), 'utf8');

console.log(JSON.stringify({ frame: wanted, label: outputLabel, imagePath, payloadMode }, null, 2));
