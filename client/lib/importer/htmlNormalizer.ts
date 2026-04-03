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
/**
 * Check if html contains an explicit FAQ H2 heading.
 */
function hasFaqHeading(html: string): boolean {
  const h2Pattern = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let m: RegExpExecArray | null;
  while ((m = h2Pattern.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]*>/g, '').trim();
    if (/\b(faq|faqs|frequently\s+asked|q\s*&\s*a|common\s+questions?)\b/i.test(text)) return true;
  }
  return false;
}

/**
 * Extract all H2 sections whose heading is an explicit FAQ heading.
 * Used to recover FAQ zones that may have been dropped by extractContentArea.
 */
function extractFaqZones(html: string): string {
  const h2Pattern = /<h2[^>]*>/gi;
  const positions: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = h2Pattern.exec(html)) !== null) positions.push(m.index);

  const parts: string[] = [];
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i];
    const end = i + 1 < positions.length ? positions[i + 1] : html.length;
    const section = html.substring(start, end);
    const headingMatch = section.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    if (headingMatch) {
      const text = headingMatch[1].replace(/<[^>]*>/g, '').trim();
      if (/\b(faq|faqs|frequently\s+asked|q\s*&\s*a|common\s+questions?)\b/i.test(text)) {
        parts.push(section);
      }
    }
  }
  return parts.join('\n');
}

export interface NormalizedHtmlResult {
  html: string;
  earlyPreservedHeading: string;
  earlyPreservedH1: string;
  earlyPreservedH2: string;
  earlyHeroTagline: string;
  earlyHadH1BeforeStrip: boolean;
  preservedHeading: string;
  preservedH1: string;
  preservedH2: string;
  hadH1BeforeStrip: boolean;
  mainContentDroppedEarlyH1: boolean;
}

