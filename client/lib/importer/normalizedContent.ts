// Normalized Content Model — Layer 2 of the import pipeline
// Template-agnostic representation of parsed web content.
// Built from mapped data, consumed by template-specific allocators.

import type { TemplateType } from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AllocationDebug {
  introSource: 'preH2' | 'firstBlockFallback' | 'empty';
  leadHtmlLength: number;
  sectionBlocks: {
    index: number;
    heading: string;
    wordCount: number;
    classification: string;
    hasImages: boolean;
  }[];
  rawOrderedNonFaqBlockIndexes: number[];
  fallbackRan: boolean;
  fallbackReason: string;
  allocationLog: {
    intro: number[];
    why: number[];
    closing: number[];
  };
  introBodyLength: number;
  whyBodyLength: number;
  closingBodyLength: number;
}

export type TitleSource = 'early-preserved-h1' | 'early-preserved-h2' | 'cleaned-meta-title' | 'empty';

export type HeroTaglineSource = 'mapped-hero-tagline' | 'early-hero-tagline' | 'empty';
export type ExcerptSource = 'mapped' | 'generated' | 'empty';

export interface NormalizedContent {
  sourceUrl: string;
  h1: string;
  metaTitle: string;
  rawMetaTitle: string;
  cleanedMetaTitle: string;
  extractedH1: string;
  earlyPreservedHeading: string;
  earlyPreservedH1: string;
  earlyPreservedH2: string;
  earlyHeroTagline: string;
  earlyHadH1BeforeStrip: boolean;
  preservedHeading: string;
  preservedH1: string;
  preservedH2: string;
  latePreservedHeading: string;
  latePreservedH1: string;
  latePreservedH2: string;
  hadH1BeforeStrip: boolean;
  mainContentDroppedEarlyH1: boolean;
  titleSource: TitleSource;
  chosenTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImage: string;
  schemaType: string;
  status: string;
  heroTagline: string;
  heroTaglineSource: HeroTaglineSource;
  heroDescription: string;
  featuredImage: string;
  heroImage: string;
  heroImageAlt: string;
  excerpt: string;
  excerptSource: ExcerptSource;
  publishedAt: string;
  categoryName: string;
  categorySlug: string;
  /** HTML of content before the first H2 heading */
  leadHtml: string;
  /** Plain text of leadHtml */
  leadText: string;
  sectionBlocks: SectionBlock[];
  faqItems: FaqItem[];
  images: ImageCandidate[];
  /** Top-level images likely to be hero/featured (from lead content, meta, og:image) */
  featuredImageCandidates: ImageCandidate[];
  stats: ContentStats;
  segmentation: SegmentationDebug;
  allocationDebug?: AllocationDebug;
}

export type SectionHeadingLevel = 2 | 3 | 4;

export interface SectionBlock {
  heading: string;
  headingLevel?: SectionHeadingLevel;
  headingTag?: string;
  bodyHtml: string;
  /** Stripped plain text of bodyHtml */
  plainText: string;
  images: ImageCandidate[];
  order: number;
  wordCount: number;
  classification?: 'intro' | 'why' | 'closing' | 'general';
}

