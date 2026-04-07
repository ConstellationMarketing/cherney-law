/**
 * DynamicCmsPage
 * Renders any page published via the CMS block editor.
 * Falls through to NotFound if no published page matches the current URL path.
 */

import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "@site/components/layout/Layout";
import Seo from "@site/components/Seo";
import BlockRenderer from "@site/components/BlockRenderer";
import AreaPageRenderer from "@site/components/area-page/AreaPageRenderer";
import type { AreaPageContent } from "@site/lib/cms/areaPageTypes";
import PracticeAreaDetailRenderer from "@site/components/practice-detail/PracticeAreaDetailRenderer";
import type { PracticeAreaDetailPageContent } from "@site/lib/cms/practiceAreaDetailPageTypes";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";
import { resolveSeo } from "@site/utils/resolveSeo";
import type { ContentBlock } from "@site/lib/blocks";
import BlogPost from "./BlogPost";
import NotFound from "./NotFound";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

interface CmsPage {
  id: string;
  title: string;
  url_path: string;
  page_type: string;
  content: ContentBlock[] | AreaPageContent;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  status: string;
}

// Module-level cache
const cmsPageCache = new Map<string, CmsPage | null>();
const blogSlugCache = new Map<string, boolean>();

export default function DynamicCmsPage() {
  const { pathname } = useLocation();
  const siteSettings = useSiteSettings();
  const siteUrl =
    siteSettings.settings.siteUrl || import.meta.env.VITE_SITE_URL || "";

  const [page, setPage] = useState<CmsPage | null | undefined>(undefined); // undefined = loading
  const [isBlogPost, setIsBlogPost] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    // Normalise path for lookup (ensure trailing slash)
    const normPath = pathname.endsWith("/") ? pathname : `${pathname}/`;

    setIsLoading(true);
    setPage(undefined);
    setIsBlogPost(false);

    if (cmsPageCache.has(normPath)) {
      if (!isActive) return;
      setPage(cmsPageCache.get(normPath)!);
      setIsBlogPost(false);
      setIsLoading(false);
      return () => {
        isActive = false;
      };
    }

    async function fetchPage() {
      try {
        // Try both with and without trailing slash
        const paths = [normPath];
        if (normPath.endsWith("/")) {
          paths.push(normPath.slice(0, -1));
        }

        const orFilter = paths
          .map((p) => `url_path.eq.${p}`)
          .join(",");

        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/pages?or=(${encodeURIComponent(orFilter)})&status=eq.published&select=id,title,url_path,page_type,content,meta_title,meta_description,canonical_url,og_title,og_description,og_image,noindex,status&limit=1`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!isActive) return;

        if (Array.isArray(data) && data.length > 0) {
          const p = data[0] as CmsPage;
          cmsPageCache.set(normPath, p);
          setPage(p);
          setIsBlogPost(false);
        } else {
          cmsPageCache.set(normPath, null);

          // No CMS page found — check if it's a blog post
          const slug = normPath.replace(/^\//, ""); // strip leading slash, keep trailing
          if (blogSlugCache.has(slug)) {
            const isBlog = blogSlugCache.get(slug)!;
            setIsBlogPost(isBlog);
            if (!isBlog) setPage(null);
          } else {
            const found = await checkBlogPost(slug);
            if (!isActive) return;
            blogSlugCache.set(slug, found);
            setIsBlogPost(found);
            if (!found) setPage(null);
          }
        }
      } catch (err) {
        if (!isActive) return;
        console.error(`[DynamicCmsPage] Error loading ${normPath}:`, err);
        setPage(null);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    async function checkBlogPost(slug: string): Promise<boolean> {
      try {
        const slugs = [slug, slug.endsWith("/") ? slug.slice(0, -1) : `${slug}/`];
        const orFilter = slugs.map((s) => `slug.eq.${s}`).join(",");
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/posts?or=(${encodeURIComponent(orFilter)})&status=eq.published&select=id&limit=1`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            },
          }
        );
        if (!response.ok) return false;
        const data = await response.json();
        return Array.isArray(data) && data.length > 0;
      } catch {
        return false;
      }
    }

    fetchPage();

    return () => {
      isActive = false;
    };
  }, [pathname]);

  // Loading state
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  // Blog post found — render BlogPost component
  if (isBlogPost) {
    const slug = (pathname.endsWith("/") ? pathname : `${pathname}/`).replace(/^\//, "");
    return <BlogPost slugOverride={slug} />;
  }

  // No published CMS page found — show 404
  if (!page) {
    return <NotFound />;
  }

  const seo = resolveSeo(page, siteSettings, pathname, siteUrl);

  // Determine if first block is a hero that needs transparent header overlap
  const firstBlock = Array.isArray(page.content) && page.content.length > 0
    ? (page.content as ContentBlock[])[0]
    : null;
  const needsHeroBg = page.page_type === 'practice_detail'
    || (firstBlock?.type === 'hero' && ((firstBlock as any).variant === 'dark' || firstBlock.backgroundImage));

  return (
    <Layout heroBg={needsHeroBg ? (page.page_type === 'practice_detail' ? 'practice_detail' : 'hero') : undefined}>
      <Seo {...seo} />
      {page.page_type === 'area' ? (
        <AreaPageRenderer content={page.content as AreaPageContent} />
      ) : page.page_type === 'practice_detail' ? (
        <PracticeAreaDetailRenderer content={page.content as unknown as PracticeAreaDetailPageContent} />
      ) : (
        <BlockRenderer content={page.content as ContentBlock[]} />
      )}
    </Layout>
  );
}
