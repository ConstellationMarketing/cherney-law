import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../client/lib/database.types";
import { renderAppToString } from "../../../client/entry-server.tsx";
import { preparePrerenderState } from "../../../client/lib/prerender/preparePrerenderState.ts";
import { serializePreloadedState } from "../../../client/lib/prerender/preloadedState.ts";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.log("Supabase credentials not configured. Skipping SSG generation.");
  console.log(
    "To enable SSG, set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.",
  );
  process.exit(0);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey);

interface PageRoute {
  id: string;
  title: string;
  url_path: string;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  updated_at: string;
}

interface BlogPostRoute {
  id: string;
  title: string;
  slug: string;
  meta_title: string | null;
  meta_description: string | null;
  canonical_url: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  noindex: boolean;
  updated_at: string;
}

interface Redirect {
  from_path: string;
  to_path: string;
  status_code: number;
}

interface SiteSettingsRow {
  site_url: string | null;
  site_noindex: boolean;
}

function normalizeOutputPath(urlPath: string) {
  if (urlPath === "/") {
    return path.join(process.cwd(), "dist/spa/index.html");
  }

  const pagePath = urlPath.startsWith("/") ? urlPath.slice(1) : urlPath;
  return path.join(process.cwd(), "dist/spa", pagePath, "index.html");
}

function stripPlaceholderSeo(template: string) {
  return template
    .replace(/\s*<title><\/title>/, "")
    .replace(/\s*<meta name="description" content="">/, "")
    .replace(/\s*<meta property="og:title" content="">/, "")
    .replace(/\s*<meta property="og:description" content="">/, "")
    .replace(/\s*<meta property="og:url" content="">/, "")
    .replace(/\s*<meta name="twitter:title" content="">/, "")
    .replace(/\s*<meta name="twitter:description" content="">/, "");
}

function injectRenderedHtml(
  template: string,
  pathname: string,
  appHtml: string,
  serializedState: string,
  helmetContext: Record<string, any>,
  preloadedSiteSettings: { headScripts?: string; footerScripts?: string },
) {
  const cleanedTemplate = stripPlaceholderSeo(template);
  const helmet = helmetContext.helmet;

  const headParts = [
    helmet?.title?.toString() || "",
    helmet?.priority?.toString?.() || "",
    helmet?.meta?.toString() || "",
    helmet?.link?.toString() || "",
    helmet?.script?.toString() || "",
    preloadedSiteSettings.headScripts
      ? '<meta name="cms-prerendered-head-scripts" content="true">'
      : "",
    preloadedSiteSettings.headScripts || "",
  ].filter(Boolean);

  const preloadScript = `<script>window.__CMS_PRELOADED_STATE__=${serializedState};</script>`;
  const footerScripts = preloadedSiteSettings.footerScripts
    ? `${preloadedSiteSettings.footerScripts}\n<meta name="cms-prerendered-footer-scripts" content="true">`
    : "";

  let html = cleanedTemplate.replace(
    '<div id="root"></div>',
    `<div id="root">${appHtml}</div>`,
  );

  html = html.replace("</head>", `${headParts.join("\n")}\n</head>`);
  html = html.replace("</body>", `${preloadScript}\n${footerScripts}\n</body>`);

  if (pathname === "/") {
    return html;
  }

  return html;
}

async function renderRoute(template: string, pathname: string) {
  const state = await preparePrerenderState(pathname);
  const helmetContext: Record<string, any> = {};
  const appHtml = renderAppToString(pathname, helmetContext);

  return injectRenderedHtml(
    template,
    pathname,
    appHtml,
    serializePreloadedState(state),
    helmetContext,
    {
      headScripts: state.siteSettings.headScripts,
      footerScripts: state.siteSettings.footerScripts,
    },
  );
}

