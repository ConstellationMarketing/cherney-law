import { useEffect, useState } from "react";
import type { TestimonialsPageContent } from "../lib/cms/testimonialsPageTypes";
import { defaultTestimonialsContent } from "../lib/cms/testimonialsPageTypes";
import type { PageSeoFields } from "../utils/resolveSeo";
import { PAGE_SEO_SELECT, fetchSupabaseJson } from "@site/lib/cms/api";

interface UseTestimonialsContentResult {
  content: TestimonialsPageContent;
  page: PageSeoFields | null;
  isLoading: boolean;
  error: Error | null;
}

interface TestimonialsContentCacheEntry {
  content: TestimonialsPageContent;
  page: PageSeoFields | null;
}

let cachedEntry: TestimonialsContentCacheEntry | null = null;

function getCachedEntry(): TestimonialsContentCacheEntry | null {
  return cachedEntry;
}

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

export async function loadTestimonialsContent(
  urlPath: string = "/testimonials/",
): Promise<TestimonialsContentCacheEntry> {
  const cached = getCachedEntry();
  if (cached) {
    return cached;
  }

  try {
    const data = await fetchSupabaseJson<any[]>(
      `/rest/v1/pages?url_path=eq.${urlPath}&status=eq.published&select=${PAGE_SEO_SELECT}`,
    );

    if (!Array.isArray(data) || data.length === 0) {
      return { content: defaultTestimonialsContent, page: null };
    }

    const pageData = data[0];
    const entry: TestimonialsContentCacheEntry = {
      content: mergeWithDefaults(
        pageData.content as TestimonialsPageContent,
        defaultTestimonialsContent,
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
    console.error("[useTestimonialsContent] Error:", err);
    return { content: defaultTestimonialsContent, page: null };
  }
}

export function primeTestimonialsContentCache(
  entry: TestimonialsContentCacheEntry,
) {
  cachedEntry = entry;
}

export function useTestimonialsContent(
  urlPath: string = "/testimonials/",
): UseTestimonialsContentResult {
  const initialEntry = getCachedEntry();
  const [content, setContent] = useState<TestimonialsPageContent>(
    initialEntry?.content ?? defaultTestimonialsContent,
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

    loadTestimonialsContent(urlPath)
      .then((entry) => {
        if (!isMounted) return;
        setContent(entry.content);
        setPage(entry.page);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setContent(defaultTestimonialsContent);
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

export function clearTestimonialsContentCache() {
  cachedEntry = null;
}
