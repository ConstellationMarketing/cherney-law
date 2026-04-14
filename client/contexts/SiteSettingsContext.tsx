import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { fetchSupabaseJson } from "@site/lib/cms/api";

export interface NavigationItem {
  id?: string;
  label: string;
  href?: string;
  order?: number;
  external?: boolean;
  openInNewTab?: boolean;
  children?: NavigationItem[];
}

export interface SiteSettings {
  siteName: string;
  logoUrl: string;
  logoAlt: string;
  phoneNumber: string;
  phoneDisplay: string;
  phoneAvailability: string;
  applyPhoneGlobally: boolean;
  headerCtaText: string;
  headerCtaUrl: string;
  navigationItems: NavigationItem[];
  footerAboutLinks: { label: string; href?: string }[];
  footerPracticeLinks: { label: string; href?: string }[];
  addressLine1: string;
  addressLine2: string;
  mapEmbedUrl: string;
  socialLinks: { platform: string; url: string; enabled: boolean }[];
  footerTagline: string;
  footerLocations: { title: string; lines: { text: string; href?: string }[] }[];
  footerBottomLinks: { label: string; href?: string }[];
  copyrightText: string;
  siteUrl: string;
  siteNoindex: boolean;
  ga4MeasurementId: string;
  googleAdsId: string;
  googleAdsConversionLabel: string;
  headScripts: string;
  footerScripts: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Constellation Law Firm",
  logoUrl: "/images/logos/firm-logo.png",
  logoAlt: "Constellation Law Firm",
  phoneNumber: "4045555555",
  phoneDisplay: "404-555-5555",
  phoneAvailability: "Call Us 24/7",
  applyPhoneGlobally: true,
  headerCtaText: "Contact Us",
  headerCtaUrl: "/contact/",
  navigationItems: [],
  footerAboutLinks: [],
  footerPracticeLinks: [],
  addressLine1: "",
  addressLine2: "",
  mapEmbedUrl: "",
  socialLinks: [],
  footerTagline:
    "Bankruptcy should be pursued along with the counsel and representation of an experienced bankruptcy attorney with an outstanding attorney profile.",
  footerLocations: [],
  footerBottomLinks: [
    { label: "Privacy Policy", href: "/privacy-policy/" },
    { label: "Terms of Service", href: "/terms-of-service/" },
    { label: "Disclaimer", href: "/disclaimer/" },
  ],
  copyrightText: `Copyright © ${new Date().getFullYear()} | All Rights Reserved`,
  siteUrl: "",
  siteNoindex: false,
  ga4MeasurementId: "",
  googleAdsId: "",
  googleAdsConversionLabel: "",
  headScripts: "",
  footerScripts: "",
};

interface SiteSettingsRow {
  site_name?: string | null;
  logo_url?: string | null;
  logo_alt?: string | null;
  phone_number?: string | null;
  phone_display?: string | null;
  phone_availability?: string | null;
  apply_phone_globally?: boolean | null;
  header_cta_text?: string | null;
  header_cta_url?: string | null;
  navigation_items?: NavigationItem[] | null;
  footer_about_links?: { label: string; href?: string }[] | null;
  footer_practice_links?: { label: string; href?: string }[] | null;
  address_line1?: string | null;
  address_line2?: string | null;
  map_embed_url?: string | null;
  social_links?: { platform: string; url: string; enabled: boolean }[] | null;
  footer_tagline?: string | null;
  footer_locations?: SiteSettings["footerLocations"] | null;
  footer_bottom_links?: SiteSettings["footerBottomLinks"] | null;
  copyright_text?: string | null;
  site_url?: string | null;
  site_noindex?: boolean | null;
  ga4_measurement_id?: string | null;
  google_ads_id?: string | null;
  google_ads_conversion_label?: string | null;
  head_scripts?: string | null;
  footer_scripts?: string | null;
}

