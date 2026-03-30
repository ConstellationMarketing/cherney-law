import { useState, useEffect } from "react";
import type { PostWithCategory } from "@site/lib/cms/blogTypes";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

let postsCache: PostWithCategory[] | null = null;

export function clearBlogPostsCache() {
  postsCache = null;
}

export function useBlogPosts(categorySlug?: string) {
  const [posts, setPosts] = useState<PostWithCategory[]>(postsCache || []);
  const [isLoading, setIsLoading] = useState(!postsCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (postsCache && !categorySlug) {
      setPosts(postsCache);
      setIsLoading(false);
      return;
    }

    async function fetchPosts() {
      try {
        let url = `${SUPABASE_URL}/rest/v1/posts?status=eq.published&select=*,post_categories(name,slug)&order=published_at.desc`;

        const response = await fetch(url, {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        });

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        let data: PostWithCategory[] = await response.json();

        // Filter by category client-side if needed
        if (categorySlug) {
          data = data.filter(
            (p) => p.post_categories?.slug === categorySlug
          );
        }

        if (!categorySlug) {
          postsCache = data;
        }
        setPosts(data);
      } catch (err: any) {
        console.error("[useBlogPosts] Error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPosts();
  }, [categorySlug]);

  return { posts, isLoading, error };
}
