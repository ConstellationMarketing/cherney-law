import { useState, useEffect } from "react";
import type { AboutPageContent } from "../lib/cms/aboutPageTypes";
import { defaultAboutContent } from "../lib/cms/aboutPageTypes";
import type { PageSeoFields } from "../utils/resolveSeo";

// Supabase configuration - use environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface UseAboutContentResult {
  content: AboutPageContent;
  page: PageSeoFields | null;
  isLoading: boolean;
  error: Error | null;
}

// Cache for about content
let cachedContent: AboutPageContent | null = null;
let cachedPage: PageSeoFields | null = null;

export function useAboutContent(): UseAboutContentResult {
  const [content, setContent] = useState<AboutPageContent>(defaultAboutContent);
  const [page, setPage] = useState<PageSeoFields | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAboutContent() {
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

        // Fetch about page from pages table with SEO fields
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq./about&status=eq.published&select=content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,url_path,title`,
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
            setContent(defaultAboutContent);
            setPage(null);
            setIsLoading(false);
          }
          return;
        }

        const pageData = data[0];
        const cmsContent = pageData.content as AboutPageContent;

        // Merge CMS content with defaults (CMS content takes precedence)
        const mergedContent = mergeWithDefaults(
          cmsContent,
          defaultAboutContent,
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
        console.error("[useAboutContent] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          // Fall back to defaults on error
          setContent(defaultAboutContent);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchAboutContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return { content, page, isLoading, error };
}

// Deep merge CMS content with defaults
function mergeWithDefaults(
  cmsContent: Partial<AboutPageContent> | null | undefined,
  defaults: AboutPageContent,
): AboutPageContent {
  if (!cmsContent) return defaults;

  return {
    hero: {
      ...defaults.hero,
      ...cmsContent.hero,
    },
    story: {
      ...defaults.story,
      ...cmsContent.story,
      badges: cmsContent.story?.badges?.length
        ? cmsContent.story.badges
        : defaults.story.badges,
    },
    missionVision: {
      mission: {
        ...defaults.missionVision.mission,
        ...cmsContent.missionVision?.mission,
      },
      vision: {
        ...defaults.missionVision.vision,
        ...cmsContent.missionVision?.vision,
      },
    },
    featureBoxes: cmsContent.featureBoxes?.length
      ? cmsContent.featureBoxes
      : defaults.featureBoxes,
    stats: {
      ...defaults.stats,
      ...cmsContent.stats,
      stats: cmsContent.stats?.stats?.length
        ? cmsContent.stats.stats
        : defaults.stats.stats,
    },
    whyChooseUs: {
      ...defaults.whyChooseUs,
      ...cmsContent.whyChooseUs,
      items: cmsContent.whyChooseUs?.items?.length
        ? cmsContent.whyChooseUs.items
        : defaults.whyChooseUs.items,
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
export function clearAboutContentCache() {
  cachedContent = null;
  cachedPage = null;
}
