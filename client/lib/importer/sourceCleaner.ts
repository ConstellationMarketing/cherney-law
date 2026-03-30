// Source cleaner — Stages 1-4 of the pipeline
// Stage 1: Strip Shortcodes (but KEEP builder CSS classes!)
// Stage 2: Fix Encoding (HTML entities, mojibake)
// Stage 3: Normalize Whitespace
// Stage 4: Clean Empty HTML Wrappers

import type { FilterOptions, SourceRecord } from './types';

/**
 * Run stages 1-4 on all records.
 * CRITICAL: Builder CSS classes are preserved — they are needed by
 * the content filter's layout unwrapper in Stage 5.
 */
export function cleanSourceRecords(
  records: SourceRecord[],
  contentFields: string[],
  _filterOptions?: FilterOptions
): SourceRecord[] {
  return records.map((record) => ({
    rowIndex: record.rowIndex,
    data: cleanRecordData(record.data, contentFields),
  }));
}

/**
 * Clean a single record's data through stages 1-4.
 */
function cleanRecordData(
  data: Record<string, string>,
  contentFields: string[]
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    if (!value) {
      result[key] = value;
      continue;
    }

    const isContent = contentFields.includes(key);
    let cleaned = value;

    // Stage 1: Strip shortcode TAGS (but KEEP CSS class attributes on HTML elements)
    cleaned = stripShortcodes(cleaned);

    // Stage 2: Fix encoding
    cleaned = fixEncoding(cleaned);

    // Stage 3: Normalize whitespace
    cleaned = normalizeWhitespace(cleaned, isContent);

    // Stage 4: Clean empty HTML wrappers (light pass)
    if (isContent) {
      cleaned = cleanEmptyWrappers(cleaned);
    }

    result[key] = cleaned;
  }

  return result;
}

// ─── Stage 1: Strip Shortcodes ───────────────────────────────────────────────
// Strip shortcode TAGS like [et_pb_section], [vc_column], [fusion_builder_row]
// but DO NOT strip CSS class attributes from HTML elements.
// Builder class names on HTML elements are HINTS for the layout unwrapper.

/** Known shortcode prefixes from common page builders */
const SHORTCODE_PREFIXES = [
  'et_pb_',       // Divi
  'vc_',          // WPBakery
  'fusion_',      // Avada
  'fl_',          // Beaver Builder
  'cs_',          // Cornerstone
  'av_',          // Enfold
  'mk_',          // Jupiter
  'tatsu_',       // Starter theme
  'rev_slider',   // Revolution Slider
  'contact-form', // CF7
  'gravityform',  // Gravity Forms
  'wpforms',      // WPForms
  'ninja_form',   // Ninja Forms
];

/**
 * Strip WordPress/page builder shortcode tags.
 * Handles self-closing [tag /] and paired [tag]...[/tag].
 * Preserves content between paired tags.
 * 
 * CRITICAL: This strips SHORTCODE syntax ([...]) only.
 * It does NOT remove class="et_pb_*" from HTML elements.
 */
function stripShortcodes(html: string): string {
  // Build a pattern that matches known builder shortcodes
  // Also match generic shortcodes with common patterns
  const prefixPattern = SHORTCODE_PREFIXES.map(escapeRegex).join('|');

  // Match self-closing shortcodes: [tag attr="val" /]
  let result = html.replace(
    new RegExp(`\\[(?:${prefixPattern})[^\\]]*\\/\\]`, 'gi'),
    ''
  );

  // Match closing shortcode tags: [/tag]
  result = result.replace(
    new RegExp(`\\[\\/(?:${prefixPattern})\\w*\\]`, 'gi'),
    ''
  );

  // Match opening shortcode tags: [tag attr="val"]
  // This preserves content between open/close tags
  result = result.replace(
    new RegExp(`\\[(?:${prefixPattern})\\w*(?:\\s[^\\]]*)?\\]`, 'gi'),
    ''
  );

  // Also strip common standalone shortcodes
  result = result.replace(/\[(?:caption|gallery|embed|audio|video|playlist)[^\]]*\]/gi, '');
  result = result.replace(/\[\/(?:caption|gallery|embed|audio|video|playlist)\]/gi, '');

  return result;
}

