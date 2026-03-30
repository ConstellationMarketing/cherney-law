import Layout from "@site/components/layout/Layout";
import Seo from "@site/components/Seo";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";
import { useBlogPosts } from "@site/hooks/useBlogPosts";
import BlogHero from "@site/components/blog/BlogHero";
import BlogPostCard from "@site/components/blog/BlogPostCard";

export default function BlogIndex() {
  const siteSettings = useSiteSettings();
  const { posts, isLoading } = useBlogPosts();
  const siteName = siteSettings.settings.siteName || "";
  const siteUrl = siteSettings.settings.siteUrl || "";

  return (
    <Layout heroBg="blog">
      <Seo
        title={`Blog | ${siteName}`}
        description="Legal news and updates from our firm."
        canonical={siteUrl ? `${siteUrl}/blog/` : undefined}
      />

      <BlogHero title="Blog" subtitle="Legal Insights & Updates" />

      <div className="bg-white py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-gray-100 animate-pulse aspect-[4/5] rounded"
                />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-outfit text-[18px] text-gray-500">
                No posts published yet. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
