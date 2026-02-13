import { useState, useEffect } from "react";
import type { ContactPageContent } from "../lib/cms/contactPageTypes";
import { defaultContactContent } from "../lib/cms/contactPageTypes";

// Supabase configuration - use environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface UseContactContentResult {
  content: ContactPageContent;
  isLoading: boolean;
  error: Error | null;
}

// Cache for contact content
let cachedContent: ContactPageContent | null = null;

export function useContactContent(): UseContactContentResult {
  const [content, setContent] = useState<ContactPageContent>(
    defaultContactContent,
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

        // Fetch contact page from pages table
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq./contact&status=eq.published&select=content`,
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
            setContent(defaultContactContent);
            setIsLoading(false);
          }
          return;
        }

        const pageData = data[0];
        const cmsContent = pageData.content as ContactPageContent;

        // Merge CMS content with defaults (CMS content takes precedence)
        const mergedContent = mergeWithDefaults(
          cmsContent,
          defaultContactContent,
        );

        // Cache the result
        cachedContent = mergedContent;

        if (isMounted) {
          setContent(mergedContent);
          setError(null);
        }
      } catch (err) {
        console.error("[useContactContent] Error:", err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          setContent(defaultContactContent);
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
  cmsContent: Partial<ContactPageContent> | null | undefined,
  defaults: ContactPageContent,
): ContactPageContent {
  if (!cmsContent) return defaults;

  return {
    hero: { ...defaults.hero, ...cmsContent.hero },
    offices:
      cmsContent.offices?.length ? cmsContent.offices : defaults.offices,
    formSettings: { ...defaults.formSettings, ...cmsContent.formSettings },
    process: {
      ...defaults.process,
      ...cmsContent.process,
      steps: cmsContent.process?.steps?.length
        ? cmsContent.process.steps
        : defaults.process.steps,
    },
  };
}

// Helper to clear cache (useful after admin edits)
export function clearContactContentCache() {
  cachedContent = null;
}
