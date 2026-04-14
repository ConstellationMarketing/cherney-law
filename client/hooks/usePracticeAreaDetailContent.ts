import { useEffect, useState } from "react";
import type { PracticeAreaDetailPageContent } from "@site/lib/cms/practiceAreaDetailPageTypes";
import { defaultPracticeAreaDetailContent } from "@site/lib/cms/practiceAreaDetailPageTypes";
import { PRACTICE_DETAIL_SELECT, fetchSupabaseJson } from "@site/lib/cms/api";

interface PageData {
  id: string;
  title: string;
  url_path: string;
  page_type: string;
  content: unknown;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  schema_type: string | null;
  schema_data: Record<string, unknown> | null;
}

interface PracticeAreaDetailCacheEntry {
  page: PageData | null;
  content: PracticeAreaDetailPageContent;
  notFound: boolean;
}

const cache = new Map<string, PracticeAreaDetailCacheEntry>();

function deepMerge(defaults: any, cms: any): any {
  if (!cms || typeof cms !== "object") return defaults;
  if (Array.isArray(defaults)) return Array.isArray(cms) ? cms : defaults;
  const result = { ...defaults };
  for (const key of Object.keys(cms)) {
    if (cms[key] !== undefined && cms[key] !== null) {
      if (
        typeof cms[key] === "object" &&
        !Array.isArray(cms[key]) &&
        typeof defaults[key] === "object" &&
        !Array.isArray(defaults[key])
      ) {
        result[key] = deepMerge(defaults[key], cms[key]);
      } else {
        result[key] = cms[key];
      }
    }
  }
  return result;
}

function getCacheKey(slug: string) {
  return `/practice-areas/${slug}/`;
}

function getCachedEntry(slug: string): PracticeAreaDetailCacheEntry | null {
  return cache.get(getCacheKey(slug)) ?? null;
}

export async function loadPracticeAreaDetailContent(
  slug: string,
): Promise<PracticeAreaDetailCacheEntry> {
  const cached = getCachedEntry(slug);
  if (cached) {
    return cached;
  }

  const urlPath = getCacheKey(slug);

  try {
    const paths = [urlPath, urlPath.slice(0, -1)];
    const orFilter = paths.map((path) => `url_path.eq.${path}`).join(",");
    const data = await fetchSupabaseJson<PageData[]>(
      `/rest/v1/pages?or=(${encodeURIComponent(orFilter)})&status=eq.published&select=${PRACTICE_DETAIL_SELECT}&limit=1`,
    );

    const entry: PracticeAreaDetailCacheEntry =
      Array.isArray(data) && data.length > 0
        ? {
            page: data[0],
            content: deepMerge(defaultPracticeAreaDetailContent, data[0].content),
            notFound: false,
          }
        : {
            page: null,
            content: defaultPracticeAreaDetailContent,
            notFound: true,
          };

    cache.set(urlPath, entry);
    return entry;
  } catch (err) {
    console.error(`[usePracticeAreaDetailContent] Error:`, err);
    const entry: PracticeAreaDetailCacheEntry = {
      page: null,
      content: defaultPracticeAreaDetailContent,
      notFound: true,
    };
    cache.set(urlPath, entry);
    return entry;
  }
}

export function primePracticeAreaDetailCache(
  slug: string,
  entry: PracticeAreaDetailCacheEntry,
) {
  cache.set(getCacheKey(slug), entry);
}

export function clearPracticeAreaDetailCache(slug?: string) {
  if (slug) {
    cache.delete(getCacheKey(slug));
  } else {
    cache.clear();
  }
}

export function usePracticeAreaDetailContent(slug: string) {
  const initialEntry = getCachedEntry(slug);
  const [page, setPage] = useState<PageData | null>(initialEntry?.page ?? null);
  const [content, setContent] = useState<PracticeAreaDetailPageContent>(
    initialEntry?.content ?? defaultPracticeAreaDetailContent,
  );
  const [isLoading, setIsLoading] = useState(!initialEntry);
  const [notFound, setNotFound] = useState(initialEntry?.notFound ?? false);

  useEffect(() => {
    const cached = getCachedEntry(slug);
    if (cached) {
      setPage(cached.page);
      setContent(cached.content);
      setNotFound(cached.notFound);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    loadPracticeAreaDetailContent(slug)
      .then((entry) => {
        if (!isMounted) return;
        setPage(entry.page);
        setContent(entry.content);
        setNotFound(entry.notFound);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return { content, page, isLoading, notFound };
}
