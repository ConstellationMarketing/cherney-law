import { loadSiteSettings } from "@site/contexts/SiteSettingsContext";
import {
  inferStructuredTemplateType,
  loadDynamicCmsRoute,
  normalizeCmsPath,
} from "@site/lib/cms/dynamicRoute";
import type { CmsPreloadedState } from "@site/lib/prerender/preloadedState";
import { loadHomeContent } from "@site/hooks/useHomeContent";
import { loadHomepage2Content } from "@site/hooks/useHomepage2Content";
import { loadAboutContent } from "@site/hooks/useAboutContent";
import { loadContactContent } from "@site/hooks/useContactContent";
import { loadPracticeAreasContent } from "@site/hooks/usePracticeAreasContent";
import { loadTestimonialsContent } from "@site/hooks/useTestimonialsContent";
import { loadCommonQuestionsContent } from "@site/hooks/useCommonQuestionsContent";
import { loadAreasWeServeContent } from "@site/hooks/useAreasWeServeContent";
import { loadPracticeAreaDetailContent } from "@site/hooks/usePracticeAreaDetailContent";
import { loadBlogPost } from "@site/hooks/useBlogPost";
import { loadHubPageLocations } from "@site/hooks/useHubPageLocations";
import { loadBlogSidebarSettings } from "@site/components/blog/BlogSidebar";
import { loadRecentPosts } from "@site/components/blog/RecentPosts";
import { loadRecentPostsBlockPage } from "@site/components/blocks/RecentPostsBlock";

async function collectRecentPostsBlocks(pageContent: unknown) {
  if (!Array.isArray(pageContent)) {
    return [] as CmsPreloadedState["routeData"]["recentPostsBlocks"];
  }

  const uniquePostsPerPage = new Set<number>();

  for (const block of pageContent as Array<Record<string, unknown>>) {
    if (block?.type === "recent-posts") {
      uniquePostsPerPage.add(
        typeof block.postsPerPage === "number" ? block.postsPerPage : 6,
      );
    }
  }

  const entries = await Promise.all(
    Array.from(uniquePostsPerPage).map(async (postsPerPage) => {
      const result = await loadRecentPostsBlockPage(postsPerPage, 0);
      return {
        key: `${postsPerPage}:0`,
        postsPerPage,
        offset: 0,
        posts: result.posts,
        hasMore: result.hasMore,
      };
    }),
  );

  return entries;
}

export async function preparePrerenderState(
  pathname: string,
): Promise<CmsPreloadedState> {
  const normalizedPath = normalizeCmsPath(pathname);
  const siteSettings = await loadSiteSettings();
  const dynamicCms = await loadDynamicCmsRoute(pathname);

  const state: CmsPreloadedState = {
    routePath: {
      requestedPath: pathname,
      normalizedPath,
    },
    routeKind: "not-found",
    routePayload: {},
    siteSettings,
    routeData: {
      dynamicCms,
    },
  };

  if (dynamicCms.isBlogPost) {
    const slug = normalizedPath.replace(/^\//, "");
    const blogPost = await loadBlogPost(slug);
    const recentPosts = await loadRecentPosts(3, blogPost.post?.id);

    state.routeKind = "post";
    state.routePayload = {
      post: blogPost.post,
    };
    state.routeData.blogPost = {
      slug,
      ...blogPost,
    };
    state.routeData.blogSidebar = await loadBlogSidebarSettings();
    state.routeData.recentPosts = [
      {
        key: `3:${blogPost.post?.id || ""}`,
        excludePostId: blogPost.post?.id,
        limit: 3,
        posts: recentPosts.posts,
      },
    ];

    return state;
  }

  if (!dynamicCms.page) {
    return state;
  }

  state.routeKind = "page";
  state.routePayload = {
    page: dynamicCms.page,
  };

  if (dynamicCms.page.page_type === "practice_detail") {
    return state;
  }

  if (dynamicCms.page.page_type === "area") {
    state.routeData.hubPageLocations = await loadHubPageLocations();
    return state;
  }

  const inferredTemplate = inferStructuredTemplateType(dynamicCms.page.content);

  if (inferredTemplate === "home") {
    if (normalizedPath === "/homepage-2/") {
      state.routeData.homepage2Content = {
        urlPath: normalizedPath,
        ...(await loadHomepage2Content(normalizedPath)),
      };
    } else {
      state.routeData.homeContent = {
        urlPath: normalizedPath,
        ...(await loadHomeContent(normalizedPath)),
      };
    }
    return state;
  }

  if (inferredTemplate === "about") {
    state.routeData.aboutContent = {
      urlPath: normalizedPath,
      ...(await loadAboutContent(normalizedPath)),
    };
    state.routeData.homeContent = {
      urlPath: "/",
      ...(await loadHomeContent("/")),
    };
    return state;
  }

  if (inferredTemplate === "contact") {
    state.routeData.contactContent = {
      urlPath: normalizedPath,
      ...(await loadContactContent(normalizedPath)),
    };
    return state;
  }

  if (inferredTemplate === "practice-areas") {
    state.routeData.practiceAreasContent = {
      urlPath: normalizedPath,
      ...(await loadPracticeAreasContent(normalizedPath)),
    };
    state.routeData.aboutContent = {
      urlPath: "/about/",
      ...(await loadAboutContent("/about/")),
    };
    return state;
  }

  if (inferredTemplate === "testimonials") {
    state.routeData.testimonialsContent = {
      urlPath: normalizedPath,
      ...(await loadTestimonialsContent(normalizedPath)),
    };
    return state;
  }

  if (inferredTemplate === "common-questions") {
    state.routeData.commonQuestionsContent = {
      urlPath: normalizedPath,
      ...(await loadCommonQuestionsContent(normalizedPath)),
    };
    return state;
  }

  if (inferredTemplate === "areas-we-serve") {
    state.routeData.areasWeServeContent = {
      urlPath: normalizedPath,
      ...(await loadAreasWeServeContent(normalizedPath)),
    };
    return state;
  }

  state.routeData.recentPostsBlocks = await collectRecentPostsBlocks(
    dynamicCms.page.content,
  );

  return state;
}
