// Transformer — Full pipeline orchestrator
// Runs all stages in sequence on source records to produce TransformedRecords
// CRITICAL Rule 3: ONE canonical pipeline for all paths

import type { Recipe } from './recipeTypes';
import type {
  FilterOptions,
  MappingConfig,
  SourceRecord,
  TemplateType,
  TransformedRecord,
} from './types';
import { cleanSourceRecords } from './sourceCleaner';
import { normalizeHtml } from './htmlNormalizer';
import { applyFieldMapping, applyFieldMappingSingle } from './fieldMapping';
import { executeRecipe } from './recipeEngine';
import { normalizeUrlSlug, prepareRecords } from './preparer';
import { scoreConfidence } from './confidenceScorer';
import { validateRecords } from './validator';
import { getContentFieldKeys } from './templateFields';
import { buildNormalizedContent } from './normalizedContent';
import type { NormalizedContent } from './normalizedContent';
import { allocateForTemplate } from './templateAllocators';

export interface TransformOptions {
  templateType: TemplateType;
  mappingConfig: MappingConfig;
  recipe: Recipe;
  filterOptions: FilterOptions;
  confidenceThreshold: number;
  /** Keys to skip HTML normalization for (e.g. AI-split fields already cleaned server-side) */
  skipNormalizationKeys?: string[];
  onProgress?: (current: number, total: number) => void;
}

export interface SamplePreviewRecord {
  rowIndex: number;
  sourceData: Record<string, string>;
  cleanedData: Record<string, string>;
  mappedData: Record<string, string>;
  normalizedContent: NormalizedContent;
  allocatedData: Record<string, unknown>;
  chosenTitle: string;
  slug: string;
}

export const AREA_SKIP_NORMALIZATION_KEYS = ['body', 'why_body', 'closing_body'] as const;

export function getSkipNormalizationKeysForTemplate(
  templateType: TemplateType
): string[] | undefined {
  return templateType === 'area' ? [...AREA_SKIP_NORMALIZATION_KEYS] : undefined;
}

/**
 * Run the full transformation pipeline on source records.
 * This is the ONE canonical pipeline — all paths must use this.
 * 
 * Pipeline order:
 * 1-4: Source cleaning (shortcodes, encoding, whitespace, empty wrappers)
 * 5:   HTML normalization (content extraction, filtering, URL normalization, etc.)
 * 6:   Field mapping
 * 7:   Recipe rules
 * 8:   Record preparation (H2 split, FAQ extract, slug generation)
 * 9:   Confidence scoring
 * 10:  Validation
 */
