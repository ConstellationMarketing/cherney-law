import { RequestHandler } from "express";
import OpenAI from "openai";

const DEFAULT_MODEL = "gpt-4o-mini";
const MAX_CONTENT_LENGTH = 5000;
const MAX_BODY_LENGTH = 3000;

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

// ---------------------------------------------------------------------------
// GET /api/ai-status
// ---------------------------------------------------------------------------
export const handleAiStatus: RequestHandler = (_req, res) => {
  const available = !!process.env.OPENAI_API_KEY;
  res.json({ available });
};

// ---------------------------------------------------------------------------
// POST /api/ai-generate-meta
// ---------------------------------------------------------------------------
export const handleAiGenerateMeta: RequestHandler = async (req, res) => {
  const client = getOpenAIClient();
  if (!client) {
    res.status(503).json({ error: "OpenAI not configured" });
    return;
  }

  const { title, content, model, temperature } = req.body ?? {};
  if (!title) {
    res.status(400).json({ error: "title is required" });
    return;
  }

  const truncatedContent = (content ?? "").substring(0, MAX_BODY_LENGTH);

  try {
    const response = await client.chat.completions.create({
      model: model || DEFAULT_MODEL,
      temperature: temperature ?? 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an SEO specialist for a legal services website. Generate an SEO-friendly meta title (max 60 characters) and meta description (max 155 characters) for the given page. Respond with JSON: { "metaTitle": "...", "metaDescription": "..." }`,
        },
        {
          role: "user",
          content: `Page title: ${title}\n\nPage content:\n${truncatedContent}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    res.json({
      metaTitle: parsed.metaTitle ?? "",
      metaDescription: parsed.metaDescription ?? "",
    });
  } catch (err) {
    console.error("ai-generate-meta error:", err);
    res.status(500).json({ error: "Failed to generate meta" });
  }
};

// ---------------------------------------------------------------------------
// POST /api/ai-score-content
// ---------------------------------------------------------------------------
export const handleAiScoreContent: RequestHandler = async (req, res) => {
  const client = getOpenAIClient();
  if (!client) {
    res.status(503).json({ error: "OpenAI not configured" });
    return;
  }

  const { content, templateType, model, temperature } = req.body ?? {};
  if (!content) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const truncatedContent = content.substring(0, MAX_CONTENT_LENGTH);

  try {
    const response = await client.chat.completions.create({
      model: model || DEFAULT_MODEL,
      temperature: temperature ?? 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a content quality evaluator for a legal services website. Evaluate the following ${templateType || "page"} content on these dimensions: completeness, readability, SEO value, and uniqueness. Return a JSON object: { "score": <number 0-1>, "feedback": "<brief feedback string>" }. A score of 1.0 means excellent quality, 0.0 means very poor.`,
        },
        {
          role: "user",
          content: truncatedContent,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    res.json({
      score: typeof parsed.score === "number" ? parsed.score : 0.5,
      feedback: parsed.feedback ?? "",
    });
  } catch (err) {
    console.error("ai-score-content error:", err);
    res.status(500).json({ error: "Failed to score content" });
  }
};

// ---------------------------------------------------------------------------
// POST /api/ai-suggest-mapping
// ---------------------------------------------------------------------------

const TEMPLATE_FIELD_SUMMARIES: Record<string, string> = {
  practice:
    "title, slug, hero_tagline, hero_description, hero_image, body, faq, meta_title, meta_description, canonical_url, og_image, status, schema_type",
  post: "title, slug, body, excerpt, featured_image, category, meta_title, meta_description, canonical_url, og_image, published_at, status",
};

export const handleAiSuggestMapping: RequestHandler = async (req, res) => {
  const client = getOpenAIClient();
  if (!client) {
    res.status(503).json({ error: "OpenAI not configured" });
    return;
  }

  const { columnNames, sampleValues, templateType, model } = req.body ?? {};
  if (!columnNames || !templateType) {
    res.status(400).json({ error: "columnNames and templateType are required" });
    return;
  }

  const targetFields =
    TEMPLATE_FIELD_SUMMARIES[templateType] ??
    TEMPLATE_FIELD_SUMMARIES["practice"];

  // Build a concise sample preview
  const samplePreview = (columnNames as string[])
    .map((col: string) => {
      const vals = (sampleValues?.[col] ?? []) as string[];
      const preview = vals
        .slice(0, 2)
        .map((v: string) => (v.length > 80 ? v.substring(0, 80) + "…" : v))
        .join(" | ");
      return `${col}: ${preview || "(empty)"}`;
    })
    .join("\n");

  try {
    const response = await client.chat.completions.create({
      model: model || DEFAULT_MODEL,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a data mapping assistant. Map source CSV/JSON column names to the target CMS template fields. Target fields for "${templateType}": ${targetFields}. Return a JSON object where keys are source column names and values are the best-matching target field key, or "__skip__" if no good match exists. Only output the JSON object, nothing else.`,
        },
        {
          role: "user",
          content: `Source columns with sample values:\n${samplePreview}`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
    res.json(parsed);
  } catch (err) {
    console.error("ai-suggest-mapping error:", err);
    res.status(500).json({ error: "Failed to suggest mapping" });
  }
};

// ---------------------------------------------------------------------------
// POST /api/ai-suggest-rewrite
// ---------------------------------------------------------------------------
export const handleAiSuggestRewrite: RequestHandler = async (req, res) => {
  const client = getOpenAIClient();
  if (!client) {
    res.status(503).json({ error: "OpenAI not configured" });
    return;
  }

  const { content, context, model, temperature } = req.body ?? {};
  if (!content) {
    res.status(400).json({ error: "content is required" });
    return;
  }

  const truncatedContent = content.substring(0, MAX_BODY_LENGTH);

  try {
    const response = await client.chat.completions.create({
      model: model || DEFAULT_MODEL,
      temperature: temperature ?? 0.4,
      messages: [
        {
          role: "system",
          content: `You are a professional content editor for a legal services website. Improve the following content: fix grammar, improve clarity, maintain a professional and authoritative tone. Keep the HTML structure intact but improve the text. ${context ? `Context: ${context}` : ""}. Return ONLY the rewritten HTML content, no explanation.`,
        },
        {
          role: "user",
          content: truncatedContent,
        },
      ],
    });

    const rewritten = response.choices[0]?.message?.content ?? content;
    res.json({ rewritten });
  } catch (err) {
    console.error("ai-suggest-rewrite error:", err);
    res.status(500).json({ error: "Failed to rewrite content" });
  }
};
