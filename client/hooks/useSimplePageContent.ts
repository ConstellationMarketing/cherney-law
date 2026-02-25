/**
 * useSimplePageContent Hook
 * Fetches simple page content from Supabase, with caching and default fallback
 */

import { useState, useEffect } from "react";
import type { SimplePageContent } from "@site/lib/cms/simplePageTypes";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Module-level cache
const pageContentCache = new Map<string, SimplePageContent>();

/**
 * Fetch simple page content from Supabase
 * Merges CMS content with default content, CMS content takes precedence
 */
export function useSimplePageContent(
  urlPath: string,
  defaultContent: SimplePageContent
): { content: SimplePageContent; isLoading: boolean } {
  const [content, setContent] = useState<SimplePageContent>(defaultContent);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check cache first
    if (pageContentCache.has(urlPath)) {
      const cached = pageContentCache.get(urlPath)!;
      setContent(cached);
      setIsLoading(false);
      return;
    }

    // Fetch from Supabase
    async function fetchContent() {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/pages?url_path=eq.${encodeURIComponent(urlPath)}&select=content`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          const page = data[0];
          const pageContent = page.content as SimplePageContent | null;

          if (pageContent && pageContent.title && pageContent.body) {
            // CMS content takes precedence
            const merged: SimplePageContent = {
              title: pageContent.title || defaultContent.title,
              body: pageContent.body || defaultContent.body,
            };
            pageContentCache.set(urlPath, merged);
            setContent(merged);
          } else {
            // No valid CMS content, use defaults
            pageContentCache.set(urlPath, defaultContent);
            setContent(defaultContent);
          }
        } else {
          // No page found, use defaults
          pageContentCache.set(urlPath, defaultContent);
          setContent(defaultContent);
        }
      } catch (err) {
        console.error(`[useSimplePageContent] Error loading ${urlPath}:`, err);
        // Use defaults on error
        pageContentCache.set(urlPath, defaultContent);
        setContent(defaultContent);
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [urlPath, defaultContent]);

  return { content, isLoading };
}

/**
 * Clear the cache for a specific page or all pages
 */
export function clearSimplePageContentCache(urlPath?: string): void {
  if (urlPath) {
    pageContentCache.delete(urlPath);
  } else {
    pageContentCache.clear();
  }
}
