// HTML normalizer — Stage 5 orchestration
// Wires together content extraction and all HTML normalization steps:
// 5a. extractMainContent
// 5b. filterSecondaryContent
// 5c. normalizeUrls
// 5d. cleanInlineMarkup
// 5e. normalizeHeadings
// 5f. removeDuplicateBlocks
// 5g. removeEmptyElements (iterative, FINAL)

import { extractMainContent, filterSecondaryContent, unwrapLayoutContainers } from './contentFilter';
import type { FilterOptions } from './types';

/**
 * Run the full Stage 5 HTML normalization pipeline on a content field.
 * 
 * CRITICAL Rule 7: removeEmptyElements runs LAST and iterates up to 10 times.
 * CRITICAL Rule 1: Builder CSS classes are available here — they were
 * NOT stripped in stages 1-4.
 */
export function normalizeHtml(html: string, options: FilterOptions): string {
  if (!html?.trim()) return '';

  let result = html;

  // 5a: Extract main content (strip shell, extract main column, unwrap wrappers)
  result = extractMainContent(result);

  // 5a (second pass): After extractMainContent strips classes, newly-bare divs
  // (elements that had non-layout classes which are now gone) need another unwrap
  // pass. Rule 2: bare wrapper divs ARE layout wrappers.
  result = unwrapLayoutContainers(result);

  // 5b: Filter secondary content (sidebar widgets, CTAs, etc.)
  // Skipped for law-firm templates (practice, area) — the page shell/nav/sidebar is
  // already removed by extractMainContent; the AI content-splitting step handles
  // intelligent organization. Running secondary filtering risks removing legitimate
  // law-firm content (CTAs, contact sections, etc.).
  if (!options.skipSecondaryFilter) {
    result = filterSecondaryContent(result, options);
  }

  // 5c: Normalize URLs (relative → absolute)
  if (options.baseUrl) {
    result = normalizeUrls(result, options.baseUrl);
  }

  // 5d: Clean inline markup
  result = cleanInlineMarkup(result);

  // 5e: Normalize headings
  result = normalizeHeadings(result);

  // 5f: Remove duplicate blocks
  result = removeDuplicateBlocks(result);

  // 5g: Remove empty elements — FINAL pass, iterative (Rule 7)
  result = removeEmptyElements(result);

  return result.trim();
}

// ─── 5c: Normalize URLs ──────────────────────────────────────────────────────

/**
 * Convert relative URLs to absolute URLs using the provided base URL.
 */
function normalizeUrls(html: string, baseUrl: string): string {
  // Normalize base URL (remove trailing slash)
  const base = baseUrl.replace(/\/$/, '');

  // Fix href attributes
  let result = html.replace(
    /\s(href|src|action)="([^"]*?)"/gi,
    (match, attr, url) => {
      const normalized = resolveUrl(url, base);
      return ` ${attr}="${normalized}"`;
    }
  );

  // Fix srcset attributes
  result = result.replace(
    /\ssrcset="([^"]*?)"/gi,
    (match, srcset) => {
      const normalized = srcset
        .split(',')
        .map((entry: string) => {
          const parts = entry.trim().split(/\s+/);
          if (parts[0]) parts[0] = resolveUrl(parts[0], base);
          return parts.join(' ');
        })
        .join(', ');
      return ` srcset="${normalized}"`;
    }
  );

  return result;
}

