import { Link } from "react-router-dom";
import type { PostWithCategory } from "@site/lib/cms/blogTypes";

interface Props {
  post: PostWithCategory;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export default function BlogPostCard({ post }: Props) {
  // Normalize slug for link
  const slug = post.slug.endsWith("/") ? post.slug : `${post.slug}/`;
  const href = `/blog/${slug}`;
  const firstLetter = post.title?.charAt(0)?.toUpperCase() || "B";

  return (
    <Link
      to={href}
      className="group block bg-white border border-gray-200 hover:border-law-accent transition-colors duration-300 overflow-hidden"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#1a1a2e] to-[#2d2d5e]">
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-playfair text-[60px] text-white/20">
              {firstLetter}
            </span>
          </div>
        )}
        {post.post_categories && (
          <span className="absolute top-3 left-3 bg-law-accent text-black text-xs font-outfit font-semibold px-3 py-1">
            {post.post_categories.name}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="font-outfit text-xs text-gray-500 mb-2">
          {formatDate(post.published_at)}
        </p>
        <h3 className="font-playfair text-[20px] md:text-[22px] leading-tight text-black mb-2 group-hover:text-law-accent transition-colors duration-300">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="font-outfit text-[14px] md:text-[15px] leading-[22px] text-gray-600 line-clamp-3 mb-3">
            {post.excerpt}
          </p>
        )}
        <span className="font-outfit text-sm font-semibold text-law-accent group-hover:underline">
          Read More →
        </span>
      </div>
    </Link>
  );
}
