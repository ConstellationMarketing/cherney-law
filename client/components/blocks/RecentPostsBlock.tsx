import { useState, useEffect, useCallback } from "react";
import type { PostWithCategory } from "@site/lib/cms/blogTypes";
import BlogPostCard from "@site/components/blog/BlogPostCard";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface RecentPostsBlockProps {
  heading?: string;
  postsPerPage?: number;
  showLoadMore?: boolean;
}

export default function RecentPostsBlock({
  heading,
  postsPerPage = 6,
  showLoadMore = true,
}: RecentPostsBlockProps) {
  const [posts, setPosts] = useState<PostWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const fetchPosts = useCallback(
    async (offset: number) => {
      // Fetch one extra to know if there are more
      const limit = postsPerPage + 1;
      const url = `${SUPABASE_URL}/rest/v1/posts?status=eq.published&select=*,post_categories(name,slug)&order=published_at.desc&limit=${limit}&offset=${offset}`;

      const response = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const data: PostWithCategory[] = await response.json();
      const hasMoreResults = data.length > postsPerPage;
      const sliced = hasMoreResults ? data.slice(0, postsPerPage) : data;

      return { posts: sliced, hasMore: hasMoreResults };
    },
    [postsPerPage]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await fetchPosts(0);
        if (!cancelled) {
          setPosts(result.posts);
          setHasMore(result.hasMore);
        }
      } catch (err) {
        console.error("[RecentPostsBlock] Error:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fetchPosts]);

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

            {showLoadMore && hasMore && (
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
