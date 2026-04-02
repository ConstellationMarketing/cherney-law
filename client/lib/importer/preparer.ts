// Preparer — Stage 8 of the pipeline
// Split body on H2, extract FAQ, generate slug, build CMS record shape

import type { ContentSection, FaqItem, MappedRecord, PreparedRecord, TemplateType } from './types';
import { defaultAreaPageContent } from '../cms/areaPageTypes';

/**
 * Prepare mapped records for import.
 * Splits body content on H2 headings, extracts FAQ items,
 * generates slugs, and builds the final CMS record shape.
 */
export function prepareRecords(
  records: MappedRecord[],
  templateType: TemplateType
): PreparedRecord[] {
  return records.map((record) => prepareRecord(record, templateType));
}

/**
 * Prepare a single mapped record for import.
 */
export function prepareRecord(
  record: MappedRecord,
  templateType: TemplateType
): PreparedRecord {
  const { mappedData } = record;

  // Generate slug
  const slug = normalizeUrlSlug(
    mappedData.slug || mappedData.title || '',
    mappedData.title || '',
    templateType
  );

  // Split body on H2
  const body = mappedData.body || '';
  const contentSections = splitBodyOnH2(body);

  // Extract FAQ items
  const faqItems = extractFaqItems(body, contentSections);

  // Build CMS record shape
  let data: Record<string, unknown>;
  if (templateType === 'practice') {
    data = buildPracticeRecord(mappedData, contentSections, faqItems, slug);
  } else if (templateType === 'area') {
    data = buildAreaRecord(mappedData, faqItems, slug);
  } else {
    data = buildPostRecord(mappedData, slug);
  }

  // Build full-path slug for display and logging (includes template prefix + trailing slash)
  let fullSlug: string;
  if (templateType === 'area') {
    fullSlug = `/areas-we-serve/${slug}/`;
  } else if (templateType === 'practice') {
    fullSlug = `/practice-areas/${slug}/`;
  } else {
    // posts: slug already has trailing slash, just prepend /
    fullSlug = slug.endsWith('/') ? `/${slug}` : `/${slug}/`;
  }

  return {
    rowIndex: record.rowIndex,
    slug: fullSlug,
    data,
    contentSections,
    faqItems,
    sourceData: record.sourceData,
  };
}

// ─── Slug Normalization ──────────────────────────────────────────────────────

/**
 * Normalize a URL slug from various input formats.
 * Rule 9: Handles full URLs, multi-segment paths, bare slugs.
 */
export function normalizeUrlSlug(
  rawSlug: string,
  title: string,
  templateType: TemplateType
): string {
  if (!rawSlug && !title) return '';

  let slug = rawSlug.trim();

  if (slug) {
    // 1. Extract pathname from full URLs
    try {
      if (/^https?:\/\//i.test(slug)) {
        const url = new URL(slug);
        slug = url.pathname;
      }
    } catch {
      // Not a valid URL, continue
    }

    // 2. Extract slug after /practice-areas/ or /areas-we-serve/ if present
    const practiceMatch = slug.match(/\/practice-areas\/([^/]+)/);
    const areaMatch = slug.match(/\/areas-we-serve\/([^/]+)/);
    if (practiceMatch) {
      slug = practiceMatch[1];
    } else if (areaMatch) {
      slug = areaMatch[1];
    } else {
      // 3. Take last segment from multi-segment paths
      const segments = slug.split('/').filter(Boolean);
      if (segments.length > 0) {
        slug = segments[segments.length - 1];
      }
    }

    // Clean up the slug
    slug = slugify(slug);
  }

  // 4. Fall back to slugify(title)
  if (!slug && title) {
    slug = slugify(title);
  }

  // Ensure slug format: for posts add trailing slash; for practice/area no trailing slash
  if (templateType === 'post') {
    slug = slug.replace(/\/$/, '') + '/';
  } else {
    slug = slug.replace(/\/$/, '');
  }

  return slug;
}

/**
 * Convert a string to a URL-safe slug.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '')    // Remove non-alphanumeric
    .replace(/[\s_]+/g, '-')          // Spaces/underscores to hyphens
    .replace(/-{2,}/g, '-')           // Collapse multiple hyphens
    .replace(/^-|-$/g, '');           // Trim leading/trailing hyphens
}

// ─── H2 Splitting ────────────────────────────────────────────────────────────

/**
 * Split body HTML into sections delimited by H2 headings.
 */
