import { RequestHandler } from "express";
import OpenAI from "openai";
import { normalizeHtml } from "../../client/lib/importer/htmlNormalizer";
import { resolveImageTag } from "../../client/lib/importer/imageSources";
import { defaultFilterOptions } from "../../client/lib/importer/types";
import { normalizeThirdPartyImageDownloadUrl } from "./bulk-import-images";

const DEFAULT_MODEL = "gpt-4o-mini";

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

interface H2Section {
  heading: string;       // h2 inner text (plain)
  html: string;          // full HTML including the <h2> tag and following content
  preview: string;       // plain-text preview for AI (~200 chars)
  hasQaStructure: boolean; // true if section contains H3/H4 Q&A pairs or <dt>/<dd> elements
}

/**
 * Split an HTML string into H2-delimited sections.
 * Each section starts at an <h2> tag and ends before the next <h2> (or EOF).
 * Content before the first <h2> is returned as a "preamble" section (no heading).
 */
function splitIntoH2Sections(html: string): H2Section[] {
  const sections: H2Section[] = [];

  // Find all <h2> positions (case-insensitive, handles attributes)
  const h2Regex = /<h2[^>]*>/gi;
  const positions: number[] = [];
  let m: RegExpExecArray | null;

  while ((m = h2Regex.exec(html)) !== null) {
    positions.push(m.index);
  }

  if (positions.length === 0) {
    // No H2 sections — treat entire content as one block
    return [
      {
        heading: "(no h2)",
        html: html,
        preview: stripTags(html).substring(0, 200),
        hasQaStructure: detectQaStructure(html),
      },
    ];
  }

  // Preamble (before first H2)
  if (positions[0] > 0) {
    const preambleHtml = html.substring(0, positions[0]).trim();
    if (preambleHtml) {
      sections.push({
        heading: "(preamble)",
        html: preambleHtml,
        preview: stripTags(preambleHtml).substring(0, 200),
        hasQaStructure: detectQaStructure(preambleHtml),
      });
    }
  }

  // Each H2-delimited block
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i];
    const end = i + 1 < positions.length ? positions[i + 1] : html.length;
    const sectionHtml = html.substring(start, end).trim();

    // Extract h2 inner text
    const headingMatch = sectionHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const heading = headingMatch ? stripTags(headingMatch[1]).trim() : "(untitled)";

    sections.push({
      heading,
      html: sectionHtml,
      preview: stripTags(sectionHtml).substring(0, 200),
      hasQaStructure: detectQaStructure(sectionHtml),
    });
  }

  return sections;
}

/**
 * Detect if an HTML section has REAL Q&A structure:
 * - <dt>/<dd> definition list elements, OR
 * - 2+ H3/H4 headings ending with '?' where each is followed by a substantive
 *   answer paragraph (>30 chars of text — not just links or another heading).
 *
 * A single question-phrased heading ("What Are Your Options?") is NOT enough.
 * Link-only content after a question heading does NOT count as Q&A.
 */
function detectQaStructure(html: string): boolean {
  // dl/dd is always real Q&A
  if (/<dt[^>]*>/i.test(html) && /<dd[^>]*>/i.test(html)) return true;

  // Collect all H3/H4 heading positions
  const headingRegex = /<h[34][^>]*>([\s\S]*?)<\/h[34]>/gi;
  const headings: { text: string; tagEnd: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = headingRegex.exec(html)) !== null) {
    headings.push({ text: stripTags(m[1]).trim(), tagEnd: m.index + m[0].length });
  }

  let qaCount = 0;
  for (let i = 0; i < headings.length; i++) {
    const { text, tagEnd } = headings[i];
    if (!text.endsWith('?')) continue;

    // Find the start of the next h3/h4 tag (so we know where this answer ends)
    let nextStart = html.length;
    const nextMatch = /<h[34][^>]*>/i.exec(html.substring(tagEnd));
    if (nextMatch) nextStart = tagEnd + nextMatch.index;

    const following = html.substring(tagEnd, nextStart).trim();
    const textOnly = stripTags(following).trim();
    // Must have substantive answer text (not just links or empty)
    if (textOnly.length > 30) qaCount++;
    if (qaCount >= 2) return true;
  }

  // Pattern 3: Bold/strong paragraph Q&A format
  // <p><b>Question?</b></p> followed by <p>Answer text...</p>
  const boldQPattern = /<p[^>]*>\s*<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>\s*<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let bm: RegExpExecArray | null;
  let boldQaCount = 0;
  while ((bm = boldQPattern.exec(html)) !== null) {
    const q = stripTags(bm[1]).trim();
    const a = stripTags(bm[2]).trim();
    if (q.endsWith('?') && a.length > 30) boldQaCount++;
    if (boldQaCount >= 2) return true;
  }

  return false;
}

