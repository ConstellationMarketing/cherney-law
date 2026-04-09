// Runs all stages in sequence on source records to produce TransformedRecords
// CRITICAL Rule 3: ONE canonical pipeline for all paths

import type {
  AreaAiSplitResult,
  PreviewPipelineSnapshot,
  Recipe,
} from './recipeTypes';
import type {
  FilterOptions,
  MappedRecord,
  MappingConfig,
  SourceRecord,
  TemplateType,
  TransformedRecord,
} from './types';
import { cleanSourceRecords } from './sourceCleaner';
import { normalizeHtml, normalizeHtmlWithMetadata } from './htmlNormalizer';
import { applyFieldMapping, applyFieldMappingSingle } from './fieldMapping';
import { executeRecipe } from './recipeEngine';
import { prepareRecords, resolveImportPath } from './preparer';
import { scoreConfidence } from './confidenceScorer';
import { buildSlugCounts, validateRecords } from './validator';
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
  areaAiSplitResultsByRow?: Record<number, AreaAiSplitResult>;
  preprocessedPipeline?: PreprocessedPipelineRecords;
  previewSnapshot?: PreviewPipelineSnapshot | null;
  onProgress?: (current: number, total: number) => void;
}

export interface PreprocessedPipelineRecords {
  cleanedRecords: SourceRecord[];
  mappedRecords: MappedRecord[];
  normalizedRecords: MappedRecord[];
  recipedRecords: MappedRecord[];
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
  resolvedPath: string;
  previewDebug: {
    aiSplitMode: boolean;
    skipNormalizationKeys: string[];
    introSourceField: 'raw' | 'cleaned' | 'corrections' | 'ai-split';
    rawSourceHtmlLength: number;
    cleanedBodyHtmlLength: number;
    correctionsBodyLength: number;
    originalSourceUrl: string;
    resolvedUrlPath: string;
    inputBodyPreview: string;
    introPreview: string;
    allocatedIntroPath: string;
  };
}

export const AREA_SKIP_NORMALIZATION_KEYS = ['body', 'why_body', 'closing_body'] as const;
const AREA_AI_SPLIT_SIGNAL_KEYS = [
  '__ai_split_mode',
  'why_body',
  'closing_body',
  'faq',
  'body_image',
  'body_image_alt',
  'why_image',
  'why_image_alt',
  'closing_image',
  'closing_image_alt',
] as const;

function hasOwnKey(record: Record<string, string>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key);
}

export function getSkipNormalizationKeysForRecord(
  templateType: TemplateType,
  data: Record<string, string>
): string[] | undefined {
  if (templateType !== 'area') return undefined;

  const hasExplicitAiSplit = data.__ai_split_mode === 'true' || AREA_AI_SPLIT_SIGNAL_KEYS.some((key) => {
    if (key === '__ai_split_mode') return false;
    return hasOwnKey(data, key);
  });

  return hasExplicitAiSplit ? [...AREA_SKIP_NORMALIZATION_KEYS] : undefined;
}

export function buildPreprocessedPipelineRecords(
  records: SourceRecord[],
  options: Pick<TransformOptions, 'templateType' | 'mappingConfig' | 'recipe' | 'filterOptions' | 'skipNormalizationKeys'>
): PreprocessedPipelineRecords {
  const {
    templateType,
    mappingConfig,
    recipe,
    filterOptions,
    skipNormalizationKeys,
  } = options;
  const contentFieldKeys = getContentFieldKeys(templateType);

  const cleanedRecords = cleanSourceRecords(records, contentFieldKeys, filterOptions);
  const mappedRecords = applyFieldMapping(cleanedRecords, mappingConfig);
  const normalizedRecords = mappedRecords.map((record) => {
    const recordSkipNormalizationKeys = skipNormalizationKeys ?? getSkipNormalizationKeysForRecord(templateType, record.mappedData);
    return {
      ...record,
      mappedData: normalizeContentFields(record.mappedData, contentFieldKeys, filterOptions, recordSkipNormalizationKeys),
    };
  });
  const recipedRecords = executeRecipe(normalizedRecords, recipe);

  return {
    cleanedRecords,
    mappedRecords,
    normalizedRecords,
    recipedRecords,
  };
}

