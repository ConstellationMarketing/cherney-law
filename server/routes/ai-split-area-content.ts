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

/**
 * Extract the first image from an HTML string.
 * Returns the image src, alt text, and HTML with the image removed.
 */
function extractFirstImage(html: string): { src: string; alt: string; cleanedHtml: string } {
  const imgRegex = /<img([^>]*)>/i;
  const match = html.match(imgRegex);
  if (!match) return { src: '', alt: '', cleanedHtml: html };

  const attrs = match[1];
  // Prefer data-lazy-src over src (common in WordPress/Divi lazy-loaded images)
  const src =
    attrs.match(/data-lazy-src=["']([^"']+)["']/i)?.[1] ??
    attrs.match(/src=["']([^"']+)["']/i)?.[1] ??
    '';
  const alt = attrs.match(/alt=["']([^"']*)["']/i)?.[1] ?? '';

  // Remove the img tag and any resulting empty <p> wrappers
  const cleanedHtml = html
    .replace(match[0], '')
    .replace(/^\s*<p>\s*<\/p>/gm, '')
    .trim();

  return { src, alt, cleanedHtml };
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
  const empty = {
    body: '', why_body: '', closing_body: '', faq: '[]',
    body_image: '', body_image_alt: '',
    why_image: '', why_image_alt: '',
    closing_image: '', closing_image_alt: '',
  };

  const faqSections: H2Section[] = [];
  const contentSections: H2Section[] = [];

  for (const s of sections) {
    if (/faq|frequent|question/i.test(s.heading)) {
      faqSections.push(s);
    } else {
      contentSections.push(s);
    }
  }

  const faqHtml = joinSections(faqSections);
  const faqItems = faqHtml ? extractFaqItems(faqHtml) : [];

  const n = contentSections.length;
  if (n === 0) return { ...empty, faq: JSON.stringify(faqItems) };

  if (n === 1) {
    const bodyImg = extractFirstImage(contentSections[0].html);
    return {
      ...empty,
      body: bodyImg.cleanedHtml,
      body_image: bodyImg.src,
      body_image_alt: bodyImg.alt,
      faq: JSON.stringify(faqItems),
    };
  }

  if (n === 2) {
    const bodyImg = extractFirstImage(contentSections[0].html);
    const closingImg = extractFirstImage(contentSections[1].html);
    return {
      ...empty,
      body: bodyImg.cleanedHtml,
      body_image: bodyImg.src,
      body_image_alt: bodyImg.alt,
      closing_body: closingImg.cleanedHtml,
      closing_image: closingImg.src,
      closing_image_alt: closingImg.alt,
      faq: JSON.stringify(faqItems),
    };
  }

  // 3+: 1 in intro, last in closing, middle in why
  const introSection = contentSections[0];
  const closingSection = contentSections[n - 1];
  const whySectionsList = contentSections.slice(1, n - 1);

  const bodyImg = extractFirstImage(introSection.html);
  const closingImg = extractFirstImage(closingSection.html);
  const whyHtml = joinSections(whySectionsList);
  const whyImg = extractFirstImage(whyHtml);

  return {
    body: bodyImg.cleanedHtml,
    why_body: whyImg.cleanedHtml,
    closing_body: closingImg.cleanedHtml,
    faq: JSON.stringify(faqItems),
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

  const sections = splitIntoH2Sections(html);

  const client = getOpenAIClient();
  if (!client) {
    res.json(smartFallbackSplit(sections));
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
          content: `You are classifying H2 sections of a law firm "Areas We Serve" page.

RULES:
- "faq": ALWAYS use this for any section whose heading contains words like "FAQ", "Questions", "Frequently Asked", OR whose content is primarily H3/H4 question+answer pairs or <dl>/<dt>/<dd> lists. This MUST take priority over all other categories.
- "intro": Use for the FIRST meaningful content section (location intro, firm overview, welcome). Assign AT MOST 1–2 sections as "intro".
- "why": Use for sections about attorney credentials, experience, firm benefits, client stories, types of debts handled. Assign AT MOST 2 sections as "why".
- "closing": Use for calls-to-action, contact us, consultation offers, resource links, map/location info, office addresses. Typically the last 1–2 sections.

Assignment strategy:
- If there are N sections total, try to distribute roughly: 1–2 intro, 1–2 why, 1–2 closing, any number faq.
- If a section could be either "closing" or "why", prefer "closing" for the last section and "why" for earlier ones.
- Never assign FAQ-style content to "closing".
- The FIRST section should almost always be "intro" unless it is clearly a FAQ.

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

    if (
      !Array.isArray(classifications) ||
      classifications.length !== sections.length
    ) {
      res.json(smartFallbackSplit(sections));
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

    // Assemble grouped HTML strings
    const bodyHtml = joinSections(introSections);
    const whyHtml = joinSections(whySections);
    const closingHtml = joinSections(closingSections);

    // Extract first image from each group, removing it from the HTML
    const bodyImg = extractFirstImage(bodyHtml);
    const whyImg = extractFirstImage(whyHtml);
    const closingImg = extractFirstImage(closingHtml);

    res.json({
      body: bodyImg.cleanedHtml,
      why_body: whyImg.cleanedHtml,
      closing_body: closingImg.cleanedHtml,
      faq: JSON.stringify(faqItems),
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
