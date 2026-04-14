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
import {
  getCachedDynamicCmsRoute,
  inferStructuredTemplateType,
  loadDynamicCmsRoute,
  normalizeCmsPath,
  type CmsPage,
} from "@site/lib/cms/dynamicRoute";
import { getSiteUrlFallback } from "@site/lib/runtime-env";
import BlogPost from "./BlogPost";
import NotFound from "./NotFound";
import Index from "./Index";
import Homepage2 from "./Homepage2";
import AboutUs from "./AboutUs";
import ContactPage from "./ContactPage";
import PracticeAreas from "./PracticeAreas";
import TestimonialsPage from "./TestimonialsPage";
import CommonQuestionsPage from "./CommonQuestionsPage";
import AreasWeServePage from "./AreasWeServePage";

export default function DynamicCmsPage() {
  const { pathname } = useLocation();
  const siteSettings = useSiteSettings();
  const siteUrl = siteSettings.settings.siteUrl || getSiteUrlFallback();
  const initialRoute = getCachedDynamicCmsRoute(pathname);

  const [page, setPage] = useState<CmsPage | null | undefined>(
    initialRoute ? initialRoute.page : undefined,
  );
  const [isBlogPost, setIsBlogPost] = useState(initialRoute?.isBlogPost ?? false);
  const [isLoading, setIsLoading] = useState(!initialRoute);

  useEffect(() => {
    const cached = getCachedDynamicCmsRoute(pathname);
    if (cached) {
      setPage(cached.page);
      setIsBlogPost(cached.isBlogPost);
      setIsLoading(false);
      return;
    }

    let isActive = true;

    setIsLoading(true);
    setPage(undefined);
    setIsBlogPost(false);

    loadDynamicCmsRoute(pathname)
      .then((route) => {
        if (!isActive) return;
        setPage(route.page);
        setIsBlogPost(route.isBlogPost);
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [pathname]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (isBlogPost) {
    const slug = normalizeCmsPath(pathname).replace(/^\//, "");
    return <BlogPost slugOverride={slug} />;
  }

  if (!page) {
    return <NotFound />;
  }

  if (page.page_type !== "area" && page.page_type !== "practice_detail") {
    const inferredTemplate = inferStructuredTemplateType(page.content);
    if (inferredTemplate === "home") {
      return pathname === "/homepage-2/" ? <Homepage2 /> : <Index />;
    }
    if (inferredTemplate === "about") {
      return <AboutUs />;
    }
    if (inferredTemplate === "contact") {
      return <ContactPage />;
    }
    if (inferredTemplate === "practice-areas") {
      return <PracticeAreas />;
    }
    if (inferredTemplate === "testimonials") {
      return <TestimonialsPage />;
    }
    if (inferredTemplate === "common-questions") {
      return <CommonQuestionsPage />;
    }
    if (inferredTemplate === "areas-we-serve") {
      return <AreasWeServePage />;
    }
  }

  const seo = resolveSeo(page, siteSettings.settings, pathname, siteUrl);

  const firstBlock =
    Array.isArray(page.content) && page.content.length > 0
      ? (page.content as ContentBlock[])[0]
      : null;
  const needsHeroBg =
    page.page_type === "practice_detail" ||
    (firstBlock?.type === "hero" &&
      ((firstBlock as any).variant === "dark" || firstBlock.backgroundImage));

  return (
    <Layout
      heroBg={
        needsHeroBg
          ? page.page_type === "practice_detail"
            ? "practice_detail"
            : "hero"
          : undefined
      }
    >
      <Seo {...seo} pageContent={page.content} />
      {page.page_type === "area" ? (
        <AreaPageRenderer content={page.content as AreaPageContent} />
      ) : page.page_type === "practice_detail" ? (
        <PracticeAreaDetailRenderer
          content={page.content as unknown as PracticeAreaDetailPageContent}
        />
      ) : (
        <BlockRenderer content={page.content as ContentBlock[]} />
      )}
    </Layout>
  );
}