function stripTagsToText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function countWords(text: string): number {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

type HeadingTagName = 'h1' | 'h2';

interface HeadingMatch {
  tagName: HeadingTagName;
  text: string;
  start: number;
  end: number;
}

function extractTagMatches(html: string, tagName: HeadingTagName): HeadingMatch[] {
  if (!html?.trim()) return [];

  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  const results: HeadingMatch[] = [];
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    const text = stripTagsToText(match[1]);
    if (!text) continue;
    results.push({
      tagName,
      text,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return results;
}

function findMeaningfulHeadingMatch(candidates: HeadingMatch[]): HeadingMatch | null {
  return candidates.find((candidate) => countWords(candidate.text) >= 3) || null;
}

function choosePreservedHeadingMatches(h1Candidates: HeadingMatch[], h2Candidates: HeadingMatch[]) {
  const meaningfulH1 = findMeaningfulHeadingMatch(h1Candidates);
  const meaningfulH2 = findMeaningfulHeadingMatch(h2Candidates);
  const preservedH1 = meaningfulH1 || (!meaningfulH2 ? h1Candidates[0] || null : null);
  const preservedH2 = meaningfulH2 || (!preservedH1 ? h2Candidates[0] || null : null);

  return {
    preservedHeading: preservedH1?.text || preservedH2?.text || '',
    preservedH1: preservedH1?.text || '',
    preservedH2: preservedH2?.text || '',
    hadH1BeforeStrip: h1Candidates.length > 0,
    chosenHeadingMatch: preservedH1 || preservedH2 || null,
  };
}

function extractPreservedHeadingData(html: string) {
  const h1Candidates = extractTagMatches(html, 'h1');
  const h2Candidates = extractTagMatches(html, 'h2');

  return choosePreservedHeadingMatches(h1Candidates, h2Candidates);
}

function stripForEarlyHeadingCapture(html: string): string {
  let result = html;

  result = result.replace(/<!DOCTYPE[^>]*>/gi, '');
  result = result.replace(/<head[\s>][\s\S]*?<\/head>/gi, '');
  result = result.replace(/<script[\s>][\s\S]*?<\/script>/gi, '');
  result = result.replace(/<style[\s>][\s\S]*?<\/style>/gi, '');
  result = result.replace(/<noscript[\s>][\s\S]*?<\/noscript>/gi, '');
  result = result.replace(/<footer[\s>][\s\S]*?<\/footer>/gi, '');
  result = result.replace(/<aside[\s>][\s\S]*?<\/aside>/gi, '');
  result = result.replace(/<nav[\s>][\s\S]*?<\/nav>/gi, '');
  result = result.replace(/<\/?(html|body)[^>]*>/gi, '');
  result = result.replace(/<\/?header[^>]*>/gi, '');

  return result;
}

function isLikelyHeroTaglineCandidate(text: string, headingText: string): boolean {
  const normalizedText = stripTagsToText(text);
  if (!normalizedText || normalizedText === headingText) return false;
  if (headingText && normalizedText.includes(headingText)) return false;

  const words = countWords(normalizedText);
  if (words < 2 || words > 24) return false;
  if (normalizedText.length > 180) return false;
  if (/^(home|back|menu|contact us|call now|learn more|get started)$/i.test(normalizedText)) return false;
  if (/[›»]/.test(normalizedText) || /\b(home|breadcrumb)\b/i.test(normalizedText)) return false;

  return true;
}

function extractHeroTaglineFromWindow(html: string, headingMatch: HeadingMatch | null): string {
  if (!headingMatch || headingMatch.tagName !== 'h1') return '';

  const windowStart = Math.max(0, headingMatch.start - 600);
  const windowEnd = Math.min(html.length, headingMatch.end + 1200);
  const windowHtml = html.slice(windowStart, windowEnd);

  const scoreCandidates = (pattern: RegExp, allowWrappers: boolean): string => {
    let match: RegExpExecArray | null;
    let bestCandidate = '';
    let bestScore = -Infinity;

    while ((match = pattern.exec(windowHtml)) !== null) {
      const tagName = match[1].toLowerCase();
      const innerHtml = match[2];
      if (!allowWrappers && (tagName === 'div' || tagName === 'span')) continue;
      if ((tagName === 'div' || tagName === 'span') && /<h[1-6][^>]*>|<p[^>]*>/i.test(innerHtml)) {
        continue;
      }

      const text = stripTagsToText(innerHtml);
      if (!isLikelyHeroTaglineCandidate(text, headingMatch.text)) continue;

      const absoluteIndex = windowStart + match.index;
      const distance = Math.min(
        Math.abs(absoluteIndex - headingMatch.start),
        Math.abs(absoluteIndex - headingMatch.end)
      );
      const priority = tagName === 'p' ? 40 : tagName === 'span' ? 32 : tagName === 'div' ? 24 : 28;
      const directionalBonus = absoluteIndex <= headingMatch.start ? 10 : 0;
      const score = priority + directionalBonus - distance / 20;

      if (score > bestScore) {
        bestScore = score;
        bestCandidate = text;
      }
    }

    return bestCandidate;
  };

  return (
    scoreCandidates(/<(p|h2|h3|h4|h5|h6)[^>]*>([\s\S]*?)<\/\1>/gi, false) ||
    scoreCandidates(/<(div|span)[^>]*>([\s\S]*?)<\/\1>/gi, true)
  );
}

function extractEarlyPreservedHeadingData(html: string) {
  const strippedHtml = stripForEarlyHeadingCapture(html);
  const h1Candidates = extractTagMatches(strippedHtml, 'h1');
  const h2Candidates = extractTagMatches(strippedHtml, 'h2');
  const chosen = choosePreservedHeadingMatches(h1Candidates, h2Candidates);

  return {
    earlyPreservedHeading: chosen.preservedHeading,
    earlyPreservedH1: chosen.preservedH1,
    earlyPreservedH2: chosen.preservedH2,
    earlyHeroTagline: extractHeroTaglineFromWindow(strippedHtml, chosen.chosenHeadingMatch),
    earlyHadH1BeforeStrip: chosen.hadH1BeforeStrip,
  };
}

function removePromotedHeroTagline(html: string, heroTagline: string): string {
  const normalizedHeroTagline = stripTagsToText(heroTagline);
  if (!html?.trim() || !normalizedHeroTagline) return html;

  const firstH2Index = html.search(/<h2[^>]*>/i);
  const searchLimit = firstH2Index >= 0 ? firstH2Index + 400 : Math.min(html.length, 2000);
  const elementPattern = /<(p|h2|h3|h4|h5|h6|div|span)([^>]*)>([\s\S]*?)<\/\1>/gi;
  let removed = false;

  return html.replace(elementPattern, (match, tagName, attrs, content, offset) => {
    if (removed || offset > searchLimit) return match;
    const text = stripTagsToText(content);
    if (text !== normalizedHeroTagline) return match;
    if (!isLikelyHeroTaglineCandidate(text, '')) return match;
    removed = true;
    return '';
  });
}

export function normalizeHtml(html: string, options: FilterOptions): string {
  return normalizeHtmlWithMetadata(html, options).html;
}

export function normalizeHtmlWithMetadata(html: string, options: FilterOptions): NormalizedHtmlResult {
  if (!html?.trim()) {
    return {
      html: '',
      earlyPreservedHeading: '',
      earlyPreservedH1: '',
      earlyPreservedH2: '',
      earlyHeroTagline: '',
      earlyHadH1BeforeStrip: false,
      preservedHeading: '',
      preservedH1: '',
      preservedH2: '',
      hadH1BeforeStrip: false,
      mainContentDroppedEarlyH1: false,
    };
  }

  const debug = !!(options as any).debug;
  const faqBefore = hasFaqHeading(html);

  function debugCheck(stepName: string, content: string) {
    if (!debug || !faqBefore) return;
    if (!hasFaqHeading(content)) {
      console.warn(`[normalizeHtml] FAQ heading LOST after step: ${stepName} (length: ${content.length})`);
    }
  }

  let result = html;

  // Capture title/tagline candidates before extractMainContent can drop hero/header wrappers.
  const earlyPreservedHeadingData = extractEarlyPreservedHeadingData(result);

  // 5a: Extract main content (strip shell, extract main column, unwrap wrappers)
  // Keep a stripped-shell copy to recover FAQ zones if they get dropped.
  const preExtract = result;
  result = extractMainContent(result);

  // If the original (post-shell-strip) had FAQ headings but the extracted area lost them,
  // append the FAQ zones so they are never silently discarded.
  if (hasFaqHeading(preExtract) && !hasFaqHeading(result)) {
    const faqZones = extractFaqZones(preExtract);
    if (faqZones) result = result + '\n' + faqZones;
  }
  debugCheck('extractMainContent', result);

  const postExtractHeadingData = extractPreservedHeadingData(result);
  const mainContentDroppedEarlyH1 = !!(
    earlyPreservedHeadingData.earlyPreservedH1 && !postExtractHeadingData.preservedH1
  );

  // 5a (second pass): After extractMainContent strips classes, newly-bare divs
  // (elements that had non-layout classes which are now gone) need another unwrap
  // pass. Rule 2: bare wrapper divs ARE layout wrappers.
  result = unwrapLayoutContainers(result);
  debugCheck('unwrapLayoutContainers', result);

  // 5b: Filter secondary content (sidebar widgets, CTAs, etc.)
  // Skipped for law-firm templates (practice, area) — the page shell/nav/sidebar is
  // already removed by extractMainContent; the AI content-splitting step handles
  // intelligent organization. Running secondary filtering risks removing legitimate
  // law-firm content (CTAs, contact sections, etc.).
  if (!options.skipSecondaryFilter) {
    result = filterSecondaryContent(result, options);
    debugCheck('filterSecondaryContent', result);
  }

  // 5c: Normalize URLs (relative → absolute)
  if (options.baseUrl) {
    result = normalizeUrls(result, options.baseUrl);
  }

  // 5d: Clean inline markup
  result = cleanInlineMarkup(result);
  debugCheck('cleanInlineMarkup', result);

  // If a hero tagline was promoted into a dedicated field, remove the matching
  // short hero subtitle from the body lead so it does not render twice.
  if (earlyPreservedHeadingData.earlyHeroTagline) {
    result = removePromotedHeroTagline(result, earlyPreservedHeadingData.earlyHeroTagline);
  }

  // Preserve the first meaningful heading from the cleaned main-content stream
  // BEFORE H1 stripping. This keeps title resolution stable without reintroducing
  // duplicate H1 markup into final body HTML.
  const preservedHeadingData = extractPreservedHeadingData(result);

  // 5e: Normalize headings
  result = normalizeHeadings(result);
  debugCheck('normalizeHeadings', result);

  // 5f: Remove duplicate blocks
  result = removeDuplicateBlocks(result);
  debugCheck('removeDuplicateBlocks', result);

  // 5g: Remove empty elements — FINAL pass, iterative (Rule 7)
  result = removeEmptyElements(result);
  debugCheck('removeEmptyElements', result);

  return {
    html: result.trim(),
    ...earlyPreservedHeadingData,
    preservedHeading: preservedHeadingData.preservedHeading,
    preservedH1: preservedHeadingData.preservedH1,
    preservedH2: preservedHeadingData.preservedH2,
    hadH1BeforeStrip: preservedHeadingData.hadH1BeforeStrip,
    mainContentDroppedEarlyH1,
  };
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
 * - Strip H1 tags entirely (page title H1 is mapped to the hero field, never body content)
 * - Fix heading hierarchy jumps (H2 → H5 becomes H2 → H3)
 */
function normalizeHeadings(html: string): string {
  let result = html;

  // Remove H1 entirely — the page title comes from the `title` field and belongs in the hero,
  // never in body content. Keeping it (or converting to H2) causes duplicate titles.
  result = result.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');

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
