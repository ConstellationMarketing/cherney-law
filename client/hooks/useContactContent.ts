import { useEffect, useState } from "react";
import type { ContactPageContent } from "../lib/cms/contactPageTypes";
import { defaultContactContent } from "../lib/cms/contactPageTypes";
import type { PageSeoFields } from "../utils/resolveSeo";
import { PAGE_SEO_SELECT, fetchSupabaseJson } from "@site/lib/cms/api";

interface UseContactContentResult {
  content: ContactPageContent;
  page: PageSeoFields | null;
  isLoading: boolean;
  error: Error | null;
}

interface ContactContentCacheEntry {
  content: ContactPageContent;
  page: PageSeoFields | null;
}

let cachedEntry: ContactContentCacheEntry | null = null;

function getCachedEntry(): ContactContentCacheEntry | null {
  return cachedEntry;
}

function mergeWithDefaults(
  cmsContent: Partial<ContactPageContent> | null | undefined,
  defaults: ContactPageContent,
): ContactPageContent {
  if (!cmsContent) return defaults;

  return {
    hero: { ...defaults.hero, ...cmsContent.hero },
    offices: cmsContent.offices?.length ? cmsContent.offices : defaults.offices,
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

export async function loadContactContent(
  urlPath: string = "/contact/",
): Promise<ContactContentCacheEntry> {
  const cached = getCachedEntry();
  if (cached) {
    return cached;
  }

  try {
    const data = await fetchSupabaseJson<any[]>(
      `/rest/v1/pages?url_path=eq.${urlPath}&status=eq.published&select=${PAGE_SEO_SELECT}`,
    );

    if (!Array.isArray(data) || data.length === 0) {
      return { content: defaultContactContent, page: null };
    }

    const pageData = data[0];
    const entry: ContactContentCacheEntry = {
      content: mergeWithDefaults(
        pageData.content as ContactPageContent,
        defaultContactContent,
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
    console.error("[useContactContent] Error:", err);
    return { content: defaultContactContent, page: null };
  }
}

export function primeContactContentCache(entry: ContactContentCacheEntry) {
  cachedEntry = entry;
}

export function useContactContent(
  urlPath: string = "/contact/",
): UseContactContentResult {
  const initialEntry = getCachedEntry();
  const [content, setContent] = useState<ContactPageContent>(
    initialEntry?.content ?? defaultContactContent,
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

    loadContactContent(urlPath)
      .then((entry) => {
        if (!isMounted) return;
        setContent(entry.content);
        setPage(entry.page);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setContent(defaultContactContent);
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

export function clearContactContentCache() {
  cachedEntry = null;
}
