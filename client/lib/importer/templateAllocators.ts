// Template Allocators — Layer 3 of the import pipeline
// Template-specific allocation of NormalizedContent into CMS record shapes.

import type { NormalizedContent, SectionBlock, ImageCandidate, SectionHeadingLevel } from './normalizedContent';
import type { TemplateType } from './types';
import { normalizeHtml } from './htmlNormalizer';
import { defaultFilterOptions } from './types';

// ─── Dispatch ────────────────────────────────────────────────────────────────

/**
 * Allocate normalized content into a template-specific CMS record.
 */
export function allocateForTemplate(
  normalized: NormalizedContent,
  templateType: TemplateType,
  slug: string,
  resolvedPath?: string
): Record<string, unknown> {
  switch (templateType) {
    case 'area':
      return allocateForAreaPage(normalized, slug, resolvedPath);
    case 'practice':
      return allocateForPracticePage(normalized, slug, resolvedPath);
    case 'post':
      return allocateForBlogPost(normalized, slug);
    default:
      return allocateForBlogPost(normalized, slug);
  }
}

function truncateExcerpt(text: string, maxLength = 160): string | null {
  if (!text) return null;
  return text.length <= maxLength ? text : text.substring(0, maxLength).trimEnd();
}

function pickPrimaryCategoryValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const arrayMatch = trimmed.match(/^\[(.*)\]$/s);
  if (arrayMatch) {
    const inner = arrayMatch[1].trim();
    if (!inner) return null;
    const firstQuoted = inner.match(/^"([^"]+)"|^'([^']+)'/);
    if (firstQuoted) return (firstQuoted[1] || firstQuoted[2] || '').trim() || null;
  }

  const [firstValue] = trimmed.split(/\s*,\s*|\s*\|\s*|\s*;\s*/);
  return firstValue?.trim() || null;
}

// ─── Blog Post Allocator ─────────────────────────────────────────────────────

/**
 * Blog posts: all content including FAQ stays in a single body field.
 * No separate FAQ component — FAQ stays as part of body HTML.
 * faqItems in NormalizedContent is populated for debug/stats but NOT stripped from body.
 */
function allocateForBlogPost(
  normalized: NormalizedContent,
  slug: string
): Record<string, unknown> {
  const pageTitle = normalized.chosenTitle || normalized.h1 || '';
  const seoTitle = normalized.cleanedMetaTitle || pageTitle || null;

  // Reconstruct full body: lead + all section blocks in order
  let body = '';
  if (normalized.leadHtml) {
    body += normalized.leadHtml;
  }
  for (const block of normalized.sectionBlocks) {
    body += renderSectionBlockHtml(block);
  }
  body = body.trim() || null;

  const generatedExcerptSource = normalized.leadText || (normalized.sectionBlocks[0]?.plainText ?? '');
  const generatedExcerpt = truncateExcerpt(generatedExcerptSource);
  const excerpt = normalized.excerpt || generatedExcerpt;
  const excerptSource = normalized.excerpt
    ? 'mapped'
    : generatedExcerpt
      ? 'generated'
      : 'empty';

  // Featured image
  const featuredImage = normalized.featuredImage || normalized.featuredImageCandidates[0]?.src || null;
  const categoryName = pickPrimaryCategoryValue(normalized.categoryName);
  const categorySlug = pickPrimaryCategoryValue(normalized.categorySlug);
  const publishedAt = normalized.publishedAt || null;

  const fullSlug = slug.endsWith('/') ? slug : slug + '/';

  return {
    title: pageTitle,
    slug: fullSlug,
    body,
    excerpt,
    excerpt_source: excerptSource,
    featured_image: featuredImage,
    category_name: categoryName,
    category_slug: categorySlug,
    meta_title: seoTitle,
    meta_description: normalized.metaDescription || null,
    canonical_url: normalized.canonicalUrl || null,
    og_title: seoTitle,
    og_description: normalized.metaDescription || null,
    og_image: normalized.ogImage || featuredImage || null,
    noindex: false,
    status: normalized.status === 'published' ? 'published' : 'draft',
    published_at: publishedAt,
  };
}

// ─── Area Page Allocator ─────────────────────────────────────────────────────

/**
 * Areas We Serve: distribute content into intro/why/closing sections.
 *
 * Deterministic allocation rules:
 * - Build intro from the raw ordered non-FAQ blocks with no pre-filtering.
 * - If pre-H2 content exists, intro uses leadHtml + the first non-FAQ block.
 * - If no pre-H2 content exists, intro must take the first non-FAQ block.
 * - If that first block is shorter than 30 words and another block exists,
 *   merge the next block into intro after selecting the first block.
 * - Remaining non-FAQ blocks are distributed without duplication:
 *   - 0 remaining → why/closing empty
 *   - 1 remaining → closing only
 *   - 2+ remaining → why gets middle blocks, closing gets last block
 * - FAQ remains only in faqSection.
 */
