import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

type SiteSettingsRow = {
  site_url?: string | null;
};

type SiteSettingsGlobal = {
  site_url?: string | null;
};

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizePath(path: string) {
  if (!path) return "/";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  const withLeadingSlash = path.startsWith("/") ? path : `/${path}`;
  if (withLeadingSlash === "/") return "/";
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
}

async function getSiteBaseUrl(req: Parameters<RequestHandler>[0]) {
  const supabase = getServiceClient();

  const { data } = await supabase
    .from("site_settings_public")
    .select("site_url")
    .eq("settings_key", "global")
    .maybeSingle<SiteSettingsRow>();

  const dbSiteUrl = (data as SiteSettingsGlobal | null)?.site_url?.trim();
  if (dbSiteUrl) return dbSiteUrl.replace(/\/$/, "");

  const envSiteUrl = process.env.VITE_SITE_URL?.trim();
  if (envSiteUrl) return envSiteUrl.replace(/\/$/, "");

  return `${req.protocol}://${req.get("host")}`;
}

function xmlResponse(res: Parameters<RequestHandler>[1], xml: string) {
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.send(xml);
}

export const handleSitemapIndex: RequestHandler = async (req, res) => {
  try {
    const baseUrl = await getSiteBaseUrl(req);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${escapeXml(`${baseUrl}/sitemap-pages.xml`)}</loc>
  </sitemap>
  <sitemap>
    <loc>${escapeXml(`${baseUrl}/sitemap-posts.xml`)}</loc>
  </sitemap>
</sitemapindex>`;

    xmlResponse(res, xml);
  } catch (err) {
    res.status(500).send(err instanceof Error ? err.message : "Failed to generate sitemap index");
  }
};

export const handlePagesSitemap: RequestHandler = async (req, res) => {
  try {
    const supabase = getServiceClient();
    const baseUrl = await getSiteBaseUrl(req);

    const { data, error } = await supabase
      .from("pages")
      .select("url_path, updated_at, published_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (error) {
      res.status(500).send(error.message);
      return;
    }

    const urlEntries = (data ?? [])
      .map((row) => {
        const rawPath = typeof row.url_path === "string" ? row.url_path.trim() : "";
        if (!rawPath) return null;

        const normalizedPath = normalizePath(rawPath);
        const loc = normalizedPath.startsWith("http")
          ? normalizedPath
          : `${baseUrl}${normalizedPath}`;
        const lastmod = row.updated_at || row.published_at || null;

        return {
          loc,
          lastmod: lastmod ? new Date(lastmod).toISOString() : null,
        };
      })
      .filter((entry): entry is { loc: string; lastmod: string | null } => Boolean(entry));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries
  .map((entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `
    <lastmod>${entry.lastmod}</lastmod>` : ""}
  </url>`)
  .join("\n")}
</urlset>`;

    xmlResponse(res, xml);
  } catch (err) {
    res.status(500).send(err instanceof Error ? err.message : "Failed to generate pages sitemap");
  }
};

export const handlePostsSitemap: RequestHandler = async (req, res) => {
  try {
    const supabase = getServiceClient();
    const baseUrl = await getSiteBaseUrl(req);

    const { data, error } = await supabase
      .from("posts")
      .select("slug, updated_at, published_at")
      .eq("status", "published")
      .order("updated_at", { ascending: false });

    if (error) {
      res.status(500).send(error.message);
      return;
    }

    const urlEntries = (data ?? [])
      .map((row) => {
        const rawSlug = typeof row.slug === "string" ? row.slug.trim() : "";
        if (!rawSlug) return null;

        const normalizedPath = normalizePath(rawSlug);
        const loc = normalizedPath.startsWith("http")
          ? normalizedPath
          : `${baseUrl}${normalizedPath}`;
        const lastmod = row.updated_at || row.published_at || null;

        return {
          loc,
          lastmod: lastmod ? new Date(lastmod).toISOString() : null,
        };
      })
      .filter((entry): entry is { loc: string; lastmod: string | null } => Boolean(entry));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries
  .map((entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>${entry.lastmod ? `
    <lastmod>${entry.lastmod}</lastmod>` : ""}
  </url>`)
  .join("\n")}
</urlset>`;

    xmlResponse(res, xml);
  } catch (err) {
    res.status(500).send(err instanceof Error ? err.message : "Failed to generate posts sitemap");
  }
};