async function generateSSG() {
  console.log("Starting SSG generation...");

  const { data: siteSettingsData } = await supabase
    .from("site_settings")
    .select("site_url, site_noindex")
    .eq("settings_key", "global")
    .single();

  const siteSettings: SiteSettingsRow = siteSettingsData || {
    site_url: null,
    site_noindex: false,
  };

  const siteUrl = process.env.SITE_URL || siteSettings.site_url || "";
  if (!siteUrl) {
    console.warn(
      "[SSG] No SITE_URL configured — canonical URLs and sitemap will be incomplete.",
    );
  }

  const { data: pages, error: pagesError } = await supabase
    .from("pages")
    .select(
      "id, title, url_path, meta_title, meta_description, canonical_url, og_title, og_description, og_image, noindex, updated_at",
    )
    .eq("status", "published");

  if (pagesError) {
    console.error("Error fetching pages:", pagesError);
    process.exit(1);
  }

  const { data: blogPosts, error: postsError } = await supabase
    .from("posts")
    .select(
      "id, title, slug, meta_title, meta_description, canonical_url, og_title, og_description, og_image, noindex, updated_at",
    )
    .eq("status", "published");

  if (postsError) {
    console.error("Error fetching blog posts:", postsError);
  }

  const templatePath = path.join(process.cwd(), "dist/spa/index.html");
  if (!fs.existsSync(templatePath)) {
    console.error("Template not found at dist/spa/index.html. Run build:client first.");
    process.exit(1);
  }

  const template = fs.readFileSync(templatePath, "utf-8");

  for (const page of pages || []) {
    const html = await renderRoute(template, page.url_path);
    const outputPath = normalizeOutputPath(page.url_path);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
    console.log(`Generated: ${page.url_path}`);
  }

  for (const post of blogPosts || []) {
    const postSlug = post.slug.endsWith("/") ? post.slug : `${post.slug}/`;
    const postUrlPath = `/${postSlug}`;
    const html = await renderRoute(template, postUrlPath);
    const outputPath = normalizeOutputPath(postUrlPath);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, html);
    console.log(`Generated: ${postUrlPath}`);
  }

  const { data: redirects, error: redirectsError } = await supabase
    .from("redirects")
    .select("from_path, to_path, status_code")
    .eq("enabled", true);

  const blogTrailingSlashRules = (blogPosts || [])
    .map((post) => {
      const postSlug = post.slug.endsWith("/") ? post.slug : `${post.slug}/`;
      const withSlash = `/${postSlug}`;
      const withoutSlash = withSlash.slice(0, -1);
      return `${withoutSlash} ${withSlash} 301`;
    })
    .join("\n");

  const trailingSlashRules = (pages || [])
    .filter((page) => page.url_path !== "/")
    .map((page) => {
      const withSlash = page.url_path.endsWith("/")
        ? page.url_path
        : `${page.url_path}/`;
      const withoutSlash = withSlash.slice(0, -1);
      return `${withoutSlash} ${withSlash} 301`;
    })
    .join("\n");

  const userRedirects = redirects && !redirectsError
    ? redirects
        .map((redirect: Redirect) => `${redirect.from_path} ${redirect.to_path} ${redirect.status_code}`)
        .join("\n")
    : "";

  const fullRedirectsContent = [
    "# Trailing-slash enforcement",
    trailingSlashRules,
    blogTrailingSlashRules
      ? `\n# Blog trailing-slash enforcement\n${blogTrailingSlashRules}`
      : "",
    userRedirects ? `\n# Custom redirects\n${userRedirects}` : "",
    "\n/* /index.html 200",
  ]
    .filter(Boolean)
    .join("\n");

  fs.writeFileSync(
    path.join(process.cwd(), "dist/spa/_redirects"),
    fullRedirectsContent,
  );

  if (redirectsError) {
    console.error("Error fetching redirects (custom rules skipped):", redirectsError);
  }

  if (!siteSettings.site_noindex) {
    const allPages: PageRoute[] = [
      ...(pages || []),
      ...((blogPosts || []).map((post) => ({
        id: post.id,
        title: post.title,
        url_path: `/${post.slug.endsWith("/") ? post.slug : `${post.slug}/`}`,
        meta_title: post.meta_title,
        meta_description: post.meta_description,
        canonical_url: post.canonical_url,
        og_title: post.og_title,
        og_description: post.og_description,
        og_image: post.og_image,
        noindex: post.noindex,
        updated_at: post.updated_at,
      })) as PageRoute[]),
    ];

    const sitemap = generateSitemap(allPages, siteUrl);
    fs.writeFileSync(path.join(process.cwd(), "dist/spa/sitemap.xml"), sitemap);
    console.log("Generated sitemap.xml");
  } else {
    const sitemapPath = path.join(process.cwd(), "dist/spa/sitemap.xml");
    if (fs.existsSync(sitemapPath)) {
      fs.unlinkSync(sitemapPath);
    }
    console.log("Skipped sitemap.xml (site is noindex)");
  }

  const robotsTxt = siteSettings.site_noindex
    ? `User-agent: *\nDisallow: /`
    : `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml`;
  fs.writeFileSync(path.join(process.cwd(), "dist/spa/robots.txt"), robotsTxt);

  console.log("SSG generation complete!");
}

function generateSitemap(pages: PageRoute[], siteUrl: string): string {
  const urls = pages
    .filter((page) => !page.noindex)
    .map((page) => {
      const normalizedPath =
        page.url_path === "/" ? "/" : page.url_path.replace(/\/?$/, "/");
      return `  <url>
    <loc>${siteUrl}${normalizedPath}</loc>
    <lastmod>${new Date(page.updated_at).toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.url_path === "/" ? "1.0" : "0.8"}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

generateSSG().catch((err) => {
  console.error("SSG generation failed:", err);
  process.exit(1);
});
