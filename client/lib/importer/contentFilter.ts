// Content filter — Stage 5a-5b of the pipeline
// 5a: Extract Main Content (strip page shell, extract main column, unwrap layout containers)
// 5b: Filter Secondary Content (sidebar widgets, CTAs, post listings, etc.)

import type { FilterOptions } from './types';

// ─── Builder CSS class patterns ──────────────────────────────────────────────
// Used to IDENTIFY layout wrappers BEFORE stripping classes.

const BUILDER_CLASS_PATTERNS = [
  /\belementor-\w+/g,
  /\bet_pb_\w+/g,
  /\bvc_\w+/g,
  /\bfl-\w+/g,
  /\bfusion-\w+/g,
  /\bav[-_]\w+/g,
  /\bcs-\w+/g,
  /\bwpb-\w+/g,
  /\bdivi-\w+/g,
];

/** Layout container class patterns that indicate a wrapper div */
const LAYOUT_CONTAINER_CLASSES = [
  // Divi
  /\bet_pb_(section|row|column|module)\b/,
  /\bet_pb_row_inner\b/,
  /\bet_pb_column_\d/,
  // Elementor
  /\belementor-(section|column|widget-wrap|element|container)\b/,
  /\belementor-row\b/,
  // WPBakery
  /\bvc_(row|column|row_inner|column_inner)\b/,
  /\bwpb_(row|column|wrapper)\b/,
  // Avada
  /\bfusion-(layout|column|builder|row)\b/,
  /\bfusion-fullwidth\b/,
  // Beaver Builder
  /\bfl-(row|col|module|node)\b/,
  // Generic
  /\bcontainer\b/,
  /\brow\b/,
  /\bwrapper\b/,
  /\bcol-\w+/,
  /\bcolumn\b/,
  /\binner\b/,
  /\bcontent-area\b/,
  /\bmain-content\b/,
  /\bpage-content\b/,
  /\bentry-content\b/,
  /\bsite-content\b/,
  /\bpost-content\b/,
];

/** Column class patterns used to detect multi-column layouts */
const COLUMN_SIZE_PATTERNS = [
  // Divi: et_pb_column_1_3, et_pb_column_2_3, etc.
  /\bet_pb_column_(\d+)_(\d+)\b/,
  // Elementor: elementor-col-33, elementor-col-66
  /\belementor-col-(\d+)\b/,
  // WPBakery: vc_col-sm-4, vc_col-sm-8
  /\bvc_col-\w+-(\d+)\b/,
  // Bootstrap: col-md-4, col-lg-8
  /\bcol-\w+-(\d+)\b/,
];

// ─── 5a: Extract Main Content ────────────────────────────────────────────────

/**
 * Extract the inner HTML of an element given its opening tag start position.
 * Uses the depth-tracking findMatchingClose().
 */
function extractInnerContent(html: string, tagStart: number, tagName: string): string {
  const closeEnd = findMatchingClose(html, tagStart, tagName);
  if (closeEnd <= tagStart) return '';
  const openTagEnd = html.indexOf('>', tagStart) + 1;
  const closeTagStart = closeEnd - `</${tagName}>`.length;
  if (openTagEnd > 0 && closeTagStart > openTagEnd) {
    return html.substring(openTagEnd, closeTagStart);
  }
  return '';
}

/**
 * Layer 1: Semantic content-area targeting.
 * Tries to find the actual body content by looking for known semantic markers
 * before falling back to column detection.
 * Returns the inner HTML of the content area, or the original html if not found.
 */
