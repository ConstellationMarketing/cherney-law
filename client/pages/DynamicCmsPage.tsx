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
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";
import { resolveSeo } from "@site/utils/resolveSeo";
import type { ContentBlock } from "@site/lib/blocks";
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

export default function DynamicCmsPage() {
  const { pathname } = useLocation();
  const siteSettings = useSiteSettings();
  const siteUrl =
    siteSettings.settings.siteUrl || import.meta.env.VITE_SITE_URL || "";

  const [page, setPage] = useState<CmsPage | null | undefined>(undefined); // undefined = loading
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Normalise path for lookup (ensure trailing slash)
    const normPath = pathname.endsWith("/") ? pathname : `${pathname}/`;

    if (cmsPageCache.has(normPath)) {
      setPage(cmsPageCache.get(normPath)!);
      setIsLoading(false);
      return;
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

        if (Array.isArray(data) && data.length > 0) {
          const p = data[0] as CmsPage;
          cmsPageCache.set(normPath, p);
          setPage(p);
        } else {
          cmsPageCache.set(normPath, null);
          setPage(null);
        }
      } catch (err) {
        console.error(`[DynamicCmsPage] Error loading ${normPath}:`, err);
        setPage(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPage();
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

  // No published CMS page found — show 404
  if (!page) {
    return <NotFound />;
  }

  const seo = resolveSeo(page, siteSettings, pathname, siteUrl);

  return (
    <Layout>
      <Seo {...seo} />
      {page.page_type === 'area' ? (
        <AreaPageRenderer content={page.content as AreaPageContent} />
      ) : (
        <BlockRenderer content={page.content as ContentBlock[]} />
      )}
    </Layout>
  );
}
