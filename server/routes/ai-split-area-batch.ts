/**
 * POST /api/ai-split-area-batch
 *
 * Accepts an array of { rowIndex, bodyHtml } records.
 * For each record:
 *   1. Rehost inline images (uploads external <img> src URLs to Supabase Storage)
 *   2. Run the same AI classification logic as /api/ai-split-area-content
 *   3. Extract section images (first <img> per section)
 *   4. Return per-record split: { rowIndex, body, why_body, closing_body, faq,
 *        body_image, body_image_alt, why_image, why_image_alt,
 *        closing_image, closing_image_alt }
 *
 * Falls back to smart keyword split if AI unavailable or classification fails.
 */

import { RequestHandler } from "express";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { extname } from "path";

const DEFAULT_MODEL = "gpt-4o-mini";

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── HTML Helpers ──────────────────────────────────────────────────────────

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

// detectQaStructure: require REAL Q&A structure — not just question-phrased headings.
// Each H3/H4 question heading must be followed by substantive answer text (>30 chars),
// not just links or another heading. A single question heading is never enough.
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
    if (!text.endsWith("?")) continue;

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

// Fix 2 — H2Section includes hasQaStructure
interface H2Section {
  heading: string;
  html: string;
  preview: string;
  hasQaStructure: boolean;
}

// Fix 8 — Junk section filter: "Recent Posts", link-heavy list sections, etc.
const JUNK_HEADING_PATTERNS = [
  /^recent\s+posts?$/i,
  /^latest\s+posts?$/i,
  /^related\s+posts?$/i,
  /^popular\s+posts?$/i,
];

function isJunkSection(section: H2Section): boolean {
  if (JUNK_HEADING_PATTERNS.some((p) => p.test(section.heading.trim()))) return true;
  // Reject sections that are mostly link lists (navigation noise)
  const liCount = (section.html.match(/<li[^>]*>/gi) ?? []).length;
  const linkLiCount = (section.html.match(/<li[^>]*>\s*<a\s/gi) ?? []).length;
  if (liCount >= 3 && linkLiCount / liCount > 0.6) return true;
  return false;
}

function splitIntoH2Sections(html: string): H2Section[] {
  const sections: H2Section[] = [];
  const h2Regex = /<h2[^>]*>/gi;
  const positions: number[] = [];
  let m: RegExpExecArray | null;

  while ((m = h2Regex.exec(html)) !== null) {
    positions.push(m.index);
  }

  if (positions.length === 0) {
    const sec: H2Section = {
      heading: "(no h2)",
      html,
      preview: stripTags(html).substring(0, 200),
      hasQaStructure: detectQaStructure(html),
    };
    return [sec];
  }

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

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i];
    const end = i + 1 < positions.length ? positions[i + 1] : html.length;
    const sectionHtml = html.substring(start, end).trim();
    const headingMatch = sectionHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const heading = headingMatch ? stripTags(headingMatch[1]).trim() : "(untitled)";
    sections.push({
      heading,
      html: sectionHtml,
      preview: stripTags(sectionHtml).substring(0, 200),
      hasQaStructure: detectQaStructure(sectionHtml),
    });
  }

  // Fix 8 — Filter out junk sections before returning
  return sections.filter((s) => !isJunkSection(s));
}

function joinSections(sections: H2Section[]): string {
  return sections.map((s) => s.html).join("\n\n");
}

// Fix 3 — Proper heading boundary finder (avoids matching <header>, <hr>, etc.)
function indexOfNextHeading(html: string, from: number): number {
  const pattern = /<h[2-4][^>]*>/gi;
  pattern.lastIndex = from;
  const m = pattern.exec(html);
  return m ? m.index : -1;
}