function extractContentArea(html: string): string {
  // Priority 1: Divi Theme Builder post content module.
  // This is the module that injects page-builder content into the page body.
  const diviPostContent = html.match(/<div[^>]*class="[^"]*et_pb_post_content[^"]*"[^>]*>/i);
  if (diviPostContent && diviPostContent.index !== undefined) {
    const inner = extractInnerContent(html, diviPostContent.index, 'div');
    if (inner.trim().length > 100) return inner;
  }

  // Priority 2: Divi inner post layout wrapper (older Divi structures)
  const diviPostLayout = html.match(/<div[^>]*class="[^"]*et-l--post[^"]*"[^>]*>/i);
  if (diviPostLayout && diviPostLayout.index !== undefined) {
    const inner = extractInnerContent(html, diviPostLayout.index, 'div');
    if (inner.trim().length > 100) return inner;
  }

  // Priority 3: WordPress standard content wrappers
  const wpContent = html.match(
    /<(div|article|section)[^>]*class="[^"]*(?:entry-content|post-content|article-content)[^"]*"[^>]*>/i
  );
  if (wpContent && wpContent.index !== undefined) {
    const tag = (wpContent[0].match(/^<(\w+)/) ?? [])[1] ?? 'div';
    const inner = extractInnerContent(html, wpContent.index, tag);
    if (inner.trim().length > 100) return inner;
  }

  // Priority 4: itemprop="articleBody"
  const articleBody = html.match(/<[^>]+itemprop="articleBody"[^>]*>/i);
  if (articleBody && articleBody.index !== undefined) {
    const tag = (articleBody[0].match(/^<(\w+)/) ?? [])[1] ?? 'div';
    const inner = extractInnerContent(html, articleBody.index, tag);
    if (inner.trim().length > 100) return inner;
  }

  // Priority 5: role="main"
  const roleMain = html.match(/<[^>]+role="main"[^>]*>/i);
  if (roleMain && roleMain.index !== undefined) {
    const tag = (roleMain[0].match(/^<(\w+)/) ?? [])[1] ?? 'div';
    const inner = extractInnerContent(html, roleMain.index, tag);
    if (inner.trim().length > 100) return inner;
  }

  // Priority 6: id="main-content" / id="content" / id="main"
  const idContent = html.match(/<(div|main|section)[^>]*id="(?:main-content|content|main)"[^>]*>/i);
  if (idContent && idContent.index !== undefined) {
    const tag = (idContent[0].match(/^<(\w+)/) ?? [])[1] ?? 'div';
    const inner = extractInnerContent(html, idContent.index, tag);
    if (inner.trim().length > 100) return inner;
  }

  // No content area found — return original html for fallback column detection
  return html;
}

/**
 * Extract the main content from a full HTML document or fragment.
 * Strips page shell, tries semantic content-area targeting first (Layer 1),
 * falls back to column detection (Layer 2), then unwraps layout containers
 * and strips non-semantic attributes.
 *
 * CRITICAL: Builder CSS classes are used HERE for identification,
 * then stripped AFTER unwrapping.
 */
export function extractMainContent(html: string): string {
  let result = html;

  // Step 1: Strip page shell (DOCTYPE, html, head, body, script, style, nav, footer, header)
  result = stripPageShell(result);

  // Step 2a: Try semantic content-area targeting first (Layer 1)
  const contentArea = extractContentArea(result);
  if (contentArea !== result) {
    // Successfully isolated the content area — skip column detection entirely
    result = contentArea;
  } else {
    // Step 2b: Fall back to column detection with full-width skipping fix (Layer 2)
    result = extractMainColumn(result);
  }

  // Step 3: Unwrap layout containers (builder divs, generic wrappers)
  result = unwrapLayoutContainers(result);

  // Step 4: Strip non-semantic attributes (class, id, style, data-*)
  // This happens AFTER unwrapping so the unwrapper can use class hints
  result = stripNonSemanticAttributes(result);

  return result;
}

/**
 * Strip the page shell: DOCTYPE, <html>, <head>, <body>, <script>, <style>,
 * <nav>, <footer>, <header>, <noscript> tags.
 */
function stripPageShell(html: string): string {
  let result = html;

  // Remove DOCTYPE
  result = result.replace(/<!DOCTYPE[^>]*>/gi, '');

  // Remove <html> and </html> tags
  result = result.replace(/<\/?html[^>]*>/gi, '');

  // Remove entire <head>...</head> block
  result = result.replace(/<head[\s>][\s\S]*?<\/head>/gi, '');

  // Remove <body> and </body> tags (keep content)
  result = result.replace(/<\/?body[^>]*>/gi, '');

  // Remove all <script>...</script> blocks
  result = result.replace(/<script[\s>][\s\S]*?<\/script>/gi, '');

  // Remove all <style>...</style> blocks
  result = result.replace(/<style[\s>][\s\S]*?<\/style>/gi, '');

  // Remove <noscript>...</noscript>
  result = result.replace(/<noscript[\s>][\s\S]*?<\/noscript>/gi, '');

  // Remove <nav>...</nav>
  result = removeTagWithContent(result, 'nav');

  // Remove <footer>...</footer>
  result = removeTagWithContent(result, 'footer');

  // Remove <header>...</header> (page header, not content headers)
  // Only remove if it looks like a site header (contains nav, logo, etc.)
  result = result.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, (match) => {
    // Keep headers that look like content (contain h1-h6, p tags with text)
    if (/<h[1-6][^>]*>/.test(match) && !/<nav/i.test(match)) {
      // Strip the header tag but keep content
      return match.replace(/<\/?header[^>]*>/gi, '');
    }
    return '';
  });

  // Remove <aside>...</aside>
  result = removeTagWithContent(result, 'aside');

  return result;
}

