import { useEffect, useState } from "react";
import type { AreasWeServePageContent } from "../lib/cms/areasWeServePageTypes";
import { defaultAreasWeServeContent } from "../lib/cms/areasWeServePageTypes";
import type { PageSeoFields } from "../utils/resolveSeo";
import { PAGE_SEO_SELECT, fetchSupabaseJson } from "@site/lib/cms/api";

interface UseAreasWeServeContentResult {
  content: AreasWeServePageContent;
  page: PageSeoFields | null;
  isLoading: boolean;
  error: Error | null;
}

interface AreasWeServeContentCacheEntry {
  content: AreasWeServePageContent;
  page: PageSeoFields | null;
}

let cachedEntry: AreasWeServeContentCacheEntry | null = null;

function getCachedEntry(): AreasWeServeContentCacheEntry | null {
  return cachedEntry;
}

function mergeWithDefaults(
  cmsContent: Partial<AreasWeServePageContent> | null | undefined,
  defaults: AreasWeServePageContent,
): AreasWeServePageContent {
  if (!cmsContent) return defaults;

  return {
    hero: {
      ...defaults.hero,
      ...cmsContent.hero,
    },
    introSection: {
      ...defaults.introSection,
      ...cmsContent.introSection,
    },
    whySection: {
      ...defaults.whySection,
      ...cmsContent.whySection,
    },
    locationsSection: {
      ...defaults.locationsSection,
      ...cmsContent.locationsSection,
      items: cmsContent.locationsSection?.items?.length
        ? cmsContent.locationsSection.items
        : defaults.locationsSection.items,
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

export async function loadAreasWeServeContent(
  urlPath: string = "/areas-we-serve/",
): Promise<AreasWeServeContentCacheEntry> {
  const cached = getCachedEntry();
  if (cached) {
    return cached;
  }

  try {
    const data = await fetchSupabaseJson<any[]>(
      `/rest/v1/pages?url_path=eq.${urlPath}&status=eq.published&select=${PAGE_SEO_SELECT}`,
    );

    if (!Array.isArray(data) || data.length === 0) {
      return { content: defaultAreasWeServeContent, page: null };
    }

    const pageData = data[0];
    const entry: AreasWeServeContentCacheEntry = {
      content: mergeWithDefaults(
        pageData.content as AreasWeServePageContent,
        defaultAreasWeServeContent,
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
    console.error("[useAreasWeServeContent] Error:", err);
    return { content: defaultAreasWeServeContent, page: null };
  }
}

export function primeAreasWeServeContentCache(
  entry: AreasWeServeContentCacheEntry,
) {
  cachedEntry = entry;
}

export function useAreasWeServeContent(
  urlPath: string = "/areas-we-serve/",
): UseAreasWeServeContentResult {
  const initialEntry = getCachedEntry();
  const [content, setContent] = useState<AreasWeServePageContent>(
    initialEntry?.content ?? defaultAreasWeServeContent,
  );
  const [page, setPage] = useState<PageSeoFields | null>(initialEntry?.page ?? null);
  const [isLoading, setIsLoading] = useState(!initialEntry);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleCacheClear = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.key === "areas-we-serve") {
        clearAreasWeServeContentCache();
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

    loadAreasWeServeContent(urlPath)
      .then((entry) => {
        if (!isMounted) return;
        setContent(entry.content);
        setPage(entry.page);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setContent(defaultAreasWeServeContent);
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

export function clearAreasWeServeContentCache() {
  cachedEntry = null;
}
