// Recipe inference — Infer recipe rules from diff between auto-output and corrected output

import type { RecipeRule } from './recipeTypes';
import type { FieldDiff } from './recipeTypes';

/**
 * Infer recipe rules from the differences between auto-generated output
 * and the user's corrected output.
 */
export function inferRulesFromDiff(diffs: FieldDiff[]): RecipeRule[] {
  const rules: RecipeRule[] = [];
  let order = 100; // Start after default rules

  for (const diff of diffs) {
    if (diff.diffType === 'unchanged') continue;

    const inferred = inferRuleForField(diff, order);
    if (inferred) {
      rules.push(...inferred);
      order += inferred.length;
    }
  }

  return rules;
}

/**
 * Compare auto-generated output with corrected output and produce diffs.
 */
export function computeFieldDiffs(
  autoOutput: Record<string, string>,
  correctedOutput: Record<string, string>
): FieldDiff[] {
  const allFields = new Set([
    ...Object.keys(autoOutput),
    ...Object.keys(correctedOutput),
  ]);

  const diffs: FieldDiff[] = [];

  for (const field of allFields) {
    const autoVal = autoOutput[field] ?? '';
    const correctedVal = correctedOutput[field] ?? '';

    if (autoVal === correctedVal) {
      diffs.push({ field, autoValue: autoVal, correctedValue: correctedVal, diffType: 'unchanged' });
    } else if (!autoVal && correctedVal) {
      diffs.push({ field, autoValue: autoVal, correctedValue: correctedVal, diffType: 'added' });
    } else if (autoVal && !correctedVal) {
      diffs.push({ field, autoValue: autoVal, correctedValue: correctedVal, diffType: 'removed' });
    } else {
      diffs.push({ field, autoValue: autoVal, correctedValue: correctedVal, diffType: 'modified' });
    }
  }

  return diffs;
}

/**
 * Infer rules for a single field diff.
 */
function inferRuleForField(diff: FieldDiff, startOrder: number): RecipeRule[] | null {
  const rules: RecipeRule[] = [];
  const { field, autoValue, correctedValue } = diff;

  if (diff.diffType === 'added') {
    // User added a value that didn't exist — create a default_value rule
    rules.push({
      id: `inferred-${startOrder}`,
      type: 'default_value',
      targetField: field,
      config: { defaultValue: correctedValue },
      order: startOrder,
      enabled: true,
      description: `Set default value for ${field}`,
    });
    return rules;
  }

  if (diff.diffType === 'removed') {
    // User removed a value — create a text_replace rule to clear it
    rules.push({
      id: `inferred-${startOrder}`,
      type: 'text_replace',
      targetField: field,
      config: { search: autoValue, replace: '', replaceAll: true },
      order: startOrder,
      enabled: true,
      description: `Clear ${field}`,
    });
    return rules;
  }

  // Modified — try to infer what transformation was applied

  // Check if it's a simple trim
  if (autoValue.trim() === correctedValue) {
    rules.push({
      id: `inferred-${startOrder}`,
      type: 'trim',
      targetField: field,
      config: {},
      order: startOrder,
      enabled: true,
      description: `Trim ${field}`,
    });
    return rules;
  }

  // Check if it's a case change
  if (autoValue.toLowerCase() === correctedValue.toLowerCase()) {
    if (correctedValue === autoValue.toLowerCase()) {
      rules.push({
        id: `inferred-${startOrder}`,
        type: 'lowercase',
        targetField: field,
        config: {},
        order: startOrder,
        enabled: true,
        description: `Lowercase ${field}`,
      });
    } else if (correctedValue === autoValue.toUpperCase()) {
      rules.push({
        id: `inferred-${startOrder}`,
        type: 'uppercase',
        targetField: field,
        config: {},
        order: startOrder,
        enabled: true,
        description: `Uppercase ${field}`,
      });
    }
    return rules;
  }

  // Check if it's a prefix addition
  if (correctedValue.endsWith(autoValue)) {
    const prefix = correctedValue.substring(0, correctedValue.length - autoValue.length);
    rules.push({
      id: `inferred-${startOrder}`,
      type: 'prefix',
      targetField: field,
      config: { prefix },
      order: startOrder,
      enabled: true,
      description: `Add prefix "${prefix}" to ${field}`,
    });
    return rules;
  }

  // Check if it's a suffix addition
  if (correctedValue.startsWith(autoValue)) {
    const suffix = correctedValue.substring(autoValue.length);
    rules.push({
      id: `inferred-${startOrder}`,
      type: 'suffix',
      targetField: field,
      config: { suffix },
      order: startOrder,
      enabled: true,
      description: `Add suffix "${suffix}" to ${field}`,
    });
    return rules;
  }

  // Check if HTML tags were stripped
  const strippedAuto = autoValue.replace(/<[^>]*>/g, '').trim();
  if (strippedAuto === correctedValue.trim()) {
    rules.push({
      id: `inferred-${startOrder}`,
      type: 'strip_tags',
      targetField: field,
      config: {},
      order: startOrder,
      enabled: true,
      description: `Strip HTML tags from ${field}`,
    });
    return rules;
  }

  // Check if it's a simple text replacement
  // Find the longest common prefix and suffix to detect the replaced portion
  const { oldText, newText } = findReplacedPortion(autoValue, correctedValue);
  if (oldText && oldText.length > 2) {
    rules.push({
      id: `inferred-${startOrder}`,
      type: 'text_replace',
      targetField: field,
      config: { search: oldText, replace: newText, replaceAll: true },
      order: startOrder,
      enabled: true,
      description: `Replace "${oldText.substring(0, 30)}" with "${newText.substring(0, 30)}" in ${field}`,
    });
    return rules;
  }

  // Fallback: create a regex replace rule with the full before/after
  // This is a last resort and may not generalize well
  rules.push({
    id: `inferred-${startOrder}`,
    type: 'text_replace',
    targetField: field,
    config: { search: autoValue, replace: correctedValue, replaceAll: false },
    order: startOrder,
    enabled: true,
    description: `Replace value of ${field}`,
  });

  return rules;
}

/**
 * Find the replaced portion between two strings by finding the longest
 * common prefix and suffix.
 */
function findReplacedPortion(
  before: string,
  after: string
): { oldText: string; newText: string } {
  // Find common prefix length
  let prefixLen = 0;
  const maxPrefix = Math.min(before.length, after.length);
  while (prefixLen < maxPrefix && before[prefixLen] === after[prefixLen]) {
    prefixLen++;
  }

  // Find common suffix length
  let suffixLen = 0;
  const maxSuffix = Math.min(before.length - prefixLen, after.length - prefixLen);
  while (
    suffixLen < maxSuffix &&
    before[before.length - 1 - suffixLen] === after[after.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  const oldText = before.substring(prefixLen, before.length - suffixLen);
  const newText = after.substring(prefixLen, after.length - suffixLen);

  return { oldText, newText };
}