export function transformRecords(
  records: SourceRecord[],
  options: TransformOptions
): TransformedRecord[] {
  const {
    templateType,
    mappingConfig,
    recipe,
    filterOptions,
    confidenceThreshold,
    skipNormalizationKeys,
    onProgress,
  } = options;

  const total = records.length;
  const contentFieldKeys = getContentFieldKeys(templateType);

  // Stage 1-4: Clean source records
  const cleaned = cleanSourceRecords(records, contentFieldKeys, filterOptions);
  onProgress?.(Math.floor(total * 0.1), total);

  // Stage 6: Apply field mapping (BEFORE HTML normalization so keys become template field keys)
  const mapped = applyFieldMapping(cleaned, mappingConfig);
  onProgress?.(Math.floor(total * 0.3), total);

  // Stage 5: Normalize HTML for content fields (now keys match template field keys)
  // Skip normalization for AI-split fields that were already cleaned server-side
  const normalized = mapped.map((record) => ({
    ...record,
    mappedData: normalizeContentFields(record.mappedData, contentFieldKeys, filterOptions, skipNormalizationKeys),
  }));
  onProgress?.(Math.floor(total * 0.4), total);

  // Stage 7: Apply recipe rules
  const reciped = executeRecipe(normalized, recipe);
  onProgress?.(Math.floor(total * 0.5), total);

  // Stage 8: Prepare records (H2 split, FAQ, slug)
  const prepared = prepareRecords(reciped, templateType);
  onProgress?.(Math.floor(total * 0.7), total);

  // Stage 10: Validation
  const slugSet = new Set<string>();
  const validation = validateRecords(prepared, templateType, slugSet);

  // Build slug set for duplicate detection
  for (const r of prepared) {
    slugSet.add(r.slug);
  }

  onProgress?.(Math.floor(total * 0.8), total);

  // Stage 9: Confidence scoring + assemble final records
  const results: TransformedRecord[] = prepared.map((record, i) => {
    const recordValidation = validation.records[i];
    const confidence = scoreConfidence(record, recordValidation, templateType);

    const status = confidence.overall >= confidenceThreshold ? 'approved' : 'flagged';
    const normalizedContent = (record as unknown as Record<string, unknown>).normalizedContent as TransformedRecord['normalizedContent'];

    onProgress?.(Math.floor(total * 0.8 + (i / total) * total * 0.2), total);

    // Build transformation debug log
    const transformationLog: import('./types').TransformationLogEntry[] = [];

    // Log field mapping
    transformationLog.push({
      stage: 'field_mapping',
      field: 'slug',
      action: `Source URL: ${record.sourceData.url || record.sourceData.slug || record.slug}`,
    });

    // Log prepare stage info
    const title = String(record.data.title ?? '');
    if (title) {
      transformationLog.push({ stage: 'prepare_records', field: 'title', action: `Title: ${title}` });
    }

    if (normalizedContent) {
      transformationLog.push({
        stage: 'prepare_records',
        field: 'chosenTitle',
        action: normalizedContent.chosenTitle || '(empty)',
      });
      transformationLog.push({
        stage: 'prepare_records',
        field: 'rawMetaTitle',
        action: normalizedContent.rawMetaTitle || '(empty)',
      });
      transformationLog.push({
        stage: 'prepare_records',
        field: 'cleanedMetaTitle',
        action: normalizedContent.cleanedMetaTitle || '(empty)',
      });

      if (normalizedContent.allocationDebug) {
        transformationLog.push({
          stage: 'prepare_records',
          field: 'leadHtmlLength',
          action: String(normalizedContent.allocationDebug.leadHtmlLength),
        });
        transformationLog.push({
          stage: 'prepare_records',
          field: 'sectionBlocks',
          action: normalizedContent.allocationDebug.sectionBlocks
            .map((block) => `#${block.index} "${block.heading || '(no heading)'}" ${block.wordCount}w class=${block.classification}`)
            .join('; ') || '(none)',
        });
        transformationLog.push({
          stage: 'prepare_records',
          field: 'rawOrderedNonFaqBlocks',
          action: `[${normalizedContent.allocationDebug.rawOrderedNonFaqBlockIndexes.join(', ')}]`,
        });
        transformationLog.push({
          stage: 'prepare_records',
          field: 'introSource',
          action: normalizedContent.allocationDebug.introSource,
        });
        transformationLog.push({
          stage: 'prepare_records',
          field: 'introFallback',
          action: `${normalizedContent.allocationDebug.fallbackRan ? 'ran' : 'skipped'} — ${normalizedContent.allocationDebug.fallbackReason}`,
        });
        transformationLog.push({
          stage: 'prepare_records',
          field: 'allocation',
          action: `intro=[${normalizedContent.allocationDebug.allocationLog.intro.join(', ')}], why=[${normalizedContent.allocationDebug.allocationLog.why.join(', ')}], closing=[${normalizedContent.allocationDebug.allocationLog.closing.join(', ')}]`,
        });
        transformationLog.push({
          stage: 'prepare_records',
          field: 'allocatedLengths',
          action: `intro=${normalizedContent.allocationDebug.introBodyLength}, why=${normalizedContent.allocationDebug.whyBodyLength}, closing=${normalizedContent.allocationDebug.closingBodyLength}`,
        });
      }
    }

    const sections = record.contentSections ?? [];
    if (sections.length > 0) {
      transformationLog.push({ stage: 'prepare_records', field: 'body', action: `Section blocks: ${sections.length}` });
    }

    const faqItems = record.faqItems ?? [];
    if (faqItems.length > 0) {
      transformationLog.push({ stage: 'prepare_records', field: 'faq', action: `FAQ items: ${faqItems.length}` });
    }

    // Log word counts for area template sections
    if (templateType === 'area') {
      const content = record.data.content as Record<string, unknown> | undefined;
      if (content) {
        const countWords = (html: string) => html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
        const introBody = String((content.introSection as Record<string, unknown>)?.body ?? '');
        const whyBody = String((content.whySection as Record<string, unknown>)?.body ?? '');
        const closingBody = String((content.closingSection as Record<string, unknown>)?.body ?? '');
        transformationLog.push({
          stage: 'prepare_records',
          action: `Intro: ${countWords(introBody)} words, Why: ${countWords(whyBody)} words, Closing: ${countWords(closingBody)} words`,
        });
      }
    }

    // Log recipe rules that affected this record's content fields
    if (recipe.rules.length > 0) {
      const mappedBefore = mapped[i]?.mappedData ?? {};
      const mappedAfter = reciped[i]?.mappedData ?? {};
      for (const rule of recipe.rules) {
        if (!rule.enabled) continue;
        const field = rule.targetField;
        if (mappedBefore[field] !== mappedAfter[field]) {
          transformationLog.push({
            stage: 'recipe_rules',
            field,
            action: `Rule "${rule.description || rule.type}" affected field ${field}`,
          });
        }
      }
    }

    return {
      rowIndex: record.rowIndex,
      slug: record.slug,
      sourceData: record.sourceData,
      mappedData: reciped[i].mappedData,
      cleanedData: cleaned[i].data,
      preparedData: record.data,
      contentSections: record.contentSections,
      faqItems: record.faqItems,
      confidence,
      validation: recordValidation,
      status: status as 'approved' | 'flagged',
      transformationLog,
      // Store Layer 2 normalized content for debug visibility
      normalizedContent,
    };
  });

  onProgress?.(total, total);
  return results;
}