export function splitBodyOnH2(html: string): ContentSection[] {
  if (!html?.trim()) return [];

  const sections: ContentSection[] = [];
  const h2Pattern = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let match;
  let lastIdx = 0;
  const splits: { heading: string; headingTag: string; bodyStart: number }[] = [];

  // Find all H2 positions
  while ((match = h2Pattern.exec(html)) !== null) {
    splits.push({
      heading: match[1].replace(/<[^>]*>/g, '').trim(),
      headingTag: match[0],
      bodyStart: match.index + match[0].length,
    });
  }

  if (splits.length === 0) {
    // No H2s — return entire content as a single section
    return [{ heading: '', body: html.trim(), headingTag: '' }];
  }

  // Content before first H2
  const preContent = html.substring(0, splits[0].bodyStart - splits[0].headingTag.length).trim();
  if (preContent) {
    sections.push({ heading: '', body: preContent, headingTag: '' });
  }

  // Create sections between H2s
  for (let i = 0; i < splits.length; i++) {
    const start = splits[i].bodyStart;
    const end = i + 1 < splits.length
      ? splits[i + 1].bodyStart - splits[i + 1].headingTag.length
      : html.length;

    const body = html.substring(start, end).trim();

    sections.push({
      heading: splits[i].heading,
      body,
      headingTag: splits[i].headingTag,
    });
  }

  return sections;
}

// ─── FAQ Extraction ──────────────────────────────────────────────────────────

/**
 * Extract FAQ items from content (alias used by buildAreaRecord).
 */
function extractFaqFromHtml(body: string, sections: ContentSection[]): FaqItem[] {
  return extractFaqItems(body, sections);
}

/**
 * Extract FAQ items from content.
 * Looks for Q&A patterns: H3/H4 headings followed by paragraphs,
 * or definition lists, or structured FAQ blocks.
 */
function extractFaqItems(
  body: string,
  sections: ContentSection[]
): FaqItem[] {
  const items: FaqItem[] = [];

  // Look for a section with "FAQ" or "Questions" in the heading
  const faqSection = sections.find((s) =>
    /\b(faq|frequently\s+asked|questions|q\s*&\s*a)\b/i.test(s.heading)
  );

  const content = faqSection?.body || body;

  // Pattern 1: H3/H4 headings as questions, following content as answers
  const headingPattern = /<h[3-4][^>]*>([\s\S]*?)<\/h[3-4]>/gi;
  let match;
  const qaPositions: { question: string; start: number; end: number }[] = [];

  while ((match = headingPattern.exec(content)) !== null) {
    const question = match[1].replace(/<[^>]*>/g, '').trim();
    // Check if it looks like a question
    if (isLikelyQuestion(question)) {
      qaPositions.push({
        question,
        start: match.index + match[0].length,
        end: content.length,
      });
    }
  }

  // Set end positions
  for (let i = 0; i < qaPositions.length - 1; i++) {
    // Find next heading position
    const nextHeading = content.indexOf('<h', qaPositions[i].start);
    if (nextHeading > qaPositions[i].start) {
      qaPositions[i].end = nextHeading;
    }
  }

  for (const qa of qaPositions) {
    const answerHtml = content.substring(qa.start, qa.end).trim();
    const answer = answerHtml.replace(/<[^>]*>/g, '').trim();
    if (answer) {
      items.push({ question: qa.question, answer: answerHtml });
    }
  }

  // Pattern 2: Definition lists (<dl>)
  if (items.length === 0) {
    const dlPattern = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
    while ((match = dlPattern.exec(content)) !== null) {
      const q = match[1].replace(/<[^>]*>/g, '').trim();
      const a = match[2].trim();
      if (q && a) items.push({ question: q, answer: a });
    }
  }

  // Pattern 3: Strong/bold text as question, following text as answer
  if (items.length === 0) {
    const boldPattern = /<p[^>]*>\s*<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>\s*<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
    while ((match = boldPattern.exec(content)) !== null) {
      const q = match[1].replace(/<[^>]*>/g, '').trim();
      if (isLikelyQuestion(q)) {
        items.push({ question: q, answer: match[2].trim() });
      }
    }
  }

  return items;
}

/**
 * Check if text looks like a question.
 */
