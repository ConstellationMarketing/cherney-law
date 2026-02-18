// TypeScript interfaces for global site settings (Header/Footer CMS)

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  order?: number;
  external?: boolean;
  openInNewTab?: boolean;
  children?: NavItem[];
}

// Backward compatibility alias
export type NavigationItem = NavItem;

export interface FooterLink {
  label: string;
  href?: string;
}

export interface FooterLocationLine {
  text: string;
  href?: string;
}

export interface FooterLocation {
  title: string;
  lines: FooterLocationLine[];
}

export interface SocialLink {
  platform: "facebook" | "instagram" | "twitter" | "linkedin" | "youtube";
  url: string;
  enabled: boolean;
}

export interface SiteSettings {
  // Site Name
  siteName: string;

  // Logo
  logoUrl: string;
  logoAlt: string;

  // Phone
  phoneNumber: string; // e.g., "4049057742"
  phoneDisplay: string; // e.g., "404-905-7742"
  phoneAvailability: string; // e.g., "Available 24/7"
  applyPhoneGlobally: boolean;

  // Header CTA
  headerCtaText: string;
  headerCtaUrl: string;

  // Navigation
  navigationItems: NavItem[];

  // Footer Links (legacy)
  footerAboutLinks: FooterLink[];
  footerPracticeLinks: FooterLink[];

  // Footer Content (new)
  footerTagline: string;
  footerLocations: FooterLocation[];
  footerBottomLinks: FooterLink[];

  // Address
  addressLine1: string;
  addressLine2: string;

  // Map
  mapEmbedUrl: string;

  // Social
  socialLinks: SocialLink[];

  // Copyright
  copyrightText: string;

  // Footer Tagline (Rich Text HTML) - legacy
  footerTaglineHtml: string;

  // SEO
  siteNoindex: boolean;

  // Analytics & Scripts
  ga4MeasurementId: string;
  googleAdsId: string;
  googleAdsConversionLabel: string;
  headScripts: string;
  footerScripts: string;
}

// Database row structure from Supabase site_settings table
export interface SiteSettingsRow {
  id: string;
  settings_key: string;
  logo_url: string | null;
  logo_alt: string | null;
  phone_number: string | null;
  phone_display: string | null;
  phone_availability: string | null;
  apply_phone_globally: boolean;
  header_cta_text: string | null;
  header_cta_url: string | null;
  navigation_items: any; // JSONB can be NavItem[] or old format
  footer_about_links: FooterLink[];
  footer_practice_links: FooterLink[];
  footer_tagline: string | null;
  footer_locations: any; // JSONB
  footer_bottom_links: any; // JSONB
  address_line1: string | null;
  address_line2: string | null;
  map_embed_url: string | null;
  social_links: SocialLink[];
  copyright_text: string | null;
  footer_tagline_html: string | null;
  site_noindex: boolean;
  ga4_measurement_id: string | null;
  google_ads_id: string | null;
  google_ads_conversion_label: string | null;
  head_scripts: string | null;
  footer_scripts: string | null;
  site_name: string | null;
  updated_at: string;
  updated_by: string | null;
}

// Default values matching current hardcoded content
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: "",
  logoUrl: "",
  logoAlt: "",
  phoneNumber: "",
  phoneDisplay: "",
  phoneAvailability: "",
  applyPhoneGlobally: true,
  headerCtaText: "",
  headerCtaUrl: "",
  navigationItems: [],
  footerAboutLinks: [],
  footerPracticeLinks: [],
  footerTagline: "",
  footerLocations: [],
  footerBottomLinks: [],
  addressLine1: "",
  addressLine2: "",
  mapEmbedUrl: "",
  socialLinks: [],
  copyrightText: "",
  footerTaglineHtml: "",
  siteNoindex: false,
  ga4MeasurementId: "",
  googleAdsId: "",
  googleAdsConversionLabel: "",
  headScripts: "",
  footerScripts: "",
};

