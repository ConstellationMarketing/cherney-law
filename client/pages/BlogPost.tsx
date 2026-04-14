import { useParams, useLocation } from "react-router-dom";
import Layout from "@site/components/layout/Layout";
import Seo from "@site/components/Seo";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";
import { useBlogPost } from "@site/hooks/useBlogPost";
import { resolveSeo } from "@site/utils/resolveSeo";
import { getSiteUrlFallback } from "@site/lib/runtime-env";
import { useGlobalPhone } from "@site/contexts/SiteSettingsContext";
import BlogSidebar from "@site/components/blog/BlogSidebar";
import RecentPosts from "@site/components/blog/RecentPosts";
import NotFound from "./NotFound";
import { Phone, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

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

export default function BlogPost({ slugOverride }: { slugOverride?: string }) {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = slugOverride || paramSlug || "";
  const { pathname } = useLocation();
  const siteSettings = useSiteSettings();
  const { phoneDisplay, phoneLabel } = useGlobalPhone();
  const siteUrl = siteSettings.settings.siteUrl || getSiteUrlFallback();

  const { post, isLoading, notFound } = useBlogPost(slug || "");

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (notFound || !post) {
    return <NotFound />;
  }

  const seo = resolveSeo(
    {
      meta_title: post.meta_title,
      meta_description: post.meta_description || post.excerpt,
      canonical_url: post.canonical_url,
      og_title: post.og_title,
      og_description: post.og_description || post.excerpt,
      og_image: post.og_image || post.featured_image,
      noindex: post.noindex,
      url_path: `/${post.slug.endsWith("/") ? post.slug : `${post.slug}/`}`,
      title: post.title,
    },
    siteSettings.settings,
    pathname,
    siteUrl,
  );

  return (
    <Layout heroBg="blog">
      <Seo
        {...seo}
        ogTitle={post.og_title || undefined}
        ogDescription={post.og_description || post.excerpt || undefined}
      />

      {/* Hero */}
      <div
        className={`relative -mt-[144px] pt-[171px] md:pt-[194px] pb-[30px] md:pb-[54px] ${post.featured_image ? "" : "bg-[#1a1a2e]"}`}
      >
        {post.featured_image && (
          <div className="absolute inset-0">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-[#1a1a2e]/80" />
          </div>
        )}
        <div className="relative max-w-[2560px] mx-auto w-[95%] md:w-[90%]">
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
            <div className="flex-1">
              {post.post_categories && (
                <span className="inline-block bg-law-accent text-black text-xs font-outfit font-semibold px-3 py-1 mb-3">
                  {post.post_categories.name}
                </span>
              )}
              <p className="font-outfit text-sm text-white/60 mb-2">
                {formatDate(post.published_at)}
              </p>
              <h1 className="font-playfair text-[clamp(2rem,5vw,54px)] font-light leading-[1.2] text-white max-w-[800px]">
                {post.title}
              </h1>
            </div>

            <div className="shrink-0 w-full md:w-auto md:max-w-[380px] space-y-3">
              <a href={`tel:${phoneDisplay.replace(/[^0-9]/g, "")}`} data-dni-phone="primary" className="block">
                <div className="bg-law-accent p-[8px] w-full cursor-pointer hover:bg-[#7a9e10] transition-colors duration-300 group">
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-[15px] mt-1 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-black" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-outfit text-[14px] md:text-[16px] leading-tight text-black pb-1 font-normal">
                        {phoneLabel}
                      </h4>
                      <p className="font-outfit text-[20px] md:text-[24px] text-black leading-tight">
                        {phoneDisplay}
                      </p>
                    </div>
                  </div>
                </div>
              </a>
              <Link to="/contact/" className="block">
                <div className="bg-white p-[8px] w-full cursor-pointer hover:bg-law-accent transition-colors duration-300 group">
                  <div className="flex items-start gap-4">
                    <div className="bg-law-accent p-[15px] mt-1 flex items-center justify-center group-hover:bg-black transition-colors duration-300">
                      <Calendar className="w-6 h-6 text-black group-hover:text-white transition-colors duration-300" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-outfit text-[14px] md:text-[16px] leading-tight text-black pb-1 font-normal group-hover:text-white transition-colors duration-300">
                        Schedule Now
                      </h4>
                      <p className="font-outfit text-[20px] md:text-[24px] text-black leading-tight group-hover:text-white transition-colors duration-300">
                        Free Consultation
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Article Body + Sidebar */}
      <div className="bg-white py-[40px] md:py-[60px]">
        <div className="max-w-[2560px] mx-auto w-[95%] md:w-[90%] lg:w-[80%]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Article */}
            <article className="lg:col-span-2">
              <div
                className="font-outfit text-[16px] md:text-[18px] leading-[28px] md:leading-[32px] text-black prose prose-lg max-w-none [&_a]:text-law-accent [&_a]:underline [&_h2]:font-playfair [&_h2]:text-[28px] [&_h2]:md:text-[36px] [&_h2]:leading-tight [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:font-playfair [&_h3]:text-[22px] [&_h3]:md:text-[28px] [&_h3]:leading-tight [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-5 [&_ul]:mb-5 [&_ol]:mb-5 [&_li]:mb-1 [&_img]:rounded [&_img]:my-6"
                dangerouslySetInnerHTML={{ __html: post.body || "" }}
              />
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="lg:sticky lg:top-[100px]">
                <BlogSidebar />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Recent Posts */}
      <RecentPosts excludePostId={post.id} />
    </Layout>
  );
}
