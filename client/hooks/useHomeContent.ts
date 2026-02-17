import { useState, useEffect } from "react";
import type { HomePageContent } from "../lib/cms/homePageTypes";
import { defaultHomeContent } from "../lib/cms/homePageTypes";
import type { PageSeoFields } from "../utils/resolveSeo";

// Supabase configuration - use environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface UseHomeContentResult {
  content: HomePageContent;
  page: PageSeoFields | null;
  isLoading: boolean;
  error: Error | null;
}

// Cache for home content
let cachedContent: HomePageContent | null = null;
let cachedPage: PageSeoFields | null = null;

export function useHomeContent(): UseHomeContentResult {
  const [content, setContent] = useState<HomePageContent>(defaultHomeContent);
  const [page, setPage] = useState<PageSeoFields | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchHomeContent() {
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

        // Fetch homepage from pages table with SEO fields
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq./&status=eq.published&select=content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,url_path,title`,
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
            setContent(defaultHomeContent);
            setPage(null);
            setIsLoading(false);
          }
          return;
        }

        const pageData = data[0];
        const cmsContent = pageData.content as HomePageContent;

        // Merge CMS content with defaults (CMS content takes precedence)
        const mergedContent = mergeWithDefaults(cmsContent, defaultHomeContent);

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
        console.error("[useHomeContent] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          // Fall back to defaults on error
          setContent(defaultHomeContent);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchHomeContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return { content, page, isLoading, error };
}

// Deep merge CMS content with defaults
function mergeWithDefaults(
  cmsContent: Partial<HomePageContent> | null | undefined,
  defaults: HomePageContent,
): HomePageContent {
  if (!cmsContent) return defaults;

  return {
    hero: {
      ...defaults.hero,
      ...cmsContent.hero,
      featureBoxes: cmsContent.hero?.featureBoxes?.length
        ? cmsContent.hero.featureBoxes
        : defaults.hero.featureBoxes,
      buttons: cmsContent.hero?.buttons?.length
        ? cmsContent.hero.buttons
        : defaults.hero.buttons,
    },
    about: {
      ...defaults.about,
      ...cmsContent.about,
      features: cmsContent.about?.features?.length
        ? cmsContent.about.features
        : defaults.about.features,
      stats: cmsContent.about?.stats?.length
        ? cmsContent.about.stats
        : defaults.about.stats,
    },
    practiceAreasIntro: {
      ...defaults.practiceAreasIntro,
      ...cmsContent.practiceAreasIntro,
    },
    practiceAreas: cmsContent.practiceAreas?.length
      ? cmsContent.practiceAreas
      : defaults.practiceAreas,
    testimonials: {
      ...defaults.testimonials,
      ...cmsContent.testimonials,
      items: cmsContent.testimonials?.items?.length
        ? cmsContent.testimonials.items
        : defaults.testimonials.items,
    },
    contact: { ...defaults.contact, ...cmsContent.contact },
    firmDescription: {
      ...defaults.firmDescription,
      ...cmsContent.firmDescription,
    },
    awardsCTA: { ...defaults.awardsCTA, ...cmsContent.awardsCTA },
    attorneyInfo: { ...defaults.attorneyInfo, ...cmsContent.attorneyInfo },
  };
}

// Helper to clear cache (useful after admin edits)
export function clearHomeContentCache() {
  cachedContent = null;
  cachedPage = null;
}