// Generate stable ID for nav items
function generateNavId(label: string, href: string | undefined, index: number): string {
  const base = `${label}-${href || 'no-href'}-${index}`;
  return base.toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 50);
}

// Validate and normalize a nav item
function normalizeNavItem(item: any, index: number, isChild = false): NavItem | null {
  if (typeof item !== 'object' || item === null || typeof item.label !== 'string') {
    return null;
  }

  const normalized: NavItem = {
    id: item.id || generateNavId(item.label, item.href, index),
    label: item.label,
    href: typeof item.href === 'string' ? item.href : undefined,
    order: typeof item.order === 'number' ? item.order : undefined,
    external: typeof item.external === 'boolean' ? item.external : undefined,
    openInNewTab: typeof item.openInNewTab === 'boolean' ? item.openInNewTab : undefined,
  };

  // Only process children for top-level items (enforce max depth 2)
  if (!isChild && Array.isArray(item.children) && item.children.length > 0) {
    const validChildren = item.children
      .map((child: any, childIndex: number) => normalizeNavItem(child, childIndex, true))
      .filter(Boolean) as NavItem[];

    if (validChildren.length > 0) {
      normalized.children = validChildren;
    }
  }

  return normalized;
}

// Helper to convert database row to SiteSettings interface
export function rowToSiteSettings(row: SiteSettingsRow): SiteSettings {
  // Process navigation items with validation
  let navigationItems: NavItem[] = [];
  if (Array.isArray(row.navigation_items)) {
    navigationItems = row.navigation_items
      .map((item, index) => normalizeNavItem(item, index, false))
      .filter(Boolean) as NavItem[];
  }

  // Process footer locations
  let footerLocations: FooterLocation[] = [];
  if (Array.isArray(row.footer_locations)) {
    footerLocations = row.footer_locations
      .filter((loc: any) =>
        typeof loc === 'object' &&
        loc !== null &&
        typeof loc.title === 'string' &&
        Array.isArray(loc.lines)
      )
      .map((loc: any) => ({
        title: loc.title,
        lines: loc.lines.filter((line: any) =>
          typeof line === 'object' &&
          line !== null &&
          typeof line.text === 'string'
        )
      }));
  }

  // Process footer bottom links
  let footerBottomLinks: FooterLink[] = [];
  if (Array.isArray(row.footer_bottom_links)) {
    footerBottomLinks = row.footer_bottom_links
      .filter((link: any) =>
        typeof link === 'object' &&
        link !== null &&
        typeof link.label === 'string'
      );
  }

  return {
    siteName: row.site_name || DEFAULT_SITE_SETTINGS.siteName,
    logoUrl: row.logo_url || DEFAULT_SITE_SETTINGS.logoUrl,
    logoAlt: row.logo_alt || DEFAULT_SITE_SETTINGS.logoAlt,
    phoneNumber: row.phone_number || DEFAULT_SITE_SETTINGS.phoneNumber,
    phoneDisplay: row.phone_display || DEFAULT_SITE_SETTINGS.phoneDisplay,
    phoneAvailability:
      row.phone_availability || DEFAULT_SITE_SETTINGS.phoneAvailability,
    applyPhoneGlobally:
      row.apply_phone_globally ?? DEFAULT_SITE_SETTINGS.applyPhoneGlobally,
    headerCtaText: row.header_cta_text || DEFAULT_SITE_SETTINGS.headerCtaText,
    headerCtaUrl: row.header_cta_url || DEFAULT_SITE_SETTINGS.headerCtaUrl,
    navigationItems,
    footerAboutLinks: row.footer_about_links?.length
      ? row.footer_about_links
      : DEFAULT_SITE_SETTINGS.footerAboutLinks,
    footerPracticeLinks: row.footer_practice_links?.length
      ? row.footer_practice_links
      : DEFAULT_SITE_SETTINGS.footerPracticeLinks,
    footerTagline: typeof row.footer_tagline === 'string' ? row.footer_tagline : DEFAULT_SITE_SETTINGS.footerTagline,
    footerLocations,
    footerBottomLinks,
    addressLine1: row.address_line1 || DEFAULT_SITE_SETTINGS.addressLine1,
    addressLine2: row.address_line2 || DEFAULT_SITE_SETTINGS.addressLine2,
    mapEmbedUrl: row.map_embed_url || DEFAULT_SITE_SETTINGS.mapEmbedUrl,
    socialLinks: row.social_links?.length
      ? row.social_links
      : DEFAULT_SITE_SETTINGS.socialLinks,
    copyrightText: row.copyright_text || DEFAULT_SITE_SETTINGS.copyrightText,
    footerTaglineHtml: row.footer_tagline_html || DEFAULT_SITE_SETTINGS.footerTaglineHtml,
    siteNoindex: row.site_noindex ?? DEFAULT_SITE_SETTINGS.siteNoindex,
    ga4MeasurementId: row.ga4_measurement_id || "",
    googleAdsId: row.google_ads_id || "",
    googleAdsConversionLabel: row.google_ads_conversion_label || "",
    headScripts: row.head_scripts || "",
    footerScripts: row.footer_scripts || "",
  };
}

