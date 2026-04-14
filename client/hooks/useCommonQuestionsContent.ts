import { useEffect, useState } from "react";
import type { CommonQuestionsPageContent } from "../lib/cms/commonQuestionsPageTypes";
import { defaultCommonQuestionsContent } from "../lib/cms/commonQuestionsPageTypes";
import type { PageSeoFields } from "../utils/resolveSeo";
import { PAGE_SEO_SELECT, fetchSupabaseJson } from "@site/lib/cms/api";

interface UseCommonQuestionsContentResult {
  content: CommonQuestionsPageContent;
  page: PageSeoFields | null;
  isLoading: boolean;
  error: Error | null;
}

interface CommonQuestionsContentCacheEntry {
  content: CommonQuestionsPageContent;
  page: PageSeoFields | null;
}

let cachedEntry: CommonQuestionsContentCacheEntry | null = null;

function getCachedEntry(): CommonQuestionsContentCacheEntry | null {
  return cachedEntry;
}

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

export async function loadCommonQuestionsContent(
  urlPath: string = "/common-questions/",
): Promise<CommonQuestionsContentCacheEntry> {
  const cached = getCachedEntry();
  if (cached) {
    return cached;
  }

  try {
    const data = await fetchSupabaseJson<any[]>(
      `/rest/v1/pages?url_path=eq.${urlPath}&status=eq.published&select=${PAGE_SEO_SELECT}`,
    );

    if (!Array.isArray(data) || data.length === 0) {
      return { content: defaultCommonQuestionsContent, page: null };
    }

    const pageData = data[0];
    const entry: CommonQuestionsContentCacheEntry = {
      content: mergeWithDefaults(
        pageData.content as CommonQuestionsPageContent,
        defaultCommonQuestionsContent,
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
    console.error("[useCommonQuestionsContent] Error:", err);
    return { content: defaultCommonQuestionsContent, page: null };
  }
}

export function primeCommonQuestionsContentCache(
  entry: CommonQuestionsContentCacheEntry,
) {
  cachedEntry = entry;
}

export function useCommonQuestionsContent(
  urlPath: string = "/common-questions/",
): UseCommonQuestionsContentResult {
  const initialEntry = getCachedEntry();
  const [content, setContent] = useState<CommonQuestionsPageContent>(
    initialEntry?.content ?? defaultCommonQuestionsContent,
  );
  const [page, setPage] = useState<PageSeoFields | null>(initialEntry?.page ?? null);
  const [isLoading, setIsLoading] = useState(!initialEntry);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
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
    const cached = getCachedEntry();
    if (cached) {
      setContent(cached.content);
      setPage(cached.page);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    loadCommonQuestionsContent(urlPath)
      .then((entry) => {
        if (!isMounted) return;
        setContent(entry.content);
        setPage(entry.page);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setContent(defaultCommonQuestionsContent);
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

export function clearCommonQuestionsContentCache() {
  cachedEntry = null;
}
