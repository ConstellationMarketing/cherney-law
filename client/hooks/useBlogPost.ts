import { useState, useEffect } from "react";
import type { PostWithCategory } from "@site/lib/cms/blogTypes";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const cache = new Map<string, PostWithCategory | null>();

export function clearBlogPostCache(slug?: string) {
  if (slug) {
    cache.delete(slug);
  } else {
    cache.clear();
  }
}

export function useBlogPost(slug: string) {
  const [post, setPost] = useState<PostWithCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Normalize: ensure trailing slash
    const normalizedSlug = slug.endsWith("/") ? slug : `${slug}/`;

    if (cache.has(normalizedSlug)) {
      const cached = cache.get(normalizedSlug)!;
      if (cached) {
        setPost(cached);
        setNotFound(false);
      } else {
        setNotFound(true);
      }
      setIsLoading(false);
      return;
    }

    async function fetchPost() {
      try {
        // Try both with and without trailing slash
        const slugs = [normalizedSlug, normalizedSlug.slice(0, -1)];
        const orFilter = slugs.map((s) => `slug.eq.${s}`).join(",");

        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/posts?or=(${encodeURIComponent(orFilter)})&status=eq.published&select=*,post_categories(name,slug)&limit=1`,
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
          cache.set(normalizedSlug, data[0]);
          setPost(data[0]);
          setNotFound(false);
        } else {
          cache.set(normalizedSlug, null);
          setNotFound(true);
        }
      } catch (err) {
        console.error("[useBlogPost] Error:", err);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPost();
  }, [slug]);

  return { post, isLoading, notFound };
}