/**
 * Extract the main content column from multi-column layouts.
 * In Divi, a 2/3 + 1/3 layout has the main content in the 2/3 column.
 */
function extractMainColumn(html: string): string {
  // Look for multi-column layout patterns
  // Try to find the "larger" column (2/3, 3/4, 8/12, etc.)

  // Divi: et_pb_column_2_3 vs et_pb_column_1_3
  const diviMatch = html.match(
    /<div[^>]*class="[^"]*et_pb_column_(\d+)_(\d+)[^"]*"[^>]*>/i
  );

  if (diviMatch) {
    return extractLargestColumn(html, COLUMN_SIZE_PATTERNS);
  }

  // Check for Bootstrap / generic column patterns
  const bootstrapMatch = html.match(/<div[^>]*class="[^"]*col-\w+-\d+[^"]*"[^>]*>/i);
  if (bootstrapMatch) {
    return extractLargestColumn(html, COLUMN_SIZE_PATTERNS);
  }

  return html;
}

/**
 * Find all column divs, determine which is the "main" (largest) one,
 * and return its content.
 */
function extractLargestColumn(html: string, patterns: RegExp[]): string {
  // Find all top-level column divs with size indicators
  const columnRegex = /<div[^>]*class="([^"]*)"[^>]*>/gi;
  let match;
  const columns: { start: number; end: number; size: number; classStr: string }[] = [];

  while ((match = columnRegex.exec(html)) !== null) {
    const classStr = match[1];
    let size = 0;

    for (const pattern of patterns) {
      const sizeMatch = classStr.match(pattern);
      if (sizeMatch) {
        if (sizeMatch[2]) {
          // Fraction: e.g., et_pb_column_2_3 → 2/3
          size = parseInt(sizeMatch[1]) / parseInt(sizeMatch[2]);
        } else {
          // Percentage/grid: e.g., col-md-8 → 8/12
          size = parseInt(sizeMatch[1]) / 12;
        }
        break;
      }
    }

    if (size > 0) {
      const closeIdx = findMatchingClose(html, match.index, 'div');
      if (closeIdx > match.index) {
        columns.push({ start: match.index, end: closeIdx, size, classStr });
      }
    }
  }

  if (columns.length < 2) return html;

  // Skip full-width columns (size >= 0.99) when partial-width columns also exist.
  // Full-width columns are header/hero wrappers, not the actual content column.
  // Example: Divi 4/4 hero wrapper vs 2/3 content column vs 1/3 sidebar.
  const partialCols = columns.filter((c) => c.size < 0.99);
  const candidates = partialCols.length >= 1 ? partialCols : columns;

  // Pick the largest among candidates
  const largest = candidates.reduce((a, b) => (a.size >= b.size ? a : b));

  // Extract content inside the largest column div
  const openTagEnd = html.indexOf('>', largest.start) + 1;
  const closeTagStart = largest.end - '</div>'.length;
  if (openTagEnd > 0 && closeTagStart > openTagEnd) {
    return html.substring(openTagEnd, closeTagStart);
  }

  return html;
}

/**
 * Find the matching closing tag for an opening tag, using depth tracking.
 * CRITICAL: Simple regex can't handle nested tags — we count depth.
 */
