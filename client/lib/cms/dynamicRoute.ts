import { CMS_PAGE_SELECT, fetchSupabaseJson } from "@site/lib/cms/api";

export interface CmsPage {
  id: string;
  title: string;
  url_path: string;
  page_type: string;
  content: unknown;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  status: string;
}

export type StructuredTemplateType =
  | "home"
  | "homepage-2"
  | "about"
  | "contact"
  | "practice-areas"
  | "testimonials"
  | "common-questions"
  | "areas-we-serve";

export interface DynamicCmsRouteResult {
  normalizedPath: string;
  page: CmsPage | null;
  isBlogPost: boolean;
}

const cmsPageCache = new Map<string, CmsPage | null>();
const blogSlugCache = new Map<string, boolean>();

export function normalizeCmsPath(pathname: string): string {
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export function inferStructuredTemplateType(
  content: unknown,
): StructuredTemplateType | null {
  if (!content || typeof content !== "object" || Array.isArray(content)) return null;

  const normalized = content as Record<string, unknown>;

  if (normalized.hero && normalized.about && Array.isArray(normalized.practiceAreas)) {
    return "home";
  }

  if (normalized.story && normalized.missionVision && normalized.whyChooseUs) {
    return "about";
  }

  if (Array.isArray(normalized.offices) && normalized.formSettings && normalized.process) {
    return "contact";
  }

  if (Array.isArray(normalized.tabs) && normalized.grid && normalized.faq) {
    return "practice-areas";
  }

  if (normalized.reviews && normalized.cta && normalized.hero) {
    return "testimonials";
  }

  if (normalized.faqSection && normalized.closingSection && normalized.hero) {
    return "common-questions";
  }

  if (normalized.locationsSection && normalized.introSection && normalized.whySection) {
    return "areas-we-serve";
  }

  return null;
}

export function primeDynamicCmsRouteCache(result: DynamicCmsRouteResult) {
  cmsPageCache.set(result.normalizedPath, result.page);

  const slug = result.normalizedPath.replace(/^\//, "");
  blogSlugCache.set(slug, result.isBlogPost);
}

export function clearDynamicCmsRouteCache(pathname?: string) {
  if (!pathname) {
    cmsPageCache.clear();
    blogSlugCache.clear();
    return;
  }

  const normalizedPath = normalizeCmsPath(pathname);
  cmsPageCache.delete(normalizedPath);
  blogSlugCache.delete(normalizedPath.replace(/^\//, ""));
}

export function getCachedDynamicCmsRoute(
  pathname: string,
): DynamicCmsRouteResult | null {
  const normalizedPath = normalizeCmsPath(pathname);

  if (!cmsPageCache.has(normalizedPath)) {
    return null;
  }

  const slug = normalizedPath.replace(/^\//, "");

  return {
    normalizedPath,
    page: cmsPageCache.get(normalizedPath) ?? null,
    isBlogPost: blogSlugCache.get(slug) ?? false,
  };
}

async function checkBlogPost(slug: string): Promise<boolean> {
  const slugs = [slug, slug.endsWith("/") ? slug.slice(0, -1) : `${slug}/`];
  const orFilter = slugs.map((entry) => `slug.eq.${entry}`).join(",");

  try {
    const data = await fetchSupabaseJson<{ id: string }[]>(
      `/rest/v1/posts?or=(${encodeURIComponent(orFilter)})&status=eq.published&select=id&limit=1`,
    );

    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

export async function loadDynamicCmsRoute(
  pathname: string,
): Promise<DynamicCmsRouteResult> {
  const cached = getCachedDynamicCmsRoute(pathname);
  if (cached) {
    return cached;
  }

  const normalizedPath = normalizeCmsPath(pathname);
  const paths = [normalizedPath];
  if (normalizedPath.endsWith("/")) {
    paths.push(normalizedPath.slice(0, -1));
  }

  const orFilter = paths.map((entry) => `url_path.eq.${entry}`).join(",");

  try {
    const data = await fetchSupabaseJson<CmsPage[]>(
      `/rest/v1/pages?or=(${encodeURIComponent(orFilter)})&status=eq.published&select=${CMS_PAGE_SELECT}&limit=1`,
    );

    if (Array.isArray(data) && data.length > 0) {
      const result: DynamicCmsRouteResult = {
        normalizedPath,
        page: data[0],
        isBlogPost: false,
      };
      primeDynamicCmsRouteCache(result);
      return result;
    }

    const slug = normalizedPath.replace(/^\//, "");
    const isBlogPost = await checkBlogPost(slug);
    const result: DynamicCmsRouteResult = {
      normalizedPath,
      page: null,
      isBlogPost,
    };
    primeDynamicCmsRouteCache(result);
    return result;
  } catch (error) {
    console.error(`[DynamicCmsPage] Error loading ${normalizedPath}:`, error);
    const result: DynamicCmsRouteResult = {
      normalizedPath,
      page: null,
      isBlogPost: false,
    };
    primeDynamicCmsRouteCache(result);
    return result;
  }
}