function isLikelyQuestion(text: string): boolean {
  if (text.endsWith('?')) return true;
  const questionWords = /^(what|how|why|when|where|who|which|can|do|does|is|are|will|should|could|would)\b/i;
  return questionWords.test(text);
}

// ─── CMS Record Building ────────────────────────────────────────────────────

/**
 * Build a practice area detail page record for the CMS.
 */
function buildPracticeRecord(
  data: Record<string, string>,
  sections: ContentSection[],
  faqItems: FaqItem[],
  slug: string
): Record<string, unknown> {
  // Build content sections array
  const contentSections = sections
    .filter((s) => s.body.trim())
    .map((s, i) => ({
      body: s.body,
      image: '',
      imageAlt: '',
      imagePosition: i % 2 === 0 ? 'right' : 'left' as const,
      showCTAs: true,
    }));

  // Build the page content structure matching PracticeAreaDetailPageContent
  const content = {
    hero: {
      sectionLabel: '',
      tagline: data.hero_tagline || data.title || '',
      description: data.hero_description || '',
      backgroundImage: data.hero_image || '',
      backgroundImageAlt: data.title || '',
    },
    socialProof: {
      mode: 'none' as const,
      testimonials: [],
      awards: { logos: [] },
    },
    contentSections: contentSections.length > 0
      ? contentSections
      : [{ body: data.body || '', image: '', imageAlt: '', imagePosition: 'right' as const, showCTAs: true }],
    faq: {
      enabled: faqItems.length > 0,
      heading: 'Frequently Asked Questions',
      description: '',
      items: faqItems,
    },
    headingTags: {},
  };

  return {
    title: data.title || '',
    url_path: `/practice-areas/${slug}`,
    page_type: 'practice_detail',
    content,
    meta_title: data.meta_title || data.title || '',
    meta_description: data.meta_description || '',
    canonical_url: data.canonical_url || null,
    og_title: data.meta_title || data.title || null,
    og_description: data.meta_description || null,
    og_image: data.og_image || data.hero_image || null,
    noindex: false,
    schema_type: data.schema_type || 'LegalService',
    schema_data: null,
    status: data.status === 'published' ? 'published' : 'draft',
  };
}

/**
 * Extract plain text of first H2 from an HTML string.
 * Returns empty string if no H2 found.
 */
function extractFirstH2Text(html: string): string {
  if (!html) return '';
  const match = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (!match) return '';
  return match[1].replace(/<[^>]+>/g, '').trim();
}

/**
 * Extract first image src + alt from HTML, returning {src, alt}.
 */
function extractFirstImage(html: string): { src: string; alt: string } {
  if (!html) return { src: '', alt: '' };
  const match = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*(alt=["']([^"']*)["'])?/i)
    ?? html.match(/<img[^>]+(alt=["']([^"']*)["'])[^>]*src=["']([^"']+)["']/i);
  if (!match) return { src: '', alt: '' };
  // Group positions differ by pattern variant — handle both
  const src = match[1] || match[3] || '';
  const alt = match[3] || match[2] || '';
  return { src, alt };
}

/**
 * Build an Areas We Serve page record for the CMS.
 */
