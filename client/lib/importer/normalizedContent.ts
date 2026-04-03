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

export interface NormalizedContent {
  sourceUrl: string;
  h1: string;
  metaTitle: string;
  rawMetaTitle: string;
  cleanedMetaTitle: string;
  extractedH1: string;
  chosenTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImage: string;
  schemaType: string;
  status: string;
  heroTagline: string;
  heroDescription: string;
  heroImage: string;
  heroImageAlt: string;
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

export interface SectionBlock {
  heading: string;
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
  method: 'ai-split' | 'h2-split' | 'single-block';
  h2Positions: number[];
  faqDetectionMethod: 'heading-match' | 'bold-qa' | 'dl-list' | 'none';
  preH2ContentLength: number;
  totalInputLength: number;
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
  const cleanedMetaTitle = cleanMetadataTitle(rawMetaTitle, mappedData.canonical_url || sourceUrl || '');
  const chosenTitle = extractedH1 || cleanedMetaTitle || '';
  const h1 = chosenTitle;
  const metaTitle = cleanedMetaTitle || chosenTitle;
  const metaDescription = mappedData.meta_description || '';
  const canonicalUrl = mappedData.canonical_url || '';
  const ogImage = mappedData.og_image || '';
  const schemaType = mappedData.schema_type || (templateType === 'post' ? 'BlogPosting' : 'LegalService');
  const status = mappedData.status || 'draft';
  const heroTagline = mappedData.hero_tagline || '';
  const heroDescription = mappedData.hero_description || '';
  const heroImage = mappedData.hero_image || '';
  const heroImageAlt = chosenTitle;
  const hasAiSplitFields = !!(mappedData.why_body || mappedData.closing_body);

  let sectionBlocks: SectionBlock[] = [];
  let leadHtml = '';
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
  } else {
    // No AI split — split on H2 headings
    const { leadHtml: lead, sections, h2Positions: positions } = splitOnH2(body);
    leadHtml = lead;
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
        sectionBlocks.push(buildSectionBlock(section.bodyHtml, order, undefined, section.heading));
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

  // Featured image candidates: og:image, hero_image, first image from lead content
  const featuredImageCandidates: ImageCandidate[] = [];
  if (ogImage) featuredImageCandidates.push({ src: ogImage, alt: heroImageAlt });
  if (heroImage) featuredImageCandidates.push({ src: heroImage, alt: heroImageAlt });
  const leadImg = extractFirstImage(leadHtml || body);
  if (leadImg) featuredImageCandidates.push(leadImg);

  const leadText = stripTagsToText(leadHtml);
  const totalWordCount = sectionBlocks.reduce((sum, block) => sum + block.wordCount, 0) + countWords(leadText);

  return {
    sourceUrl,
    h1,
    metaTitle,
    rawMetaTitle,
    cleanedMetaTitle,
    extractedH1,
    chosenTitle,
    metaDescription,
    canonicalUrl,
    ogImage,
    schemaType,
    status,
    heroTagline,
    heroDescription,
    heroImage,
    heroImageAlt,
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
      preH2ContentLength: leadHtml.length,
      totalInputLength: body.length,
    },
  };
}

// ─── Section Block Builder ───────────────────────────────────────────────────

function buildSectionBlock(
  bodyHtml: string,
  order: number,
  classification?: SectionBlock['classification'],
  heading?: string
): SectionBlock {
  // Extract heading from body if not provided
  const resolvedHeading = heading || extractFirstH2Text(bodyHtml) || '';
  const plainText = stripTagsToText(bodyHtml);
  const images = extractImages(bodyHtml);

  return {
    heading: resolvedHeading,
    bodyHtml,
    plainText,
    images,
    order,
    wordCount: countWords(plainText),
    classification,
  };
}

function extractFirstH2Text(html: string): string {
  if (!html) return '';
  const match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (!match) return '';
  return stripTagsToText(match[1]);
}
