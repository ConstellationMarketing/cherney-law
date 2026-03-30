// Validator — Stage 10 of the pipeline
// Validates transformed records against template requirements

import type {
  PreparedRecord,
  RecordValidation,
  TemplateType,
  ValidationIssue,
  ValidationResult,
  ValidationSeverity,
} from './types';
import { getRequiredFieldKeys, getTemplateFields } from './templateFields';

/**
 * Validate all prepared records against template requirements.
 */
export function validateRecords(
  records: PreparedRecord[],
  templateType: TemplateType,
  existingSlugs?: Set<string>
): ValidationResult {
  const results = records.map((r) =>
    validateRecord(r, templateType, existingSlugs)
  );

  const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warningCount, 0);

  return {
    isValid: totalErrors === 0,
    records: results,
    totalErrors,
    totalWarnings,
  };
}

/**
 * Validate a single prepared record.
 */
export function validateRecord(
  record: PreparedRecord,
  templateType: TemplateType,
  existingSlugs?: Set<string>
): RecordValidation {
  const issues: ValidationIssue[] = [];
  const fields = getTemplateFields(templateType);
  const required = getRequiredFieldKeys(templateType);
  const data = record.data as Record<string, unknown>;

  // Check required fields
  for (const key of required) {
    // Slug is validated separately below
    if (key === 'slug') continue;

    const value = data[key];
    if (value === null || value === undefined || value === '') {
      // Special case: for practice pages, content is nested
      if (key === 'body' && templateType === 'practice') {
        const content = data.content as Record<string, unknown> | undefined;
        const sections = (content?.contentSections as unknown[]) ?? [];
        if (sections.length > 0) continue; // Has content sections
      }
      // Special case: title might be at top level of data
      if (key === 'title' && data.title) continue;
      issues.push(issue('error', key, 'Required field is missing'));
    }
  }

  // Validate slug
  if (!record.slug) {
    issues.push(issue('error', 'slug', 'Slug is empty'));
  } else {
    const slugBase = record.slug.replace(/\/$/, '');
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slugBase) && slugBase.length > 1) {
      issues.push(issue('error', 'slug', `Invalid slug format: "${record.slug}"`));
    }
    if (slugBase.includes('--')) {
      issues.push(issue('warning', 'slug', 'Slug contains consecutive hyphens'));
    }
  }

  // Check for duplicate slugs within the import batch
  if (existingSlugs?.has(record.slug)) {
    issues.push(issue('error', 'slug', `Duplicate slug: "${record.slug}"`));
  }

  // Validate title length
  const title = String(data.title ?? '');
  if (title.length > 200) {
    issues.push(issue('warning', 'title', `Title is very long (${title.length} chars)`));
  }

  // Validate meta fields
  const metaTitle = String(data.meta_title ?? '');
  if (metaTitle && metaTitle.length > 70) {
    issues.push(issue('warning', 'meta_title', `Meta title exceeds 70 chars (${metaTitle.length})`));
  }

  const metaDesc = String(data.meta_description ?? '');
  if (!metaDesc) {
    issues.push(issue('warning', 'meta_description', 'Missing meta description'));
  } else if (metaDesc.length > 160) {
    issues.push(issue('warning', 'meta_description', `Meta description exceeds 160 chars (${metaDesc.length})`));
  }

  // Validate URLs
  for (const field of fields) {
    if (field.type === 'url') {
      const url = String(data[field.key] ?? '');
      if (url && !isValidUrl(url)) {
        issues.push(issue('warning', field.key, `Invalid URL: "${url}"`));
      }
    }
  }

  // Check content quality
  if (templateType === 'practice') {
    validatePracticeContent(data, issues);
  } else {
    validatePostContent(data, issues);
  }

  // Check for shortcode remnants
  const allText = JSON.stringify(data);
  if (/\[\w+[^\]]*\]/.test(allText)) {
    issues.push(issue('warning', 'body', 'Content may contain shortcode remnants'));
  }

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return {
    rowIndex: record.rowIndex,
    isValid: errorCount === 0,
    issues,
    errorCount,
    warningCount,
  };
}

function validatePracticeContent(
  data: Record<string, unknown>,
  issues: ValidationIssue[]
): void {
  const content = data.content as Record<string, unknown> | undefined;
  if (!content) {
    issues.push(issue('warning', 'body', 'No content structure'));
    return;
  }

  const sections = (content.contentSections as { body: string }[]) ?? [];

  // Check for empty content sections
  const emptySections = sections.filter((s) => {
    const text = (s.body || '').replace(/<[^>]*>/g, '').trim();
    return text.length < 20;
  });
  if (emptySections.length > 0) {
    issues.push(issue('warning', 'body', `${emptySections.length} content section(s) have very little text`));
  }

  // Check total word count
  const totalText = sections.map((s) => s.body || '').join(' ').replace(/<[^>]*>/g, '');
  const wordCount = totalText.split(/\s+/).filter(Boolean).length;
  if (wordCount < 100) {
    issues.push(issue('warning', 'body', `Low word count: ${wordCount} words`));
  }

  // Check hero
  const hero = content.hero as Record<string, string> | undefined;
  if (!hero?.tagline) {
    issues.push(issue('warning', 'hero_tagline', 'Missing hero tagline'));
  }
}

function validatePostContent(
  data: Record<string, unknown>,
  issues: ValidationIssue[]
): void {
  const body = String(data.body ?? '');
  if (!body) return;

  const text = body.replace(/<[^>]*>/g, '').trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;

  if (wordCount < 50) {
    issues.push(issue('warning', 'body', `Low word count: ${wordCount} words`));
  }

  // Check for missing featured image
  if (!data.featured_image) {
    issues.push(issue('warning', 'featured_image', 'Missing featured image'));
  }

  // Check for missing excerpt
  if (!data.excerpt) {
    issues.push(issue('warning', 'excerpt', 'Missing excerpt'));
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return url.startsWith('/');
  }
}

function issue(severity: ValidationSeverity, field: string, message: string): ValidationIssue {
  return { severity, field, message };
}
