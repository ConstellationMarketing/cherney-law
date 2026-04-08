export interface ResolvedHtmlImage {
  src: string;
  alt: string;
}

export interface ResolvedHtmlImageMatch extends ResolvedHtmlImage {
  tag: string;
  start: number;
  end: number;
}

const IMG_TAG_PATTERN = /<img\b[^>]*>/gi;
const HTML_IMAGE_TOKEN_PATTERN = /<noscript\b[^>]*>[\s\S]*?<\/noscript>|<img\b[^>]*>/gi;
const IMG_ATTRIBUTE_PATTERN = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/gi;
const DATA_URL_PATTERN = /^data:/i;
const UNSAFE_URL_PATTERN = /^(?:javascript|vbscript):/i;

function parseImgAttributes(imgTag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const rawAttributes = imgTag
    .replace(/^<img\b/i, '')
    .replace(/\/?\s*>$/i, '');

  IMG_ATTRIBUTE_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = IMG_ATTRIBUTE_PATTERN.exec(rawAttributes)) !== null) {
    const name = match[1]?.toLowerCase();
    if (!name) continue;
    const value = (match[2] ?? match[3] ?? match[4] ?? '').trim();
    attributes[name] = value;
  }

  return attributes;
}

function normalizeImageUrlCandidate(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return '';
  if (DATA_URL_PATTERN.test(trimmed)) return '';
  if (UNSAFE_URL_PATTERN.test(trimmed)) return '';
  return trimmed;
}

function extractFirstUsableSrcsetUrl(srcset: string | undefined): string {
  const trimmed = srcset?.trim() ?? '';
  if (!trimmed || DATA_URL_PATTERN.test(trimmed)) return '';

  for (const candidate of trimmed.split(',')) {
    const url = normalizeImageUrlCandidate(candidate.trim().split(/\s+/)[0]);
    if (url) return url;
  }

  return '';
}

function resolveImageAttributes(attributes: Record<string, string>): ResolvedHtmlImage | null {
  const src =
    normalizeImageUrlCandidate(attributes['data-lazy-src'])
    || normalizeImageUrlCandidate(attributes['data-src'])
    || extractFirstUsableSrcsetUrl(attributes.srcset)
    || extractFirstUsableSrcsetUrl(attributes['data-lazy-srcset'])
    || extractFirstUsableSrcsetUrl(attributes['data-srcset'])
    || normalizeImageUrlCandidate(attributes['data-original'])
    || normalizeImageUrlCandidate(attributes['data-orig-file'])
    || normalizeImageUrlCandidate(attributes['data-large-file'])
    || normalizeImageUrlCandidate(attributes['data-medium-file'])
    || normalizeImageUrlCandidate(attributes.src);

  if (!src) return null;

  return {
    src,
    alt: attributes.alt ?? '',
  };
}

function extractNoscriptInnerHtml(noscriptTag: string): string {
  const match = noscriptTag.match(/^<noscript\b[^>]*>([\s\S]*?)<\/noscript>$/i);
  return match?.[1]?.trim() ?? '';
}

function extractImageMatchesFromHtmlInternal(html: string, includeNoscript: boolean): ResolvedHtmlImageMatch[] {
  if (!html?.trim()) return [];

  const images: ResolvedHtmlImageMatch[] = [];
  const tokenPattern = includeNoscript ? HTML_IMAGE_TOKEN_PATTERN : IMG_TAG_PATTERN;
  tokenPattern.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = tokenPattern.exec(html)) !== null) {
    const token = match[0];

    if (/^<noscript\b/i.test(token)) {
      const innerMatches = extractImageMatchesFromHtmlInternal(extractNoscriptInnerHtml(token), false);
      images.push(
        ...innerMatches.map(({ src, alt }) => ({
          src,
          alt,
          tag: token,
          start: match!.index,
          end: match!.index + token.length,
        }))
      );
      continue;
    }

    const image = resolveImageTag(token);
    if (image?.src) {
      images.push({
        ...image,
        tag: token,
        start: match.index,
        end: match.index + token.length,
      });
    }
  }

  return images;
}

export function resolveImageTag(imgTag: string): ResolvedHtmlImage | null {
  if (!/^<img\b/i.test(imgTag)) return null;
  return resolveImageAttributes(parseImgAttributes(imgTag));
}

export function extractImageMatchesFromHtml(html: string): ResolvedHtmlImageMatch[] {
  return extractImageMatchesFromHtmlInternal(html, true);
}

export function extractImagesFromHtml(html: string): ResolvedHtmlImage[] {
  return extractImageMatchesFromHtml(html).map(({ src, alt }) => ({ src, alt }));
}

export function extractFirstImageFromHtml(html: string): ResolvedHtmlImage | null {
  const images = extractImagesFromHtml(html);
  return images[0] ?? null;
}

export function extractFirstImageMatchFromHtml(html: string): ResolvedHtmlImageMatch | null {
  const images = extractImageMatchesFromHtml(html);
  return images[0] ?? null;
}

export function isExternalHttpImageUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

export function isDiscardableImageUrl(value: unknown): boolean {
  return typeof value === 'string' && (DATA_URL_PATTERN.test(value.trim()) || UNSAFE_URL_PATTERN.test(value.trim()));
}