/**
 * Strip resource/link sub-sections (H3-H6) from HTML before FAQ extraction.
 * Removes headings like "Resource Links", "Helpful Links", etc. and their content.
 */
function stripResourceSubSections(html: string): string {
  const resourcePattern = /\b(resource\s+links?|helpful\s+links?|additional\s+resources?|useful\s+links?|external\s+links?|related\s+links?)\b/i;
  return html.replace(
    /<h([3-6])[^>]*>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h[1-6]|$)/gi,
    (match, _level, headingContent) => {
      const text = stripTags(headingContent).trim();
      return resourcePattern.test(text) ? '' : match;
    }
  );
}

/** Strip HTML tags from a string */
function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Join multiple section HTML strings into one HTML string */
function joinSections(sections: H2Section[]): string {
  return sections.map((s) => s.html).join("\n\n");
}

function isPreambleSection(section: H2Section): boolean {
  return /^\(preamble\)$/i.test(section.heading.trim());
}

function isFaqHeading(heading: string): boolean {
  return /faq|frequent|frequently\s+asked|q\s*&\s*a|common\s+question/i.test(heading);
}

function buildDeterministicAreaSplit(
  sections: H2Section[],
  classifications?: string[] | null
): {
  body: string;
  why_body: string;
  closing_body: string;
  faq: string;
} {
  const faqSections: H2Section[] = [];
  const contentSections: H2Section[] = [];

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const classifiedAsFaq = classifications?.[i] === 'faq';
    const heuristicFaq = !classifications && (isFaqHeading(section.heading) || section.hasQaStructure);

    if (classifiedAsFaq || heuristicFaq) {
      faqSections.push(section);
    } else {
      contentSections.push(section);
    }
  }

  const faqHtml = faqSections.length ? stripResourceSubSections(joinSections(faqSections)) : '';
  const faqItems = faqHtml ? extractFaqItems(faqHtml) : [];

  if (contentSections.length === 0) {
    return {
      body: '',
      why_body: '',
      closing_body: '',
      faq: JSON.stringify(faqItems),
    };
  }

  const introSections: H2Section[] = [];
  let contentCursor = 0;

  if (isPreambleSection(contentSections[0])) {
    introSections.push(contentSections[0]);
    contentCursor = 1;
  }

  if (contentSections[contentCursor]) {
    introSections.push(contentSections[contentCursor]);
    contentCursor += 1;
  }

  if (introSections.length === 0 && contentSections[0]) {
    introSections.push(contentSections[0]);
    contentCursor = 1;
  }

  const remainingSections = contentSections.slice(contentCursor);
  const closingSections = remainingSections.length > 0 ? [remainingSections[remainingSections.length - 1]] : [];
  const whySections = remainingSections.length > 1 ? remainingSections.slice(0, -1) : [];

  return {
    body: joinSections(introSections),
    why_body: joinSections(whySections),
    closing_body: joinSections(closingSections),
    faq: JSON.stringify(faqItems),
  };
}

/**
 * Extract the first image from an HTML string.
 * Returns the image src, alt text, and HTML with the image removed.
 */
function extractFirstImage(html: string): { src: string; alt: string; cleanedHtml: string } {
  const imgRegex = /<img\b[^>]*>/i;
  const match = html.match(imgRegex);
  if (!match) return { src: '', alt: '', cleanedHtml: html };

  const image = resolveImageTag(match[0]);

  // Remove the img tag and any resulting empty <p> wrappers
  const cleanedHtml = html
    .replace(match[0], '')
    .replace(/^\s*<p>\s*<\/p>/gm, '')
    .trim();

  return {
    src: image?.src ?? '',
    alt: image?.alt ?? '',
    cleanedHtml,
  };
}