function resolveUrl(url: string, base: string): string {
  if (!url) return url;
  // Already absolute
  if (/^https?:\/\//i.test(url)) return url;
  // Protocol-relative
  if (url.startsWith('//')) return `https:${url}`;
  // Mailto/tel/javascript
  if (/^(mailto:|tel:|javascript:|#|data:)/i.test(url)) return url;
  // Root-relative
  if (url.startsWith('/')) return `${base}${url}`;
  // Relative
  return `${base}/${url}`;
}

// ─── 5d: Clean Inline Markup ─────────────────────────────────────────────────

/**
 * Clean inline markup:
 * - Unwrap empty <span>, <em>, <strong>, <b>, <i>, <u> tags
 * - Flatten unnecessarily nested inline tags (e.g., <strong><strong>text</strong></strong>)
 * - Remove style attributes from inline elements
 */
function cleanInlineMarkup(html: string): string {
  let result = html;
  let prev = '';

  for (let i = 0; i < 5; i++) {
    prev = result;

    // Remove empty inline elements
    result = result.replace(
      /<(span|em|strong|b|i|u|a|font|small|big|sub|sup)(\s[^>]*)?\s*>\s*<\/\1>/gi,
      ''
    );

    // Flatten nested identical inline tags: <strong><strong>x</strong></strong> → <strong>x</strong>
    result = result.replace(
      /<(strong|em|b|i|u)(\s[^>]*)?>(\s*)<\1(\s[^>]*)?>([\s\S]*?)<\/\1>(\s*)<\/\1>/gi,
      '<$1$2>$3$5$6</$1>'
    );

    // Remove <font> tags (legacy markup), keep content
    result = result.replace(/<\/?font[^>]*>/gi, '');

    // Remove style attributes from inline elements
    result = result.replace(
      /(<(?:span|em|strong|b|i|u|a|p|li|td|th)\s[^>]*?)style="[^"]*"/gi,
      '$1'
    );

    // Clean up double spaces in attributes
    result = result.replace(/\s{2,}>/g, '>');
    result = result.replace(/<(\w+)\s+>/g, '<$1>');

    if (result === prev) break;
  }

  return result;
}

// ─── 5e: Normalize Headings ──────────────────────────────────────────────────

/**
 * Normalize heading hierarchy:
 * - Convert extra H1 tags to H2 (only one H1 should exist, but it's usually the title)
 * - Fix heading hierarchy jumps (H2 → H5 becomes H2 → H3)
 */
function normalizeHeadings(html: string): string {
  let result = html;

  // Convert all H1 to H2 (the page title H1 comes from elsewhere)
  result = result.replace(/<h1([^>]*)>/gi, '<h2$1>');
  result = result.replace(/<\/h1>/gi, '</h2>');

  // Fix heading hierarchy: ensure no jumps > 1 level
  const headingPattern = /<h([2-6])([^>]*)>([\s\S]*?)<\/h\1>/gi;
  const headings: { level: number; match: string; start: number; end: number }[] = [];
  let match;

  while ((match = headingPattern.exec(result)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      match: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  if (headings.length < 2) return result;

  // Build a mapping of old level → new level
  const levelMap = new Map<number, number>();
  let lastLevel = 2;

  for (const h of headings) {
    if (!levelMap.has(h.level)) {
      if (h.level <= lastLevel + 1) {
        levelMap.set(h.level, h.level);
      } else {
        levelMap.set(h.level, lastLevel + 1);
      }
    }
    lastLevel = levelMap.get(h.level) ?? h.level;
  }

  // Apply level mapping (only if changes needed)
  let needsRemap = false;
  for (const [old, nw] of levelMap) {
    if (old !== nw) { needsRemap = true; break; }
  }

  if (needsRemap) {
    result = result.replace(/<h([2-6])([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, level, attrs, content) => {
      const oldLevel = parseInt(level);
      const newLevel = levelMap.get(oldLevel) ?? oldLevel;
      return `<h${newLevel}${attrs}>${content}</h${newLevel}>`;
    });
  }

  return result;
}

// ─── 5f: Remove Duplicate Blocks ─────────────────────────────────────────────

/**
 * Remove duplicate content blocks (exact or near-exact matches).
 */
function removeDuplicateBlocks(html: string): string {
  // Split on block-level elements and compare
  const blockPattern = /(<(?:p|div|h[1-6]|ul|ol|table|blockquote|pre|figure|section|article)[^>]*>[\s\S]*?<\/(?:p|div|h[1-6]|ul|ol|table|blockquote|pre|figure|section|article)>)/gi;

  const blocks: string[] = [];
  const seen = new Set<string>();
  let lastIdx = 0;
  const result: string[] = [];
  let match;

  while ((match = blockPattern.exec(html)) !== null) {
    // Add text between blocks
    if (match.index > lastIdx) {
      result.push(html.substring(lastIdx, match.index));
    }

    const block = match[1];
    // Normalize for comparison (strip whitespace, lowercase)
    const normalized = block.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

    // Only deduplicate substantial blocks (> 50 chars)
    if (normalized.length > 50 && seen.has(normalized)) {
      // Skip duplicate
    } else {
      seen.add(normalized);
      result.push(block);
    }

    lastIdx = match.index + match[0].length;
  }

  result.push(html.substring(lastIdx));
  return result.join('');
}

// ─── 5g: Remove Empty Elements ───────────────────────────────────────────────

/**
 * Remove empty elements iteratively.
 * CRITICAL Rule 7: This runs at the END of normalizeHtml and iterates
 * up to 10 times to handle cascading empties (inner removed → outer becomes empty).
 */
function removeEmptyElements(html: string): string {
  let result = html;
  let prev = '';

  for (let i = 0; i < 10; i++) {
    prev = result;

    // Remove empty block elements
    result = result.replace(
      /<(div|p|section|article|span|ul|ol|li|blockquote|figure|figcaption|main|aside|header|footer|table|thead|tbody|tr|td|th)(\s[^>]*)?\s*>\s*<\/\1>/gi,
      ''
    );

    // Remove empty headings
    result = result.replace(/<h([1-6])(\s[^>]*)?\s*>\s*<\/h\1>/gi, '');

    // Remove <br> at start/end of block elements
    result = result.replace(/(<(?:div|p|li|td|th|blockquote)[^>]*>)\s*(<br\s*\/?>)+/gi, '$1');
    result = result.replace(/(<br\s*\/?>)+\s*(<\/(?:div|p|li|td|th|blockquote)>)/gi, '$2');

    // Remove consecutive <br> tags (more than 2)
    result = result.replace(/(<br\s*\/?>[\s]*){3,}/gi, '<br><br>');

    // Collapse whitespace between tags
    result = result.replace(/>\s+</g, '><');

    if (result === prev) break;
  }

  // Final whitespace cleanup
  result = result.replace(/^\s+|\s+$/g, '');

  return result;
}