function buildAreaRecord(
  data: Record<string, string>,
  faqItems: FaqItem[],
  slug: string
): Record<string, unknown> {
  const defaults = defaultAreaPageContent;

  // FAQ resolution: always try data.faq JSON first (highest fidelity, set by AI split)
  let resolvedFaqItems: FaqItem[] = [];

  // 1. AI-split FAQ JSON (most reliable — comes from ai-split-area-content endpoint)
  if (data.faq) {
    try {
      const parsed = JSON.parse(data.faq);
      if (Array.isArray(parsed) && parsed.length > 0) {
        resolvedFaqItems = parsed;
      }
    } catch { /* ignore */ }
  }

  // 2. Fall back to FAQ extracted by preparer from intro body scan
  if (resolvedFaqItems.length === 0 && faqItems.length > 0) {
    resolvedFaqItems = faqItems;
  }

  // 3. Last resort: scan all section bodies together
  if (resolvedFaqItems.length === 0) {
    const allBody = [data.body, data.why_body, data.closing_body].filter(Boolean).join('\n');
    if (allBody) {
      const sections = splitBodyOnH2(allBody);
      resolvedFaqItems = extractFaqFromHtml(allBody, sections);
    }
  }

  // Extract first H2 from each section for its heading
  const introHeading = extractFirstH2Text(data.body) || defaults.introSection.heading;
  const whyHeading = extractFirstH2Text(data.why_body) || defaults.whySection.heading;
  const closingHeading = extractFirstH2Text(data.closing_body) || defaults.closingSection.heading;

  // Extract section images — prefer explicitly passed fields, then first <img> in body.
  // Deduplicate: once a URL is used in a section it won't be reused in later sections.
  const usedImageUrls = new Set<string>();

  function pickSectionImage(
    explicitSrc: string | undefined,
    explicitAlt: string | undefined,
    bodyHtml: string | undefined,
  ): { src: string; alt: string } {
    // Try explicit field first
    if (explicitSrc && !usedImageUrls.has(explicitSrc)) {
      usedImageUrls.add(explicitSrc);
      return { src: explicitSrc, alt: explicitAlt || '' };
    }
    // Fall back to first image found in body HTML
    const found = extractFirstImage(bodyHtml ?? '');
    if (found.src && !usedImageUrls.has(found.src)) {
      usedImageUrls.add(found.src);
      return found;
    }
    return { src: '', alt: '' };
  }

  const introImg = pickSectionImage(data.body_image, data.body_image_alt, data.body);
  const whyImg = pickSectionImage(data.why_image, data.why_image_alt, data.why_body);
  const closingImg = pickSectionImage(data.closing_image, data.closing_image_alt, data.closing_body);

  // Build why/closing sections without placeholders when content is empty
  const whySectionContent = data.why_body
    ? { heading: whyHeading, headingLevel: defaults.whySection.headingLevel, body: data.why_body, image: whyImg.src, imageAlt: whyImg.alt }
    : { heading: '', headingLevel: defaults.whySection.headingLevel, body: '', image: '', imageAlt: '' };

  const closingSectionContent = data.closing_body
    ? { heading: closingHeading, headingLevel: defaults.closingSection.headingLevel, body: data.closing_body, image: closingImg.src, imageAlt: closingImg.alt }
    : { heading: '', headingLevel: defaults.closingSection.headingLevel, body: '', image: '', imageAlt: '' };

  const content = {
    hero: {
      ...defaults.hero,
      sectionLabel: data.title ? `\u2013 ${data.title}` : defaults.hero.sectionLabel,
      tagline: data.hero_tagline || defaults.hero.tagline,
    },
    introSection: {
      ...defaults.introSection,
      heading: introHeading,
      body: data.body || defaults.introSection.body,
      image: introImg.src,
      imageAlt: introImg.alt,
    },
    whySection: whySectionContent,
    closingSection: closingSectionContent,
    faq: {
      enabled: resolvedFaqItems.length > 0,
      heading: 'Frequently Asked Questions',
      items: resolvedFaqItems,
    },
    cta: defaults.cta,
    locationsSection: defaults.locationsSection,
    mapSection: defaults.mapSection,
  };

  return {
    title: data.title || '',
    url_path: `/areas-we-serve/${slug}/`,
    page_type: 'area',
    content,
    meta_title: data.meta_title || data.title || '',
    meta_description: data.meta_description || '',
    canonical_url: data.canonical_url || null,
    og_title: data.meta_title || data.title || null,
    og_description: data.meta_description || null,
    og_image: data.og_image || null,
    noindex: false,
    schema_type: 'LegalService',
    schema_data: null,
    status: data.status === 'published' ? 'published' : 'draft',
  };
}

/**
 * Build a blog post record for the CMS.
 */
function buildPostRecord(
  data: Record<string, string>,
  slug: string
): Record<string, unknown> {
  return {
    title: data.title || '',
    slug: slug.endsWith('/') ? slug : slug + '/',
    body: data.body || null,
    excerpt: data.excerpt || null,
    featured_image: data.featured_image || null,
    category_name: data.category || null,
    meta_title: data.meta_title || data.title || null,
    meta_description: data.meta_description || null,
    canonical_url: data.canonical_url || null,
    og_title: data.meta_title || data.title || null,
    og_description: data.meta_description || null,
    og_image: data.og_image || data.featured_image || null,
    noindex: false,
    status: data.status === 'published' ? 'published' : 'draft',
    published_at: data.published_at || null,
  };
}
