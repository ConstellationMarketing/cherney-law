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
import { applyFieldMapping } from './fieldMapping';
import { executeRecipe } from './recipeEngine';
import { prepareRecords } from './preparer';
import { scoreConfidence } from './confidenceScorer';
import { validateRecords } from './validator';
import { getContentFieldKeys } from './templateFields';

export interface TransformOptions {
  templateType: TemplateType;
  mappingConfig: MappingConfig;
  recipe: Recipe;
  filterOptions: FilterOptions;
  confidenceThreshold: number;
  onProgress?: (current: number, total: number) => void;
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
    onProgress,
  } = options;

  const total = records.length;
  const contentFieldKeys = getContentFieldKeys(templateType);

  // Stage 1-4: Clean source records
  const cleaned = cleanSourceRecords(records, contentFieldKeys, filterOptions);
  onProgress?.(Math.floor(total * 0.1), total);

  // Stage 5: Normalize HTML for content fields
  const normalized = cleaned.map((record) => ({
    rowIndex: record.rowIndex,
    data: normalizeContentFields(record.data, contentFieldKeys, filterOptions),
  }));
  onProgress?.(Math.floor(total * 0.3), total);

  // Stage 6: Apply field mapping
  const mapped = applyFieldMapping(normalized, mappingConfig);
  onProgress?.(Math.floor(total * 0.4), total);

  // Stage 7: Apply recipe rules
  const reciped = executeRecipe(mapped, recipe);
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

    onProgress?.(Math.floor(total * 0.8 + (i / total) * total * 0.2), total);

    return {
      rowIndex: record.rowIndex,
      slug: record.slug,
      sourceData: record.sourceData,
      mappedData: reciped[i].mappedData,
      cleanedData: normalized[i].data,
      preparedData: record.data,
      contentSections: record.contentSections,
      faqItems: record.faqItems,
      confidence,
      validation: recordValidation,
      status: status as 'approved' | 'flagged',
      transformationLog: [],
    };
  });

  onProgress?.(total, total);
  return results;
}

/**
 * Normalize content fields in a record's data.
 * Only applies HTML normalization to fields that are content fields.
 */
function normalizeContentFields(
  data: Record<string, string>,
  contentFieldKeys: string[],
  filterOptions: FilterOptions
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (contentFieldKeys.includes(key) && value) {
      result[key] = normalizeHtml(value, filterOptions);
    } else {
      result[key] = value;
    }
  }

  return result;
}
