import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

// Site Settings types (matching submodule)
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
  navigationItems: {
    id?: string;
    label: string;
    href?: string;
    order?: number;
    external?: boolean;
    openInNewTab?: boolean;
    children?: {
      id?: string;
      label: string;
      href?: string;
      external?: boolean;
      openInNewTab?: boolean;
    }[];
  }[];
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
  siteNoindex: boolean;
  // Analytics & Scripts
  ga4MeasurementId: string;
  googleAdsId: string;
  googleAdsConversionLabel: string;
  headScripts: string;
  footerScripts: string;
}

// Default values
const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "Constellation Law Firm",
  logoUrl: "/images/logos/firm-logo.png",
  logoAlt: "Constellation Law Firm",
  phoneNumber: "4045555555",
  phoneDisplay: "404-555-5555",
  phoneAvailability: "Call Us 24/7",
  applyPhoneGlobally: true,
  headerCtaText: "Contact Us",
  headerCtaUrl: "/contact",
  navigationItems: [],
  footerAboutLinks: [],
  footerPracticeLinks: [],
  addressLine1: "",
  addressLine2: "",
  mapEmbedUrl: "",
  socialLinks: [],
  footerTagline: "Bankruptcy should be pursued along with the counsel and representation of an experienced bankruptcy attorney with an outstanding attorney profile.",
  footerLocations: [],
  footerBottomLinks: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms-of-service" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
  copyrightText: `Copyright © ${new Date().getFullYear()} | All Rights Reserved`,
  siteNoindex: false,
  // Analytics & Scripts defaults
  ga4MeasurementId: "",
  googleAdsId: "",
  googleAdsConversionLabel: "",
  headScripts: "",
  footerScripts: "",
};

interface SiteSettingsContextValue {
  settings: SiteSettings;
  isLoading: boolean;
  // Convenience getters for phone
  phoneDisplay: string;
  phoneLabel: string;
}

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(
  null,
);

// Supabase configuration
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Global cache
let settingsCache: SiteSettings | null = null;

interface SiteSettingsProviderProps {
  children: ReactNode;
}

export function SiteSettingsProvider({ children }: SiteSettingsProviderProps) {
  const [settings, setSettings] = useState<SiteSettings>(
    settingsCache || DEFAULT_SETTINGS,
  );
  const [isLoading, setIsLoading] = useState(!settingsCache);

  useEffect(() => {
    if (settingsCache) {
      setSettings(settingsCache);
      setIsLoading(false);
      return;
    }

    async function fetchSettings() {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/site_settings_public?settings_key=eq.global&select=*`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          const row = data[0];
          const loadedSettings: SiteSettings = {
            siteName: row.site_name || DEFAULT_SETTINGS.siteName,
            logoUrl: row.logo_url || DEFAULT_SETTINGS.logoUrl,
            logoAlt: row.logo_alt || DEFAULT_SETTINGS.logoAlt,
            phoneNumber: row.phone_number || DEFAULT_SETTINGS.phoneNumber,
            phoneDisplay: row.phone_display || DEFAULT_SETTINGS.phoneDisplay,
            phoneAvailability:
              row.phone_availability || DEFAULT_SETTINGS.phoneAvailability,
            applyPhoneGlobally:
              row.apply_phone_globally ?? DEFAULT_SETTINGS.applyPhoneGlobally,
            headerCtaText:
              row.header_cta_text || DEFAULT_SETTINGS.headerCtaText,
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
            siteNoindex: row.site_noindex ?? DEFAULT_SETTINGS.siteNoindex,
            // Analytics & Scripts
            ga4MeasurementId: row.ga4_measurement_id || DEFAULT_SETTINGS.ga4MeasurementId,
            googleAdsId: row.google_ads_id || DEFAULT_SETTINGS.googleAdsId,
            googleAdsConversionLabel:
              row.google_ads_conversion_label || DEFAULT_SETTINGS.googleAdsConversionLabel,
            headScripts: row.head_scripts || DEFAULT_SETTINGS.headScripts,
            footerScripts: row.footer_scripts || DEFAULT_SETTINGS.footerScripts,
          };

          settingsCache = loadedSettings;
          setSettings(loadedSettings);
        }
      } catch (err) {
        console.error("[SiteSettingsContext] Error loading settings:", err);
        // Keep defaults on error
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
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

// Hook to access site settings
export function useSiteSettings(): SiteSettingsContextValue {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    // Return defaults if used outside provider (for safety)
    return {
      settings: DEFAULT_SETTINGS,
      isLoading: false,
      phoneDisplay: DEFAULT_SETTINGS.phoneDisplay,
      phoneLabel: DEFAULT_SETTINGS.phoneAvailability,
    };
  }
  return context;
}

// Convenience hook specifically for phone
export function useGlobalPhone() {
  const { settings, isLoading } = useSiteSettings();
  return {
    phoneNumber: settings.phoneNumber,
    phoneDisplay: settings.phoneDisplay,
    phoneLabel: settings.phoneAvailability,
    isLoading,
  };
}