/**
 * Return the index of the next heading tag (<h2>, <h3>, or <h4>) at or after `from`.
 * Returns -1 if none found. Uses a regex to avoid false matches on <header> etc.
 */
function indexOfNextHeading(html: string, from: number): number {
  const pattern = /<h[2-4][^>]*>/gi;
  pattern.lastIndex = from;
  const m = pattern.exec(html);
  return m ? m.index : -1;
}

/** Extract FAQ items from HTML sections classified as "faq" */
function extractFaqItems(html: string): { question: string; answer: string }[] {
  const items: { question: string; answer: string }[] = [];

  // Pattern 1: H3/H4 headings as questions
  const headingPattern = /<h[3-4][^>]*>([\s\S]*?)<\/h[3-4]>/gi;
  let match: RegExpExecArray | null;
  const qaPositions: { question: string; start: number }[] = [];

  while ((match = headingPattern.exec(html)) !== null) {
    const question = stripTags(match[1]).trim();
    if (question) {
      qaPositions.push({ question, start: match.index + match[0].length });
    }
  }

  for (let i = 0; i < qaPositions.length; i++) {
    const start = qaPositions[i].start;
    const nextHeading = i + 1 < qaPositions.length ? indexOfNextHeading(html, start) : -1;
    const end = nextHeading > start ? nextHeading : html.length;
    const answerHtml = html.substring(start, end).trim();
    const answerText = stripTags(answerHtml).trim();
    if (answerText) {
      items.push({ question: qaPositions[i].question, answer: answerHtml });
    }
  }

  // Pattern 2: <dt>/<dd> definition lists
  if (items.length === 0) {
    const dlPattern = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
    while ((match = dlPattern.exec(html)) !== null) {
      const q = stripTags(match[1]).trim();
      const a = match[2].trim();
      if (q && a) items.push({ question: q, answer: a });
    }
  }

  // Pattern 3: Bold/strong paragraphs as question + following paragraph as answer
  if (items.length === 0) {
    const boldPattern = /<p[^>]*>\s*<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>\s*<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
    while ((match = boldPattern.exec(html)) !== null) {
      const q = stripTags(match[1]).trim();
      if (q.endsWith('?')) {
        items.push({ question: q, answer: match[2].trim() });
      }
    }
  }

  return items;
}

/**
 * Smart fallback split when AI is unavailable or fails.
 * Detects FAQ sections by heading keyword, then distributes:
 *   - 1 section → intro (body)
 *   - middle sections → why_body
 *   - last section → closing_body
 *   - FAQ sections → faq
 */
function smartFallbackSplit(sections: H2Section[]): {
  body: string;
  why_body: string;
  closing_body: string;
  faq: string;
  body_image: string;
  body_image_alt: string;
  why_image: string;
  why_image_alt: string;
  closing_image: string;
  closing_image_alt: string;
} {
  const split = buildDeterministicAreaSplit(sections);
  const bodyImg = extractFirstImage(split.body);
  const whyImg = extractFirstImage(split.why_body);
  const closingImg = extractFirstImage(split.closing_body);

  return {
    body: bodyImg.cleanedHtml,
    why_body: whyImg.cleanedHtml,
    closing_body: closingImg.cleanedHtml,
    faq: split.faq,
    body_image: bodyImg.src,
    body_image_alt: bodyImg.alt,
    why_image: whyImg.src,
    why_image_alt: whyImg.alt,
    closing_image: closingImg.src,
    closing_image_alt: closingImg.alt,
  };
}

/**
 * POST /api/ai-split-area-content
 * Input:  { html: string, model?: string }
 * Output: { body, why_body, closing_body, faq, body_image, body_image_alt, why_image, why_image_alt, closing_image, closing_image_alt }
 *
 * Strategy:
 * 1. Split HTML into H2-delimited sections
 * 2. Ask OpenAI to classify each section as "intro" | "why" | "closing" | "faq"
 * 3. Reassemble the full HTML per group, extract first image from each group
 * 4. Fallback to smart split if AI is unavailable or classification fails
 */
