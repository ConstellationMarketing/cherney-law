// Recipe engine — Execute recipe rules against mapped records

import type { Recipe, RecipeRule } from './recipeTypes';
import type { MappedRecord } from './types';
import { executeRule } from './recipeRules';

/**
 * Execute a recipe against a set of mapped records.
 * Applies all enabled rules in order to each record.
 * 
 * CRITICAL Rule 3: This uses the same cleaned/mapped data as input,
 * never raw source data.
 */
export function executeRecipe(
  records: MappedRecord[],
  recipe: Recipe
): MappedRecord[] {
  const enabledRules = recipe.rules
    .filter((r) => r.enabled)
    .sort((a, b) => a.order - b.order);

  return records.map((record) => ({
    rowIndex: record.rowIndex,
    sourceData: record.sourceData,
    mappedData: applyRulesToRecord(record.mappedData, enabledRules),
  }));
}

/**
 * Execute a recipe against a single record.
 */
export function executeRecipeSingle(
  record: MappedRecord,
  recipe: Recipe
): MappedRecord {
  const enabledRules = recipe.rules
    .filter((r) => r.enabled)
    .sort((a, b) => a.order - b.order);

  return {
    rowIndex: record.rowIndex,
    sourceData: record.sourceData,
    mappedData: applyRulesToRecord(record.mappedData, enabledRules),
  };
}

/**
 * Apply all rules to a single record's mapped data.
 */
function applyRulesToRecord(
  data: Record<string, string>,
  rules: RecipeRule[]
): Record<string, string> {
  const result = { ...data };

  for (const rule of rules) {
    const currentValue = result[rule.targetField] ?? '';
    const newValue = executeRule(rule.type, currentValue, rule.config, result);
    result[rule.targetField] = newValue;
  }

  return result;
}

/**
 * Create a default recipe for a given template type.
 */
export function createDefaultRecipe(templateType: 'practice' | 'post' | 'area'): Recipe {
  const rules: RecipeRule[] = [];
  let order = 0;

  // Always normalize slug
  rules.push({
    id: `rule-${++order}`,
    type: 'slug_normalize',
    targetField: 'slug',
    config: { templateType },
    order,
    enabled: true,
    description: 'Normalize URL slug',
  });

  // Clean HTML for body
  rules.push({
    id: `rule-${++order}`,
    type: 'html_clean',
    targetField: 'body',
    config: { stripEmptyTags: true, stripComments: true },
    order,
    enabled: true,
    description: 'Clean body HTML',
  });

  // Trim title
  rules.push({
    id: `rule-${++order}`,
    type: 'trim',
    targetField: 'title',
    config: {},
    order,
    enabled: true,
    description: 'Trim title whitespace',
  });

  // Default meta_title from title
  rules.push({
    id: `rule-${++order}`,
    type: 'default_value',
    targetField: 'meta_title',
    config: { defaultValue: '' }, // Will be set from title in preparer
    order,
    enabled: true,
    description: 'Default meta title from title',
  });

  if (templateType === 'post') {
    // Extract first image as featured image if not set
    rules.push({
      id: `rule-${++order}`,
      type: 'extract_first_image',
      targetField: 'featured_image',
      config: {},
      order,
      enabled: true,
      description: 'Extract featured image from body',
    });
  }

  return {
    name: `Default ${templateType} recipe`,
    templateType,
    rules,
    confidenceThreshold: 0.7,
    version: 1,
  };
}
