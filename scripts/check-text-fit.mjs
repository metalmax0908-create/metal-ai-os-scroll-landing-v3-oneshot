import { slides } from '../content/slides.js';

const profiles = {
  'hero-cinematic': {
    title: 34,
    subtitle: 42,
    bodyParagraphs: 3,
    bodyChars: 96,
    totalBodyChars: 190,
  },
  'statement-large': {
    title: 46,
    subtitle: 58,
    bodyParagraphs: 3,
    bodyChars: 115,
    totalBodyChars: 230,
  },
  'chapter-break': {
    title: 34,
    subtitle: 52,
    bodyParagraphs: 2,
    bodyChars: 90,
    totalBodyChars: 150,
  },
  'cta-final': {
    title: 42,
    subtitle: 58,
    bodyParagraphs: 3,
    bodyChars: 95,
    totalBodyChars: 180,
  },
  default: {
    title: 42,
    subtitle: 62,
    bodyParagraphs: 3,
    bodyChars: 110,
    totalBodyChars: 230,
  },
};

const listLimits = {
  items: { count: 6, title: 24, body: 66 },
  modules: { count: 8, title: 30, body: 66 },
  definitions: { count: 4, title: 18, body: 48 },
  formulas: { count: 5, title: 44, body: 44 },
  steps: { count: 7, title: 38, body: 66 },
  outputs: { count: 5, title: 38, body: 66 },
  fields: { count: 6, title: 18, body: 58 },
  entries: { count: 6, title: 24, body: 64 },
  cta: { count: 4, title: 14, body: 14 },
};

function width(text = '') {
  return Array.from(String(text)).reduce((sum, char) => {
    if (/\s/.test(char)) return sum + 0.35;
    if (/^[\x00-\x7F]$/.test(char)) return sum + 0.56;
    return sum + 1;
  }, 0);
}

function listTexts(value) {
  if (value == null) return [];
  if (typeof value === 'string') return [value];
  if (typeof value === 'number' || typeof value === 'boolean') return [];
  if (Array.isArray(value)) return value.flatMap(listTexts);
  if (typeof value === 'object') return Object.values(value).flatMap(listTexts);
  return [];
}

function describeField(item) {
  if (typeof item === 'string') return { title: item, body: '' };
  if (!item || typeof item !== 'object') return { title: '', body: '' };
  return {
    title: item.title || item.key || item.label || item.role || item.value || '',
    body: item.body || item.action || item.value || '',
  };
}

const warnings = [];
const severe = [];

function add(issue) {
  const bucket = issue.severe ? severe : warnings;
  bucket.push(issue);
}

for (const slide of slides) {
  const profile = profiles[slide.template] || profiles.default;
  const titleWidth = width(slide.title);
  if (titleWidth > profile.title) {
    add({ slide, field: 'title', value: titleWidth, limit: profile.title, severe: titleWidth > profile.title * 1.35 });
  }

  if (slide.subtitle) {
    const subtitleWidth = width(slide.subtitle);
    if (subtitleWidth > profile.subtitle) {
      add({ slide, field: 'subtitle', value: subtitleWidth, limit: profile.subtitle, severe: subtitleWidth > profile.subtitle * 1.45 });
    }
  }

  const body = Array.isArray(slide.body) ? slide.body : [];
  if (body.length > profile.bodyParagraphs) {
    add({ slide, field: 'body paragraphs', value: body.length, limit: profile.bodyParagraphs, severe: body.length > profile.bodyParagraphs + 2 });
  }

  const totalBodyWidth = body.reduce((sum, text) => sum + width(text), 0);
  if (totalBodyWidth > profile.totalBodyChars) {
    add({ slide, field: 'body total', value: totalBodyWidth, limit: profile.totalBodyChars, severe: totalBodyWidth > profile.totalBodyChars * 1.35 });
  }

  for (const [index, paragraph] of body.entries()) {
    const paragraphWidth = width(paragraph);
    if (paragraphWidth > profile.bodyChars) {
      add({ slide, field: `body[${index}]`, value: paragraphWidth, limit: profile.bodyChars, severe: paragraphWidth > profile.bodyChars * 1.45 });
    }
  }

  for (const [field, limit] of Object.entries(listLimits)) {
    const value = slide[field];
    if (!Array.isArray(value)) continue;
    if (value.length > limit.count) {
      add({ slide, field: `${field}.length`, value: value.length, limit: limit.count, severe: value.length > limit.count + 2 });
    }
    for (const [index, item] of value.entries()) {
      const { title, body: itemBody } = describeField(item);
      const titleWidth = width(title);
      if (titleWidth > limit.title) {
        add({ slide, field: `${field}[${index}].title`, value: titleWidth, limit: limit.title, severe: titleWidth > limit.title * 1.6 });
      }
      const bodyWidth = width(itemBody);
      if (bodyWidth > limit.body) {
        add({ slide, field: `${field}[${index}].body`, value: bodyWidth, limit: limit.body, severe: bodyWidth > limit.body * 1.5 });
      }
    }
  }

  const supportingWidth = listTexts(slide.supporting).reduce((sum, text) => sum + width(text), 0);
  if (supportingWidth > 120) {
    add({ slide, field: 'supporting total', value: supportingWidth, limit: 120, severe: supportingWidth > 180 });
  }
}

function format(issue) {
  return `Slide ${String(issue.slide.number).padStart(2, '0')} ${issue.slide.source} [${issue.slide.template}] ${issue.field}: ${Math.round(issue.value * 10) / 10} > ${issue.limit}`;
}

if (warnings.length) {
  console.warn(`text fit warnings: ${warnings.length}`);
  for (const issue of warnings) {
    console.warn(`- ${format(issue)}`);
  }
}

if (severe.length) {
  console.error(`text fit severe issues: ${severe.length}`);
  for (const issue of severe) {
    console.error(`- ${format(issue)}`);
  }
  process.exit(1);
}

console.log(`text fit check ok: ${slides.length} slides checked${warnings.length ? `, ${warnings.length} soft warnings` : ''}`);