// Fix 3 + Fix 4 — extractFaqItems with correct boundary and bold/strong fallback
function extractFaqItems(html: string): { question: string; answer: string }[] {
  const items: { question: string; answer: string }[] = [];

  // Pattern 1: H3/H4 headings as questions
  const headingPattern = /<h[3-4][^>]*>([\s\S]*?)<\/h[3-4]>/gi;
  let match: RegExpExecArray | null;
  const qaPositions: { question: string; start: number }[] = [];

  while ((match = headingPattern.exec(html)) !== null) {
    const question = stripTags(match[1]).trim();
    if (question) qaPositions.push({ question, start: match.index + match[0].length });
  }

  for (let i = 0; i < qaPositions.length; i++) {
    const start = qaPositions[i].start;
    // Fix 3: use indexOfNextHeading instead of indexOf('<h', start)
    const nextHeadingPos = indexOfNextHeading(html, start);
    const end = nextHeadingPos > start ? nextHeadingPos : html.length;
    const answerHtml = html.substring(start, end).trim();
    if (stripTags(answerHtml).trim()) {
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

  // Fix 4 — Pattern 3: bold/strong paragraphs as questions
  // Handles: <p><strong>Question?</strong></p><p>Answer text.</p>
  if (items.length === 0) {
    const boldPattern =
      /<p[^>]*>\s*<(?:strong|b)>([\s\S]*?)<\/(?:strong|b)>\s*<\/p>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
    while ((match = boldPattern.exec(html)) !== null) {
      const q = stripTags(match[1]).trim();
      if (q.endsWith("?")) {
        items.push({ question: q, answer: match[2].trim() });
      }
    }
  }

  return items;
}

/**
 * Extract first <img> from HTML, return its src + alt, and the html with that img removed.
 */
function extractFirstImage(html: string): { src: string; alt: string; cleanedHtml: string } {
  const imgRegex = /<img([^>]*)>/i;
  const match = html.match(imgRegex);
  if (!match) return { src: "", alt: "", cleanedHtml: html };

  const attrs = match[1];
  const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
  const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
  const src = srcMatch?.[1] ?? "";
  const alt = altMatch?.[1] ?? "";
  const cleanedHtml = html.replace(match[0], "").replace(/^\s*<p>\s*<\/p>/gm, "").trim();

  return { src, alt, cleanedHtml };
}

// ─── Image rehosting ────────────────────────────────────────────────────────

async function rehostInlineImages(
  html: string,
  supabase: ReturnType<typeof getServiceClient>
): Promise<string> {
  if (!supabase || !html) return html;

  const imgRegex = /<img([^>]*)>/gi;
  const srcRegex = /src=["']([^"']+)["']/i;
  let result = html;
  const matches = [...html.matchAll(imgRegex)];

  for (const match of matches) {
    const srcMatch = match[1].match(srcRegex);
    if (!srcMatch) continue;
    const originalSrc = srcMatch[1];
    if (!originalSrc.startsWith("http")) continue;

    try {
      const response = await fetch(originalSrc, {
        signal: AbortSignal.timeout(10_000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BulkImporter/1.0)" },
      });
      if (!response.ok) continue;

      const contentType = response.headers.get("content-type") ?? "image/jpeg";
      const mimeType = contentType.split(";")[0].trim();
      const urlExt = extname(new URL(originalSrc).pathname).toLowerCase() || ".jpg";
      const mimeExtMap: Record<string, string> = {
        "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif",
        "image/webp": ".webp", "image/svg+xml": ".svg", "image/avif": ".avif",
      };
      const ext = mimeExtMap[mimeType] ?? urlExt;
      const uid = randomUUID().split("-")[0];
      const fileName = `imported-${Date.now()}-${uid}${ext}`;
      const storagePath = `uploads/imported/${fileName}`;
      const buffer = Buffer.from(await response.arrayBuffer());

      const { error } = await supabase.storage.from("media")
        .upload(storagePath, buffer, { contentType: mimeType, upsert: false });
      if (error) continue;

      const { data: pub } = supabase.storage.from("media").getPublicUrl(storagePath);
      const newUrl = pub.publicUrl;

      await supabase.from("media").insert({
        file_name: fileName, file_path: storagePath, public_url: newUrl,
        file_size: buffer.length, mime_type: mimeType, uploaded_by: null,
      });

      result = result.replace(originalSrc, newUrl);
    } catch {
      // Keep original URL on failure
    }
  }

  return result;
}

// ─── AI Classification ───────────────────────────────────────────────────────

// Fix 5 — Annotate sections with Q&A structure hint for the AI prompt
// Fix 6 — Strengthened prompt: FAQ takes absolute priority, question-phrased headings go to "why"
async function aiClassifySections(
  sections: H2Section[],
  client: OpenAI
): Promise<string[] | null> {
  if (sections.length === 0) return [];

  // Fix 5: include [Contains Q&A structure] hint in section list
  const sectionList = sections
    .map((s, i) => {
      const qaHint = s.hasQaStructure ? "\n[Contains Q&A structure - likely FAQ]" : "";
      return `Section ${i + 1}: "${s.heading}"\nPreview: ${s.preview}${qaHint}`;
    })
    .join("\n\n");

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are classifying sections of a law firm's "Areas We Serve" page for a bankruptcy law firm. Each section starts at an H2 heading. Classify each section as one of: "intro", "why", "closing", or "faq".

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

    if (!Array.isArray(classifications) || classifications.length !== sections.length) return null;
    return classifications;
  } catch {
    return null;
  }
}

// ─── Fallback split ──────────────────────────────────────────────────────────

interface SplitResult {
  body: string;
  why_body: string;
  closing_body: string;
  faq: string;
}

function emptyImages(): {
  body_image: string; body_image_alt: string;
  why_image: string; why_image_alt: string;
  closing_image: string; closing_image_alt: string;
} {
  return {
    body_image: "", body_image_alt: "",
    why_image: "", why_image_alt: "",
    closing_image: "", closing_image_alt: "",
  };
}

// Fix 7 — Smart fallback that does FAQ keyword detection and reasonable section assignment
function smartFallbackSplit(sections: H2Section[]): SplitResult {
  const faqSections: H2Section[] = [];
  const contentSections: H2Section[] = [];

  for (const s of sections) {
    if (/faq|frequent|frequently\s+asked|q\s*&\s*a|common\s+question/i.test(s.heading) || s.hasQaStructure) {
      faqSections.push(s);
    } else {
      contentSections.push(s);
    }
  }

  const faqHtml = faqSections.length ? stripResourceSubSections(joinSections(faqSections)) : '';
  const faqItems = faqHtml ? extractFaqItems(faqHtml) : [];
  const faqJson = JSON.stringify(faqItems);
  const n = contentSections.length;

  if (n === 0) return { body: "", why_body: "", closing_body: "", faq: faqJson };
  if (n === 1) return { body: contentSections[0].html, why_body: "", closing_body: "", faq: faqJson };
  if (n === 2) return { body: contentSections[0].html, why_body: "", closing_body: contentSections[1].html, faq: faqJson };

  return {
    body: contentSections[0].html,
    why_body: contentSections.slice(1, n - 1).map((s) => s.html).join("\n\n"),
    closing_body: contentSections[n - 1].html,
    faq: faqJson,
  };
}

// ─── Per-record processing ───────────────────────────────────────────────────

interface BatchRecord {
  rowIndex: number;
  bodyHtml: string;
}

interface BatchResult {
  rowIndex: number;
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
}

async function processRecord(
  record: BatchRecord,
  client: OpenAI | null,
  supabase: ReturnType<typeof getServiceClient>
): Promise<BatchResult> {
  // Step 1: Rehost inline images
  const rehostedHtml = supabase
    ? await rehostInlineImages(record.bodyHtml, supabase)
    : record.bodyHtml;

  // Step 2: Split into H2 sections (Fix 8: junk sections filtered inside splitIntoH2Sections)
  const sections = splitIntoH2Sections(rehostedHtml);

  // Step 3: Classify with AI (or fall back to smart split)
  let classifications: string[] | null = null;
  if (client && sections.length > 0) {
    classifications = await aiClassifySections(sections, client);
  }

  let split: SplitResult;

  if (classifications) {
    const introSections: H2Section[] = [];
    const whySections: H2Section[] = [];
    const closingSections: H2Section[] = [];
    const faqSections: H2Section[] = [];

    for (let i = 0; i < sections.length; i++) {
      const cls = classifications[i];
      if (cls === "why") whySections.push(sections[i]);
      else if (cls === "closing") closingSections.push(sections[i]);
      else if (cls === "faq") faqSections.push(sections[i]);
      else introSections.push(sections[i]);
    }

    const faqHtml = faqSections.length ? stripResourceSubSections(joinSections(faqSections)) : '';
    const faqItems = faqHtml ? extractFaqItems(faqHtml) : [];

    split = {
      body: joinSections(introSections),
      why_body: joinSections(whySections),
      closing_body: joinSections(closingSections),
      faq: JSON.stringify(faqItems),
    };
  } else {
    // Fix 7: use smartFallbackSplit instead of evenSplit
    split = smartFallbackSplit(sections);
  }

  // Step 4: Extract first image from each section
  const bodyImg = extractFirstImage(split.body);
  const whyImg = extractFirstImage(split.why_body);
  const closingImg = extractFirstImage(split.closing_body);

  return {
    rowIndex: record.rowIndex,
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

// ─── Handler ────────────────────────────────────────────────────────────────

export const handleAiSplitAreaBatch: RequestHandler = async (req, res) => {
  const { records } = req.body ?? {};

  if (!Array.isArray(records) || records.length === 0) {
    res.status(400).json({ error: "records must be a non-empty array" });
    return;
  }

  const client = getOpenAIClient();
  const supabase = getServiceClient();
  const results: BatchResult[] = [];

  for (const record of records as BatchRecord[]) {
    try {
      const result = await processRecord(record, client, supabase);
      results.push(result);
    } catch (err) {
      console.error(`ai-split-area-batch: error on rowIndex ${record.rowIndex}:`, err);
      // Return empty split on error
      results.push({
        rowIndex: record.rowIndex,
        body: record.bodyHtml,
        why_body: "",
        closing_body: "",
        faq: "[]",
        body_image: "",
        body_image_alt: "",
        why_image: "",
        why_image_alt: "",
        closing_image: "",
        closing_image_alt: "",
      });
    }
  }

  res.json({ results });
};