// Ensure nav item has ID before saving
function ensureNavItemId(item: NavItem, index: number): NavItem {
  const withId = {
    ...item,
    id: item.id || generateNavId(item.label, item.href, index),
  };

  // Process children and ensure they have IDs too
  if (item.children && item.children.length > 0) {
    withId.children = item.children.map((child, childIndex) =>
      ensureNavItemId(child, childIndex)
    );
  }

  // Remove undefined fields to avoid writing them to DB
  const cleaned: any = {
    id: withId.id,
    label: withId.label,
  };

  if (withId.href !== undefined) cleaned.href = withId.href;
  if (withId.order !== undefined) cleaned.order = withId.order;
  if (withId.external !== undefined) cleaned.external = withId.external;
  if (withId.openInNewTab !== undefined) cleaned.openInNewTab = withId.openInNewTab;
  if (withId.children !== undefined) cleaned.children = withId.children;

  return cleaned;
}

// Helper to convert SiteSettings to database row format for updates
export function siteSettingsToRow(
  settings: SiteSettings,
): Partial<SiteSettingsRow> {
  // Ensure all nav items have IDs
  const navigationItems = settings.navigationItems.map((item, index) =>
    ensureNavItemId(item, index)
  );

  return {
    logo_url: settings.logoUrl,
    logo_alt: settings.logoAlt,
    phone_number: settings.phoneNumber,
    phone_display: settings.phoneDisplay,
    phone_availability: settings.phoneAvailability,
    apply_phone_globally: settings.applyPhoneGlobally,
    header_cta_text: settings.headerCtaText,
    header_cta_url: settings.headerCtaUrl,
    navigation_items: navigationItems as any,
    footer_about_links: settings.footerAboutLinks,
    footer_practice_links: settings.footerPracticeLinks,
    footer_tagline: settings.footerTagline || null,
    footer_locations: settings.footerLocations as any,
    footer_bottom_links: settings.footerBottomLinks as any,
    address_line1: settings.addressLine1,
    address_line2: settings.addressLine2,
    map_embed_url: settings.mapEmbedUrl,
    social_links: settings.socialLinks,
    copyright_text: settings.copyrightText,
    footer_tagline_html: settings.footerTaglineHtml || null,
    site_noindex: settings.siteNoindex,
    ga4_measurement_id: settings.ga4MeasurementId || null,
    google_ads_id: settings.googleAdsId || null,
    google_ads_conversion_label: settings.googleAdsConversionLabel || null,
    head_scripts: settings.headScripts || null,
    footer_scripts: settings.footerScripts || null,
    site_name: settings.siteName,
  };
}
