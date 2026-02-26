import { useState, useEffect } from "react";
import type { AreasWeServePageContent } from "../lib/cms/areasWeServePageTypes";
import { defaultAreasWeServeContent } from "../lib/cms/areasWeServePageTypes";
import type { PageSeoFields } from "../utils/resolveSeo";

// Supabase configuration - use environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface UseAreasWeServeContentResult {
  content: AreasWeServePageContent;
  page: PageSeoFields | null;
  isLoading: boolean;
  error: Error | null;
}

// Cache for areas we serve content
let cachedContent: AreasWeServePageContent | null = null;
let cachedPage: PageSeoFields | null = null;

export function useAreasWeServeContent(): UseAreasWeServeContentResult {
  const [content, setContent] = useState<AreasWeServePageContent>(defaultAreasWeServeContent);
  const [page, setPage] = useState<PageSeoFields | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Listen for cache clear events
    const handleCacheClear = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.key === "areas-we-serve") {
        clearAreasWeServeContentCache();
      }
    };

    window.addEventListener("cms:cache-clear", handleCacheClear);

    return () => {
      window.removeEventListener("cms:cache-clear", handleCacheClear);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchAreasWeServeContent() {
      try {
        // Return cached content if available
        if (cachedContent && cachedPage) {
          if (isMounted) {
            setContent(cachedContent);
            setPage(cachedPage);
            setIsLoading(false);
          }
          return;
        }

        // Fetch areas-we-serve page from pages table with SEO fields
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq./areas-we-serve&status=eq.published&select=content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,url_path,title`,
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

        if (!Array.isArray(data) || data.length === 0) {
          // No CMS content, use defaults
          if (isMounted) {
            setContent(defaultAreasWeServeContent);
            setPage(null);
            setIsLoading(false);
          }
          return;
        }

        const pageData = data[0];
        const cmsContent = pageData.content as AreasWeServePageContent;

        // Merge CMS content with defaults (CMS content takes precedence)
        const mergedContent = mergeWithDefaults(
          cmsContent,
          defaultAreasWeServeContent,
        );

        // Extract SEO fields
        const pageSeoFields: PageSeoFields = {
          meta_title: pageData.meta_title,
          meta_description: pageData.meta_description,
          canonical_url: pageData.canonical_url,
          og_title: pageData.og_title,
          og_description: pageData.og_description,
          og_image: pageData.og_image,
          noindex: pageData.noindex ?? false,
          url_path: pageData.url_path,
          title: pageData.title,
        };

        // Cache the results
        cachedContent = mergedContent;
        cachedPage = pageSeoFields;

        if (isMounted) {
          setContent(mergedContent);
          setPage(pageSeoFields);
          setError(null);
        }
      } catch (err) {
        console.error("[useAreasWeServeContent] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          // Fall back to defaults on error
          setContent(defaultAreasWeServeContent);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchAreasWeServeContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return { content, page, isLoading, error };
}

// Deep merge CMS content with defaults
function mergeWithDefaults(
  cmsContent: Partial<AreasWeServePageContent> | null | undefined,
  defaults: AreasWeServePageContent,
): AreasWeServePageContent {
  if (!cmsContent) return defaults;

  return {
    hero: {
      ...defaults.hero,
      ...cmsContent.hero,
    },
    introSection: {
      ...defaults.introSection,
      ...cmsContent.introSection,
    },
    whySection: {
      ...defaults.whySection,
      ...cmsContent.whySection,
    },
    locationsSection: {
      ...defaults.locationsSection,
      ...cmsContent.locationsSection,
      items: cmsContent.locationsSection?.items?.length
        ? cmsContent.locationsSection.items
        : defaults.locationsSection.items,
    },
    cta: {
      ...defaults.cta,
      ...cmsContent.cta,
      secondaryButton: {
        ...defaults.cta.secondaryButton,
        ...cmsContent.cta?.secondaryButton,
      },
    },
  };
}

// Helper to clear cache (useful after admin edits)
export function clearAreasWeServeContentCache() {
  cachedContent = null;
  cachedPage = null;
}
