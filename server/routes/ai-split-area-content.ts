import { RequestHandler } from "express";
import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-4o-mini";

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

interface H2Section {
  heading: string; // h2 inner text (plain)
  html: string;    // full HTML including the <h2> tag and following content
  preview: string; // plain-text preview for AI (~200 chars)
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
    });
  }

  return sections;
}

/** Strip HTML tags from a string */
function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Join multiple section HTML strings into one HTML string */
function joinSections(sections: H2Section[]): string {
  return sections.map((s) => s.html).join("\n\n");
}

/** Fallback: divide sections evenly into thirds */
function evenSplit(sections: H2Section[]): {
  body: string;
  why_body: string;
  closing_body: string;
  faq: string;
} {
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
    const end = i + 1 < qaPositions.length
      ? html.indexOf('<h', start)
      : html.length;
    const answerHtml = html.substring(start, end > start ? end : html.length).trim();
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

  return items;
}

/**
 * POST /api/ai-split-area-content
 * Input:  { html: string, model?: string }
 * Output: { body: string, why_body: string, closing_body: string }
 *
 * Strategy:
 * 1. Split HTML into H2-delimited sections
 * 2. Ask OpenAI to classify each section as "intro" | "why" | "closing"
 * 3. Reassemble the full HTML per group
 * 4. Fallback to even split if AI is unavailable or classification fails
 */
export const handleAiSplitAreaContent: RequestHandler = async (req, res) => {
  const { html, model } = req.body ?? {};

  if (!html || typeof html !== "string" || !html.trim()) {
    res.status(400).json({ error: "html is required" });
    return;
  }

  const sections = splitIntoH2Sections(html);

  const client = getOpenAIClient();
  if (!client) {
    // No AI — fall back to even split
    res.json(evenSplit(sections));
    return;
  }

  // Build compact section list for AI
  const sectionList = sections
    .map((s, i) => `Section ${i + 1}: "${s.heading}"\nPreview: ${s.preview}`)
    .join("\n\n");

  try {
    const response = await client.chat.completions.create({
      model: model || DEFAULT_MODEL,
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

    if (
      !Array.isArray(classifications) ||
      classifications.length !== sections.length
    ) {
      // Malformed response — fall back to even split
      res.json(evenSplit(sections));
      return;
    }

    const introSections: H2Section[] = [];
    const whySections: H2Section[] = [];
    const closingSections: H2Section[] = [];
    const faqSections: H2Section[] = [];

    for (let i = 0; i < sections.length; i++) {
      const cls = classifications[i];
      if (cls === "why") whySections.push(sections[i]);
      else if (cls === "closing") closingSections.push(sections[i]);
      else if (cls === "faq") faqSections.push(sections[i]);
      else introSections.push(sections[i]); // "intro" or unrecognized → intro
    }

    const faqHtml = joinSections(faqSections);
    const faqItems = faqHtml ? extractFaqItems(faqHtml) : [];

    res.json({
      body: joinSections(introSections),
      why_body: joinSections(whySections),
      closing_body: joinSections(closingSections),
      faq: JSON.stringify(faqItems),
    });
  } catch (err) {
    console.error("ai-split-area-content error:", err);
    // Fall back to even split on any AI error
    res.json(evenSplit(sections));
  }
};