function applyAreaAiSplitResults(
  records: MappedRecord[],
  areaAiSplitResultsByRow?: Record<number, AreaAiSplitResult>
): MappedRecord[] {
  if (!areaAiSplitResultsByRow) return records;

  return records.map((record) => {
    const splitResult = areaAiSplitResultsByRow[record.rowIndex];
    if (!splitResult) return record;

    return {
      ...record,
      mappedData: {
        ...record.mappedData,
        __ai_split_mode: 'true',
        body: splitResult.body ?? '',
        why_body: splitResult.why_body ?? '',
        closing_body: splitResult.closing_body ?? '',
        ...(splitResult.faq !== undefined ? { faq: splitResult.faq } : {}),
        ...(splitResult.body_image !== undefined ? { body_image: splitResult.body_image } : {}),
        ...(splitResult.body_image_alt !== undefined ? { body_image_alt: splitResult.body_image_alt } : {}),
        ...(splitResult.why_image !== undefined ? { why_image: splitResult.why_image } : {}),
        ...(splitResult.why_image_alt !== undefined ? { why_image_alt: splitResult.why_image_alt } : {}),
        ...(splitResult.closing_image !== undefined ? { closing_image: splitResult.closing_image } : {}),
        ...(splitResult.closing_image_alt !== undefined ? { closing_image_alt: splitResult.closing_image_alt } : {}),
      },
    };
  });
}

function getAreaSectionBody(data: Record<string, unknown>, key: 'introSection' | 'whySection' | 'closingSection'): string {
  const content = data.content as Record<string, unknown> | undefined;
  return String((content?.[key] as Record<string, unknown> | undefined)?.body ?? '');
}