export const handleAiSplitAreaContent: RequestHandler = async (req, res) => {
  const { html, model } = req.body ?? {};

  if (!html || typeof html !== "string" || !html.trim()) {
    res.status(400).json({ error: "html is required" });
    return;
  }

  const cleanedHtml = normalizeHtml(html, {
    ...defaultFilterOptions.area,
    skipSecondaryFilter: true,
  });
  const allSections = splitIntoH2Sections(cleanedHtml || html);

  // Fix 3c: Pre-filter sections that are clearly "Recent Posts" / post listings
  // so they never reach the AI and don't pollute classified content.
  const knownJunkHeadings = [
    /^recent\s+posts?$/i,
    /^latest\s+posts?$/i,
    /^related\s+posts?$/i,
    /^popular\s+posts?$/i,
    /^more\s+(posts?|articles?|stories)$/i,
  ];

  const sections = allSections.filter((s) => {
    // Remove by heading pattern
    if (knownJunkHeadings.some((p) => p.test(s.heading.trim()))) return false;
    // Remove post link-list blocks: mostly <li><a> items
    const liCount = (s.html.match(/<li[^>]*>/gi) ?? []).length;
    const linkLiCount = (s.html.match(/<li[^>]*>\s*<a\s/gi) ?? []).length;
    if (liCount >= 3 && linkLiCount / liCount > 0.6) return false;
    return true;
  });

  const client = getOpenAIClient();
  if (!client) {
    res.json(smartFallbackSplit(sections));
    return;
  }

  // Build compact section list for AI (Fix 3a/3b: include Q&A hint)
  const sectionList = sections
    .map((s, i) => {
      const qaHint = s.hasQaStructure ? "\n[Contains Q&A structure - likely FAQ]" : "";
      return `Section ${i + 1}: "${s.heading}"\nPreview: ${s.preview}${qaHint}`;
    })
    .join("\n\n");

  try {
    const response = await client.chat.completions.create({
      model: model || DEFAULT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are classifying H2 sections of a law firm "Areas We Serve" page.

RULES:
- "faq": Use ONLY for sections whose heading EXPLICITLY references FAQ / FAQs / Frequently Asked Questions / Q&A / Common Questions (or very close synonyms). Also prefer "faq" for sections marked [Contains Q&A structure - likely FAQ], UNLESS the heading contains words like Resources, Links, Related, More Information, Helpful Links, Additional Resources — in that case use "closing" instead.
- "intro": Use for the FIRST meaningful content section (location intro, firm overview, welcome). Assign AT MOST 1–2 sections as "intro".
- "why": Use for sections about attorney credentials, experience, firm benefits, client stories, types of debts handled, legal process explanations. Question-phrased headings like "What Are Your Options?", "How Does Bankruptcy Work?", "Why File for Bankruptcy?" belong HERE, NOT in "faq".
- "closing": Use for calls-to-action, contact us, consultation offers, resource/link lists, map/location info, office addresses. Typically the last 1–2 sections.

Assignment strategy:
- Distribute roughly: 1–2 intro, 1–2 why, 1–2 closing, any number faq.
- If a section could be either "closing" or "why", prefer "closing" for the last section and "why" for earlier ones.
- The FIRST section should almost always be "intro" unless it is clearly a FAQ.
- A heading merely phrased as a question ("What Are Your Options?") is NOT an FAQ section — assign to "why".

Return JSON: { "classifications": ["intro"|"why"|"closing"|"faq", ...] }
The array must have exactly ${sections.length} entries, one per section, in order.`,
        },
        {
          role: "user",
          content: `Classify these ${sections.length} sections:\n\n${sectionList}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { classifications?: string[] };
    const classifications = parsed.classifications;

    if (!Array.isArray(classifications) || classifications.length !== sections.length) {
      res.json(smartFallbackSplit(sections));
      return;
    }

    const split = buildDeterministicAreaSplit(sections, classifications);
    const bodyImg = extractFirstImage(split.body);
    const whyImg = extractFirstImage(split.why_body);
    const closingImg = extractFirstImage(split.closing_body);

    res.json({
      body: bodyImg.cleanedHtml,
      why_body: whyImg.cleanedHtml,
      closing_body: closingImg.cleanedHtml,
      faq: split.faq,
      body_image: bodyImg.src,
      body_image_alt: bodyImg.alt,
      why_image: whyImg.src,
      why_image_alt: whyImg.alt,
      closing_image: closingImg.src,
      closing_image_alt: closingImg.alt,
    });
  } catch (err) {
    console.error("ai-split-area-content error:", err);
    res.json(smartFallbackSplit(sections));
  }
};