export function findMatchingClose(html: string, startIdx: number, tagName: string): number {
  const openPattern = new RegExp(`<${tagName}[\\s>]`, 'gi');
  const closePattern = new RegExp(`</${tagName}>`, 'gi');

  let depth = 0;
  let pos = startIdx;

  // Count the opening tag at startIdx
  openPattern.lastIndex = startIdx;
  const firstOpen = openPattern.exec(html);
  if (!firstOpen || firstOpen.index !== startIdx) return -1;
  depth = 1;
  pos = firstOpen.index + firstOpen[0].length;

  // Scan forward looking for open/close tags
  while (pos < html.length && depth > 0) {
    // Find next opening or closing tag
    openPattern.lastIndex = pos;
    closePattern.lastIndex = pos;

    const nextOpen = openPattern.exec(html);
    const nextClose = closePattern.exec(html);

    if (!nextClose) return -1; // No matching close

    if (nextOpen && nextOpen.index < nextClose.index) {
      // Always increment depth — real layout tags (div, section, article) are never self-closing.
      // Void/self-closing elements (br, img, input) do NOT match the <div|section|article> pattern.
      depth++;
      pos = nextOpen.index + nextOpen[0].length;
    } else {
      depth--;
      if (depth === 0) {
        return nextClose.index + nextClose[0].length;
      }
      pos = nextClose.index + nextClose[0].length;
    }
  }

  return -1;
}

/**
 * Unwrap layout container divs, keeping their inner content.
 * A layout container is a div/section/article used purely for layout
 * (identified by builder CSS classes or being a bare wrapper).
 *
 * Exported so htmlNormalizer can run a second pass AFTER classes are stripped.
 */
export function unwrapLayoutContainers(html: string): string {
  let result = html;
  let prev = '';

  // Multiple passes to handle nested wrappers
  for (let pass = 0; pass < 10; pass++) {
    prev = result;
    result = unwrapSinglePass(result);
    if (result === prev) break;
  }

  return result;
}

/**
 * Single pass of unwrapping layout wrapper divs.
 */
function unwrapSinglePass(html: string): string {
  // Match opening div/section/article tags
  const tagPattern = /<(div|section|article)(\s[^>]*)?\s*>/gi;
  let result = '';
  let lastIdx = 0;
  let match;

  // Reset lastIndex
  tagPattern.lastIndex = 0;

  while ((match = tagPattern.exec(html)) !== null) {
    const tagName = match[1].toLowerCase();
    const attrs = match[2] || '';

    if (isLayoutWrapper(attrs)) {
      // Find the matching close tag
      const closeEnd = findMatchingClose(html, match.index, tagName);

      if (closeEnd > 0) {
        // Output everything before this tag
        result += html.substring(lastIdx, match.index);

        // Output the inner content (skip the opening and closing tags)
        const innerStart = match.index + match[0].length;
        const innerEnd = closeEnd - `</${tagName}>`.length;
        if (innerEnd > innerStart) {
          result += html.substring(innerStart, innerEnd);
        }

        lastIdx = closeEnd;
        tagPattern.lastIndex = lastIdx;
      }
    }
  }

  result += html.substring(lastIdx);
  return result;
}

/**
 * Determine if a tag's attributes indicate it's a layout wrapper.
 * 
 * CRITICAL Rule 2: Bare wrapper divs (no attributes) ARE layout wrappers.
 */
function isLayoutWrapper(attrs: string): boolean {
  const trimmed = attrs.trim();

  // Rule 2: A div with NO attributes is a leftover layout wrapper
  if (!trimmed) return true;

  // Check if it has a builder layout class
  const classMatch = trimmed.match(/class="([^"]*)"/i);
  if (classMatch) {
    const classStr = classMatch[1];
    return isLayoutContainerClass(classStr);
  }

  // Has non-class attributes only (e.g., id, data-*) — might still be a wrapper
  // Check if it only has id/data attributes (no meaningful content attributes)
  if (/^(?:\s*(?:id|data-\w+|role|aria-\w+)\s*=\s*"[^"]*"\s*)+$/i.test(trimmed)) {
    return true;
  }

  return false;
}

/**
 * Check if a class string indicates a layout container.
 */
function isLayoutContainerClass(classStr: string): boolean {
  for (const pattern of LAYOUT_CONTAINER_CLASSES) {
    if (pattern.test(classStr)) return true;
  }
  return false;
}

/**
 * Strip non-semantic attributes from elements.
 * Called AFTER unwrapping so builder classes were already used for identification.
 * 
 * - Strip class, id, style, data-* from wrapper elements (div, section, article)
 * - Strip builder-specific classes from semantic elements (p, h1-h6, ul, ol, li, etc.)
 */
