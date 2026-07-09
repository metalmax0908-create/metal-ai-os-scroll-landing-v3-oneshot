import { sceneGroups, slides, templates } from '../content/slides.js';

const allowedPageTypes = new Set([
  'Cover',
  'One-liner',
  'Part Divider',
  'Context Slide',
  'Pain Slide',
  'Opportunity Slide',
  'Gap Slide',
  'Model Slide',
  'Loop Slide',
  'Demo Moment',
  'Module Slide',
  'Mechanism Slide',
  'Action Card Slide',
  'Pilot Path Slide',
  'Collaboration Slide',
  'CTA Slide',
]);

const requiredFields = [
  'number',
  'title',
  'pageType',
  'template',
  'sceneGroup',
  'visualType',
  'visualPurpose',
  'animation',
  'needs',
];

const positivePromiseTerms = [
  '保證排名',
  '保證曝光',
  '保證 ROI',
  '保證ROI',
  '保證成交',
  '保證回本',
  ' guaranteed ranking',
  ' guaranteed exposure',
  ' guaranteed ROI',
  ' guaranteed conversion',
];

const bannedFramingTerms = [
  '價格區間',
  '自動外發',
  '自動改價',
  '自動合同',
  '自動付款',
  'ERP 替代',
  'POS 替代',
  '會計替代',
  '會計系統替代',
];

const imageInstructionTerms = [
  'Midjourney',
  'Stable Diffusion',
  'DALL-E',
  'image prompt',
  '圖片 prompt',
  '圖片生成 prompt',
  '生成圖片提示詞',
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function collectText(value) {
  if (value == null) return [];
  if (typeof value === 'string') return [value];
  if (typeof value === 'number' || typeof value === 'boolean') return [];
  if (Array.isArray(value)) return value.flatMap(collectText);
  if (typeof value === 'object') return Object.values(value).flatMap(collectText);
  return [];
}

if (slides.length !== 32) {
  fail(`Expected 32 slides, found ${slides.length}.`);
}

const numbers = slides.map((slide) => slide.number);
const expectedNumbers = Array.from({ length: 32 }, (_, index) => index + 1);
if (numbers.some((number, index) => number !== expectedNumbers[index])) {
  fail(`Slide numbers are not sequential: ${numbers.join(', ')}`);
}

const duplicateNumbers = numbers.filter((number, index) => numbers.indexOf(number) !== index);
if (duplicateNumbers.length) {
  fail(`Duplicate slide numbers: ${[...new Set(duplicateNumbers)].join(', ')}`);
}

const sceneGroupIds = new Set(sceneGroups.map((group) => group.id));
if (sceneGroups.length !== 8) {
  fail(`Expected 8 scene groups, found ${sceneGroups.length}.`);
}

const groupedNumbers = sceneGroups.flatMap((group) => group.slides);
const missingFromGroups = numbers.filter((number) => !groupedNumbers.includes(number));
const extraInGroups = groupedNumbers.filter((number) => !numbers.includes(number));
if (missingFromGroups.length || extraInGroups.length) {
  fail(`Scene group coverage mismatch. Missing: ${missingFromGroups.join(', ') || 'none'}; extra: ${extraInGroups.join(', ') || 'none'}.`);
}

for (const slide of slides) {
  const missing = requiredFields.filter((field) => slide[field] == null || slide[field] === '');
  if (missing.length) {
    fail(`Slide ${slide.number} missing required fields: ${missing.join(', ')}.`);
  }

  if (!allowedPageTypes.has(slide.pageType)) {
    fail(`Slide ${slide.number} has invalid page type: ${slide.pageType}.`);
  }

  if (!sceneGroupIds.has(slide.sceneGroup)) {
    fail(`Slide ${slide.number} uses unknown scene group: ${slide.sceneGroup}.`);
  }

  const declaredGroup = sceneGroups.find((group) => group.id === slide.sceneGroup);
  if (!declaredGroup.slides.includes(slide.number)) {
    fail(`Slide ${slide.number} is not listed inside scene group ${slide.sceneGroup}.`);
  }

  for (const key of ['image', 'diagram', 'ui']) {
    if (typeof slide.needs[key] !== 'boolean') {
      fail(`Slide ${slide.number} needs.${key} must be boolean.`);
    }
  }
}

const expectedTemplates = [...new Set(slides.map((slide) => slide.template))];
if (templates.length !== expectedTemplates.length || templates.some((template, index) => template !== expectedTemplates[index])) {
  fail('Exported templates do not match slide templates.');
}

const allSlideText = collectText(slides).join('\n');
const blockedTerms = [...positivePromiseTerms, ...bannedFramingTerms, ...imageInstructionTerms];
const foundBlockedTerms = blockedTerms.filter((term) => allSlideText.includes(term));
if (foundBlockedTerms.length) {
  fail(`Found blocked terms in slide manifest: ${foundBlockedTerms.join(', ')}`);
}

console.log(`slides manifest check ok: ${slides.length} slides, ${templates.length} templates, ${sceneGroups.length} scene groups`);
