import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Layout from "@site/components/layout/Layout";
import Seo from "@site/components/Seo";
import type { AreaPageContent } from "@site/lib/cms/areaPageTypes";
import type { PracticeAreaDetailPageContent } from "@site/lib/cms/practiceAreaDetailPageTypes";
import { useSiteSettings } from "@site/contexts/SiteSettingsContext";
import { resolveSeo } from "@site/utils/resolveSeo";
import type { ContentBlock } from "@site/lib/blocks";
import {
  getBlogListingPaginationInfo,
  getBlogListingPathForPage,
  getCachedDynamicCmsRoute,
  inferStructuredTemplateType,
  loadDynamicCmsRoute,
  normalizeCmsPath,
  type CmsPage,
} from "@site/lib/cms/dynamicRoute";
import { getSiteUrlFallback } from "@site/lib/runtime-env";
const BlogPost = lazy(() => import("./BlogPost"));
const NotFound = lazy(() => import("./NotFound"));
const Index = lazy(() => import("./Index"));
const Homepage2 = lazy(() => import("./Homepage2"));
const AboutUs = lazy(() => import("./AboutUs"));
const ContactPage = lazy(() => import("./ContactPage"));
const PracticeAreas = lazy(() => import("./PracticeAreas"));
const TestimonialsPage = lazy(() => import("./TestimonialsPage"));
const CommonQuestionsPage = lazy(() => import("./CommonQuestionsPage"));
const AreasWeServePage = lazy(() => import("./AreasWeServePage"));
const BlockRenderer = lazy(() => import("@site/components/BlockRenderer"));
const AreaPageRenderer = lazy(
  () => import("@site/components/area-page/AreaPageRenderer"),
);
const PracticeAreaDetailRenderer = lazy(
  () => import("@site/components/practice-detail/PracticeAreaDetailRenderer"),
);

function PageFallback() {
  return (
    <Layout>
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    </Layout>
  );
}

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
    return (
      <Suspense fallback={<PageFallback />}>
        <BlogPost slugOverride={slug} />
      </Suspense>
    );
  }

  if (!page) {
    return (
      <Suspense fallback={<PageFallback />}>
        <NotFound />
      </Suspense>
    );
  }

  if (page.page_type !== "area" && page.page_type !== "practice_detail") {
    const inferredTemplate = inferStructuredTemplateType(page.content);
    if (inferredTemplate === "home") {
      return (
        <Suspense fallback={<PageFallback />}>
          {pathname === "/homepage-2/" ? <Homepage2 /> : <Index />}
        </Suspense>
      );
    }
    if (inferredTemplate === "about") {
      return (
        <Suspense fallback={<PageFallback />}>
          <AboutUs />
        </Suspense>
      );
    }
    if (inferredTemplate === "contact") {
      return (
        <Suspense fallback={<PageFallback />}>
          <ContactPage />
        </Suspense>
      );
    }
    if (inferredTemplate === "practice-areas") {
      return (
        <Suspense fallback={<PageFallback />}>
          <PracticeAreas />
        </Suspense>
      );
    }
    if (inferredTemplate === "testimonials") {
      return (
        <Suspense fallback={<PageFallback />}>
          <TestimonialsPage />
        </Suspense>
      );
    }
    if (inferredTemplate === "common-questions") {
      return (
        <Suspense fallback={<PageFallback />}>
          <CommonQuestionsPage />
        </Suspense>
      );
    }
    if (inferredTemplate === "areas-we-serve") {
      return (
        <Suspense fallback={<PageFallback />}>
          <AreasWeServePage />
        </Suspense>
      );
    }
  }

  const blogPagination = getBlogListingPaginationInfo(pathname);
  const seoPath = blogPagination
    ? getBlogListingPathForPage(blogPagination.page)
    : pathname;
  const seo = resolveSeo(page, siteSettings.settings, seoPath, siteUrl);
  if (blogPagination && blogPagination.page > 1) {
    seo.title = `${seo.title} - Page ${blogPagination.page}`;
    seo.canonical = siteUrl
      ? new URL(seoPath, siteUrl.endsWith("/") ? siteUrl : `${siteUrl}/`).toString()
      : seo.canonical;
  }

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
      <Suspense fallback={<div className="min-h-[60vh]" />}>
        {page.page_type === "area" ? (
          <AreaPageRenderer content={page.content as AreaPageContent} />
        ) : page.page_type === "practice_detail" ? (
          <PracticeAreaDetailRenderer
            content={page.content as unknown as PracticeAreaDetailPageContent}
          />
        ) : (
          <BlockRenderer content={page.content as ContentBlock[]} />
        )}
      </Suspense>
    </Layout>
  );
}
