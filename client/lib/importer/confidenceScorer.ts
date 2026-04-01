// Confidence scorer — Stage 9 of the pipeline
// Multi-dimensional confidence scoring (Rule 10)

import type { ConfidenceScore } from './recipeTypes';
import { confidenceWeights } from './recipeTypes';
import type { ContentSection, FaqItem, PreparedRecord, RecordValidation, TemplateType } from './types';

/**
 * Score a prepared record's confidence across multiple dimensions.
 */
export function scoreConfidence(
  record: PreparedRecord,
  validation: RecordValidation,
  templateType: TemplateType,
  aiUsed = false
): ConfidenceScore {
  const notes: Record<string, string> = {};

  // Structural: Did the H2 split produce expected sections?
  const structural = scoreStructural(record, templateType, notes);

  // Extraction: Were FAQ, hero, meta fields extracted?
  const extraction = scoreExtraction(record, templateType, notes);

  // Content quality: Word count, empty sections, shortcode remnants?
  const contentQuality = scoreContentQuality(record, templateType, notes);

  // Validation: Do required fields pass?
  const validationScore = scoreValidation(validation, notes);

  // AI ambiguity: Placeholder — set to 1 if no AI used
  const aiAmbiguity = aiUsed ? 0.7 : 1.0;
  if (aiUsed) notes.aiAmbiguity = 'AI was used for transformation';

  // Calculate weighted overall score
  const overall =
    structural * confidenceWeights.structural +
    extraction * confidenceWeights.extraction +
    contentQuality * confidenceWeights.contentQuality +
    validationScore * confidenceWeights.validation +
    aiAmbiguity * confidenceWeights.aiAmbiguity;

  return {
    overall: Math.round(overall * 100) / 100,
    structural,
    extraction,
    contentQuality,
    validation: validationScore,
    aiAmbiguity,
    notes,
  };
}

function scoreStructural(
  record: PreparedRecord,
  templateType: TemplateType,
  notes: Record<string, string>
): number {
  const sections = record.contentSections ?? [];

  if (templateType === 'practice') {
    // Practice pages should have 2+ content sections
    if (sections.length === 0) {
      notes.structural = 'No content sections found';
      return 0.2;
    }
    if (sections.length === 1) {
      notes.structural = 'Only 1 content section (expected 2+)';
      return 0.5;
    }
    if (sections.length >= 3) return 1.0;
    return 0.7;
  }

  if (templateType === 'area') {
    // Area pages: check intro section has content
    const data = record.data as Record<string, unknown>;
    const content = data.content as Record<string, unknown> | undefined;
    const intro = content?.introSection as Record<string, string> | undefined;
    const introText = (intro?.body || '').replace(/<[^>]*>/g, '').trim();
    if (!introText || introText.length < 20) {
      notes.structural = 'Intro section is empty';
      return 0.3;
    }
    return 0.9;
  }

  // Blog posts — less strict on structure
  if (!record.data.body && !record.data.content) {
    notes.structural = 'No body content';
    return 0.2;
  }
  return 0.9;
}

function scoreExtraction(
  record: PreparedRecord,
  templateType: TemplateType,
  notes: Record<string, string>
): number {
  let score = 0.5; // Base

  const data = record.data as Record<string, unknown>;

  // Title extracted?
  if (data.title) score += 0.1;
  else notes.extraction = (notes.extraction ?? '') + 'Missing title. ';

  // Meta fields?
  if (data.meta_title) score += 0.1;
  if (data.meta_description) score += 0.1;

  if (templateType === 'practice') {
    // FAQ items extracted?
    const faqItems = record.faqItems ?? [];
    if (faqItems.length > 0) score += 0.1;

    // Hero content?
    const content = data.content as Record<string, unknown> | undefined;
    const hero = content?.hero as Record<string, string> | undefined;
    if (hero?.tagline) score += 0.1;
  } else if (templateType === 'area') {
    // Area: hero tagline, intro body, and FAQ items
    const content = data.content as Record<string, unknown> | undefined;
    const hero = content?.hero as Record<string, string> | undefined;
    if (hero?.tagline) score += 0.1;
    const intro = content?.introSection as Record<string, string> | undefined;
    if (intro?.body && intro.body.replace(/<[^>]*>/g, '').trim().length > 20) score += 0.1;
    const faq = content?.faq as { enabled?: boolean; items?: unknown[] } | undefined;
    if (faq?.enabled && (faq.items?.length ?? 0) > 0) score += 0.1;
  } else {
    // Blog: excerpt, featured image
    if (data.excerpt) score += 0.1;
    if (data.featured_image) score += 0.1;
  }

  return Math.min(1, score);
}

function scoreContentQuality(
  record: PreparedRecord,
  templateType: TemplateType,
  notes: Record<string, string>
): number {
  let score = 1.0;
  const data = record.data as Record<string, unknown>;

  // Get text content for analysis
  let textContent = '';
  if (templateType === 'practice') {
    const content = data.content as Record<string, unknown> | undefined;
    const sections = (content?.contentSections as { body: string }[]) ?? [];
    textContent = sections.map((s) => s.body || '').join(' ');
  } else if (templateType === 'area') {
    const content = data.content as Record<string, unknown> | undefined;
    const intro = content?.introSection as Record<string, string> | undefined;
    const why = content?.whySection as Record<string, string> | undefined;
    const closing = content?.closingSection as Record<string, string> | undefined;
    textContent = [intro?.body, why?.body, closing?.body].filter(Boolean).join(' ');
  } else {
    textContent = String(data.body ?? '');
  }

  const plainText = textContent.replace(/<[^>]*>/g, '').trim();
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  // Word count scoring
  if (wordCount < 50) {
    score -= 0.4;
    notes.contentQuality = `Very low word count: ${wordCount}`;
  } else if (wordCount < 150) {
    score -= 0.2;
    notes.contentQuality = `Low word count: ${wordCount}`;
  }

  // Check for shortcode remnants
  if (/\[\w+[^\]]*\]/.test(textContent)) {
    score -= 0.2;
    notes.contentQuality = (notes.contentQuality ?? '') + ' Shortcode remnants detected.';
  }

  // Check for empty sections
  if (templateType === 'practice') {
    const content = data.content as Record<string, unknown> | undefined;
    const sections = (content?.contentSections as { body: string }[]) ?? [];
    const emptySections = sections.filter((s) => {
      const t = (s.body || '').replace(/<[^>]*>/g, '').trim();
      return t.length < 20;
    });
    if (emptySections.length > 0) {
      score -= 0.1 * emptySections.length;
      notes.contentQuality = (notes.contentQuality ?? '') + ` ${emptySections.length} empty section(s).`;
    }
  }

  return Math.max(0, Math.min(1, score));
}

function scoreValidation(
  validation: RecordValidation,
  notes: Record<string, string>
): number {
  if (validation.errorCount === 0 && validation.warningCount === 0) return 1.0;

  let score = 1.0;

  // Errors are severe
  score -= validation.errorCount * 0.3;

  // Warnings are mild
  score -= validation.warningCount * 0.05;

  if (validation.errorCount > 0) {
    notes.validation = `${validation.errorCount} error(s), ${validation.warningCount} warning(s)`;
  }

  return Math.max(0, score);
}