function buildPreviewMappedData(
  data: Record<string, string>,
  normalizedContent: NormalizedContent,
  slug: string
): Record<string, string> {
  return {
    ...data,
    ...(normalizedContent.chosenTitle ? { title: normalizedContent.chosenTitle } : {}),
    ...(normalizedContent.cleanedMetaTitle || normalizedContent.metaTitle
      ? { meta_title: normalizedContent.cleanedMetaTitle || normalizedContent.metaTitle }
      : {}),
    ...(slug ? { slug } : {}),
  };
}

export function getSamplePreviewRecord(
  sourceRecord: SourceRecord,
  mappingConfig: MappingConfig,
  templateType: TemplateType,
  filterOptions: FilterOptions,
  overrides: Record<string, string> = {},
  skipNormalizationKeys?: string[]
): SamplePreviewRecord {
  const contentFieldKeys = getContentFieldKeys(templateType);
  const [cleanedRecord] = cleanSourceRecords([sourceRecord], contentFieldKeys, filterOptions);
  const mappedRecord = applyFieldMappingSingle(cleanedRecord, mappingConfig);
  const mergedMappedData = {
    ...mappedRecord.mappedData,
    ...overrides,
  };
  const normalizedMappedData = normalizeContentFields(
    mergedMappedData,
    contentFieldKeys,
    filterOptions,
    skipNormalizationKeys
  );
  const normalizedContent = buildNormalizedContent(normalizedMappedData, templateType);
  const slug = normalizeUrlSlug(
    normalizedMappedData.slug || normalizedContent.chosenTitle || normalizedMappedData.title || '',
    normalizedContent.chosenTitle || normalizedMappedData.title || '',
    templateType
  );
  const allocatedData = allocateForTemplate(normalizedContent, templateType, slug);
  const mappedData = buildPreviewMappedData(normalizedMappedData, normalizedContent, slug);

  return {
    rowIndex: sourceRecord.rowIndex,
    sourceData: { ...sourceRecord.data },
    cleanedData: cleanedRecord.data,
    mappedData,
    normalizedContent,
    allocatedData,
    chosenTitle: normalizedContent.chosenTitle,
    slug,
  };
}

/**
 * Normalize content fields in a record's data.
 * Only applies HTML normalization to fields that are content fields.
 */
function normalizeContentFields(
  data: Record<string, string>,
  contentFieldKeys: string[],
  filterOptions: FilterOptions,
  skipNormalizationKeys?: string[]
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (skipNormalizationKeys?.includes(key)) {
      // Already cleaned server-side (e.g. AI-split fields) — pass through
      result[key] = value;
    } else if (contentFieldKeys.includes(key) && value) {
      result[key] = normalizeHtml(value, filterOptions);
    } else {
      result[key] = value;
    }
  }

  return result;
}