function buildPreviewComparisonAction(
  snapshot: PreviewPipelineSnapshot,
  preparedData: Record<string, unknown>
): string {
  const titleMatches = String(preparedData.title ?? '') === snapshot.chosenTitle;
  const pathMatches = String(preparedData.url_path ?? '') === snapshot.resolvedPath;
  const snapshotHasAreaContent = Boolean((snapshot.preparedData.content as Record<string, unknown> | undefined)?.introSection);

  if (!snapshotHasAreaContent) {
    const matches = JSON.stringify(preparedData) === JSON.stringify(snapshot.preparedData);
    return matches
      ? 'MATCH — build recipe preview and batch preparedData are identical for this row'
      : 'MISMATCH — build recipe preview and batch preparedData differ for this row';
  }

  const introMatches = getAreaSectionBody(preparedData, 'introSection') === getAreaSectionBody(snapshot.preparedData, 'introSection');
  const whyMatches = getAreaSectionBody(preparedData, 'whySection') === getAreaSectionBody(snapshot.preparedData, 'whySection');
  const closingMatches = getAreaSectionBody(preparedData, 'closingSection') === getAreaSectionBody(snapshot.preparedData, 'closingSection');
  const faqMatches = JSON.stringify((preparedData.content as Record<string, unknown> | undefined)?.faq ?? null) === JSON.stringify((snapshot.preparedData.content as Record<string, unknown> | undefined)?.faq ?? null);
  const isMatch = titleMatches && pathMatches && introMatches && whyMatches && closingMatches && faqMatches;

  return isMatch
    ? 'MATCH — build recipe preview and batch preparedData are identical for this row'
    : `MISMATCH — title=${titleMatches ? 'ok' : 'diff'}, path=${pathMatches ? 'ok' : 'diff'}, intro=${introMatches ? 'ok' : 'diff'}, why=${whyMatches ? 'ok' : 'diff'}, closing=${closingMatches ? 'ok' : 'diff'}, faq=${faqMatches ? 'ok' : 'diff'}`;
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
  const preprocessed = options.preprocessedPipeline ?? buildPreprocessedPipelineRecords(records, {
    templateType,
    mappingConfig,
    recipe,
    filterOptions,
    skipNormalizationKeys,
  });

  onProgress?.(Math.floor(total * 0.1), total);
  onProgress?.(Math.floor(total * 0.3), total);
  onProgress?.(Math.floor(total * 0.4), total);
  onProgress?.(Math.floor(total * 0.5), total);

  const cleaned = preprocessed.cleanedRecords;
  const mapped = preprocessed.mappedRecords;
  const recipedBase = preprocessed.recipedRecords;
  const reciped = templateType === 'area'
    ? applyAreaAiSplitResults(recipedBase, options.areaAiSplitResultsByRow)
    : recipedBase;

  // Stage 8: Prepare records (H2 split, FAQ, slug)
  const prepared = prepareRecords(reciped, templateType);
  onProgress?.(Math.floor(total * 0.7), total);

  // Stage 10: Validation
  const batchSlugCounts = buildSlugCounts(prepared);
  const validation = validateRecords(prepared, templateType, { batchSlugCounts });

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
      transformationLog.push({
        stage: 'prepare_records',
        field: 'titleSource',
        action: normalizedContent.titleSource,
      });
      transformationLog.push({
        stage: 'prepare_records',
        field: 'earlyPreservedH1',
        action: normalizedContent.earlyPreservedH1 || '(empty)',
      });
      transformationLog.push({
        stage: 'prepare_records',
        field: 'earlyPreservedH2',
        action: normalizedContent.earlyPreservedH2 || '(empty)',
      });
      transformationLog.push({
        stage: 'prepare_records',
        field: 'earlyHeroTagline',
        action: normalizedContent.earlyHeroTagline || '(empty)',
      });
      transformationLog.push({
        stage: 'prepare_records',
        field: 'latePreservedH1',
        action: normalizedContent.latePreservedH1 || '(empty)',
      });
      transformationLog.push({
        stage: 'prepare_records',
        field: 'latePreservedH2',
        action: normalizedContent.latePreservedH2 || '(empty)',
      });
      transformationLog.push({
        stage: 'prepare_records',
        field: 'earlyHadH1BeforeStrip',
        action: normalizedContent.earlyHadH1BeforeStrip ? 'true' : 'false',
      });
      transformationLog.push({
        stage: 'prepare_records',
        field: 'hadH1BeforeStrip',
        action: normalizedContent.hadH1BeforeStrip ? 'true' : 'false',
      });
      transformationLog.push({
        stage: 'prepare_records',
        field: 'mainContentDroppedEarlyH1',
        action: normalizedContent.mainContentDroppedEarlyH1 ? 'true' : 'false',
      });
      transformationLog.push({
        stage: 'prepare_records',
        field: 'heroTaglineSource',
        action: normalizedContent.heroTaglineSource,
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

      const splitApplied = Boolean(options.areaAiSplitResultsByRow?.[record.rowIndex]);
      transformationLog.push({
        stage: 'prepare_records',
        field: 'pipelineAiSplit',
        action: splitApplied ? 'enabled — batch used shared post-normalization/post-recipe body input' : 'disabled',
      });
    }

    if (options.previewSnapshot && options.previewSnapshot.rowIndex === record.rowIndex) {
      transformationLog.push({
        stage: 'prepare_records',
        field: 'previewBatchParity',
        action: buildPreviewComparisonAction(options.previewSnapshot, record.data),
      });
    }

    // Log recipe rules that affected this record's content fields
    if (recipe.rules.length > 0) {
      const mappedBefore = mapped[i]?.mappedData ?? {};
      const mappedAfter = preprocessed.recipedRecords[i]?.mappedData ?? {};
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

export function buildSamplePreviewSnapshot(preview: SamplePreviewRecord): PreviewPipelineSnapshot {
  return {
    rowIndex: preview.rowIndex,
    chosenTitle: preview.chosenTitle,
    resolvedPath: preview.resolvedPath,
    aiSplitMode: preview.previewDebug.aiSplitMode,
    preparedData: preview.allocatedData,
  };
}

function buildPreviewMappedData(
  data: Record<string, string>,
  normalizedContent: NormalizedContent,
  slug: string,
  resolvedPath: string,
  templateType: TemplateType
): Record<string, string> {
  const previewMetaTitle = templateType === 'practice'
    ? normalizedContent.rawMetaTitle || normalizedContent.metaTitle
    : normalizedContent.cleanedMetaTitle || normalizedContent.metaTitle;

  return {
    ...data,
    ...(normalizedContent.chosenTitle ? { title: normalizedContent.chosenTitle } : {}),
    ...(normalizedContent.heroTagline ? { hero_tagline: normalizedContent.heroTagline } : {}),
    ...(previewMetaTitle
      ? { meta_title: previewMetaTitle }
      : {}),
    ...((templateType === 'area' || templateType === 'practice') && resolvedPath
      ? { slug: resolvedPath }
      : slug
        ? { slug }
        : {}),
  };
}

function buildPracticeSectionDiagnostics(contentSections: Record<string, unknown>[] = []) {
  return contentSections.map((section, index) => {
    const body = String(section.body ?? '');
    const headingMatch = body.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i);
    const derivedTitle = String(section.heading ?? '')
      || (headingMatch?.[1] ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      || `Section ${index + 1}`;
    const image = String(section.image ?? '');
    const imageAlt = String(section.imageAlt ?? '');

    return {
      index,
      title: derivedTitle,
      image,
      imageAlt,
      hasImgInBody: /<img\b/i.test(body),
      hasNoscriptInBody: /<noscript\b/i.test(body),
      containsDataUriImage: image.startsWith('data:'),
    };
  });
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
  const recordSkipNormalizationKeys = skipNormalizationKeys ?? getSkipNormalizationKeysForRecord(templateType, mergedMappedData);
  const normalizedMappedData = normalizeContentFields(
    mergedMappedData,
    contentFieldKeys,
    filterOptions,
    recordSkipNormalizationKeys
  );
  const normalizedContent = buildNormalizedContent(normalizedMappedData, templateType);
  const resolvedPath = resolveImportPath(
    normalizedMappedData.slug || normalizedContent.sourceUrl || '',
    normalizedContent.chosenTitle || normalizedMappedData.title || '',
    templateType
  );
  const slug = resolvedPath.slug;
  const allocatedData = allocateForTemplate(normalizedContent, templateType, slug, resolvedPath.path);
  const mappedData = buildPreviewMappedData(normalizedMappedData, normalizedContent, slug, resolvedPath.path, templateType);

  if (templateType === 'practice') {
    const content = (allocatedData.content as Record<string, unknown> | undefined) ?? {};
    const contentSections = (content.contentSections as Record<string, unknown>[] | undefined) ?? [];

    console.groupCollapsed('[practice-preview-diagnostic] transformer prepared payload');
    console.log({
      rowIndex: sourceRecord.rowIndex,
      resolvedPath: resolvedPath.path,
      chosenTitle: normalizedContent.chosenTitle,
      hero: content.hero ?? null,
      contentSections,
      faq: content.faq ?? null,
    });
    console.log('[practice-preview-diagnostic] transformer section summary', buildPracticeSectionDiagnostics(contentSections));
    console.groupEnd();
  }

  const introBody = templateType === 'area'
    ? String(((allocatedData.content as Record<string, unknown> | undefined)?.introSection as Record<string, unknown> | undefined)?.body ?? '')
    : String(allocatedData.body ?? '');
  const bodyMapping = mappingConfig.mappings.find((mapping) => mapping.targetField === 'body');
  const slugMapping = mappingConfig.mappings.find((mapping) => mapping.targetField === 'slug');
  const rawSourceBody = bodyMapping ? String(sourceRecord.data[bodyMapping.sourceColumn] ?? '') : '';
  const originalSourceUrl = slugMapping
    ? String(sourceRecord.data[slugMapping.sourceColumn] ?? '')
    : String(normalizedMappedData.slug || '');
  const bodyWasCorrected = hasOwnKey(overrides, 'body') && (overrides.body ?? '') !== (mappedRecord.mappedData.body ?? '');
  const introSourceField: 'raw' | 'cleaned' | 'corrections' | 'ai-split' = normalizedContent.segmentation.method === 'ai-split'
    ? 'ai-split'
    : bodyWasCorrected
      ? 'corrections'
      : 'cleaned';

  return {
    rowIndex: sourceRecord.rowIndex,
    sourceData: { ...sourceRecord.data },
    cleanedData: cleanedRecord.data,
    mappedData,
    normalizedContent,
    allocatedData,
    chosenTitle: normalizedContent.chosenTitle,
    slug: templateType === 'post' ? slug : resolvedPath.path,
    resolvedPath: resolvedPath.path,
    previewDebug: {
      aiSplitMode: normalizedContent.segmentation.method === 'ai-split',
      skipNormalizationKeys: recordSkipNormalizationKeys ?? [],
      introSourceField,
      rawSourceHtmlLength: rawSourceBody.length,
      cleanedBodyHtmlLength: String(normalizedMappedData.body ?? '').length,
      correctionsBodyLength: String(overrides.body ?? '').length,
      originalSourceUrl,
      resolvedUrlPath: String((allocatedData.url_path as string | undefined) ?? resolvedPath.path),
      inputBodyPreview: String(normalizedMappedData.body ?? '').substring(0, 300),
      introPreview: introBody.substring(0, 200),
      allocatedIntroPath: templateType === 'area' ? 'allocatedData.content.introSection.body' : 'allocatedData.body',
    },
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
      if (key === 'body') {
        result.__body_raw_html = value;
        const normalized = normalizeHtmlWithMetadata(value, filterOptions);
        result[key] = normalized.html;
        result.__body_early_preserved_heading = normalized.earlyPreservedHeading;
        result.__body_early_preserved_h1 = normalized.earlyPreservedH1;
        result.__body_early_preserved_h2 = normalized.earlyPreservedH2;
        result.__body_early_hero_tagline = normalized.earlyHeroTagline;
        result.__body_early_had_h1_before_strip = normalized.earlyHadH1BeforeStrip ? 'true' : 'false';
        result.__body_preserved_heading = normalized.preservedHeading;
        result.__body_preserved_h1 = normalized.preservedH1;
        result.__body_preserved_h2 = normalized.preservedH2;
        result.__body_had_h1_before_strip = normalized.hadH1BeforeStrip ? 'true' : 'false';
        result.__body_main_content_dropped_early_h1 = normalized.mainContentDroppedEarlyH1 ? 'true' : 'false';
      } else {
        result[key] = normalizeHtml(value, filterOptions);
      }
    } else {
      result[key] = value;
    }
  }

  return result;
}
