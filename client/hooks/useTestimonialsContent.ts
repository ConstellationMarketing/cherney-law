import { useState, useEffect } from "react";
import type { TestimonialsPageContent } from "../lib/cms/testimonialsPageTypes";
import { defaultTestimonialsContent } from "../lib/cms/testimonialsPageTypes";

// Supabase configuration - use environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface UseTestimonialsContentResult {
  content: TestimonialsPageContent;
  isLoading: boolean;
  error: Error | null;
}

// Cache for testimonials content
let cachedContent: TestimonialsPageContent | null = null;

export function useTestimonialsContent(): UseTestimonialsContentResult {
  const [content, setContent] = useState<TestimonialsPageContent>(
    defaultTestimonialsContent,
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

        // Fetch testimonials page from pages table
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq./testimonials&status=eq.published&select=content`,
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
          if (isMounted) {
            setContent(defaultTestimonialsContent);
            setIsLoading(false);
          }
          return;
        }

        const pageData = data[0];
        const cmsContent = pageData.content as TestimonialsPageContent;

        // Merge CMS content with defaults (CMS content takes precedence)
        const mergedContent = mergeWithDefaults(
          cmsContent,
          defaultTestimonialsContent,
        );

        // Cache the result
        cachedContent = mergedContent;

        if (isMounted) {
          setContent(mergedContent);
          setError(null);
        }
      } catch (err) {
        console.error("[useTestimonialsContent] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setContent(defaultTestimonialsContent);
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
  cmsContent: Partial<TestimonialsPageContent> | null | undefined,
  defaults: TestimonialsPageContent,
): TestimonialsPageContent {
  if (!cmsContent) return defaults;

  return {
    hero: { ...defaults.hero, ...cmsContent.hero },
    reviews: { ...defaults.reviews, ...cmsContent.reviews },
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
export function clearTestimonialsContentCache() {
  cachedContent = null;
}
