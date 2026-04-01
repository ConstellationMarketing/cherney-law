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
 * Falls back to even split if AI unavailable or classification fails.
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

interface H2Section {
  heading: string;
  html: string;
  preview: string;
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
    return [{ heading: "(no h2)", html, preview: stripTags(html).substring(0, 200) }];
  }

  if (positions[0] > 0) {
    const preambleHtml = html.substring(0, positions[0]).trim();
    if (preambleHtml) {
      sections.push({ heading: "(preamble)", html: preambleHtml, preview: stripTags(preambleHtml).substring(0, 200) });
    }
  }

  for (let i = 0; i < positions.length; i++) {
    const start = positions[i];
    const end = i + 1 < positions.length ? positions[i + 1] : html.length;
    const sectionHtml = html.substring(start, end).trim();
    const headingMatch = sectionHtml.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const heading = headingMatch ? stripTags(headingMatch[1]).trim() : "(untitled)";
    sections.push({ heading, html: sectionHtml, preview: stripTags(sectionHtml).substring(0, 200) });
  }

  return sections;
}

function joinSections(sections: H2Section[]): string {
  return sections.map((s) => s.html).join("\n\n");
}

function evenSplit(sections: H2Section[]): { body: string; why_body: string; closing_body: string; faq: string } {
  const total = sections.length;
  if (total === 0) return { body: "", why_body: "", closing_body: "", faq: "[]" };
  if (total === 1) return { body: sections[0].html, why_body: "", closing_body: "", faq: "[]" };
  if (total === 2) return { body: sections[0].html, why_body: "", closing_body: sections[1].html, faq: "[]" };
  const third = Math.ceil(total / 3);
  return {
    body: joinSections(sections.slice(0, third)),
    why_body: joinSections(sections.slice(third, third * 2)),
    closing_body: joinSections(sections.slice(third * 2)),
    faq: "[]",
  };
}

function extractFaqItems(html: string): { question: string; answer: string }[] {
  const items: { question: string; answer: string }[] = [];
  const headingPattern = /<h[3-4][^>]*>([\s\S]*?)<\/h[3-4]>/gi;
  let match: RegExpExecArray | null;
  const qaPositions: { question: string; start: number }[] = [];

  while ((match = headingPattern.exec(html)) !== null) {
    const question = stripTags(match[1]).trim();
    if (question) qaPositions.push({ question, start: match.index + match[0].length });
  }

  for (let i = 0; i < qaPositions.length; i++) {
    const start = qaPositions[i].start;
    const nextHeadingPos = html.indexOf("<h", start);
    const end = nextHeadingPos > start ? nextHeadingPos : html.length;
    const answerHtml = html.substring(start, end).trim();
    if (stripTags(answerHtml).trim()) {
      items.push({ question: qaPositions[i].question, answer: answerHtml });
    }
  }

  if (items.length === 0) {
    const dlPattern = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
    while ((match = dlPattern.exec(html)) !== null) {
      const q = stripTags(match[1]).trim();
      const a = match[2].trim();
      if (q && a) items.push({ question: q, answer: a });
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

// ─── AI Classification (same logic as ai-split-area-content.ts) ─────────────

async function aiClassifySections(
  sections: H2Section[],
  client: OpenAI
): Promise<string[] | null> {
  if (sections.length === 0) return [];

  const sectionList = sections
    .map((s, i) => `Section ${i + 1}: "${s.heading}"\nPreview: ${s.preview}`)
    .join("\n\n");

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are classifying sections of a law firm's "Areas We Serve" page for a bankruptcy law firm. Each section starts at an H2 heading. Classify each section as one of:
- "intro": introduction to the firm's services in this location, general overview
- "why": why choose this firm — credentials, experience, testimonials, benefits, qualifications
- "closing": call to action, contact info, next steps, consultation offers
- "faq": frequently asked questions — heading mentions FAQ or "Questions", contains H3/H4 question+answer pairs or <dl>/<dt>/<dd> structure

Return JSON: { "classifications": ["intro"|"why"|"closing"|"faq", ...] }
The array must have exactly ${sections.length} entries, one per section, in order.
If unsure, assign "intro" to earlier sections and "closing" to the final section.`,
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

  // Step 2: Split into H2 sections
  const sections = splitIntoH2Sections(rehostedHtml);

  // Step 3: Classify with AI (or fall back to even split)
  let classifications: string[] | null = null;
  if (client && sections.length > 0) {
    classifications = await aiClassifySections(sections, client);
  }

  let split: { body: string; why_body: string; closing_body: string; faq: string };

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

    const faqHtml = joinSections(faqSections);
    const faqItems = faqHtml ? extractFaqItems(faqHtml) : [];

    split = {
      body: joinSections(introSections),
      why_body: joinSections(whySections),
      closing_body: joinSections(closingSections),
      faq: JSON.stringify(faqItems),
    };
  } else {
    split = evenSplit(sections);
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
