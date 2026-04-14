import { useEffect, useState } from "react";
import type { SimplePageContent } from "@site/lib/cms/simplePageTypes";
import { fetchSupabaseJson } from "@site/lib/cms/api";

const pageContentCache = new Map<string, SimplePageContent>();

function getCachedEntry(urlPath: string): SimplePageContent | null {
  return pageContentCache.get(urlPath) ?? null;
}

export async function loadSimplePageContent(
  urlPath: string,
  defaultContent: SimplePageContent,
): Promise<SimplePageContent> {
  const cached = getCachedEntry(urlPath);
  if (cached) {
    return cached;
  }

  try {
    const data = await fetchSupabaseJson<any[]>(
      `/rest/v1/pages?url_path=eq.${encodeURIComponent(urlPath)}&select=content`,
    );

    let resolved = defaultContent;

    if (Array.isArray(data) && data.length > 0) {
      const pageContent = data[0].content as SimplePageContent | null;
      if (pageContent && pageContent.title && pageContent.body) {
        resolved = {
          title: pageContent.title || defaultContent.title,
          body: pageContent.body || defaultContent.body,
        };
      }
    }

    pageContentCache.set(urlPath, resolved);
    return resolved;
  } catch (err) {
    console.error(`[useSimplePageContent] Error loading ${urlPath}:`, err);
    pageContentCache.set(urlPath, defaultContent);
    return defaultContent;
  }
}

export function primeSimplePageContentCache(
  urlPath: string,
  content: SimplePageContent,
) {
  pageContentCache.set(urlPath, content);
}

export function useSimplePageContent(
  urlPath: string,
  defaultContent: SimplePageContent,
): { content: SimplePageContent; isLoading: boolean } {
  const initialContent = getCachedEntry(urlPath) ?? defaultContent;
  const [content, setContent] = useState<SimplePageContent>(initialContent);
  const [isLoading, setIsLoading] = useState(!getCachedEntry(urlPath));

  useEffect(() => {
    const cached = getCachedEntry(urlPath);
    if (cached) {
      setContent(cached);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    loadSimplePageContent(urlPath, defaultContent)
      .then((loadedContent) => {
        if (!isMounted) return;
        setContent(loadedContent);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [urlPath, defaultContent]);

  return { content, isLoading };
}

export function clearSimplePageContentCache(urlPath?: string): void {
  if (urlPath) {
    pageContentCache.delete(urlPath);
  } else {
    pageContentCache.clear();
  }
}
