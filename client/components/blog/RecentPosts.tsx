import { useState, useEffect } from "react";
import type { PostWithCategory } from "@site/lib/cms/blogTypes";
import BlogPostCard from "./BlogPostCard";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface Props {
  excludePostId?: string;
  limit?: number;
}

export default function RecentPosts({ excludePostId, limit = 3 }: Props) {
  const [posts, setPosts] = useState<PostWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/posts?status=eq.published&select=*,post_categories(name,slug)&order=published_at.desc&limit=${limit + 1}`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        if (!response.ok) return;
        const data: PostWithCategory[] = await response.json();
        const filtered = excludePostId
          ? data.filter((p) => p.id !== excludePostId).slice(0, limit)
          : data.slice(0, limit);
        setPosts(filtered);
      } catch (err) {
        console.error("[RecentPosts] Error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPosts();
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