export interface ImageCandidate {
  src: string;
  alt: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ContentStats {
  totalWordCount: number;
  sectionBlockCount: number;
  faqItemCount: number;
  imageCount: number;
  h2Count: number;
}

export interface SegmentationDebug {
  method: 'ai-split' | 'h2-split' | 'paragraph-chunk' | 'single-block';
  h2Positions: number[];
  faqDetectionMethod: 'heading-match' | 'bold-qa' | 'dl-list' | 'none';
  preH2ContentLength: number;
  totalInputLength: number;
  areaSplitSignals?: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TITLE_SPLIT_PATTERN = /(?:\s*[|–—:]\s*|\s+-\s+)/g;
const KNOWN_BRAND_PHRASES = ['cherney law', 'cherney law firm'];
const PRACTICE_KEYWORD_PATTERN = /\b(accident|injury|injuries|malpractice|divorce|custody|bankruptcy|dui|dwi|criminal|defense|probate|estate|immigration|employment|workers'? comp|personal injury|wrongful death|practice area|legal service|attorney|lawyer|litigation|claims?)\b/i;
const LOCATION_KEYWORD_PATTERN = /\b(in|near|serving|serves|county|city|state|local|regional|metro|downtown|north|south|east|west|central|beach|hills|park|village|town|borough|district|new york|california|florida|texas|georgia|illinois|ohio|arizona|nevada)\b/i;
const STRONG_BRAND_PATTERN = /\b(law firm|firm|law offices?|attorneys at law|llp|pllc|pc|p\.c\.|group)\b/i;
const BRAND_HINT_PATTERN = /\b(law|firm|attorneys?|lawyers?|counsel|llp|pllc|pc|p\.c\.)\b/i;

function stripTagsToText(html: string): string {
  return normalizeText(html.replace(/<[^>]+>/g, ' '));
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function normalizeText(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text: string): number {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function hasOwnMappedKey(mappedData: Record<string, string>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(mappedData, key);
}

function compactText(text: string): string {
  return normalizeText(text).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getHostnamePhrase(url: string): string {
  if (!url) return '';

  try {
    const hostname = new URL(url).hostname.replace(/^www\./i, '');
    const primaryLabel = hostname.split('.')[0] || '';
    return normalizeText(primaryLabel.replace(/[-_]+/g, ' '));
  } catch {
    return '';
  }
}

function extractTagTexts(html: string, tagName: 'h1' | 'h2'): string[] {
  if (!html?.trim()) return [];

  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const results: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const text = stripTagsToText(match[1]);
    if (text) results.push(text);
  }

  return results;
}

function findRichHeadingCandidate(candidates: string[]): string {
  return candidates.find((candidate) => countWords(candidate) >= 3) || '';
}

function extractPrimaryHeading(html: string): string {
  const h1Candidates = extractTagTexts(html, 'h1');
  const h2Candidates = extractTagTexts(html, 'h2');

  return (
    findRichHeadingCandidate(h1Candidates) ||
    findRichHeadingCandidate(h2Candidates) ||
    h1Candidates[0] ||
    h2Candidates[0] ||
    ''
  );
}

function extractTitleSegments(rawTitle: string): string[] {
  if (!rawTitle?.trim()) return [];

  const segments = rawTitle
    .split(TITLE_SPLIT_PATTERN)
    .map((segment) => normalizeText(segment.replace(/<[^>]+>/g, ' ')))
    .filter(Boolean);

  return segments.length > 0 ? segments : [normalizeText(rawTitle)];
}

function inferBrandPhrases(rawTitle: string, canonicalUrl: string): Set<string> {
  const phrases = new Set<string>(KNOWN_BRAND_PHRASES.map(compactText).filter(Boolean));
  const hostnamePhrase = getHostnamePhrase(canonicalUrl);
  if (hostnamePhrase) phrases.add(compactText(hostnamePhrase));

  for (const segment of extractTitleSegments(rawTitle)) {
    if (
      STRONG_BRAND_PATTERN.test(segment) &&
      !PRACTICE_KEYWORD_PATTERN.test(segment) &&
      !LOCATION_KEYWORD_PATTERN.test(segment) &&
      countWords(segment) <= 5
    ) {
      phrases.add(compactText(segment));
    }
  }

  return phrases;
}

function segmentContainsBrand(segment: string, brandPhrases: Set<string>): boolean {
  const compactSegment = compactText(segment);
  if (!compactSegment) return false;

  for (const brandPhrase of brandPhrases) {
    if (brandPhrase && compactSegment.includes(brandPhrase)) {
      return true;
    }
  }

  return false;
}

function scoreMetaTitleSegment(segment: string, brandPhrases: Set<string>): number {
  const normalizedSegment = normalizeText(segment);
  const wordCount = countWords(normalizedSegment);
  const isBrand = segmentContainsBrand(normalizedSegment, brandPhrases);

  let score = Math.min(normalizedSegment.length, 80);

  if (wordCount >= 3) score += 18;
  if (wordCount >= 5) score += 8;
  if (PRACTICE_KEYWORD_PATTERN.test(normalizedSegment)) score += 24;
  if (LOCATION_KEYWORD_PATTERN.test(normalizedSegment)) score += 16;
  if (wordCount === 1) score -= 10;
  if (wordCount > 0 && wordCount < 3) score -= 8;
  if (BRAND_HINT_PATTERN.test(normalizedSegment)) score -= 12;
  if (isBrand) score -= 100;

  return score;
}

function cleanMetadataTitle(rawTitle: string, canonicalUrl: string): string {
  const normalizedRawTitle = normalizeText(rawTitle);
  if (!normalizedRawTitle) return '';

  const segments = extractTitleSegments(normalizedRawTitle);
  if (segments.length <= 1) return normalizedRawTitle;

  const brandPhrases = inferBrandPhrases(normalizedRawTitle, canonicalUrl);
  const nonBrandSegments = segments.filter((segment) => !segmentContainsBrand(segment, brandPhrases));
  const candidates = nonBrandSegments.length > 0 ? nonBrandSegments : segments;

  const ranked = candidates
    .map((segment) => ({
      segment,
      score: scoreMetaTitleSegment(segment, brandPhrases),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.segment.length - a.segment.length;
    });

  return ranked[0]?.segment || candidates[0] || normalizedRawTitle;
}

/** Extract all images from an HTML string */
function extractImages(html: string): ImageCandidate[] {
  const images: ImageCandidate[] = [];
  const re = /<img[^>]*\ssrc=["']([^"']+)["'][^>]*/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const src = match[1];
    const altMatch = match[0].match(/alt=["']([^"']*?)["']/i);
    const alt = altMatch?.[1] ?? '';
    if (src) images.push({ src, alt });
  }
  return images;
}

/** Extract first image src + alt from HTML */
function extractFirstImage(html: string): ImageCandidate | null {
  const imgs = extractImages(html);
  return imgs[0] ?? null;
}

/** Check if text looks like a question */
function isLikelyQuestion(text: string): boolean {
  if (text.endsWith('?')) return true;
  const questionWords = /^(what|how|why|when|where|who|which|can|do|does|is|are|will|should|could|would)\b/i;
  return questionWords.test(text);
}

// ─── H2 Splitting ────────────────────────────────────────────────────────────

interface H2Split {
  heading: string;
  bodyHtml: string;
  headingStartPos: number;
}

/**
 * Split HTML on H2 boundaries. Returns the pre-H2 lead content and an array of H2 sections.
 */
function splitOnH2(html: string): { leadHtml: string; sections: H2Split[]; h2Positions: number[] } {
  if (!html?.trim()) return { leadHtml: '', sections: [], h2Positions: [] };

  const h2Pattern = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let match;
  const splits: { heading: string; headingTag: string; bodyStart: number; headingStart: number }[] = [];
  const h2Positions: number[] = [];

  while ((match = h2Pattern.exec(html)) !== null) {
    h2Positions.push(match.index);
    splits.push({
      heading: stripTagsToText(match[1]),
      headingTag: match[0],
      bodyStart: match.index + match[0].length,
      headingStart: match.index,
    });
  }

  // Content before first H2
  const leadEnd = splits.length > 0 ? splits[0].headingStart : html.length;
  const leadHtml = html.substring(0, leadEnd).trim();

  // Build sections between H2s
  const sections: H2Split[] = [];
  for (let i = 0; i < splits.length; i++) {
    const start = splits[i].bodyStart;
    const end = i + 1 < splits.length ? splits[i + 1].headingStart : html.length;
    sections.push({
      heading: splits[i].heading,
      bodyHtml: html.substring(start, end).trim(),
      headingStartPos: splits[i].headingStart,
    });
  }

  return { leadHtml, sections, h2Positions };
}

// ─── FAQ Extraction ──────────────────────────────────────────────────────────

/**
 * Extract FAQ items from HTML content. Returns the items found and the detection method.
 * Does NOT modify the input HTML — FAQ removal from sectionBlocks is handled by the caller.
 */
function extractFaqFromHtml(html: string): { items: FaqItem[]; method: SegmentationDebug['faqDetectionMethod'] } {
  if (!html?.trim()) return { items: [], method: 'none' };

  // Pattern 1: H3/H4 headings as questions in an FAQ-headed section
  const faqSectionMatch = html.match(
    /<h2[^>]*>[^<]*\b(faq|frequently\s+asked|questions|q\s*&\s*a)\b[^<]*<\/h2>([\s\S]*?)(?=<h2|$)/i
  );

  const searchContent = faqSectionMatch ? faqSectionMatch[2] : html;
  const items: FaqItem[] = [];

  // Pattern 1: H3/H4 headings as questions
  const headingPattern = /<h[3-4][^>]*>([\s\S]*?)<\/h[3-4]>/gi;
  let match;
  const qaPositions: { question: string; start: number; end: number }[] = [];

  while ((match = headingPattern.exec(searchContent)) !== null) {
    const question = stripTagsToText(match[1]);
    if (isLikelyQuestion(question)) {
      qaPositions.push({
        question,
        start: match.index + match[0].length,
        end: searchContent.length,
      });
    }
  }

  // Set end positions
  for (let i = 0; i < qaPositions.length - 1; i++) {
    const nextHeading = searchContent.indexOf('<h', qaPositions[i].start);
    if (nextHeading > qaPositions[i].start) {
      qaPositions[i].end = nextHeading;
    }
  }

  for (const qa of qaPositions) {
    const answerHtml = searchContent.substring(qa.start, qa.end).trim();
    const answer = stripTagsToText(answerHtml);
    if (answer) {
      items.push({ question: qa.question, answer: answerHtml });
    }
  }

  if (items.length > 0) return { items, method: faqSectionMatch ? 'heading-match' : 'heading-match' };

  // Pattern 2: Definition lists
  const dlPattern = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  while ((match = dlPattern.exec(searchContent)) !== null) {
    const q = stripTagsToText(match[1]);
    const a = match[2].trim();
    if (q && a) items.push({ question: q, answer: a });
  }

  if (items.length > 0) return { items, method: 'dl-list' };

  // Pattern 3: Bold text as question
  const boldPattern = /<p[^>]*>\s*<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>\s*<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  while ((match = boldPattern.exec(searchContent)) !== null) {
    const q = stripTagsToText(match[1]);
    if (isLikelyQuestion(q)) {
      items.push({ question: q, answer: match[2].trim() });
    }
  }

  if (items.length > 0) return { items, method: 'bold-qa' };

  return { items: [], method: 'none' };
}

/**
 * Check if a section heading indicates FAQ content.
 */
function isFaqHeading(heading: string): boolean {
  return /\b(faq|frequently\s+asked|questions|q\s*&\s*a)\b/i.test(heading);
}

const PRACTICE_SECONDARY_HEADING_PATTERNS = [
  /breadcrumbs?/i,
  /recent\s+posts?/i,
  /latest\s+posts?/i,
  /related\s+posts?/i,
  /popular\s+posts?/i,
  /recent\s+comments?/i,
  /share\s+this/i,
  /follow\s+us/i,
  /social\s+media/i,
  /newsletter/i,
  /subscribe/i,
  /about\s+the\s+author/i,
  /author\s+bio/i,
  /leave\s+a\s+(comment|reply)/i,
  /^comments?$/i,
  /^tags?$/i,
  /^categories$/i,
  /^archives?$/i,
  /related\s+articles?/i,
  /you\s+may\s+also\s+like/i,
  /more\s+from/i,
  /pagination/i,
];

interface EditorialNode {
  html: string;
  text: string;
  tagName: string;
  wordCount: number;
  image?: ImageCandidate;
}

interface PracticeSectionParseResult {
  leadHtml: string;
  preH2ContentLength: number;
  sectionBlocks: SectionBlock[];
  segmentationMethod: SegmentationDebug['method'];
  h2Positions: number[];
  faqItems: FaqItem[];
  faqDetectionMethod: SegmentationDebug['faqDetectionMethod'];
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pushStrayTextNode(nodes: EditorialNode[], htmlFragment: string): void {
  const text = stripTagsToText(htmlFragment);
  if (!text) return;

  nodes.push({
    html: `<p>${escapeHtml(text)}</p>`,
    text,
    tagName: 'p',
    wordCount: countWords(text),
  });
}

function isMeaningfulEditorialNode(node: EditorialNode): boolean {
  if (node.tagName === 'img') {
    return Boolean(node.image?.src);
  }

  if (!node.text) return false;

  if (node.tagName === 'p') {
    const linkCount = (node.html.match(/<a\b/gi) ?? []).length;
    if (linkCount > 0) {
      const linkText = stripTagsToText((node.html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) ?? []).join(' '));
      if (linkText === node.text && countWords(node.text) <= 6) {
        return false;
      }
    }

    return countWords(node.text) >= 2 || /[.!?:;]/.test(node.text);
  }

  if (node.tagName === 'ul' || node.tagName === 'ol') {
    const itemCount = (node.html.match(/<li\b/gi) ?? []).length;
    if (itemCount === 0 || countWords(node.text) < 3) return false;

    const linkText = stripTagsToText((node.html.match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) ?? []).join(' '));
    if ((node.html.match(/<a\b/gi) ?? []).length >= 2 && linkText === node.text) {
      return false;
    }

    return true;
  }

  if (node.tagName === 'table' || node.tagName === 'blockquote') {
    return countWords(node.text) >= 3;
  }

  if (/^h[3-6]$/.test(node.tagName)) {
    return true;
  }

  return countWords(node.text) >= 1;
}

function isPracticeSecondaryHeading(text: string): boolean {
  return PRACTICE_SECONDARY_HEADING_PATTERNS.some((pattern) => pattern.test(text));
}

function stripPracticeSecondarySubSections(html: string): string {
  return html.replace(
    /<h([3-6])[^>]*>([\s\S]*?)<\/h\1>\s*((?:(?:<ul\b[\s\S]*?<\/ul>|<ol\b[\s\S]*?<\/ol>|<div\b[\s\S]*?<\/div>|<section\b[\s\S]*?<\/section>|<article\b[\s\S]*?<\/article>|<p\b[^>]*>\s*(?:<a\b[^>]*>[\s\S]*?<\/a>\s*)+<\/p>)\s*)+)/gi,
    (match, _level, heading) => {
      const headingText = stripTagsToText(heading);
      return isPracticeSecondaryHeading(headingText) ? '' : match;
    }
  );
}

function stripPracticeSecondaryContent(html: string): string {
  if (!html?.trim()) return '';

  let result = html
    .replace(/<form[\s\S]*?<\/form>/gi, '')
    .replace(/<button\b[^>]*>[\s\S]*?<\/button>/gi, '')
    .replace(/<input\b[^>]*>/gi, '')
    .replace(/<select\b[^>]*>[\s\S]*?<\/select>/gi, '')
    .replace(/<textarea\b[^>]*>[\s\S]*?<\/textarea>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '');

  const { leadHtml, sections } = splitOnH2(result);
  const keptParts: string[] = [];
  const cleanedLead = stripPracticeSecondarySubSections(leadHtml).trim();
  if (cleanedLead) keptParts.push(cleanedLead);

  for (const section of sections) {
    if (isPracticeSecondaryHeading(section.heading)) continue;

    const cleanedBody = stripPracticeSecondarySubSections(section.bodyHtml).trim();
    if (!cleanedBody) continue;

    keptParts.push(`<h2>${escapeHtml(section.heading)}</h2>${cleanedBody}`);
  }

  return keptParts.join('').trim();
}

function extractEditorialNodes(html: string): EditorialNode[] {
  if (!html?.trim()) return [];

  const nodes: EditorialNode[] = [];
  const editorialPattern = /<(p|ul|ol|table|blockquote|h[3-6])\b[^>]*>[\s\S]*?<\/\1>|<img\b[^>]*\/?>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = editorialPattern.exec(html)) !== null) {
    pushStrayTextNode(nodes, html.substring(lastIndex, match.index));

    const token = match[0];
    if (/^<img\b/i.test(token)) {
      const image = extractFirstImage(token);
      if (image?.src) {
        nodes.push({
          html: token,
          text: image.alt || '',
          tagName: 'img',
          wordCount: 0,
          image,
        });
      }
    } else {
      const tagName = ((token.match(/^<([a-z0-9]+)/i) ?? [])[1] || '').toLowerCase();
      const text = stripTagsToText(token);
      const node: EditorialNode = {
        html: token.trim(),
        text,
        tagName,
        wordCount: countWords(text),
      };

      if (isMeaningfulEditorialNode(node)) {
        nodes.push(node);
      }
    }

    lastIndex = editorialPattern.lastIndex;
  }

  pushStrayTextNode(nodes, html.substring(lastIndex));

  return nodes.filter(isMeaningfulEditorialNode);
}

function buildPracticeSectionBlockFromNodes(
  nodes: EditorialNode[],
  order: number,
  heading?: string,
  headingLevel?: SectionHeadingLevel
): SectionBlock | null {
  if (nodes.length === 0) return null;

  const bodyParts: string[] = [];
  let firstImage: ImageCandidate | null = null;

  for (const node of nodes) {
    if (node.tagName === 'img') {
      if (!firstImage && node.image?.src) {
        firstImage = node.image;
      }
      continue;
    }

    bodyParts.push(node.html);
  }

  const bodyHtml = bodyParts.join('').trim();
  if (!bodyHtml) return null;

  const block = buildSectionBlock(bodyHtml, order, undefined, heading, headingLevel);
  block.images = firstImage ? [firstImage] : [];

  return block.plainText ? block : null;
}

function findFallbackSplitIndex(nodes: EditorialNode[]): number {
  if (nodes.length < 4) return 0;

  const midpoint = Math.floor(nodes.length / 2);
  for (let i = midpoint; i < nodes.length; i++) {
    if (/^h[3-6]$/.test(nodes[i].tagName)) return i;
  }
  for (let i = midpoint - 1; i > 0; i--) {
    if (/^h[3-6]$/.test(nodes[i].tagName)) return i;
  }

  return Math.ceil(nodes.length / 2);
}

function chunkPracticeNodes(nodes: EditorialNode[]): EditorialNode[][] {
  if (nodes.length === 0) return [];

  const groups: EditorialNode[][] = [];
  let current: EditorialNode[] = [];
  let currentWords = 0;
  let currentContentNodes = 0;

  const flush = () => {
    if (current.length > 0) {
      groups.push(current);
      current = [];
      currentWords = 0;
      currentContentNodes = 0;
    }
  };

  nodes.forEach((node, index) => {
    const isHeading = /^h[3-6]$/.test(node.tagName);
    if (current.length > 0 && isHeading && currentWords >= 40) {
      flush();
    }

    current.push(node);
    if (node.tagName !== 'img') {
      currentWords += node.wordCount;
      currentContentNodes += 1;
    }

    const nextNode = nodes[index + 1];
    const nextIsHeading = nextNode ? /^h[3-6]$/.test(nextNode.tagName) : false;
    if (currentWords >= 140 || (currentContentNodes >= 3 && nextIsHeading)) {
      flush();
    }
  });

  flush();

  if (groups.length === 1) {
    const splitIndex = findFallbackSplitIndex(nodes);
    if (splitIndex > 0 && splitIndex < nodes.length) {
      return [nodes.slice(0, splitIndex), nodes.slice(splitIndex)].filter((group) => group.length > 0);
    }
  }

  return groups;
}

function stripFaqSectionFromHtml(html: string): { html: string; items: FaqItem[]; method: SegmentationDebug['faqDetectionMethod'] } {
  if (!html?.trim()) {
    return { html: '', items: [], method: 'none' };
  }

  const faqSectionPattern = /<h2[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2[^>]*>|$)/gi;
  let resultHtml = html;
  let extractedItems: FaqItem[] = [];
  let detectionMethod: SegmentationDebug['faqDetectionMethod'] = 'none';
  let match: RegExpExecArray | null;

  while ((match = faqSectionPattern.exec(html)) !== null) {
    const heading = stripTagsToText(match[1]);
    if (!isFaqHeading(heading)) continue;

    const fullSectionHtml = match[0];
    const faqResult = extractFaqFromHtml(fullSectionHtml);
    if (faqResult.items.length > 0) {
      extractedItems = faqResult.items;
      detectionMethod = faqResult.method;
      resultHtml = resultHtml.replace(fullSectionHtml, '');
      break;
    }
  }

  if (extractedItems.length === 0) {
    const fallbackFaq = extractFaqFromHtml(html);
    extractedItems = fallbackFaq.items;
    detectionMethod = fallbackFaq.method;
  }

  return {
    html: resultHtml.trim(),
    items: extractedItems,
    method: detectionMethod,
  };
}

function buildPracticeSectionBlocks(body: string): PracticeSectionParseResult {
  const filteredBody = stripPracticeSecondaryContent(body).trim();
  const faqStripped = stripFaqSectionFromHtml(filteredBody || body);
  const editorialHtml = faqStripped.html || filteredBody || body;
  const { leadHtml: rawLeadHtml, sections, h2Positions } = splitOnH2(editorialHtml);
  const preH2ContentLength = rawLeadHtml.length;

  if (sections.length > 0) {
    const sectionBlocks: SectionBlock[] = [];

    sections.forEach((section, index) => {
      const sectionHtml = index === 0
        ? `${rawLeadHtml}${section.bodyHtml}`
        : section.bodyHtml;
      const block = buildPracticeSectionBlockFromNodes(
        extractEditorialNodes(sectionHtml),
        sectionBlocks.length,
        section.heading,
        2
      );
      if (block) {
        sectionBlocks.push(block);
      }
    });

    return {
      leadHtml: '',
      preH2ContentLength,
      sectionBlocks,
      segmentationMethod: 'h2-split',
      h2Positions,
      faqItems: faqStripped.items,
      faqDetectionMethod: faqStripped.method,
    };
  }

  const fallbackGroups = chunkPracticeNodes(extractEditorialNodes(editorialHtml));
  const sectionBlocks = fallbackGroups
    .map((group, index) => buildPracticeSectionBlockFromNodes(group, index))
    .filter((block): block is SectionBlock => Boolean(block));

  return {
    leadHtml: '',
    preH2ContentLength,
    sectionBlocks,
    segmentationMethod: sectionBlocks.length > 1 ? 'paragraph-chunk' : 'single-block',
    h2Positions,
    faqItems: faqStripped.items,
    faqDetectionMethod: faqStripped.method,
  };
}

// ─── Main Builder ────────────────────────────────────────────────────────────

/**
 * Build a template-agnostic NormalizedContent from mapped data.
 *
 * This is the core of Layer 2: it takes the raw mapped fields and produces
 * a structured representation that any template allocator can consume.
 */
export function buildNormalizedContent(
  mappedData: Record<string, string>,
  templateType: TemplateType
): NormalizedContent {
  const sourceUrl = mappedData.slug || '';
  const body = mappedData.body || '';
  const rawMetaTitle = mappedData.meta_title || mappedData.title || '';
  const extractedH1 = extractPrimaryHeading(body);
  const earlyPreservedH1 = normalizeText(mappedData.__body_early_preserved_h1 || '');
  const earlyPreservedH2 = normalizeText(mappedData.__body_early_preserved_h2 || '');
  const earlyPreservedHeading = normalizeText(mappedData.__body_early_preserved_heading || earlyPreservedH1 || earlyPreservedH2 || '');
  const earlyHeroTagline = normalizeText(mappedData.__body_early_hero_tagline || '');
  const earlyHadH1BeforeStrip = mappedData.__body_early_had_h1_before_strip === 'true' || Boolean(earlyPreservedH1);
  const preservedH1 = normalizeText(mappedData.__body_preserved_h1 || '');
  const preservedH2 = normalizeText(mappedData.__body_preserved_h2 || '');
  const preservedHeading = normalizeText(mappedData.__body_preserved_heading || preservedH1 || preservedH2 || '');
  const latePreservedHeading = preservedHeading;
  const latePreservedH1 = preservedH1;
  const latePreservedH2 = preservedH2;
  const hadH1BeforeStrip = mappedData.__body_had_h1_before_strip === 'true' || Boolean(preservedH1);
  const mainContentDroppedEarlyH1 = mappedData.__body_main_content_dropped_early_h1 === 'true';
  const cleanedMetaTitle = cleanMetadataTitle(rawMetaTitle, mappedData.canonical_url || sourceUrl || '');
  let chosenTitle = '';
  let titleSource: TitleSource = 'empty';

  if (earlyPreservedH1) {
    chosenTitle = earlyPreservedH1;
    titleSource = 'early-preserved-h1';
  } else if (earlyPreservedH2) {
    chosenTitle = earlyPreservedH2;
    titleSource = 'early-preserved-h2';
  } else if (cleanedMetaTitle) {
    chosenTitle = cleanedMetaTitle;
    titleSource = 'cleaned-meta-title';
  }

  const h1 = chosenTitle;
  const metaTitle = cleanedMetaTitle || chosenTitle;
  const metaDescription = mappedData.meta_description || '';
  const canonicalUrl = mappedData.canonical_url || '';
  const featuredImage = mappedData.featured_image || '';
  const ogImage = mappedData.og_image || '';
  const schemaType = mappedData.schema_type || (templateType === 'post' ? 'BlogPosting' : 'LegalService');
  const status = mappedData.status || 'draft';
  const explicitHeroTagline = normalizeText(mappedData.hero_tagline || '');
  const heroTagline = explicitHeroTagline || earlyHeroTagline;
  const heroTaglineSource: HeroTaglineSource = explicitHeroTagline
    ? 'mapped-hero-tagline'
    : earlyHeroTagline
      ? 'early-hero-tagline'
      : 'empty';
  const heroDescription = mappedData.hero_description || '';
  const heroImage = mappedData.hero_image || '';
  const heroImageAlt = chosenTitle;
  const mappedExcerpt = normalizeText(mappedData.excerpt || '');
  const excerptSource: ExcerptSource = mappedExcerpt ? 'mapped' : 'empty';
  const publishedAt = normalizeText(mappedData.published_at || '');
  const categoryName = normalizeText(mappedData.category || '');
  const categorySlug = normalizeText(mappedData.category_slug || '');
  const areaSplitSignals = templateType === 'area'
    ? [
        ...(mappedData.__ai_split_mode === 'true' ? ['__ai_split_mode'] : []),
        ...[
          'why_body',
          'closing_body',
          'faq',
          'body_image',
          'body_image_alt',
          'why_image',
          'why_image_alt',
          'closing_image',
          'closing_image_alt',
        ].filter((key) => hasOwnMappedKey(mappedData, key)),
      ]
    : [];
  const hasAiSplitFields = templateType === 'area' && areaSplitSignals.length > 0;

  let sectionBlocks: SectionBlock[] = [];
  let leadHtml = '';
  let preH2ContentLength = 0;
  let segmentationMethod: SegmentationDebug['method'] = 'single-block';
  let h2Positions: number[] = [];
  let faqItems: FaqItem[] = [];
  let faqDetectionMethod: SegmentationDebug['faqDetectionMethod'] = 'none';

  if (hasAiSplitFields && templateType === 'area') {
    // AI-split fields available: use classification hints
    segmentationMethod = 'ai-split';

    if (body.trim()) {
      sectionBlocks.push(buildSectionBlock(body, 0, 'intro'));
    }
    if (mappedData.why_body?.trim()) {
      sectionBlocks.push(buildSectionBlock(mappedData.why_body, 1, 'why'));
    }
    if (mappedData.closing_body?.trim()) {
      sectionBlocks.push(buildSectionBlock(mappedData.closing_body, 2, 'closing'));
    }

    // FAQ from AI-split JSON
    if (mappedData.faq) {
      try {
        const parsed = JSON.parse(mappedData.faq);
        if (Array.isArray(parsed) && parsed.length > 0) {
          faqItems = parsed;
          faqDetectionMethod = 'heading-match';
        }
      } catch {
        // ignore invalid FAQ JSON
      }
    }
  } else if (templateType === 'practice') {
    const practiceParseResult = buildPracticeSectionBlocks(body);
    leadHtml = practiceParseResult.leadHtml;
    preH2ContentLength = practiceParseResult.preH2ContentLength;
    sectionBlocks = practiceParseResult.sectionBlocks;
    segmentationMethod = practiceParseResult.segmentationMethod;
    h2Positions = practiceParseResult.h2Positions;
    faqItems = practiceParseResult.faqItems;
    faqDetectionMethod = practiceParseResult.faqDetectionMethod;
  } else {
    // No AI split — split on H2 headings
    const { leadHtml: lead, sections, h2Positions: positions } = splitOnH2(body);
    leadHtml = lead;
    preH2ContentLength = lead.length;
    h2Positions = positions;

    if (sections.length === 0) {
      // No H2s — single block with all content
      segmentationMethod = 'single-block';
      if (body.trim()) {
        sectionBlocks.push(buildSectionBlock(body, 0));
      }
    } else {
      segmentationMethod = 'h2-split';

      // Build section blocks from H2 sections (excluding FAQ sections)
      let order = 0;
      for (const section of sections) {
        if (isFaqHeading(section.heading)) {
          // Extract FAQ from this section
          const faqResult = extractFaqFromHtml(
            `<h2>${section.heading}</h2>${section.bodyHtml}`
          );
          if (faqResult.items.length > 0) {
            faqItems = faqResult.items;
            faqDetectionMethod = faqResult.method;
          }
          continue; // Don't add FAQ section as a content block
        }
        sectionBlocks.push(buildSectionBlock(section.bodyHtml, order, undefined, section.heading, 2));
        order++;
      }
    }

    // If no FAQ found from heading-based sections, try extracting from full body
    if (faqItems.length === 0 && body) {
      const faqResult = extractFaqFromHtml(body);
      if (faqResult.items.length > 0) {
        faqItems = faqResult.items;
        faqDetectionMethod = faqResult.method;
      }
    }
  }

  // Extract all images from all content
  const allHtml = [body, mappedData.why_body, mappedData.closing_body].filter(Boolean).join('\n');
  const allImages = extractImages(allHtml);

  // Featured image candidates: explicit featured image first, then hero image, og:image, then the first body image.
  const featuredImageCandidates: ImageCandidate[] = [];
  const pushFeaturedCandidate = (candidate: ImageCandidate | null) => {
    if (!candidate?.src) return;
    if (featuredImageCandidates.some((existing) => existing.src === candidate.src)) return;
    featuredImageCandidates.push(candidate);
  };

  pushFeaturedCandidate(featuredImage ? { src: featuredImage, alt: heroImageAlt } : null);
  pushFeaturedCandidate(heroImage ? { src: heroImage, alt: heroImageAlt } : null);
  pushFeaturedCandidate(ogImage ? { src: ogImage, alt: heroImageAlt } : null);
  const leadImg = extractFirstImage(leadHtml || body);
  pushFeaturedCandidate(leadImg);

  const leadText = stripTagsToText(leadHtml);
  const totalWordCount = sectionBlocks.reduce((sum, block) => sum + block.wordCount, 0) + countWords(leadText);

  return {
    sourceUrl,
    h1,
    metaTitle,
    rawMetaTitle,
    cleanedMetaTitle,
    extractedH1,
    earlyPreservedHeading,
    earlyPreservedH1,
    earlyPreservedH2,
    earlyHeroTagline,
    earlyHadH1BeforeStrip,
    preservedHeading,
    preservedH1,
    preservedH2,
    latePreservedHeading,
    latePreservedH1,
    latePreservedH2,
    hadH1BeforeStrip,
    mainContentDroppedEarlyH1,
    titleSource,
    chosenTitle,
    metaDescription,
    canonicalUrl,
    ogImage,
    schemaType,
    status,
    heroTagline,
    heroTaglineSource,
    heroDescription,
    featuredImage,
    heroImage,
    heroImageAlt,
    excerpt: mappedExcerpt,
    excerptSource,
    publishedAt,
    categoryName,
    categorySlug,
    leadHtml,
    leadText,
    sectionBlocks,
    faqItems,
    images: allImages,
    featuredImageCandidates,
    stats: {
      totalWordCount,
      sectionBlockCount: sectionBlocks.length,
      faqItemCount: faqItems.length,
      imageCount: allImages.length,
      h2Count: h2Positions.length,
    },
    segmentation: {
      method: segmentationMethod,
      h2Positions,
      faqDetectionMethod,
      preH2ContentLength,
      totalInputLength: body.length,
      areaSplitSignals,
    },
  };
}

// ─── Section Block Builder ───────────────────────────────────────────────────

function buildSectionBlock(
  bodyHtml: string,
  order: number,
  classification?: SectionBlock['classification'],
  heading?: string,
  headingLevel?: SectionHeadingLevel
): SectionBlock {
  const normalizedBodyHtml = bodyHtml.trim();
  const extractedOpeningHeading = heading
    ? null
    : extractLeadingSectionHeading(normalizedBodyHtml);
  const resolvedHeading = heading || extractedOpeningHeading?.text || '';
  const resolvedHeadingLevel = headingLevel || extractedOpeningHeading?.level;
  const resolvedBodyHtml = extractedOpeningHeading?.remainingHtml ?? normalizedBodyHtml;
  const plainText = stripTagsToText(resolvedBodyHtml);
  const images = extractImages(resolvedBodyHtml);

  return {
    heading: resolvedHeading,
    headingLevel: resolvedHeadingLevel,
    headingTag: resolvedHeading && resolvedHeadingLevel
      ? `<h${resolvedHeadingLevel}>${resolvedHeading}</h${resolvedHeadingLevel}>`
      : '',
    bodyHtml: resolvedBodyHtml,
    plainText,
    images,
    order,
    wordCount: countWords(plainText),
    classification,
  };
}

function extractLeadingSectionHeading(html: string): { text: string; level: SectionHeadingLevel; remainingHtml: string } | null {
  if (!html) return null;

  const match = html.match(/^\s*(?:<p[^>]*>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>\s*)*(<h([2-4])[^>]*>([\s\S]*?)<\/h\2>)([\s\S]*)$/i);
  if (!match) return null;

  const text = stripTagsToText(match[3]);
  if (!text) return null;

  return {
    text,
    level: Number(match[2]) as SectionHeadingLevel,
    remainingHtml: match[4].trim(),
  };
}
