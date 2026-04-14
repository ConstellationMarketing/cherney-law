import type { SiteSettings } from "@site/contexts/SiteSettingsContext";

export interface CmsPreloadedState {
  routePath: {
    requestedPath: string;
    normalizedPath: string;
  };
  routeKind: "page" | "post" | "not-found";
  routePayload: {
    page?: unknown | null;
    post?: unknown | null;
  };
  siteSettings: SiteSettings;
  routeData: {
    dynamicCms?: {
      normalizedPath: string;
      page: unknown | null;
      isBlogPost: boolean;
    };
    homeContent?: { urlPath: string; content: unknown; page: unknown | null };
    homepage2Content?: { urlPath: string; content: unknown; page: unknown | null };
    aboutContent?: { urlPath: string; content: unknown; page: unknown | null };
    contactContent?: { urlPath: string; content: unknown; page: unknown | null };
    practiceAreasContent?: { urlPath: string; content: unknown; page: unknown | null };
    testimonialsContent?: { urlPath: string; content: unknown; page: unknown | null };
    commonQuestionsContent?: { urlPath: string; content: unknown; page: unknown | null };
    areasWeServeContent?: { urlPath: string; content: unknown; page: unknown | null };
    practiceAreaDetailContent?: {
      slug: string;
      page: unknown | null;
      content: unknown;
      notFound: boolean;
    };
    blogPost?: {
      slug: string;
      post: unknown | null;
      notFound: boolean;
    };
    hubPageLocations?: {
      locationsSection: unknown | null;
      cta: unknown | null;
    };
    blogSidebar?: unknown | null;
    recentPosts?: Array<{
      key: string;
      excludePostId?: string;
      limit: number;
      posts: unknown[];
    }>;
    recentPostsBlocks?: Array<{
      key: string;
      postsPerPage: number;
      offset: number;
      posts: unknown[];
      hasMore: boolean;
    }>;
  };
}

export function getWindowPreloadedState(): CmsPreloadedState | null {
  if (typeof window === "undefined") {
    return null;
  }

  return (window as Window & { __CMS_PRELOADED_STATE__?: CmsPreloadedState })
    .__CMS_PRELOADED_STATE__ ?? null;
}

export function serializePreloadedState(state: CmsPreloadedState): string {
  return JSON.stringify(state)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
