// Auto-mapper — Fuzzy column-name matching to auto-map source→template fields

import type { FieldMapping, MappingConfig, SourceColumn, TemplateField, TemplateType } from './types';
import { getTemplateFields } from './templateFields';

/**
 * Auto-map source columns to template fields using fuzzy name matching.
 * Returns a MappingConfig with all mappings, unmapped columns, and unmapped fields.
 */
export function autoMapFields(
  columns: SourceColumn[],
  templateType: TemplateType
): MappingConfig {
  const fields = getTemplateFields(templateType);
  const mappings: FieldMapping[] = [];
  const usedColumns = new Set<string>();
  const usedFields = new Set<string>();

  // Pass 1: Exact matches (column name matches field key or alias exactly)
  for (const col of columns) {
    const normalizedCol = normalize(col.name);

    for (const field of fields) {
      if (usedFields.has(field.key)) continue;

      const allNames = [field.key, ...field.aliases].map(normalize);
      if (allNames.includes(normalizedCol)) {
        mappings.push({
          sourceColumn: col.name,
          targetField: field.key,
          confidence: 1.0,
          isManual: false,
        });
        usedColumns.add(col.name);
        usedFields.add(field.key);
        break;
      }
    }
  }

  // Pass 2: Fuzzy matches for remaining columns
  for (const col of columns) {
    if (usedColumns.has(col.name)) continue;

    let bestField: TemplateField | null = null;
    let bestScore = 0;

    // Determine if this column is clearly an image/media column
    const colLower = col.name.toLowerCase();
    const isImageColumn = /image|img|photo|thumb|banner|cover|avatar|icon|picture/.test(colLower);

    for (const field of fields) {
      if (usedFields.has(field.key)) continue;

      // Guard: never map an image-named column to the slug field
      if (isImageColumn && field.key === 'slug') continue;

      const score = fuzzyMatchScore(col.name, field, col);
      if (score > bestScore && score >= 0.4) {
        bestScore = score;
        bestField = field;
      }
    }

    if (bestField) {
      mappings.push({
        sourceColumn: col.name,
        targetField: bestField.key,
        confidence: bestScore,
        isManual: false,
      });
      usedColumns.add(col.name);
      usedFields.add(bestField.key);
    }
  }

  const unmappedColumns = columns
    .map((c) => c.name)
    .filter((n) => !usedColumns.has(n));

  const unmappedFields = fields
    .map((f) => f.key)
    .filter((k) => !usedFields.has(k));

  return { templateType, mappings, unmappedColumns, unmappedFields };
}

/**
 * Calculate a fuzzy match score between a source column and a template field.
 * Returns 0-1 where 1 is perfect match.
 */
function fuzzyMatchScore(
  columnName: string,
  field: TemplateField,
  column: SourceColumn
): number {
  const colNorm = normalize(columnName);
  const allFieldNames = [field.key, field.label, ...field.aliases].map(normalize);

  let bestNameScore = 0;

  for (const fieldName of allFieldNames) {
    // Substring match
    if (colNorm.includes(fieldName) || fieldName.includes(colNorm)) {
      const longer = Math.max(colNorm.length, fieldName.length);
      const shorter = Math.min(colNorm.length, fieldName.length);
      bestNameScore = Math.max(bestNameScore, (shorter / longer) * 0.9);
    }

    // Word overlap
    const colWords = colNorm.split(/[_\s-]+/);
    const fieldWords = fieldName.split(/[_\s-]+/);
    const overlap = colWords.filter((w) => fieldWords.includes(w)).length;
    if (overlap > 0) {
      const wordScore = (overlap * 2) / (colWords.length + fieldWords.length);
      bestNameScore = Math.max(bestNameScore, wordScore * 0.85);
    }

    // Levenshtein distance for short strings
    if (colNorm.length < 20 && fieldName.length < 20) {
      const dist = levenshtein(colNorm, fieldName);
      const maxLen = Math.max(colNorm.length, fieldName.length);
      const levScore = 1 - dist / maxLen;
      if (levScore > 0.6) {
        bestNameScore = Math.max(bestNameScore, levScore * 0.8);
      }
    }
  }

  // Boost score based on data type match
  let typeBoost = 0;
  if (column.detectedType === field.type) typeBoost = 0.1;
  else if (field.isContentField && column.detectedType === 'html') typeBoost = 0.15;
  else if (field.type === 'url' && column.detectedType === 'url') typeBoost = 0.1;

  return Math.min(1, bestNameScore + typeBoost);
}

/**
 * Normalize a string for comparison: lowercase, strip special chars,
 * collapse whitespace.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s_-]/g, '')
    .replace(/[-\s]+/g, '_')
    .trim();
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }

  return dp[m][n];
}
