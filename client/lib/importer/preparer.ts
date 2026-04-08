// Preparer — Stage 8 of the pipeline
// Uses Layer 2 (NormalizedContent) + Layer 3 (Template Allocators) to build CMS records.

import type { ContentSection, MappedRecord, PreparedRecord, TemplateType } from './types';
import { buildNormalizedContent } from './normalizedContent';
import type { NormalizedContent } from './normalizedContent';
import { allocateForTemplate } from './templateAllocators';

export interface ResolvedImportPath {
  slug: string;
  path: string;
  usedSourcePath: boolean;
}


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

  // Layer 2: Build template-agnostic normalized content
  const normalized = buildNormalizedContent(mappedData, templateType);

  const resolvedPath = resolveImportPath(
    mappedData.slug || normalized.sourceUrl || '',
    normalized.chosenTitle || mappedData.title || '',
    templateType
  );
  const slug = resolvedPath.slug;

  // Layer 3: Allocate into template-specific CMS record
  const data = allocateForTemplate(normalized, templateType, slug, resolvedPath.path);

  // Build full-path slug for display and logging using the same shared resolver
  const fullSlug = templateType === 'post'
    ? (slug.endsWith('/') ? `/${slug}` : `/${slug}/`)
    : templateType === 'practice'
      ? (resolvedPath.path.endsWith('/') ? resolvedPath.path : `${resolvedPath.path}/`)
      : resolvedPath.path;

  // Map normalized content back to legacy ContentSection format for compatibility
  const contentSections = normalized.sectionBlocks.map((block) => ({
    heading: block.heading,
    body: block.bodyHtml,
    headingLevel: block.headingLevel,
    headingTag: block.headingTag || '',
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

function extractSourcePath(rawValue: string): string {
  const value = rawValue.trim();
  if (!value) return '';

  try {
    if (/^https?:\/\//i.test(value)) {
      return new URL(value).pathname || '';
    }
  } catch {
    // Fall through to best-effort parsing below
  }

  const withoutQuery = value.split('#')[0].split('?')[0].trim();
  if (!withoutQuery) return '';

  if (withoutQuery.startsWith('/') || withoutQuery.includes('/')) {
    return withoutQuery;
  }

  return '';
}

function normalizeTemplatePath(path: string, _templateType: TemplateType): string {
  let normalizedPath = path.trim();
  if (!normalizedPath) return '';

  normalizedPath = normalizedPath.replace(/\/+/g, '/');
  if (!normalizedPath.startsWith('/')) {
    normalizedPath = `/${normalizedPath}`;
  }
  normalizedPath = normalizedPath.split('#')[0].split('?')[0].replace(/\/+/g, '/');

  return normalizedPath === '/' ? '/' : `${normalizedPath.replace(/\/+$/, '')}/`;
}

export function resolveImportPath(
  rawSlug: string,
  title: string,
  templateType: TemplateType
): ResolvedImportPath {
  const sourcePath = extractSourcePath(rawSlug);
  const slug = normalizeUrlSlug(rawSlug, title, templateType);

  if (sourcePath) {
    const normalizedPath = templateType === 'practice'
      ? `/${slug.replace(/^\/+|\/+$/g, '')}/`
      : sourcePath;

    return {
      slug,
      path: normalizeTemplatePath(normalizedPath, templateType),
      usedSourcePath: true,
    };
  }

  const fallbackPath = templateType === 'area'
    ? `/areas-we-serve/${slug}/`
    : templateType === 'practice'
      ? `/${slug.replace(/^\/+|\/+$/g, '')}/`
      : `/${slug.replace(/^\/+/, '')}`;

  return {
    slug,
    path: normalizeTemplatePath(fallbackPath, templateType),
    usedSourcePath: false,
  };
}

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

  // Ensure slug format: posts keep a trailing slash, practice/area keep a bare segment
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
