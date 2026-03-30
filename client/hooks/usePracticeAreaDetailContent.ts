import { useState, useEffect } from "react";
import type { PracticeAreaDetailPageContent } from "@site/lib/cms/practiceAreaDetailPageTypes";
import { defaultPracticeAreaDetailContent } from "@site/lib/cms/practiceAreaDetailPageTypes";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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

// Module-level cache
const cache = new Map<string, PageData | null>();

function deepMerge(defaults: any, cms: any): any {
  if (!cms || typeof cms !== "object") return defaults;
  if (Array.isArray(defaults)) return Array.isArray(cms) ? cms : defaults;
  const result = { ...defaults };
  for (const key of Object.keys(cms)) {
    if (cms[key] !== undefined && cms[key] !== null) {
      if (typeof cms[key] === "object" && !Array.isArray(cms[key]) && typeof defaults[key] === "object" && !Array.isArray(defaults[key])) {
        result[key] = deepMerge(defaults[key], cms[key]);
      } else {
        result[key] = cms[key];
      }
    }
  }
  return result;
}

export function clearPracticeAreaDetailCache(slug?: string) {
  if (slug) {
    cache.delete(`/practice-areas/${slug}/`);
  } else {
    cache.clear();
  }
}

export function usePracticeAreaDetailContent(slug: string) {
  const [page, setPage] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const urlPath = `/practice-areas/${slug}/`;

    if (cache.has(urlPath)) {
      const cached = cache.get(urlPath)!;
      if (cached) {
        setPage(cached);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      try {
        // Try both with and without trailing slash
        const paths = [urlPath, urlPath.slice(0, -1)];
        const orFilter = paths.map((p) => `url_path.eq.${p}`).join(",");

        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/pages?or=(${encodeURIComponent(orFilter)})&status=eq.published&select=id,title,url_path,page_type,content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,schema_type,schema_data&limit=1`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
          cache.set(urlPath, data[0]);
          setPage(data[0]);
          setNotFound(false);
        } else {
          cache.set(urlPath, null);
          setNotFound(true);
        }
      } catch (err) {
        console.error(`[usePracticeAreaDetailContent] Error:`, err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [slug]);

  const content: PracticeAreaDetailPageContent = page
    ? deepMerge(defaultPracticeAreaDetailContent, page.content)
    : defaultPracticeAreaDetailContent;

  return { content, page, isLoading, notFound };
}
