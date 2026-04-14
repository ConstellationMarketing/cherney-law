import { useEffect, useState } from "react";
import type { AboutPageContent } from "../lib/cms/aboutPageTypes";
import { defaultAboutContent } from "../lib/cms/aboutPageTypes";
import type { PageSeoFields } from "../utils/resolveSeo";
import { PAGE_SEO_SELECT, fetchSupabaseJson } from "@site/lib/cms/api";

interface UseAboutContentResult {
  content: AboutPageContent;
  page: PageSeoFields | null;
  isLoading: boolean;
  error: Error | null;
}

interface AboutContentCacheEntry {
  content: AboutPageContent;
  page: PageSeoFields | null;
}

const aboutContentCache = new Map<string, AboutContentCacheEntry>();

function getCachedEntry(urlPath: string): AboutContentCacheEntry | null {
  return aboutContentCache.get(urlPath) ?? null;
}

function mergeWithDefaults(
  cmsContent: Partial<AboutPageContent> | null | undefined,
  defaults: AboutPageContent,
): AboutPageContent {
  if (!cmsContent) return defaults;

  return {
    hero: {
      ...defaults.hero,
      ...cmsContent.hero,
    },
    story: {
      ...defaults.story,
      ...cmsContent.story,
      badges: cmsContent.story?.badges?.length
        ? cmsContent.story.badges
        : defaults.story.badges,
    },
    missionVision: {
      mission: {
        ...defaults.missionVision.mission,
        ...cmsContent.missionVision?.mission,
      },
      vision: {
        ...defaults.missionVision.vision,
        ...cmsContent.missionVision?.vision,
      },
    },
    featureBoxes: cmsContent.featureBoxes?.length
      ? cmsContent.featureBoxes
      : defaults.featureBoxes,
    stats: {
      ...defaults.stats,
      ...cmsContent.stats,
      stats: cmsContent.stats?.stats?.length
        ? cmsContent.stats.stats
        : defaults.stats.stats,
    },
    whyChooseUs: {
      ...defaults.whyChooseUs,
      ...cmsContent.whyChooseUs,
      items: cmsContent.whyChooseUs?.items?.length
        ? cmsContent.whyChooseUs.items
        : defaults.whyChooseUs.items,
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

export async function loadAboutContent(
  urlPath: string = "/about/",
): Promise<AboutContentCacheEntry> {
  const cached = getCachedEntry(urlPath);
  if (cached) {
    return cached;
  }

  try {
    const data = await fetchSupabaseJson<any[]>(
      `/rest/v1/pages?url_path=eq.${urlPath}&status=eq.published&select=${PAGE_SEO_SELECT}`,
    );

    if (!Array.isArray(data) || data.length === 0) {
      return { content: defaultAboutContent, page: null };
    }

    const pageData = data[0];
    const entry: AboutContentCacheEntry = {
      content: mergeWithDefaults(
        pageData.content as AboutPageContent,
        defaultAboutContent,
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

    aboutContentCache.set(urlPath, entry);
    return entry;
  } catch (err) {
    console.error("[useAboutContent] Error:", err);
    return { content: defaultAboutContent, page: null };
  }
}

export function primeAboutContentCache(
  entry: AboutContentCacheEntry,
  urlPath: string = "/about/",
) {
  aboutContentCache.set(urlPath, entry);
}

export function useAboutContent(
  urlPath: string = "/about/",
): UseAboutContentResult {
  const initialEntry = getCachedEntry(urlPath);
  const [content, setContent] = useState<AboutPageContent>(
    initialEntry?.content ?? defaultAboutContent,
  );
  const [page, setPage] = useState<PageSeoFields | null>(initialEntry?.page ?? null);
  const [isLoading, setIsLoading] = useState(!initialEntry);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const cached = getCachedEntry(urlPath);
    if (cached) {
      setContent(cached.content);
      setPage(cached.page);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    loadAboutContent(urlPath)
      .then((entry) => {
        if (!isMounted) return;
        setContent(entry.content);
        setPage(entry.page);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setContent(defaultAboutContent);
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

export function clearAboutContentCache(urlPath?: string) {
  if (urlPath) {
    aboutContentCache.delete(urlPath);
    return;
  }

  aboutContentCache.clear();
}
