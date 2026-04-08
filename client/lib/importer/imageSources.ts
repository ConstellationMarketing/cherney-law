export interface ResolvedHtmlImage {
  src: string;
  alt: string;
}

const IMG_TAG_PATTERN = /<img\b[^>]*>/gi;
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

export function resolveImageTag(imgTag: string): ResolvedHtmlImage | null {
  if (!/^<img\b/i.test(imgTag)) return null;

  const attributes = parseImgAttributes(imgTag);
  const src =
    normalizeImageUrlCandidate(attributes['data-lazy-src'])
    || normalizeImageUrlCandidate(attributes['data-src'])
    || extractFirstUsableSrcsetUrl(attributes['data-srcset'])
    || extractFirstUsableSrcsetUrl(attributes.srcset)
    || normalizeImageUrlCandidate(attributes.src);

  if (!src) return null;

  return {
    src,
    alt: attributes.alt ?? '',
  };
}

export function extractImagesFromHtml(html: string): ResolvedHtmlImage[] {
  if (!html?.trim()) return [];

  const images: ResolvedHtmlImage[] = [];
  IMG_TAG_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = IMG_TAG_PATTERN.exec(html)) !== null) {
    const image = resolveImageTag(match[0]);
    if (image?.src) {
      images.push(image);
    }
  }

  return images;
}

export function extractFirstImageFromHtml(html: string): ResolvedHtmlImage | null {
  const images = extractImagesFromHtml(html);
  return images[0] ?? null;
}

export function isExternalHttpImageUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value.trim());
}

export function isDiscardableImageUrl(value: unknown): boolean {
  return typeof value === 'string' && (DATA_URL_PATTERN.test(value.trim()) || UNSAFE_URL_PATTERN.test(value.trim()));
}