interface SiteSettingsContextValue {
  settings: SiteSettings;
  isLoading: boolean;
  phoneDisplay: string;
  phoneLabel: string;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

let settingsCache: SiteSettings | null = null;

function mapSiteSettingsRow(row: SiteSettingsRow | null | undefined): SiteSettings {
  if (!row) {
    return DEFAULT_SETTINGS;
  }

  return {
    siteName: row.site_name || DEFAULT_SETTINGS.siteName,
    logoUrl: row.logo_url || DEFAULT_SETTINGS.logoUrl,
    logoAlt: row.logo_alt || DEFAULT_SETTINGS.logoAlt,
    phoneNumber: row.phone_number || DEFAULT_SETTINGS.phoneNumber,
    phoneDisplay: row.phone_display || DEFAULT_SETTINGS.phoneDisplay,
    phoneAvailability:
      row.phone_availability || DEFAULT_SETTINGS.phoneAvailability,
    applyPhoneGlobally:
      row.apply_phone_globally ?? DEFAULT_SETTINGS.applyPhoneGlobally,
    headerCtaText: row.header_cta_text || DEFAULT_SETTINGS.headerCtaText,
    headerCtaUrl: row.header_cta_url || DEFAULT_SETTINGS.headerCtaUrl,
    navigationItems: row.navigation_items?.length
      ? row.navigation_items
      : DEFAULT_SETTINGS.navigationItems,
    footerAboutLinks:
      row.footer_about_links || DEFAULT_SETTINGS.footerAboutLinks,
    footerPracticeLinks:
      row.footer_practice_links || DEFAULT_SETTINGS.footerPracticeLinks,
    addressLine1: row.address_line1 || DEFAULT_SETTINGS.addressLine1,
    addressLine2: row.address_line2 || DEFAULT_SETTINGS.addressLine2,
    mapEmbedUrl: row.map_embed_url || DEFAULT_SETTINGS.mapEmbedUrl,
    socialLinks: row.social_links || DEFAULT_SETTINGS.socialLinks,
    footerTagline: row.footer_tagline || DEFAULT_SETTINGS.footerTagline,
    footerLocations: row.footer_locations?.length
      ? row.footer_locations
      : DEFAULT_SETTINGS.footerLocations,
    footerBottomLinks: row.footer_bottom_links?.length
      ? row.footer_bottom_links
      : DEFAULT_SETTINGS.footerBottomLinks,
    copyrightText: row.copyright_text || DEFAULT_SETTINGS.copyrightText,
    siteUrl: row.site_url || DEFAULT_SETTINGS.siteUrl,
    siteNoindex: row.site_noindex ?? DEFAULT_SETTINGS.siteNoindex,
    ga4MeasurementId:
      row.ga4_measurement_id || DEFAULT_SETTINGS.ga4MeasurementId,
    googleAdsId: row.google_ads_id || DEFAULT_SETTINGS.googleAdsId,
    googleAdsConversionLabel:
      row.google_ads_conversion_label || DEFAULT_SETTINGS.googleAdsConversionLabel,
    headScripts: row.head_scripts || DEFAULT_SETTINGS.headScripts,
    footerScripts: row.footer_scripts || DEFAULT_SETTINGS.footerScripts,
  };
}

export function primeSiteSettingsCache(settings: SiteSettings) {
  settingsCache = settings;
}

export function clearSiteSettingsCache() {
  settingsCache = null;
}

export function getCachedSiteSettings(): SiteSettings | null {
  return settingsCache;
}

export async function loadSiteSettings(): Promise<SiteSettings> {
  if (settingsCache) {
    return settingsCache;
  }

  try {
    const data = await fetchSupabaseJson<SiteSettingsRow[]>(
      "/rest/v1/site_settings_public?settings_key=eq.global&select=*",
    );

    if (Array.isArray(data) && data.length > 0) {
      settingsCache = mapSiteSettingsRow(data[0]);
      return settingsCache;
    }
  } catch (err) {
    console.error("[SiteSettingsContext] Error loading settings:", err);
  }

  settingsCache = DEFAULT_SETTINGS;
  return settingsCache;
}

interface SiteSettingsProviderProps {
  children: ReactNode;
}

export function SiteSettingsProvider({ children }: SiteSettingsProviderProps) {
  const cachedSettings = getCachedSiteSettings();
  const [settings, setSettings] = useState<SiteSettings>(
    cachedSettings || DEFAULT_SETTINGS,
  );
  const [isLoading, setIsLoading] = useState(!cachedSettings);

  useEffect(() => {
    const existing = getCachedSiteSettings();
    if (existing) {
      setSettings(existing);
      setIsLoading(false);
      return;
    }

    let isActive = true;

    loadSiteSettings()
      .then((loadedSettings) => {
        if (!isActive) return;
        setSettings(loadedSettings);
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  const value: SiteSettingsContextValue = {
    settings,
    isLoading,
    phoneDisplay: settings.phoneDisplay,
    phoneLabel: settings.phoneAvailability,
  };

  return (
    <SiteSettingsContext.Provider value={value}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings(): SiteSettingsContextValue {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    return {
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      phoneDisplay: DEFAULT_SETTINGS.phoneDisplay,
      phoneLabel: DEFAULT_SETTINGS.phoneAvailability,
    };
  }
  return context;
}

export function useGlobalPhone() {
  const { settings, isLoading } = useSiteSettings();
  return {
    phoneNumber: settings.phoneNumber,
    phoneDisplay: settings.phoneDisplay,
    phoneLabel: settings.phoneAvailability,
    isLoading,
  };
}
