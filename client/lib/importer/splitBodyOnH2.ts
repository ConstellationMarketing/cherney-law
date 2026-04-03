// H2 splitting utility — extracted for re-use across preparer and recipeRules

import type { ContentSection } from './types';

/**
 * Split body HTML into sections delimited by H2 headings.
 */
export function splitBodyOnH2(html: string): ContentSection[] {
  if (!html?.trim()) return [];

  const sections: ContentSection[] = [];
  const h2Pattern = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let match;
  const splits: { heading: string; headingTag: string; bodyStart: number }[] = [];

  while ((match = h2Pattern.exec(html)) !== null) {
    splits.push({
      heading: match[1].replace(/<[^>]*>/g, '').trim(),
      headingTag: match[0],
      bodyStart: match.index + match[0].length,
    });
  }

  if (splits.length === 0) {
    return [{ heading: '', body: html.trim(), headingTag: '' }];
  }

  // Content before first H2
  const preContent = html.substring(0, splits[0].bodyStart - splits[0].headingTag.length).trim();
  if (preContent) {
    sections.push({ heading: '', body: preContent, headingTag: '' });
  }

  for (let i = 0; i < splits.length; i++) {
    const start = splits[i].bodyStart;
    const end = i + 1 < splits.length
      ? splits[i + 1].bodyStart - splits[i + 1].headingTag.length
      : html.length;

    const body = html.substring(start, end).trim();
    sections.push({
      heading: splits[i].heading,
      body,
      headingTag: splits[i].headingTag,
    });
  }

  return sections;
}
