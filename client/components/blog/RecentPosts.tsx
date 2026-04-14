import { useEffect, useState } from "react";
import type { PostWithCategory } from "@site/lib/cms/blogTypes";
import BlogPostCard from "./BlogPostCard";
import { fetchSupabaseJson } from "@site/lib/cms/api";

interface Props {
  excludePostId?: string;
  limit?: number;
}

interface RecentPostsCacheEntry {
  posts: PostWithCategory[];
  limit: number;
  excludePostId?: string;
}

const recentPostsCache = new Map<string, RecentPostsCacheEntry>();

function getCacheKey(limit: number, excludePostId?: string) {
  return `${limit}:${excludePostId || ""}`;
}

function getCachedEntry(limit: number, excludePostId?: string) {
  return recentPostsCache.get(getCacheKey(limit, excludePostId)) ?? null;
}

export async function loadRecentPosts(
  limit: number,
  excludePostId?: string,
): Promise<RecentPostsCacheEntry> {
  const cached = getCachedEntry(limit, excludePostId);
  if (cached) {
    return cached;
  }

  try {
    const data = await fetchSupabaseJson<PostWithCategory[]>(
      `/rest/v1/posts?status=eq.published&select=*,post_categories(name,slug)&order=published_at.desc&limit=${limit + 1}`,
    );

    const filtered = excludePostId
      ? data.filter((post) => post.id !== excludePostId).slice(0, limit)
      : data.slice(0, limit);

    const entry: RecentPostsCacheEntry = { posts: filtered, limit, excludePostId };
    recentPostsCache.set(getCacheKey(limit, excludePostId), entry);
    return entry;
  } catch (err) {
    console.error("[RecentPosts] Error:", err);
    return { posts: [], limit, excludePostId };
  }
}

export function primeRecentPostsCache(entry: RecentPostsCacheEntry) {
  recentPostsCache.set(getCacheKey(entry.limit, entry.excludePostId), entry);
}

export default function RecentPosts({ excludePostId, limit = 3 }: Props) {
  const initialEntry = getCachedEntry(limit, excludePostId);
  const [posts, setPosts] = useState<PostWithCategory[]>(initialEntry?.posts ?? []);
  const [isLoading, setIsLoading] = useState(!initialEntry);

  useEffect(() => {
    const cached = getCachedEntry(limit, excludePostId);
    if (cached) {
      setPosts(cached.posts);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    loadRecentPosts(limit, excludePostId)
      .then((entry) => {
        if (!isMounted) return;
        setPosts(entry.posts);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [excludePostId, limit]);

  if (isLoading || posts.length === 0) return null;

  return (
    <div className="bg-gray-50 py-[40px] md:py-[60px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        <h2 className="font-playfair text-[28px] md:text-[36px] leading-tight text-black mb-8">
          Recent Posts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}
