// Preparer — Stage 8 of the pipeline
// Uses Layer 2 (NormalizedContent) + Layer 3 (Template Allocators) to build CMS records.

import type { ContentSection, MappedRecord, PreparedRecord, TemplateType } from './types';
import { buildNormalizedContent } from './normalizedContent';
import type { NormalizedContent } from './normalizedContent';
import { allocateForTemplate } from './templateAllocators';


/**
 * Prepare mapped records for import.
 * Builds normalized content, then allocates into template-specific CMS records.
 */
export function prepareRecords(
  records: MappedRecord[],
  templateType: TemplateType
): PreparedRecord[] {
  return records.map((record) => prepareRecord(record, templateType));
}

/**
 * Prepare a single mapped record for import.
 * Returns both the CMS record data and the normalizedContent for debug visibility.
 */
export function prepareRecord(
  record: MappedRecord,
  templateType: TemplateType
): PreparedRecord & { normalizedContent?: NormalizedContent } {
  const { mappedData } = record;

  // Generate slug
  const slug = normalizeUrlSlug(
    mappedData.slug || mappedData.title || '',
    mappedData.title || '',
    templateType
  );

  // Layer 2: Build template-agnostic normalized content
  const normalized = buildNormalizedContent(mappedData, templateType);

  // Layer 3: Allocate into template-specific CMS record
  const data = allocateForTemplate(normalized, templateType, slug);

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

  // Map normalized content back to legacy ContentSection format for compatibility
  const contentSections = normalized.sectionBlocks.map((block) => ({
    heading: block.heading,
    body: block.bodyHtml,
    headingTag: block.heading ? `<h2>${block.heading}</h2>` : '',
  }));

  return {
    rowIndex: record.rowIndex,
    slug: fullSlug,
    data,
    contentSections,
    faqItems: normalized.faqItems,
    sourceData: record.sourceData,
    normalizedContent: normalized,
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
