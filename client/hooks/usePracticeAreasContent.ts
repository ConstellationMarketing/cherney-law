import { useState, useEffect } from "react";
import type { PracticeAreasPageContent } from "../lib/cms/practiceAreasPageTypes";
import { defaultPracticeAreasContent } from "../lib/cms/practiceAreasPageTypes";

// Supabase configuration - use environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface UsePracticeAreasContentResult {
  content: PracticeAreasPageContent;
  isLoading: boolean;
  error: Error | null;
}

// Cache for practice areas content
let cachedContent: PracticeAreasPageContent | null = null;

export function usePracticeAreasContent(): UsePracticeAreasContentResult {
  const [content, setContent] = useState<PracticeAreasPageContent>(
    defaultPracticeAreasContent,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchContent() {
      try {
        // Return cached content if available
        if (cachedContent) {
          if (isMounted) {
            setContent(cachedContent);
            setIsLoading(false);
          }
          return;
        }

        // Fetch practice areas page from pages table
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq./practice-areas&status=eq.published&select=content`,
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
            setContent(defaultPracticeAreasContent);
            setIsLoading(false);
          }
          return;
        }

        const pageData = data[0];
        const cmsContent = pageData.content as PracticeAreasPageContent;

        // Merge CMS content with defaults (CMS content takes precedence)
        const mergedContent = mergeWithDefaults(
          cmsContent,
          defaultPracticeAreasContent,
        );

        // Cache the result
        cachedContent = mergedContent;

        if (isMounted) {
          setContent(mergedContent);
          setError(null);
        }
      } catch (err) {
        console.error("[usePracticeAreasContent] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          // Fall back to defaults on error
          setContent(defaultPracticeAreasContent);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return { content, isLoading, error };
}

// Deep merge CMS content with defaults
function mergeWithDefaults(
  cmsContent: Partial<PracticeAreasPageContent> | null | undefined,
  defaults: PracticeAreasPageContent,
): PracticeAreasPageContent {
  if (!cmsContent) return defaults;

  return {
    hero: { ...defaults.hero, ...cmsContent.hero },
    grid: {
      ...defaults.grid,
      ...cmsContent.grid,
      areas: cmsContent.grid?.areas?.length
        ? cmsContent.grid.areas
        : defaults.grid.areas,
    },
    whyChoose: {
      ...defaults.whyChoose,
      ...cmsContent.whyChoose,
      items: cmsContent.whyChoose?.items?.length
        ? cmsContent.whyChoose.items
        : defaults.whyChoose.items,
    },
    cta: {
      ...defaults.cta,
      ...cmsContent.cta,
      primaryButton: {
        ...defaults.cta.primaryButton,
        ...cmsContent.cta?.primaryButton,
      },
      secondaryButton: {
        ...defaults.cta.secondaryButton,
        ...cmsContent.cta?.secondaryButton,
      },
    },
  };
}

// Helper to clear cache (useful after admin edits)
export function clearPracticeAreasContentCache() {
  cachedContent = null;
}