function allocateForAreaPage(
  normalized: NormalizedContent,
  slug: string,
  resolvedPath?: string
): Record<string, unknown> {
  const pageTitle = normalized.chosenTitle || normalized.h1 || '';
  const seoTitle = normalized.cleanedMetaTitle || pageTitle || '';
  const blocks = normalized.sectionBlocks;
  const leadHtml = normalized.leadHtml.trim();
  const rawOrderedNonFaqBlockIndexes = blocks.map((_, index) => index);
  const allocationLog = {
    intro: [] as number[],
    why: [] as number[],
    closing: [] as number[],
  };

  let introBody = '';
  let introHeading = '';
  let introImages: ImageCandidate[] = [];
  let introHeadingLevel: SectionHeadingLevel = 2;
  let whyBody = '';
  let whyHeading = '';
  let whyImages: ImageCandidate[] = [];
  let whyHeadingLevel: SectionHeadingLevel = 2;
  let closingBody = '';
  let closingHeading = '';
  let closingImages: ImageCandidate[] = [];
  let closingHeadingLevel: SectionHeadingLevel = 2;

  let introSource: 'preH2' | 'firstBlockFallback' | 'empty' = 'empty';
  let fallbackRan = false;
  let fallbackReason = 'Did not run: no non-FAQ section blocks available';
  const introBlocks: SectionBlock[] = [];

  const firstBlock = blocks[0];
  if (firstBlock) {
    introBlocks.push(firstBlock);
    allocationLog.intro.push(0);

    if (leadHtml) {
      introSource = 'preH2';
      fallbackReason = 'Skipped: pre-H2 content was present, so intro used leadHtml plus the first non-FAQ block';
    } else {
      introSource = 'firstBlockFallback';
      fallbackRan = true;
      fallbackReason = 'Ran: no pre-H2 content, so intro was seeded from the first non-FAQ block';
    }
  } else if (leadHtml) {
    introSource = 'preH2';
    fallbackReason = 'Skipped: pre-H2 content was present and no non-FAQ section blocks were available';
  }

  if (introBlocks[0] && introBlocks[0].wordCount < 30 && blocks[introBlocks.length]) {
    const nextIndex = introBlocks.length;
    introBlocks.push(blocks[nextIndex]);
    allocationLog.intro.push(nextIndex);
    fallbackReason += '; merged the next ordered block because the first block was under 30 words';
  }

  if (leadHtml || introBlocks.length > 0) {
    introBody = joinBlockBodies(introBlocks, leadHtml);
    introHeading = pickSectionHeading(introBlocks);
    introHeadingLevel = pickSectionHeadingLevel(introBlocks);
    introImages = [
      ...(leadHtml ? extractImagesFromHtml(leadHtml) : []),
      ...collectImages(introBlocks),
    ];
  }

  introBody = sanitizeFragmentHtml(introBody, normalized);
  if (!introBody && firstBlock) {
    const hardFallbackBody = sanitizeFragmentHtml(joinBlockBodies([firstBlock], leadHtml), normalized)
      || sanitizeFragmentHtml(joinBlockBodies([firstBlock]), normalized)
      || sanitizeFragmentHtml(firstBlock.bodyHtml, normalized);

    if (hardFallbackBody) {
      introBody = hardFallbackBody;
      if (!introHeading) {
        introHeading = pickSectionHeading([firstBlock]);
        introHeadingLevel = pickSectionHeadingLevel([firstBlock]);
      }
      introImages = introImages.length > 0 ? introImages : collectImages([firstBlock]);
      introSource = leadHtml ? 'preH2' : 'firstBlockFallback';
      fallbackRan = true;
      fallbackReason = 'Hard invariant applied: intro was empty after sanitization, so the first non-FAQ block was forced into intro';
      if (allocationLog.intro.length === 0) {
        allocationLog.intro.push(0);
      }
    }
  }

  const remainingBlocks = blocks.slice(introBlocks.length);
  const remainingStartIndex = introBlocks.length;

  if (remainingBlocks.length === 1) {
    const closingIndex = remainingStartIndex;
    const block = remainingBlocks[0];
    allocationLog.closing.push(closingIndex);
    closingBody = sanitizeFragmentHtml(block.bodyHtml, normalized);
    closingHeading = pickSectionHeading([block]);
    closingHeadingLevel = pickSectionHeadingLevel([block]);
    closingImages = block.images;
  } else if (remainingBlocks.length >= 2) {
    const middleBlocks = remainingBlocks.slice(0, -1);
    const closingBlock = remainingBlocks[remainingBlocks.length - 1];

    allocationLog.why.push(...middleBlocks.map((_, index) => remainingStartIndex + index));
    allocationLog.closing.push(remainingStartIndex + remainingBlocks.length - 1);

    whyBody = sanitizeFragmentHtml(joinBlockBodies(middleBlocks), normalized);
    whyHeading = pickSectionHeading(middleBlocks);
    whyHeadingLevel = pickSectionHeadingLevel(middleBlocks);
    whyImages = collectImages(middleBlocks);

    closingBody = sanitizeFragmentHtml(closingBlock.bodyHtml, normalized);
    closingHeading = pickSectionHeading([closingBlock]);
    closingHeadingLevel = pickSectionHeadingLevel([closingBlock]);
    closingImages = closingBlock.images;
  }

  normalized.allocationDebug = {
    introSource,
    leadHtmlLength: leadHtml.length,
    sectionBlocks: blocks.map((block, index) => ({
      index,
      heading: block.heading,
      wordCount: block.wordCount,
      classification: block.classification || 'general',
      hasImages: block.images.length > 0,
    })),
    rawOrderedNonFaqBlockIndexes,
    fallbackRan,
    fallbackReason,
    allocationLog,
    introBodyLength: introBody.length,
    whyBodyLength: whyBody.length,
    closingBodyLength: closingBody.length,
  };

  // Deduplicate images across sections
  const usedImageUrls = new Set<string>();
  const introImg = pickImage(introImages, usedImageUrls);
  const whyImg = pickImage(whyImages, usedImageUrls);
  const closingImg = pickImage(closingImages, usedImageUrls);

  const content = {
    hero: {
      sectionLabel: pageTitle ? `– ${pageTitle}` : '',
      tagline: normalized.heroTagline || '',
    },
    introSection: {
      heading: introHeading,
      headingLevel: introHeadingLevel,
      body: introBody,
      image: introImg.src,
      imageAlt: introImg.alt,
    },
    whySection: {
      heading: whyHeading,
      headingLevel: whyHeadingLevel,
      body: whyBody,
      image: whyImg.src,
      imageAlt: whyImg.alt,
    },
    closingSection: {
      heading: closingHeading,
      headingLevel: closingHeadingLevel,
      body: closingBody,
      image: closingImg.src,
      imageAlt: closingImg.alt,
    },
    faq: {
      enabled: normalized.faqItems.length > 0,
      heading: 'Frequently Asked Questions',
      items: normalized.faqItems,
    },
    cta: { heading: '', description: '', secondaryButton: { label: '', sublabel: '', href: '' } },
    locationsSection: { heading: '', introText: '', items: [] },
    mapSection: { heading: '', embedUrl: '' },
  };

  return {
    title: pageTitle,
    url_path: resolvedPath || `/areas-we-serve/${slug}/`,
    page_type: 'area',
    content,
    meta_title: seoTitle,
    meta_description: normalized.metaDescription || '',
    canonical_url: normalized.canonicalUrl || null,
    og_title: seoTitle || null,
    og_description: normalized.metaDescription || null,
    og_image: normalized.ogImage || normalized.featuredImage || null,
    noindex: false,
    schema_type: 'LegalService',
    schema_data: null,
    status: normalized.status === 'published' ? 'published' : 'draft',
  };
}

