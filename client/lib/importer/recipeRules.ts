// Recipe rules — Individual rule type implementations
// Each rule transforms a single field value

import type { RecipeRuleType } from './recipeTypes';
import { normalizeUrlSlug } from './preparer';
import { splitBodyOnH2 } from './splitBodyOnH2';

/** Rule executor function */
type RuleExecutor = (
  value: string,
  config: Record<string, unknown>,
  allFields: Record<string, string>
) => string;

/** Registry of rule executors */
const ruleExecutors: Record<RecipeRuleType, RuleExecutor> = {
  html_clean: executeHtmlClean,
  h2_split: executeH2Split,
  faq_extract: executeFaqExtract,
  slug_normalize: executeSlugNormalize,
  text_replace: executeTextReplace,
  regex_replace: executeRegexReplace,
  prefix: executePrefix,
  suffix: executeSuffix,
  default_value: executeDefaultValue,
  uppercase: (v) => v.toUpperCase(),
  lowercase: (v) => v.toLowerCase(),
  titlecase: executeTitleCase,
  trim: (v) => v.trim(),
  strip_tags: (v) => v.replace(/<[^>]*>/g, '').trim(),
  date_format: executeDateFormat,
  boolean_parse: executeBooleanParse,
  concat_fields: executeConcatFields,
  extract_first_image: executeExtractFirstImage,
  meta_from_content: executeMetaFromContent,
  custom_function: executeCustomFunction,
};

/**
 * Execute a single rule against a field value.
 */
export function executeRule(
  ruleType: RecipeRuleType,
  value: string,
  config: Record<string, unknown>,
  allFields: Record<string, string>
): string {
  const executor = ruleExecutors[ruleType];
  if (!executor) return value;
  return executor(value, config, allFields);
}

// ─── Rule Implementations ────────────────────────────────────────────────────

function executeHtmlClean(value: string, config: Record<string, unknown>): string {
  let result = value;

  if (config.stripEmptyTags !== false) {
    result = result.replace(/<(\w+)(\s[^>]*)?\s*>\s*<\/\1>/g, '');
  }

  if (config.stripComments) {
    result = result.replace(/<!--[\s\S]*?-->/g, '');
  }

  if (config.stripStyles) {
    result = result.replace(/\s*style="[^"]*"/gi, '');
  }

  if (config.stripClasses) {
    result = result.replace(/\s*class="[^"]*"/gi, '');
  }

  if (config.allowedTags) {
    const allowed = config.allowedTags as string[];
    const pattern = new RegExp(
      `<(?!\\/?(${allowed.join('|')})(\\s|>|\\/))[^>]*>`,
      'gi'
    );
    result = result.replace(pattern, '');
  }

  return result.trim();
}

function executeH2Split(value: string): string {
  const sections = splitBodyOnH2(value);
  return JSON.stringify(sections);
}

function executeFaqExtract(value: string): string {
  // Extract FAQ items — delegates to the same logic used in preparer
  const items: { question: string; answer: string }[] = [];
  const pattern = /<h[3-4][^>]*>([\s\S]*?)<\/h[3-4]>\s*([\s\S]*?)(?=<h[2-4]|$)/gi;
  let match;

  while ((match = pattern.exec(value)) !== null) {
    const q = match[1].replace(/<[^>]*>/g, '').trim();
    const a = match[2].trim();
    if (q && a && (q.endsWith('?') || /^(what|how|why|when|where|who|can|is|are|do|does|should)\b/i.test(q))) {
      items.push({ question: q, answer: a });
    }
  }

  return JSON.stringify(items);
}

function executeSlugNormalize(
  value: string,
  config: Record<string, unknown>,
  allFields: Record<string, string>
): string {
  const templateType = (config.templateType as 'practice' | 'post') || 'practice';
  return normalizeUrlSlug(value, allFields.title || '', templateType);
}

function executeTextReplace(value: string, config: Record<string, unknown>): string {
  const search = String(config.search ?? '');
  const replace = String(config.replace ?? '');
  if (!search) return value;
  if (config.replaceAll) {
    return value.split(search).join(replace);
  }
  return value.replace(search, replace);
}

function executeRegexReplace(value: string, config: Record<string, unknown>): string {
  const pattern = String(config.pattern ?? '');
  const replace = String(config.replace ?? '');
  const flags = String(config.flags ?? 'gi');
  if (!pattern) return value;

  try {
    const regex = new RegExp(pattern, flags);
    return value.replace(regex, replace);
  } catch {
    return value;
  }
}

function executePrefix(value: string, config: Record<string, unknown>): string {
  const prefix = String(config.prefix ?? '');
  if (!prefix || value.startsWith(prefix)) return value;
  return prefix + value;
}

function executeSuffix(value: string, config: Record<string, unknown>): string {
  const suffix = String(config.suffix ?? '');
  if (!suffix || value.endsWith(suffix)) return value;
  return value + suffix;
}

function executeDefaultValue(value: string, config: Record<string, unknown>): string {
  if (value.trim()) return value;
  return String(config.defaultValue ?? '');
}

function executeTitleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

function executeDateFormat(value: string, config: Record<string, unknown>): string {
  if (!value) return value;

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    const format = String(config.format ?? 'iso');
    if (format === 'iso') return date.toISOString();
    if (format === 'date') return date.toISOString().split('T')[0];
    return date.toISOString();
  } catch {
    return value;
  }
}

function executeBooleanParse(value: string): string {
  const truthy = ['true', '1', 'yes', 'on', 'published', 'active'];
  return truthy.includes(value.toLowerCase().trim()) ? 'true' : 'false';
}

function executeConcatFields(
  _value: string,
  config: Record<string, unknown>,
  allFields: Record<string, string>
): string {
  const fields = (config.fields as string[]) ?? [];
  const separator = String(config.separator ?? ' ');
  return fields.map((f) => allFields[f] ?? '').filter(Boolean).join(separator);
}

function executeExtractFirstImage(value: string): string {
  const match = value.match(/<img[^>]+src="([^"]+)"/i);
  return match ? match[1] : '';
}

function executeMetaFromContent(value: string, config: Record<string, unknown>): string {
  if (value.trim()) return value; // Don't overwrite existing

  const maxLength = (config.maxLength as number) ?? 160;
  // Strip HTML and get first N chars
  const text = value.replace(/<[^>]*>/g, '').trim();
  if (!text) return '';

  if (text.length <= maxLength) return text;

  // Cut at last word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

function executeCustomFunction(value: string, config: Record<string, unknown>): string {
  // Custom functions are defined as simple JS expressions
  // For security, we only allow basic string operations
  const expression = String(config.expression ?? '');
  if (!expression) return value;

  try {
    // Very limited eval — only allow string methods
    if (expression === 'trim') return value.trim();
    if (expression === 'lower') return value.toLowerCase();
    if (expression === 'upper') return value.toUpperCase();
    if (expression.startsWith('slice:')) {
      const [start, end] = expression.slice(6).split(',').map(Number);
      return value.slice(start, end);
    }
    return value;
  } catch {
    return value;
  }
}
