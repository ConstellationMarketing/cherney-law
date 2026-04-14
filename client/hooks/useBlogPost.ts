import { useEffect, useState } from "react";
import type { PostWithCategory } from "@site/lib/cms/blogTypes";
import { fetchSupabaseJson } from "@site/lib/cms/api";

interface BlogPostCacheEntry {
  post: PostWithCategory | null;
  notFound: boolean;
}

const cache = new Map<string, BlogPostCacheEntry>();

function normalizeSlug(slug: string) {
  return slug.endsWith("/") ? slug : `${slug}/`;
}

function getCachedEntry(slug: string): BlogPostCacheEntry | null {
  return cache.get(normalizeSlug(slug)) ?? null;
}

export async function loadBlogPost(
  slug: string,
): Promise<BlogPostCacheEntry> {
  const normalizedSlug = normalizeSlug(slug);
  const cached = getCachedEntry(normalizedSlug);
  if (cached) {
    return cached;
  }

  try {
    const slugs = [normalizedSlug, normalizedSlug.slice(0, -1)];
    const orFilter = slugs.map((entry) => `slug.eq.${entry}`).join(",");
    const data = await fetchSupabaseJson<PostWithCategory[]>(
      `/rest/v1/posts?or=(${encodeURIComponent(orFilter)})&status=eq.published&select=*,post_categories(name,slug)&limit=1`,
    );

    const entry: BlogPostCacheEntry =
      Array.isArray(data) && data.length > 0
        ? { post: data[0], notFound: false }
        : { post: null, notFound: true };

    cache.set(normalizedSlug, entry);
    return entry;
  } catch (err) {
    console.error("[useBlogPost] Error:", err);
    const entry: BlogPostCacheEntry = { post: null, notFound: true };
    cache.set(normalizedSlug, entry);
    return entry;
  }
}

export function primeBlogPostCache(slug: string, entry: BlogPostCacheEntry) {
  cache.set(normalizeSlug(slug), entry);
}

export function clearBlogPostCache(slug?: string) {
  if (slug) {
    cache.delete(normalizeSlug(slug));
  } else {
    cache.clear();
  }
}

export function useBlogPost(slug: string) {
  const initialEntry = getCachedEntry(slug);
  const [post, setPost] = useState<PostWithCategory | null>(initialEntry?.post ?? null);
  const [isLoading, setIsLoading] = useState(!initialEntry);
  const [notFound, setNotFound] = useState(initialEntry?.notFound ?? false);

  useEffect(() => {
    const cached = getCachedEntry(slug);
    if (cached) {
      setPost(cached.post);
      setNotFound(cached.notFound);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    loadBlogPost(slug)
      .then((entry) => {
        if (!isMounted) return;
        setPost(entry.post);
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

  return { post, isLoading, notFound };
}