// ─── Practice Page Allocator ─────────────────────────────────────────────────

/**
 * Practice Area pages: use the normalized section order directly.
 *
 * The parser is responsible for:
 * - merging any pre-H2 intro into the first real section
 * - removing FAQ blocks before allocation
 * - extracting at most one image per section
 * - preserving H2-defined section boundaries without heuristic merging
 */
function allocateForPracticePage(
  normalized: NormalizedContent,
  slug: string,
  resolvedPath?: string
): Record<string, unknown> {
  const pageTitle = normalized.chosenTitle || normalized.h1 || '';
  const seoTitle = normalized.cleanedMetaTitle || pageTitle || '';
  const blocks = normalized.sectionBlocks;

  let contentSections: {
    body: string;
    image: string;
    imageAlt: string;
    imagePosition: 'left' | 'right';
    showCTAs: boolean;
  }[];

  if (blocks.length > 0) {
    contentSections = blocks.map((block, index) => {
      const img = block.images[0];

      return {
        body: renderSectionBlockHtml(block),
        image: img?.src || '',
        imageAlt: img?.alt || '',
        imagePosition: (index % 2 === 0 ? 'right' : 'left') as 'right' | 'left',
        showCTAs: true,
      };
    });
  } else if (normalized.leadHtml) {
    contentSections = [{ body: normalized.leadHtml, image: '', imageAlt: '', imagePosition: 'right' as const, showCTAs: true }];
  } else {
    contentSections = [];
  }

  const content = {
    hero: {
      sectionLabel: '',
      tagline: normalized.heroTagline || pageTitle || '',
      description: normalized.heroDescription || '',
      backgroundImage: normalized.heroImage || normalized.featuredImage || '',
      backgroundImageAlt: pageTitle || '',
    },
    socialProof: {
      mode: 'none' as const,
      testimonials: [],
      awards: { logos: [] },
    },
    contentSections,
    faq: {
      enabled: normalized.faqItems.length > 0,
      heading: 'Frequently Asked Questions',
      description: '',
      items: normalized.faqItems,
    },
    headingTags: {},
  };

  return {
    title: pageTitle,
    url_path: resolvedPath || `/practice-areas/${slug}/`,
    page_type: 'practice_detail',
    content,
    meta_title: seoTitle,
    meta_description: normalized.metaDescription || '',
    canonical_url: normalized.canonicalUrl || null,
    og_title: seoTitle || null,
    og_description: normalized.metaDescription || null,
    og_image: normalized.ogImage || normalized.featuredImage || normalized.heroImage || null,
    noindex: false,
    schema_type: normalized.schemaType || 'LegalService',
    schema_data: null,
    status: normalized.status === 'published' ? 'published' : 'draft',
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function looksLikeDocumentHtml(html: string): boolean {
  if (!html?.trim()) return false;
  return /<!doctype|<html\b|<head\b|<body\b/i.test(html)
    || /\bet_pb_(section|row|column|module)\b/i.test(html)
    || /\b(elementor-section|fl-row|builder-content|wp-site-blocks|site-content|page-container)\b/i.test(html);
}

function sanitizeFragmentHtml(html: string, normalized: NormalizedContent): string {
  const value = html.trim();
  if (!value) return '';
  if (!looksLikeDocumentHtml(value)) return value;

  const baseUrl = /^https?:\/\//i.test(normalized.sourceUrl || normalized.canonicalUrl)
    ? (normalized.sourceUrl || normalized.canonicalUrl)
    : undefined;
  const sanitized = normalizeHtml(value, {
    ...defaultFilterOptions.area,
    ...(baseUrl ? { baseUrl } : {}),
    skipSecondaryFilter: true,
  }).trim();

  if (sanitized && !looksLikeDocumentHtml(sanitized)) {
    return sanitized;
  }

  return value
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<\/?(?:html|head|body)[^>]*>/gi, '')
    .trim();
}

function joinBlockBodies(blocks: SectionBlock[], leadHtml?: string): string {
  let result = leadHtml?.trim() || '';
  for (const block of blocks) {
    result += block.bodyHtml;
  }
  return result.trim();
}

function collectImages(blocks: SectionBlock[]): ImageCandidate[] {
  return blocks.flatMap((block) => block.images);
}

function extractImagesFromHtml(html: string): ImageCandidate[] {
  const images: ImageCandidate[] = [];
  const re = /<img[^>]*\ssrc=["']([^"']+)["'][^>]*/gi;
  let match: RegExpExecArray | null;

  while ((match = re.exec(html)) !== null) {
    const src = match[1];
    const altMatch = match[0].match(/alt=["']([^"']*?)["']/i);
    const alt = altMatch?.[1] ?? '';
    if (src) images.push({ src, alt });
  }

  return images;
}

function pickSectionHeading(blocks: SectionBlock[]): string {
  return blocks.find((block) => block.heading)?.heading || '';
}

function pickSectionHeadingLevel(blocks: SectionBlock[]): SectionHeadingLevel {
  return blocks.find((block) => block.headingLevel)?.headingLevel || 2;
}

function renderSectionBlockHtml(block: SectionBlock): string {
  if (!block.heading) return block.bodyHtml;

  const level = block.headingLevel || 2;
  return `<h${level}>${block.heading}</h${level}>${block.bodyHtml}`;
}

function pickImage(
  candidates: ImageCandidate[],
  usedUrls: Set<string>
): { src: string; alt: string } {
  for (const img of candidates) {
    if (img.src && !usedUrls.has(img.src)) {
      usedUrls.add(img.src);
      return img;
    }
  }
  return { src: '', alt: '' };
}
