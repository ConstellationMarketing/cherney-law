import type { SiteSettings } from '../contexts/SiteSettingsContext';

export interface PageSeoFields {
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  url_path: string;
  title: string; // page.title as fallback
}

export interface ResolvedSeo {
  title: string;
  description: string;
  canonical: string | undefined;
  image: string | undefined;
  noindex: boolean;
}

export function resolveSeo(
  page: PageSeoFields | null | undefined,
  siteSettings: SiteSettings,
  pathname: string,
  siteUrl: string
): ResolvedSeo {
  // Hardcoded final fallbacks
  const FALLBACK_SITE_NAME = 'Constellation Law Firm';
  const FALLBACK_DESCRIPTION = 'Protecting your rights with integrity, experience, and relentless advocacy.';
  const FALLBACK_OG_IMAGE = siteUrl ? `${siteUrl}/og-image.jpg` : undefined;

  // Extract site settings with fallbacks
  const siteName = siteSettings.siteName || FALLBACK_SITE_NAME;
  const siteNoindex = siteSettings.siteNoindex || false;

  // PRECEDENCE: Page → Site Settings → Hardcoded

  // Title: Use meta_title as-is, only append siteName to page.title fallback
  // meta_title → use exactly as saved (user controls full title)
  // page.title → append siteName
  // fallback → siteName alone
  let fullTitle: string;
  if (page?.meta_title) {
    // meta_title is complete - use as-is, do NOT append siteName
    fullTitle = page.meta_title;
  } else if (page?.title) {
    // Fallback to page.title with branding
    fullTitle = `${page.title} | ${siteName}`;
  } else {
    // Final fallback - siteName alone
    fullTitle = siteName;
  }

  // Description: meta_description → og_description → hardcoded
  const description = 
    page?.meta_description || 
    page?.og_description || 
    FALLBACK_DESCRIPTION;

  // Canonical: Ensure absolute URL (normalize relative to absolute)
  // canonical_url → construct from siteUrl + url_path → construct from siteUrl + pathname
  let canonical: string | undefined;
  if (page?.canonical_url) {
    // If canonical_url is relative, make it absolute
    if (page.canonical_url.startsWith('http://') || page.canonical_url.startsWith('https://')) {
      canonical = page.canonical_url;
    } else {
      // Relative URL - normalize to absolute using siteUrl
      const cleanPath = page.canonical_url.startsWith('/') ? page.canonical_url : `/${page.canonical_url}`;
      canonical = siteUrl ? `${siteUrl}${cleanPath}` : undefined;
    }
  } else if (siteUrl && page?.url_path) {
    canonical = `${siteUrl}${page.url_path}`;
  } else if (siteUrl) {
    canonical = `${siteUrl}${pathname}`;
  }

  // OG Image: og_image → hardcoded
  const image = page?.og_image || FALLBACK_OG_IMAGE;

  // Noindex: page.noindex OR site.siteNoindex
  const noindex = (page?.noindex ?? false) || siteNoindex;

  // Pure function - returns new object, does not mutate inputs
  return {
    title: fullTitle,
    description,
    canonical,
    image,
    noindex,
  };
}
