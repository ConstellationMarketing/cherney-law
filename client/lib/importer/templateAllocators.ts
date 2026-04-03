// Template Allocators — Layer 3 of the import pipeline
// Template-specific allocation of NormalizedContent into CMS record shapes.

import type { NormalizedContent, SectionBlock, ImageCandidate } from './normalizedContent';
import type { TemplateType } from './types';

// ─── Dispatch ────────────────────────────────────────────────────────────────

/**
 * Allocate normalized content into a template-specific CMS record.
 */
export function allocateForTemplate(
  normalized: NormalizedContent,
  templateType: TemplateType,
  slug: string
): Record<string, unknown> {
  switch (templateType) {
    case 'area':
      return allocateForAreaPage(normalized, slug);
    case 'practice':
      return allocateForPracticePage(normalized, slug);
    case 'post':
      return allocateForBlogPost(normalized, slug);
    default:
      return allocateForBlogPost(normalized, slug);
  }
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
    if (block.heading) {
      body += `<h2>${block.heading}</h2>`;
    }
    body += block.bodyHtml;
  }
  body = body.trim() || null;

  // Excerpt: first ~160 chars of plain text
  const plainText = normalized.leadText || (normalized.sectionBlocks[0]?.plainText ?? '');
  const excerpt = plainText ? plainText.substring(0, 160).trimEnd() : null;

  // Featured image
  const featuredImage = normalized.featuredImageCandidates[0]?.src || null;

  const fullSlug = slug.endsWith('/') ? slug : slug + '/';

  return {
    title: pageTitle,
    slug: fullSlug,
    body,
    excerpt,
    featured_image: featuredImage,
    category_name: null,
    meta_title: seoTitle,
    meta_description: normalized.metaDescription || null,
    canonical_url: normalized.canonicalUrl || null,
    og_title: seoTitle,
    og_description: normalized.metaDescription || null,
    og_image: normalized.ogImage || featuredImage || null,
    noindex: false,
    status: normalized.status === 'published' ? 'published' : 'draft',
    published_at: null,
  };
}

// ─── Area Page Allocator ─────────────────────────────────────────────────────

/**
 * Areas We Serve: distribute content into intro/why/closing sections.
 *
 * Deterministic allocation rules:
 * - If pre-H2 content exists, intro uses leadHtml only.
 * - If no pre-H2 content exists, intro must take the first non-FAQ block.
 * - If that first block is shorter than 30 words and another block exists,
 *   merge the next block into intro.
 * - Remaining non-FAQ blocks are distributed without duplication:
 *   - 0 remaining → why/closing empty
 *   - 1 remaining → closing only
 *   - 2+ remaining → why gets middle blocks, closing gets last block
 * - FAQ remains only in faqSection.
 */
function allocateForAreaPage(
  normalized: NormalizedContent,
  slug: string
): Record<string, unknown> {
  const pageTitle = normalized.chosenTitle || normalized.h1 || '';
  const seoTitle = normalized.cleanedMetaTitle || pageTitle || '';
  const blocks = normalized.sectionBlocks;
  const allocationLog = {
    intro: [] as number[],
    why: [] as number[],
    closing: [] as number[],
  };

  let introBody = normalized.leadHtml.trim();
  let introHeading = '';
  let introImages: ImageCandidate[] = introBody ? extractImagesFromHtml(introBody) : [];
  let whyBody = '';
  let whyHeading = '';
  let whyImages: ImageCandidate[] = [];
  let closingBody = '';
  let closingHeading = '';
  let closingImages: ImageCandidate[] = [];

  let introSource: 'preH2' | 'firstBlockFallback' | 'empty' = 'empty';
  let remainingStartIndex = 0;

  if (normalized.leadHtml.trim()) {
    introSource = 'preH2';
  } else if (blocks.length > 0) {
    introSource = 'firstBlockFallback';

    const introBlocks = [blocks[0]];
    allocationLog.intro.push(0);

    if (blocks[0].wordCount < 30 && blocks[1]) {
      introBlocks.push(blocks[1]);
      allocationLog.intro.push(1);
    }

    introBody = joinBlockBodies(introBlocks);
    introHeading = pickSectionHeading(introBlocks);
    introImages = collectImages(introBlocks);
    remainingStartIndex = introBlocks.length;
  }

  const remainingBlocks = blocks.slice(remainingStartIndex);

  if (remainingBlocks.length === 1) {
    const closingIndex = remainingStartIndex;
    const block = remainingBlocks[0];
    allocationLog.closing.push(closingIndex);
    closingBody = block.bodyHtml;
    closingHeading = pickSectionHeading([block]);
    closingImages = block.images;
  } else if (remainingBlocks.length >= 2) {
    const middleBlocks = remainingBlocks.slice(0, -1);
    const closingBlock = remainingBlocks[remainingBlocks.length - 1];

    allocationLog.why.push(...middleBlocks.map((_, index) => remainingStartIndex + index));
    allocationLog.closing.push(remainingStartIndex + remainingBlocks.length - 1);

    whyBody = joinBlockBodies(middleBlocks);
    whyHeading = pickSectionHeading(middleBlocks);
    whyImages = collectImages(middleBlocks);

    closingBody = closingBlock.bodyHtml;
    closingHeading = pickSectionHeading([closingBlock]);
    closingImages = closingBlock.images;
  }

  normalized.allocationDebug = {
    introSource,
    allocationLog,
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
      headingLevel: 2,
      body: introBody,
      image: introImg.src,
      imageAlt: introImg.alt,
    },
    whySection: {
      heading: whyHeading,
      headingLevel: 2,
      body: whyBody,
      image: whyImg.src,
      imageAlt: whyImg.alt,
    },
    closingSection: {
      heading: closingHeading,
      headingLevel: 2,
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
    url_path: `/areas-we-serve/${slug}/`,
    page_type: 'area',
    content,
    meta_title: seoTitle,
    meta_description: normalized.metaDescription || '',
    canonical_url: normalized.canonicalUrl || null,
    og_title: seoTitle || null,
    og_description: normalized.metaDescription || null,
    og_image: normalized.ogImage || null,
    noindex: false,
    schema_type: 'LegalService',
    schema_data: null,
    status: normalized.status === 'published' ? 'published' : 'draft',
  };
}