// ─── Stage 2: Fix Encoding ───────────────────────────────────────────────────

/** Common mojibake patterns and their correct replacements */
const MOJIBAKE_MAP: [RegExp, string][] = [
  [/â€™/g, "'"],      // Right single quote
  [/â€˜/g, "'"],      // Left single quote
  [/â€œ/g, '"'],      // Left double quote
  [/â€"/g, '—'],      // Em dash (must be before generic â€ pattern)
  [/â€"/g, '–'],      // En dash
  [/â€¦/g, '…'],      // Ellipsis
  [/â€\x9D/g, '"'],   // Right double quote (â€\x9D)
  [/Â /g, ' '],        // Non-breaking space mojibake
  [/Â·/g, '·'],        // Middle dot
  [/Ã©/g, 'é'],       // e-acute
  [/Ã¨/g, 'è'],       // e-grave
  [/Ã¡/g, 'á'],       // a-acute
  [/Ã /g, 'à'],       // a-grave
  [/Ã¼/g, 'ü'],       // u-umlaut
  [/Ã¶/g, 'ö'],       // o-umlaut
  [/Ã¤/g, 'ä'],       // a-umlaut
  [/Ã±/g, 'ñ'],       // n-tilde
];

function fixEncoding(text: string): string {
  let result = text;

  // Fix mojibake
  for (const [pattern, replacement] of MOJIBAKE_MAP) {
    result = result.replace(pattern, replacement);
  }

  // Decode HTML entities
  result = decodeHtmlEntities(result);

  return result;
}

/**
 * Decode common HTML entities (both named and numeric).
 */
function decodeHtmlEntities(text: string): string {
  // Named entities
  const entityMap: Record<string, string> = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&apos;': "'", '&nbsp;': ' ', '&ndash;': '–', '&mdash;': '—',
    '&lsquo;': '\u2018', '&rsquo;': '\u2019', '&ldquo;': '\u201C', '&rdquo;': '\u201D',
    '&hellip;': '…', '&copy;': '©', '&reg;': '®', '&trade;': '™',
    '&bull;': '•', '&middot;': '·', '&deg;': '°',
    '&frac12;': '½', '&frac14;': '¼', '&frac34;': '¾',
  };

  let result = text;
  for (const [entity, char] of Object.entries(entityMap)) {
    result = result.split(entity).join(char);
  }

  // Numeric entities: &#123; or &#x1F; 
  result = result.replace(/&#(\d+);/g, (_, num) => {
    const code = parseInt(num, 10);
    return code > 0 && code < 0x10FFFF ? String.fromCodePoint(code) : '';
  });
  result = result.replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
    const code = parseInt(hex, 16);
    return code > 0 && code < 0x10FFFF ? String.fromCodePoint(code) : '';
  });

  return result;
}

// ─── Stage 3: Normalize Whitespace ───────────────────────────────────────────

function normalizeWhitespace(text: string, isHtml: boolean): string {
  if (isHtml) {
    // For HTML: collapse whitespace between tags, normalize line breaks
    let result = text;
    // Remove whitespace between tags
    result = result.replace(/>\s+</g, '><');
    // Collapse multiple spaces/tabs to single space within text
    result = result.replace(/[ \t]+/g, ' ');
    // Remove leading/trailing whitespace on each line
    result = result.replace(/^ +| +$/gm, '');
    // Collapse multiple blank lines
    result = result.replace(/\n{3,}/g, '\n\n');
    return result.trim();
  }

  // For plain text: collapse whitespace
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

// ─── Stage 4: Clean Empty HTML Wrappers ──────────────────────────────────────
// Light cleanup — remove obviously empty wrappers.
// The heavy lifting happens in Stage 5 (normalizeHtml).

function cleanEmptyWrappers(html: string): string {
  let result = html;
  let prev = '';

  // Iterate a few times to handle nested empties
  for (let i = 0; i < 3; i++) {
    prev = result;

    // Remove empty divs, spans, p tags (with optional attributes)
    result = result.replace(/<(div|span|p|section|article)(\s[^>]*)?\s*>\s*<\/\1>/gi, '');

    // Remove self-closing empty elements that shouldn't be
    result = result.replace(/<(div|span|p)\s*\/>/gi, '');

    if (result === prev) break;
  }

  return result;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
