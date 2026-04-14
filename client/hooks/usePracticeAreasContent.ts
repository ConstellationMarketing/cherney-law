import { useEffect, useState } from "react";
import {
  defaultPracticeAreasContent,
  normalizePracticeAreasPageContent,
  type PracticeAreasPageContent,
} from "../lib/cms/practiceAreasPageTypes";
import type { PageSeoFields } from "../utils/resolveSeo";
import { PAGE_SEO_SELECT, fetchSupabaseJson } from "@site/lib/cms/api";

interface UsePracticeAreasContentResult {
  content: PracticeAreasPageContent;
  page: PageSeoFields | null;
  isLoading: boolean;
  error: Error | null;
}

interface PracticeAreasContentCacheEntry {
  content: PracticeAreasPageContent;
  page: PageSeoFields | null;
}

let cachedEntry: PracticeAreasContentCacheEntry | null = null;

function getCachedEntry(): PracticeAreasContentCacheEntry | null {
  return cachedEntry;
}

export async function loadPracticeAreasContent(
  urlPath: string = "/practice-areas/",
): Promise<PracticeAreasContentCacheEntry> {
  const cached = getCachedEntry();
  if (cached) {
    return cached;
  }

  try {
    const data = await fetchSupabaseJson<any[]>(
      `/rest/v1/pages?url_path=eq.${urlPath}&status=eq.published&select=${PAGE_SEO_SELECT}`,
    );

    if (!Array.isArray(data) || data.length === 0) {
      return { content: defaultPracticeAreasContent, page: null };
    }

    const pageData = data[0];
    const entry: PracticeAreasContentCacheEntry = {
      content: normalizePracticeAreasPageContent(
        pageData.content as Partial<PracticeAreasPageContent>,
        defaultPracticeAreasContent,
      ),
      page: {
        meta_title: pageData.meta_title,
        meta_description: pageData.meta_description,
        canonical_url: pageData.canonical_url,
        og_title: pageData.og_title,
        og_description: pageData.og_description,
        og_image: pageData.og_image,
        noindex: pageData.noindex ?? false,
        url_path: pageData.url_path,
        title: pageData.title,
      },
    };

    cachedEntry = entry;
    return entry;
  } catch (err) {
    console.error("[usePracticeAreasContent] Error:", err);
    return { content: defaultPracticeAreasContent, page: null };
  }
}

export function primePracticeAreasContentCache(
  entry: PracticeAreasContentCacheEntry,
) {
  cachedEntry = entry;
}

export function usePracticeAreasContent(
  urlPath: string = "/practice-areas/",
): UsePracticeAreasContentResult {
  const initialEntry = getCachedEntry();
  const [content, setContent] = useState<PracticeAreasPageContent>(
    initialEntry?.content ?? defaultPracticeAreasContent,
  );
  const [page, setPage] = useState<PageSeoFields | null>(initialEntry?.page ?? null);
  const [isLoading, setIsLoading] = useState(!initialEntry);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const cached = getCachedEntry();
    if (cached) {
      setContent(cached.content);
      setPage(cached.page);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    loadPracticeAreasContent(urlPath)
      .then((entry) => {
        if (!isMounted) return;
        setContent(entry.content);
        setPage(entry.page);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setContent(defaultPracticeAreasContent);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [urlPath]);

  return { content, page, isLoading, error };
}

export function clearPracticeAreasContentCache() {
  cachedEntry = null;
}