function stripNonSemanticAttributes(html: string): string {
  // Wrapper elements: strip ALL non-semantic attributes
  let result = html.replace(
    /<(div|section|article|main|aside|figure|figcaption)(\s[^>]*?)(\s*\/?)>/gi,
    (match, tag, attrs, selfClose) => {
      const cleaned = stripAttrs(attrs, true);
      return `<${tag}${cleaned}${selfClose}>`;
    }
  );

  // Semantic elements: strip builder-specific classes but keep href, src, alt, etc.
  result = result.replace(
    /<(p|h[1-6]|ul|ol|li|blockquote|pre|code|table|tr|td|th|thead|tbody|dl|dt|dd|span|em|strong|b|i|u|a|img|br|hr)(\s[^>]*?)(\s*\/?)>/gi,
    (match, tag, attrs, selfClose) => {
      const cleaned = stripAttrs(attrs, false);
      return `<${tag}${cleaned}${selfClose}>`;
    }
  );

  return result;
}

/**
 * Strip attributes from an HTML tag's attribute string.
 * @param attrs - The attribute string (everything between tag name and >)
 * @param stripAll - If true, strip all non-semantic attrs. If false, only strip builder classes.
 */
function stripAttrs(attrs: string, stripAll: boolean): string {
  if (!attrs?.trim()) return '';

  if (stripAll) {
    // Keep only semantically meaningful attributes
    const keep: string[] = [];
    const attrPattern = /(\w[\w-]*)="([^"]*)"/g;
    let m;
    while ((m = attrPattern.exec(attrs)) !== null) {
      const name = m[1].toLowerCase();
      // Keep: href, src, alt, title, colspan, rowspan, type, target, rel
      if (['href', 'src', 'alt', 'title', 'colspan', 'rowspan', 'type', 'target', 'rel', 'width', 'height'].includes(name)) {
        keep.push(`${name}="${m[2]}"`);
      }
    }
    return keep.length > 0 ? ' ' + keep.join(' ') : '';
  }

  // For semantic elements: remove builder-specific classes but keep others
  let result = attrs;

  // Remove class attribute if it only contains builder classes
  result = result.replace(/\s*class="([^"]*)"/gi, (match, classStr) => {
    let cleaned = classStr;
    for (const pattern of BUILDER_CLASS_PATTERNS) {
      cleaned = cleaned.replace(pattern, '');
    }
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned ? ` class="${cleaned}"` : '';
  });

  // Remove id, style, data-* attributes
  result = result.replace(/\s*(?:id|style|data-[\w-]+)="[^"]*"/gi, '');

  return result;
}

// ─── 5b: Filter Secondary Content ────────────────────────────────────────────

/**
 * Filter out secondary content blocks (sidebars, CTAs, post listings, etc.).
 * Groups content into H2-delimited blocks, strips h3-h6 sub-sections inside
 * kept blocks first, then evaluates each block.
 * 
 * CRITICAL Rule 5: Strip h3-h6 sub-sections INSIDE H2 blocks BEFORE
 * evaluating whether the block itself is secondary.
 */
export function filterSecondaryContent(html: string, options: FilterOptions): string {
  // Split into H2-delimited blocks
  const blocks = splitOnH2(html);

  const kept: string[] = [];

  for (const block of blocks) {
    // Rule 5: Strip secondary h3-h6 sub-sections inside this block first
    let cleaned = stripSecondarySubSections(block);

    // Now evaluate the cleaned block
    if (isSecondaryBlock(cleaned, options)) {
      continue; // Skip this block
    }

    kept.push(cleaned);
  }

  return kept.join('');
}

/**
 * Split HTML into blocks delimited by H2 tags.
 * The H2 tag is included at the start of each block (except possibly the first).
 */
function splitOnH2(html: string): string[] {
  const blocks: string[] = [];
  const h2Pattern = /<h2[^>]*>/gi;
  let lastIdx = 0;
  let match;

  while ((match = h2Pattern.exec(html)) !== null) {
    if (match.index > lastIdx) {
      blocks.push(html.substring(lastIdx, match.index));
    }
    lastIdx = match.index;
  }

  if (lastIdx < html.length) {
    blocks.push(html.substring(lastIdx));
  }

  return blocks.filter((b) => b.trim());
}

/**
 * Strip secondary h3-h6 sub-sections from inside a block.
 * Detects patterns like: <h3>Recent Posts</h3><ul>...</ul>
 * These are sidebar widgets that ended up inside a content section.
 */
