// AI assist — OpenAI integration for the bulk importer
// Provides: smart field mapping, meta generation, content quality scoring,
// and content rewriting suggestions.
// All features degrade gracefully when AI is unavailable.

import type { AiSettings } from './recipeTypes';

/** Check if AI features are available (API key configured) */
export async function checkAiAvailability(): Promise<boolean> {
  try {
    const res = await fetch('/api/ai-status');
    if (!res.ok) return false;
    const data = await res.json();
    return data.available === true;
  } catch {
    return false;
  }
}

/**
 * Generate meta title and description from page content.
 */
export async function generateMeta(
  title: string,
  content: string,
  settings: AiSettings
): Promise<{ metaTitle: string; metaDescription: string } | null> {
  if (!settings.useForMeta) return null;

  try {
    const res = await fetch('/api/ai-generate-meta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content: content.substring(0, 3000), // Limit content length
        model: settings.model,
        temperature: settings.temperature,
      }),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Score content quality using AI.
 */
export async function scoreContentWithAi(
  content: string,
  templateType: string,
  settings: AiSettings
): Promise<{ score: number; feedback: string } | null> {
  if (!settings.useForScoring) return null;

  try {
    const res = await fetch('/api/ai-score-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content.substring(0, 5000),
        templateType,
        model: settings.model,
        temperature: settings.temperature,
      }),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Get AI suggestions for field mapping when auto-mapper confidence is low.
 */
export async function suggestFieldMapping(
  columnNames: string[],
  sampleValues: Record<string, string[]>,
  templateType: string,
  settings: AiSettings
): Promise<Record<string, string> | null> {
  if (!settings.useForMapping) return null;

  try {
    const res = await fetch('/api/ai-suggest-mapping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        columnNames,
        sampleValues,
        templateType,
        model: settings.model,
      }),
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Get AI rewriting suggestion for low-quality content.
 */
export async function suggestRewrite(
  content: string,
  context: string,
  settings: AiSettings
): Promise<string | null> {
  if (!settings.useForRewriting) return null;

  try {
    const res = await fetch('/api/ai-suggest-rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content.substring(0, 3000),
        context,
        model: settings.model,
        temperature: settings.temperature,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.rewritten ?? null;
  } catch {
    return null;
  }
}
