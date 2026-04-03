// Template Allocators — Layer 3 of the import pipeline
// Template-specific allocation of NormalizedContent into CMS record shapes.

import type { NormalizedContent, SectionBlock, ImageCandidate, FaqItem } from './normalizedContent';
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
    title: normalized.h1,
    slug: fullSlug,
    body,
    excerpt,
    featured_image: featuredImage,
    category_name: null,
    meta_title: normalized.metaTitle || normalized.h1 || null,
    meta_description: normalized.metaDescription || null,
    canonical_url: normalized.canonicalUrl || null,
    og_title: normalized.metaTitle || normalized.h1 || null,
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
 * Section distribution:
 * - If AI classification available: use classification hints directly
 * - Positional fallback:
 *   - 0 blocks: intro = leadHtml only, why/closing empty
 *   - 1 block: intro only (leadHtml + block)
 *   - 2 blocks: intro (leadHtml + first) + closing (last)
 *   - 3+ blocks: intro (leadHtml + first) + why (middle blocks joined) + closing (last)
 *
 * Pre-H2 content (leadHtml) is prepended to intro.
 * Empty = empty. No placeholder text.
 */
function allocateForAreaPage(
  normalized: NormalizedContent,
  slug: string
): Record<string, unknown> {
  const blocks = normalized.sectionBlocks;
  const hasAiClassification = blocks.some((b) => b.classification);

  let introBody = '';
  let introHeading = '';
  let introImages: ImageCandidate[] = [];
  let whyBody = '';
  let whyHeading = '';
  let whyImages: ImageCandidate[] = [];
  let closingBody = '';
  let closingHeading = '';
  let closingImages: ImageCandidate[] = [];

  if (hasAiClassification) {
    // Use AI classification hints
    const introBlocks = blocks.filter((b) => b.classification === 'intro');
    const whyBlocks = blocks.filter((b) => b.classification === 'why');
    const closingBlocks = blocks.filter((b) => b.classification === 'closing');
    const generalBlocks = blocks.filter((b) => b.classification === 'general' || !b.classification);

    // Intro gets lead + classified intro blocks + unclassified general blocks
    introBody = joinBlockBodies([...introBlocks, ...generalBlocks], normalized.leadHtml);
    introHeading = introBlocks[0]?.heading || '';
    introImages = collectImages([...introBlocks, ...generalBlocks]);

    whyBody = joinBlockBodies(whyBlocks);
    whyHeading = whyBlocks[0]?.heading || '';
    whyImages = collectImages(whyBlocks);

    closingBody = joinBlockBodies(closingBlocks);
    closingHeading = closingBlocks[0]?.heading || '';
    closingImages = collectImages(closingBlocks);
  } else {
    // Positional fallback
    if (blocks.length === 0) {
      // No H2 blocks — all content goes to intro
      introBody = normalized.leadHtml;
    } else if (blocks.length === 1) {
      introBody = prependLead(normalized.leadHtml, blocks[0].bodyHtml);
      introHeading = blocks[0].heading;
      introImages = blocks[0].images;
    } else if (blocks.length === 2) {
      introBody = prependLead(normalized.leadHtml, blocks[0].bodyHtml);
      introHeading = blocks[0].heading;
      introImages = blocks[0].images;

      closingBody = blocks[1].bodyHtml;
      closingHeading = blocks[1].heading;
      closingImages = blocks[1].images;
    } else {
      // 3+ blocks: first → intro, middle → why, last → closing
      introBody = prependLead(normalized.leadHtml, blocks[0].bodyHtml);
      introHeading = blocks[0].heading;
      introImages = blocks[0].images;

      const middleBlocks = blocks.slice(1, -1);
      whyBody = joinBlockBodies(middleBlocks);
      whyHeading = middleBlocks[0]?.heading || '';
      whyImages = collectImages(middleBlocks);

      const lastBlock = blocks[blocks.length - 1];
      closingBody = lastBlock.bodyHtml;
      closingHeading = lastBlock.heading;
      closingImages = lastBlock.images;
    }
  }

  // Deduplicate images across sections
  const usedImageUrls = new Set<string>();
  const introImg = pickImage(introImages, usedImageUrls);
  const whyImg = pickImage(whyImages, usedImageUrls);
  const closingImg = pickImage(closingImages, usedImageUrls);

  const content = {
    hero: {
      sectionLabel: normalized.h1 ? `\u2013 ${normalized.h1}` : '',
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
    title: normalized.h1,
    url_path: `/areas-we-serve/${slug}/`,
    page_type: 'area',
    content,
    meta_title: normalized.metaTitle || normalized.h1 || '',
    meta_description: normalized.metaDescription || '',
    canonical_url: normalized.canonicalUrl || null,
    og_title: normalized.metaTitle || normalized.h1 || null,
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
    contentSections = mergedGroups.map((group, i) => {
      let body = group.map((b) => {
        let html = '';
        if (b.heading) html += `<h2>${b.heading}</h2>`;
        html += b.bodyHtml;
        return html;
      }).join('\n');

      // Prepend lead content to first section
      if (i === 0 && normalized.leadHtml) {
        body = normalized.leadHtml + '\n' + body;
      }

      // Pick first image from the group
      const img = group.flatMap((b) => b.images)[0];

      return {
        body,
        image: img?.src || '',
        imageAlt: img?.alt || '',
        imagePosition: (i % 2 === 0 ? 'right' : 'left') as 'right' | 'left',
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
      tagline: normalized.heroTagline || normalized.h1 || '',
      description: normalized.heroDescription || '',
      backgroundImage: normalized.heroImage || '',
      backgroundImageAlt: normalized.h1 || '',
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
    title: normalized.h1,
    url_path: `/practice-areas/${slug}`,
    page_type: 'practice_detail',
    content,
    meta_title: normalized.metaTitle || normalized.h1 || '',
    meta_description: normalized.metaDescription || '',
    canonical_url: normalized.canonicalUrl || null,
    og_title: normalized.metaTitle || normalized.h1 || null,
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

function prependLead(leadHtml: string, bodyHtml: string): string {
  if (!leadHtml?.trim()) return bodyHtml;
  return leadHtml + '\n' + bodyHtml;
}

function collectImages(blocks: SectionBlock[]): ImageCandidate[] {
  return blocks.flatMap((b) => b.images);
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
