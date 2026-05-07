import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { PostWithCategory } from "@site/lib/cms/blogTypes";
import BlogPostCard from "@site/components/blog/BlogPostCard";
import { fetchSupabaseJson } from "@site/lib/cms/api";
import {
  getBlogListingPaginationInfo,
  getBlogListingPathForPage,
} from "@site/lib/cms/dynamicRoute";

interface RecentPostsBlockProps {
  heading?: string;
  postsPerPage?: number;
  showLoadMore?: boolean;
}

interface RecentPostsPageEntry {
  posts: PostWithCategory[];
  hasMore: boolean;
}

const recentPostsBlockCache = new Map<string, RecentPostsPageEntry>();

function isFormCategoryPost(post: PostWithCategory) {
  const category = post.post_categories;
  return (
    category?.slug?.trim().toLowerCase() === "form" ||
    category?.name?.trim().toLowerCase() === "form"
  );
}

function getRecentPostsBlockCacheKey(postsPerPage: number, offset: number) {
  return `${postsPerPage}:${offset}`;
}

function getCachedRecentPostsPage(postsPerPage: number, offset: number) {
  return recentPostsBlockCache.get(
    getRecentPostsBlockCacheKey(postsPerPage, offset),
  ) ?? null;
}

export async function loadRecentPostsBlockPage(
  postsPerPage: number,
  offset: number,
): Promise<RecentPostsPageEntry> {
  const cached = getCachedRecentPostsPage(postsPerPage, offset);
  if (cached) {
    return cached;
  }

  const limit = offset + postsPerPage + 2;

  try {
    const data = await fetchSupabaseJson<PostWithCategory[]>(
      `/rest/v1/posts?status=eq.published&select=*,post_categories(name,slug)&order=published_at.desc&limit=${limit}`,
    );
    const visiblePosts = data.filter((post) => !isFormCategoryPost(post));
    const pagePosts = visiblePosts.slice(offset, offset + postsPerPage);
    const hasMore = visiblePosts.length > offset + postsPerPage;
    const entry: RecentPostsPageEntry = {
      posts: pagePosts,
      hasMore,
    };

    recentPostsBlockCache.set(
      getRecentPostsBlockCacheKey(postsPerPage, offset),
      entry,
    );
    return entry;
  } catch (err) {
    console.error("[RecentPostsBlock] Error:", err);
    return { posts: [], hasMore: false };
  }
}

export function primeRecentPostsBlockCache(
  postsPerPage: number,
  offset: number,
  entry: RecentPostsPageEntry,
) {
  recentPostsBlockCache.set(
    getRecentPostsBlockCacheKey(postsPerPage, offset),
    entry,
  );
}

export default function RecentPostsBlock({
  heading,
  postsPerPage = 6,
  showLoadMore = true,
}: RecentPostsBlockProps) {
  const { pathname } = useLocation();
  const blogPagination = getBlogListingPaginationInfo(pathname);
  const isBlogListing = Boolean(blogPagination);
  const currentPage = blogPagination?.page ?? 1;
  const currentOffset = isBlogListing ? (currentPage - 1) * postsPerPage : 0;
  const initialEntry = getCachedRecentPostsPage(postsPerPage, currentOffset);
  const [posts, setPosts] = useState<PostWithCategory[]>(initialEntry?.posts ?? []);
  const [isLoading, setIsLoading] = useState(!initialEntry);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialEntry?.hasMore ?? false);

  const fetchPosts = useCallback(
    async (offset: number) => loadRecentPostsBlockPage(postsPerPage, offset),
    [postsPerPage],
  );

  useEffect(() => {
    const cached = getCachedRecentPostsPage(postsPerPage, currentOffset);
    if (cached) {
      setPosts(cached.posts);
      setHasMore(cached.hasMore);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    setIsLoading(true);
    setPosts([]);
    setHasMore(false);

    async function load() {
      try {
        const result = await fetchPosts(currentOffset);
        if (!cancelled) {
          setPosts(result.posts);
          setHasMore(result.hasMore);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [currentOffset, fetchPosts, postsPerPage]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const result = await fetchPosts(posts.length);
      setPosts((prev) => [...prev, ...result.posts]);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error("[RecentPostsBlock] Load more error:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="bg-white py-[40px] md:py-[60px]">
      <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
        {heading && (
          <h2 className="font-playfair text-[36px] md:text-[48px] font-light leading-tight text-black mb-[30px]">
            {heading}
          </h2>
        )}

        {isLoading ? (
          <LoadingSkeletons count={postsPerPage > 3 ? 6 : 3} />
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-outfit text-[18px] text-gray-500">
              No posts published yet. Check back soon!
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>

            {showLoadMore && isBlogListing && (currentPage > 1 || hasMore) && (
              <nav
                aria-label="Blog pagination"
                className="flex flex-wrap items-center justify-center gap-4 mt-[40px]"
              >
                {currentPage > 1 && (
                  <Link
                    to={getBlogListingPathForPage(currentPage - 1)}
                    className="font-outfit text-[16px] font-semibold text-black bg-gray-100 px-8 py-4 hover:bg-gray-200 transition-colors duration-300"
                  >
                    Newer Blog Posts
                  </Link>
                )}
                {hasMore && (
                  <Link
                    to={getBlogListingPathForPage(currentPage + 1)}
                    className="font-outfit text-[16px] font-semibold text-black bg-law-accent px-8 py-4 hover:bg-law-accent/80 transition-colors duration-300"
                  >
                    See More Blog Posts
                  </Link>
                )}
              </nav>
            )}

            {showLoadMore && !isBlogListing && hasMore && (
              <div className="flex justify-center mt-[40px]">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="font-outfit text-[16px] font-semibold text-black bg-law-accent px-8 py-4 hover:bg-law-accent/80 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? "Loading..." : "See More Blog Posts"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LoadingSkeletons({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-100 animate-pulse aspect-[4/5] rounded"
        />
      ))}
    </div>
  );
}