function stripSecondarySubSections(block: string): string {
  const subHeadingPattern = /<h([3-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let result = block;
  let match;

  // Find all h3-h6 headings and check if they're secondary
  const removals: { start: number; end: number }[] = [];

  while ((match = subHeadingPattern.exec(block)) !== null) {
    const headingText = match[2].replace(/<[^>]*>/g, '').trim().toLowerCase();

    if (isSecondaryHeading(headingText)) {
      // Find the end of this sub-section (next heading of same or higher level, or end)
      const level = parseInt(match[1]);
      const sectionEnd = findSubSectionEnd(block, match.index + match[0].length, level);
      removals.push({ start: match.index, end: sectionEnd });
    }
  }

  // Apply removals in reverse order
  for (let i = removals.length - 1; i >= 0; i--) {
    result = result.substring(0, removals[i].start) + result.substring(removals[i].end);
  }

  return result;
}

/** Headings that indicate secondary/widget content */
// NOTE: Do NOT add law-firm headings like "free consultation", "contact us",
// "about us", "our location", "office hours" — these are MAIN content on
// law firm pages, not sidebar widgets.
const SECONDARY_HEADING_PATTERNS = [
  /recent\s+posts?/i,
  /latest\s+posts?/i,
  /related\s+posts?/i,
  /popular\s+posts?/i,
  /categories/i,
  /archives?/i,
  /tags?$/i,
  /recent\s+comments?/i,
  /search/i,
  /subscribe/i,
  /newsletter/i,
  /follow\s+us/i,
  /social\s+media/i,
  /connect\s+with\s+(us|me)/i,
  /about\s+the\s+author/i,
  /share\s+this/i,
  /leave\s+a\s+(comment|reply)/i,
  /related\s+articles?/i,
  /you\s+may\s+also\s+like/i,
  /more\s+from/i,
];

function isSecondaryHeading(text: string): boolean {
  return SECONDARY_HEADING_PATTERNS.some((p) => p.test(text));
}

/**
 * Find the end of a sub-section: next heading of same or higher level, or end of block.
 */
function findSubSectionEnd(html: string, startIdx: number, level: number): number {
  const nextHeadingPattern = new RegExp(`<h([1-${level}])[^>]*>`, 'gi');
  nextHeadingPattern.lastIndex = startIdx;

  const match = nextHeadingPattern.exec(html);
  return match ? match.index : html.length;
}

/**
 * Check if a block's H2 heading is an explicit FAQ heading.
 * FAQ blocks must NEVER be removed regardless of other heuristics.
 */
function isFaqHeading(block: string): boolean {
  const headingMatch = block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  if (!headingMatch) return false;
  const text = headingMatch[1].replace(/<[^>]*>/g, '').trim();
  return /\b(faq|faqs|frequently\s+asked|q\s*&\s*a|common\s+questions?)\b/i.test(text);
}

/**
 * Determine if a block is secondary content that should be removed.
 */
function isSecondaryBlock(block: string, options: FilterOptions): boolean {
  // FAQ blocks are NEVER secondary — protect them unconditionally.
  if (isFaqHeading(block)) return false;

  const textContent = block.replace(/<[^>]*>/g, '').trim();

  // Very short blocks with no real content
  if (textContent.length < 60 && !/<img/i.test(block)) return true;

  // Contact/CTA blocks
  if (options.removeContactBlocks && isContactBlock(block, textContent)) return true;

  // Post listing widgets
  if (options.removePostListings && isPostListing(block)) return true;

  // Sidebar widgets
  if (options.removeSidebarWidgets && isSidebarWidget(block, textContent)) return true;

  // Newsletter blocks
  if (options.removeNewsletterBlocks && isNewsletterBlock(block, textContent)) return true;

  // Comment sections
  if (options.removeCommentSections && isCommentSection(block)) return true;

  // Form blocks
  if (options.removeFormBlocks && isFormBlock(block)) return true;

  // High link density blocks
  if (isHighLinkDensity(block, textContent, options.linkDensityThreshold)) return true;

  return false;
}

function isContactBlock(html: string, text: string): boolean {
  // Only remove if it's a very short standalone CTA widget.
  // Longer text means it's legitimate content that happens to mention consultation.
  // Law firm pages legitimately use CTA/consultation language throughout.
  if (text.length > 120) return false;

  const contactPatterns = [
    /free\s+(consultation|case\s+(review|evaluation))/i,
    /call\s+(us|now|today)/i,
    /contact\s+(us|our\s+office)/i,
    /schedule\s+(a\s+)?(free\s+)?consultation/i,
    /get\s+(your\s+)?free/i,
    /speak\s+with\s+(a|an)\s+(attorney|lawyer)/i,
  ];

  if (contactPatterns.some((p) => p.test(text))) return true;

  // Phone number links with very short surrounding text (pure CTA widget)
  const phoneLinks = (html.match(/href="tel:/gi) ?? []).length;
  if (phoneLinks >= 1 && text.length < 80) return true;

  return false;
}

function isPostListing(html: string): boolean {
  // Rule 6: Detect both <article> lists and <ul>/<ol> link-lists

  // Multiple article elements = post listing
  const articleCount = (html.match(/<article/gi) ?? []).length;
  if (articleCount >= 3) return true;

  // UL/OL with 3+ LI items that are primarily links
  const listMatch = html.match(/<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi);
  if (listMatch) {
    for (const list of listMatch) {
      const liItems = list.match(/<li[^>]*>/gi) ?? [];
      const linkItems = list.match(/<li[^>]*>\s*<a\s/gi) ?? [];

      // 3+ items where most are links → blog roll
      if (liItems.length >= 3 && linkItems.length / liItems.length > 0.6) {
        return true;
      }
    }
  }

  return false;
}

function isSidebarWidget(html: string, text: string): boolean {
  // Widget container patterns
  if (/class="[^"]*widget[^"]*"/i.test(html)) return true;
  if (/class="[^"]*sidebar[^"]*"/i.test(html)) return true;

  // Tag clouds
  if (/class="[^"]*tag-?cloud[^"]*"/i.test(html)) return true;
  if (/class="[^"]*tagcloud[^"]*"/i.test(html)) return true;

  // Category lists with counts
  const catCountPattern = /\(\d+\)/g;
  const counts = text.match(catCountPattern);
  if (counts && counts.length >= 3) return true;

  return false;
}

function isNewsletterBlock(_html: string, text: string): boolean {
  const patterns = [
    /subscribe\s+to/i,
    /sign\s+up\s+for/i,
    /join\s+our\s+(newsletter|mailing\s+list)/i,
    /get\s+updates/i,
    /email\s+newsletter/i,
    /stay\s+informed/i,
  ];
  return patterns.some((p) => p.test(text));
}

function isCommentSection(html: string): boolean {
  if (/id="comments"/i.test(html)) return true;
  if (/class="[^"]*comment-?(s|list|area|section)[^"]*"/i.test(html)) return true;
  if (/<form[^>]*comment/i.test(html)) return true;
  return false;
}

function isFormBlock(html: string): boolean {
  // Contains a <form> element
  if (/<form[\s>]/i.test(html)) return true;
  // WP form shortcode remnants
  if (/\[(?:contact-form|gravityform|wpforms|ninja_form)/i.test(html)) return true;
  return false;
}

function isHighLinkDensity(html: string, text: string, threshold: number): boolean {
  if (!text) return true;

  // Count link text vs total text
  const links = html.match(/<a[^>]*>([\s\S]*?)<\/a>/gi) ?? [];

  // Need at least 5 links to trigger — law firm pages have anchor links
  // to related practice areas that should not be treated as nav blocks.
  if (links.length < 5) return false;

  let linkTextLength = 0;
  for (const link of links) {
    const lt = link.replace(/<[^>]*>/g, '').trim();
    linkTextLength += lt.length;
  }

  const density = linkTextLength / text.length;
  return density > threshold;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Remove an HTML tag and all its content using depth tracking.
 */
function removeTagWithContent(html: string, tagName: string): string {
  const pattern = new RegExp(`<${tagName}[\\s>]`, 'gi');
  let result = '';
  let lastIdx = 0;
  let match;

  while ((match = pattern.exec(html)) !== null) {
    result += html.substring(lastIdx, match.index);
    const closeEnd = findMatchingClose(html, match.index, tagName);
    if (closeEnd > 0) {
      lastIdx = closeEnd;
      pattern.lastIndex = closeEnd;
    } else {
      lastIdx = match.index + match[0].length;
    }
  }

  result += html.substring(lastIdx);
  return result;
}