// ─── Practice Page Allocator ─────────────────────────────────────────────────

/**
 * Practice Area pages: dynamic-length contentSections array with merge heuristics.
 *
 * Block merging rules (R4):
 * - Adjacent blocks both < 100 words → merge into one section
 * - Never merge blocks that both have images
 * - Never merge more than 3 blocks into one section
 * - Preserve heading from first block in merge group
 * - leadHtml prepended to first section body
 */
function allocateForPracticePage(
  normalized: NormalizedContent,
  slug: string
): Record<string, unknown> {
  const pageTitle = normalized.chosenTitle || normalized.h1 || '';
  const seoTitle = normalized.cleanedMetaTitle || pageTitle || '';
  const blocks = normalized.sectionBlocks;

  // Merge short adjacent blocks
  const mergedGroups = mergeShortBlocks(blocks);

  // Build contentSections from merged groups
  let contentSections: {
    body: string;
    image: string;
    imageAlt: string;
    imagePosition: 'left' | 'right';
    showCTAs: boolean;
  }[];

  if (mergedGroups.length > 0) {
    contentSections = mergedGroups.map((group, index) => {
      let body = group.map((block) => {
        let html = '';
        if (block.heading) html += `<h2>${block.heading}</h2>`;
        html += block.bodyHtml;
        return html;
      }).join('\n');

      // Prepend lead content to first section
      if (index === 0 && normalized.leadHtml) {
        body = normalized.leadHtml + '\n' + body;
      }

      // Pick first image from the group
      const img = group.flatMap((block) => block.images)[0];

      return {
        body,
        image: img?.src || '',
        imageAlt: img?.alt || '',
        imagePosition: (index % 2 === 0 ? 'right' : 'left') as 'right' | 'left',
        showCTAs: true,
      };
    });
  } else if (normalized.leadHtml || blocks.length === 0) {
    // No blocks but has body content or lead
    const body = normalized.leadHtml || '';
    contentSections = body
      ? [{ body, image: '', imageAlt: '', imagePosition: 'right' as const, showCTAs: true }]
      : [];
  } else {
    contentSections = [];
  }

  const content = {
    hero: {
      sectionLabel: '',
      tagline: normalized.heroTagline || pageTitle || '',
      description: normalized.heroDescription || '',
      backgroundImage: normalized.heroImage || '',
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
    url_path: `/practice-areas/${slug}`,
    page_type: 'practice_detail',
    content,
    meta_title: seoTitle,
    meta_description: normalized.metaDescription || '',
    canonical_url: normalized.canonicalUrl || null,
    og_title: seoTitle || null,
    og_description: normalized.metaDescription || null,
    og_image: normalized.ogImage || normalized.heroImage || null,
    noindex: false,
    schema_type: normalized.schemaType || 'LegalService',
    schema_data: null,
    status: normalized.status === 'published' ? 'published' : 'draft',
  };
}

// ─── Merge Heuristics (R4) ──────────────────────────────────────────────────

/**
 * Merge adjacent short blocks into groups.
 * Rules:
 * - Adjacent blocks both < 100 words → merge
 * - Never merge blocks that both have images
 * - Never merge more than 3 blocks into one group
 * - Preserve heading from first block
 */
function mergeShortBlocks(blocks: SectionBlock[]): SectionBlock[][] {
  if (blocks.length === 0) return [];

  const groups: SectionBlock[][] = [];
  let currentGroup: SectionBlock[] = [blocks[0]];

  for (let i = 1; i < blocks.length; i++) {
    const prev = blocks[i - 1];
    const curr = blocks[i];
    const groupSize = currentGroup.length;

    const canMerge =
      groupSize < 3 &&
      prev.wordCount < 100 &&
      curr.wordCount < 100 &&
      !(prev.images.length > 0 && curr.images.length > 0);

    if (canMerge) {
      currentGroup.push(curr);
    } else {
      groups.push(currentGroup);
      currentGroup = [curr];
    }
  }

  groups.push(currentGroup);
  return groups;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function joinBlockBodies(blocks: SectionBlock[], leadHtml?: string): string {
  let result = leadHtml?.trim() || '';
  for (const block of blocks) {
    if (block.heading) result += `<h2>${block.heading}</h2>`;
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
