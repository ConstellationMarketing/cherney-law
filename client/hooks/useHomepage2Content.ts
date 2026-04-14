import { useEffect, useState } from "react";
import type { HomePageContent } from "../lib/cms/homePageTypes";
import { defaultHomeContent } from "../lib/cms/homePageTypes";
import type { PageSeoFields } from "../utils/resolveSeo";
import { PAGE_SEO_SELECT, fetchSupabaseJson } from "@site/lib/cms/api";

interface UseHomepage2ContentResult {
  content: HomePageContent;
  page: PageSeoFields | null;
  isLoading: boolean;
  error: Error | null;
}

interface Homepage2ContentCacheEntry {
  content: HomePageContent;
  page: PageSeoFields | null;
}

let cachedEntry: Homepage2ContentCacheEntry | null = null;

function getCachedEntry(): Homepage2ContentCacheEntry | null {
  return cachedEntry;
}

function mergeWithDefaults(
  cmsContent: Partial<HomePageContent> | null | undefined,
  defaults: HomePageContent,
): HomePageContent {
  if (!cmsContent) return defaults;

  return {
    hero: {
      ...defaults.hero,
      ...cmsContent.hero,
      featureBoxes: cmsContent.hero?.featureBoxes?.length
        ? cmsContent.hero.featureBoxes
        : defaults.hero.featureBoxes,
      buttons: cmsContent.hero?.buttons?.length
        ? cmsContent.hero.buttons
        : defaults.hero.buttons,
    },
    about: {
      ...defaults.about,
      ...cmsContent.about,
      features: cmsContent.about?.features?.length
        ? cmsContent.about.features
        : defaults.about.features,
      stats: cmsContent.about?.stats?.length
        ? cmsContent.about.stats
        : defaults.about.stats,
    },
    practiceAreasIntro: {
      ...defaults.practiceAreasIntro,
      ...cmsContent.practiceAreasIntro,
    },
    practiceAreas: cmsContent.practiceAreas?.length
      ? cmsContent.practiceAreas
      : defaults.practiceAreas,
    testimonials: {
      ...defaults.testimonials,
      ...cmsContent.testimonials,
      items: cmsContent.testimonials?.items?.length
        ? cmsContent.testimonials.items
        : defaults.testimonials.items,
    },
    contact: { ...defaults.contact, ...cmsContent.contact },
    firmDescription: {
      ...defaults.firmDescription,
      ...cmsContent.firmDescription,
    },
    awardsCTA: { ...defaults.awardsCTA, ...cmsContent.awardsCTA },
    attorneyInfo: { ...defaults.attorneyInfo, ...cmsContent.attorneyInfo },
  };
}

export async function loadHomepage2Content(
  urlPath: string = "/homepage-2/",
): Promise<Homepage2ContentCacheEntry> {
  const cached = getCachedEntry();
  if (cached) {
    return cached;
  }

  try {
    const data = await fetchSupabaseJson<any[]>(
      `/rest/v1/pages?url_path=eq.${urlPath}&status=eq.published&select=${PAGE_SEO_SELECT}`,
    );

    if (!Array.isArray(data) || data.length === 0) {
      return { content: defaultHomeContent, page: null };
    }

    const pageData = data[0];
    const mergedContent = mergeWithDefaults(
      pageData.content as HomePageContent,
      defaultHomeContent,
    );
    const entry: Homepage2ContentCacheEntry = {
      content: mergedContent,
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
    console.error("[useHomepage2Content] Error:", err);
    return { content: defaultHomeContent, page: null };
  }
}

export function primeHomepage2ContentCache(entry: Homepage2ContentCacheEntry) {
  cachedEntry = entry;
}

export function useHomepage2Content(
  urlPath: string = "/homepage-2/",
): UseHomepage2ContentResult {
  const initialEntry = getCachedEntry();
  const [content, setContent] = useState<HomePageContent>(
    initialEntry?.content ?? defaultHomeContent,
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

    loadHomepage2Content(urlPath)
      .then((entry) => {
        if (!isMounted) return;
        setContent(entry.content);
        setPage(entry.page);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setContent(defaultHomeContent);
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

export function clearHomepage2ContentCache() {
  cachedEntry = null;
}

if (typeof window !== "undefined") {
  window.addEventListener("cms:cache-clear", (e: Event) => {
    const detail = (e as CustomEvent<{ key: string }>).detail;
    if (detail?.key === "homepage-2") {
      clearHomepage2ContentCache();
    }
  });
}
