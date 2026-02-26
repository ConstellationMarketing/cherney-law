import { useState, useEffect } from "react";
import type { CommonQuestionsPageContent } from "../lib/cms/commonQuestionsPageTypes";
import { defaultCommonQuestionsContent } from "../lib/cms/commonQuestionsPageTypes";
import type { PageSeoFields } from "../utils/resolveSeo";

// Supabase configuration - use environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface UseCommonQuestionsContentResult {
  content: CommonQuestionsPageContent;
  page: PageSeoFields | null;
  isLoading: boolean;
  error: Error | null;
}

// Cache for common questions content
let cachedContent: CommonQuestionsPageContent | null = null;
let cachedPage: PageSeoFields | null = null;

export function useCommonQuestionsContent(): UseCommonQuestionsContentResult {
  const [content, setContent] = useState<CommonQuestionsPageContent>(defaultCommonQuestionsContent);
  const [page, setPage] = useState<PageSeoFields | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Listen for cache clear events
    const handleCacheClear = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.key === "common-questions") {
        clearCommonQuestionsContentCache();
      }
    };

    window.addEventListener("cms:cache-clear", handleCacheClear);

    return () => {
      window.removeEventListener("cms:cache-clear", handleCacheClear);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchCommonQuestionsContent() {
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

        // Fetch common-questions page from pages table with SEO fields
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq./common-questions&status=eq.published&select=content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,url_path,title`,
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
            setContent(defaultCommonQuestionsContent);
            setPage(null);
            setIsLoading(false);
          }
          return;
        }

        const pageData = data[0];
        const cmsContent = pageData.content as CommonQuestionsPageContent;

        // Merge CMS content with defaults (CMS content takes precedence)
        const mergedContent = mergeWithDefaults(
          cmsContent,
          defaultCommonQuestionsContent,
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
        console.error("[useCommonQuestionsContent] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          // Fall back to defaults on error
          setContent(defaultCommonQuestionsContent);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchCommonQuestionsContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return { content, page, isLoading, error };
}

// Deep merge CMS content with defaults
function mergeWithDefaults(
  cmsContent: Partial<CommonQuestionsPageContent> | null | undefined,
  defaults: CommonQuestionsPageContent,
): CommonQuestionsPageContent {
  if (!cmsContent) return defaults;

  return {
    hero: {
      ...defaults.hero,
      ...cmsContent.hero,
    },
    faqSection: {
      ...defaults.faqSection,
      ...cmsContent.faqSection,
      items: cmsContent.faqSection?.items?.length
        ? cmsContent.faqSection.items
        : defaults.faqSection.items,
    },
    closingSection: {
      ...defaults.closingSection,
      ...cmsContent.closingSection,
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
export function clearCommonQuestionsContentCache() {
  cachedContent = null;
  cachedPage = null;
}
