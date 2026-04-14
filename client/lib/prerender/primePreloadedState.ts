import { primeSiteSettingsCache } from "@site/contexts/SiteSettingsContext";
import { primeDynamicCmsRouteCache } from "@site/lib/cms/dynamicRoute";
import type { CmsPreloadedState } from "@site/lib/prerender/preloadedState";
import { primeHomeContentCache } from "@site/hooks/useHomeContent";
import { primeHomepage2ContentCache } from "@site/hooks/useHomepage2Content";
import { primeAboutContentCache } from "@site/hooks/useAboutContent";
import { primeContactContentCache } from "@site/hooks/useContactContent";
import { primePracticeAreasContentCache } from "@site/hooks/usePracticeAreasContent";
import { primeTestimonialsContentCache } from "@site/hooks/useTestimonialsContent";
import { primeCommonQuestionsContentCache } from "@site/hooks/useCommonQuestionsContent";
import { primeAreasWeServeContentCache } from "@site/hooks/useAreasWeServeContent";
import { primePracticeAreaDetailCache } from "@site/hooks/usePracticeAreaDetailContent";
import { primeBlogPostCache } from "@site/hooks/useBlogPost";
import { primeHubPageLocationsCache } from "@site/hooks/useHubPageLocations";
import { primeBlogSidebarCache } from "@site/components/blog/BlogSidebar";
import { primeRecentPostsCache } from "@site/components/blog/RecentPosts";
import { primeRecentPostsBlockCache } from "@site/components/blocks/RecentPostsBlock";

export function primePreloadedCmsState(state: CmsPreloadedState | null | undefined) {
  if (!state) {
    return;
  }

  primeSiteSettingsCache(state.siteSettings);

  if (state.routeData.dynamicCms) {
    primeDynamicCmsRouteCache(state.routeData.dynamicCms as any);
  }
  if (state.routeData.homeContent) {
    primeHomeContentCache(state.routeData.homeContent as any);
  }
  if (state.routeData.homepage2Content) {
    primeHomepage2ContentCache(state.routeData.homepage2Content as any);
  }
  if (state.routeData.aboutContent) {
    primeAboutContentCache(
      state.routeData.aboutContent as any,
      state.routeData.aboutContent.urlPath,
    );
  }
  if (state.routeData.contactContent) {
    primeContactContentCache(state.routeData.contactContent as any);
  }
  if (state.routeData.practiceAreasContent) {
    primePracticeAreasContentCache(state.routeData.practiceAreasContent as any);
  }
  if (state.routeData.testimonialsContent) {
    primeTestimonialsContentCache(state.routeData.testimonialsContent as any);
  }
  if (state.routeData.commonQuestionsContent) {
    primeCommonQuestionsContentCache(state.routeData.commonQuestionsContent as any);
  }
  if (state.routeData.areasWeServeContent) {
    primeAreasWeServeContentCache(state.routeData.areasWeServeContent as any);
  }
  if (state.routeData.practiceAreaDetailContent) {
    primePracticeAreaDetailCache(
      state.routeData.practiceAreaDetailContent.slug,
      state.routeData.practiceAreaDetailContent as any,
    );
  }
  if (state.routeData.blogPost) {
    primeBlogPostCache(state.routeData.blogPost.slug, state.routeData.blogPost as any);
  }
  if (state.routeData.hubPageLocations) {
    primeHubPageLocationsCache(state.routeData.hubPageLocations as any);
  }
  if (Object.prototype.hasOwnProperty.call(state.routeData, "blogSidebar")) {
    primeBlogSidebarCache((state.routeData.blogSidebar ?? null) as any);
  }

  for (const entry of state.routeData.recentPosts ?? []) {
    primeRecentPostsCache(entry as any);
  }

  for (const entry of state.routeData.recentPostsBlocks ?? []) {
    primeRecentPostsBlockCache(entry.postsPerPage, entry.offset, {
      posts: entry.posts as any,
      hasMore: entry.hasMore,
    });
  }
}
