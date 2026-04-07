import { RequestHandler } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { extname } from "path";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = SupabaseClient<any, "public", any>;

function getServiceClient(): ServiceClient {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

/**
 * Download an external image URL and upload it to Supabase Storage.
 * Returns the new public URL, or the original URL on failure.
 */
async function uploadSingleImage(supabase: ServiceClient, imageUrl: string): Promise<string> {
  if (!imageUrl || !imageUrl.startsWith("http")) return imageUrl;

  try {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BulkImporter/1.0)" },
    });

    if (!response.ok) return imageUrl;

    const contentType = response.headers.get("content-type") ?? "image/jpeg";
    const mimeType = contentType.split(";")[0].trim();
    const urlExt = extname(new URL(imageUrl).pathname).toLowerCase() || ".jpg";
    const mimeExtMap: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/webp": ".webp",
      "image/svg+xml": ".svg",
      "image/avif": ".avif",
    };
    const ext = mimeExtMap[mimeType] ?? urlExt;
    const uid = randomUUID().split("-")[0];
    const fileName = `imported-${Date.now()}-${uid}${ext}`;
    const storagePath = `uploads/imported/${fileName}`;

    const buffer = Buffer.from(await response.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("media")
      .upload(storagePath, buffer, { contentType: mimeType, upsert: false });

    if (uploadError) return imageUrl;

    const { data: publicData } = supabase.storage.from("media").getPublicUrl(storagePath);
    const newUrl = publicData.publicUrl;

    await supabase.from("media").insert({
      file_name: fileName,
      file_path: storagePath,
      public_url: newUrl,
      file_size: buffer.length,
      mime_type: mimeType,
      uploaded_by: null,
    });

    return newUrl;
  } catch {
    return imageUrl;
  }
}

function normalizeOptionalText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizePublishedAt(value: unknown): string | null {
  const textValue = normalizeOptionalText(value);
  if (!textValue) return null;

  const numericTimestamp = /^\d{10,13}$/.test(textValue)
    ? Number(textValue)
    : null;

  const parsedDate = numericTimestamp !== null
    ? new Date(textValue.length === 13 ? numericTimestamp : numericTimestamp * 1000)
    : new Date(textValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

async function findPostCategoryBySlug(supabase: ServiceClient, slug: string) {
  const { data, error } = await supabase
    .from("post_categories")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Category lookup failed: ${error.message}`);
  return data;
}

async function findPostCategoryByName(supabase: ServiceClient, name: string) {
  const { data, error } = await supabase
    .from("post_categories")
    .select("id, name, slug")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Category lookup failed: ${error.message}`);
  return data;
}

async function resolvePostCategoryId(
  supabase: ServiceClient,
  categoryNameValue: unknown,
  categorySlugValue: unknown
): Promise<string | null> {
  const categoryName = normalizeOptionalText(categoryNameValue);
  const categorySlug = normalizeOptionalText(categorySlugValue);

  if (categorySlug) {
    const slugMatch = await findPostCategoryBySlug(supabase, categorySlug);
    if (slugMatch) return slugMatch.id;
  }

  if (categoryName) {
    const nameMatch = await findPostCategoryByName(supabase, categoryName);
    if (nameMatch) return nameMatch.id;

    const generatedSlug = slugify(categoryName);
    if (!generatedSlug) return null;

    const existingSlugMatch = await findPostCategoryBySlug(supabase, generatedSlug);
    if (existingSlugMatch) return existingSlugMatch.id;

    const { data, error } = await supabase
      .from("post_categories")
      .insert({
        name: categoryName,
        slug: categorySlug || generatedSlug,
        description: null,
      })
      .select("id")
      .single();

    if (error) throw new Error(`Category creation failed: ${error.message}`);
    return data.id;
  }

  return null;
}

function collectInlineImageUrls(html: string): string[] {
  if (!html?.trim()) return [];

  const imageUrls = new Set<string>();
  const imgTagPattern = /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = imgTagPattern.exec(html)) !== null) {
    const src = (match[1] || match[2] || match[3] || "").trim();
    if (src.startsWith("http://") || src.startsWith("https://")) {
      imageUrls.add(src);
    }
  }

  return Array.from(imageUrls);
}

async function rewriteBlogBodyImageUrls(
  supabase: ServiceClient,
  bodyHtmlValue: unknown
): Promise<{ bodyHtml: string | null; uploadedUrlMap: Map<string, string> }> {
  const bodyHtml = normalizeOptionalText(bodyHtmlValue);
  if (!bodyHtml) {
    return { bodyHtml: null, uploadedUrlMap: new Map() };
  }

  const uploadedUrlMap = new Map<string, string>();
  const inlineImageUrls = collectInlineImageUrls(bodyHtml);

  for (const imageUrl of inlineImageUrls) {
    const uploadedUrl = await uploadSingleImage(supabase, imageUrl).catch(() => imageUrl);
    uploadedUrlMap.set(imageUrl, uploadedUrl || imageUrl);
  }

  if (uploadedUrlMap.size === 0) {
    return { bodyHtml, uploadedUrlMap };
  }

  const rewrittenBodyHtml = bodyHtml.replace(
    /(<img\b[^>]*\bsrc\s*=\s*)("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi,
    (match, prefix, valueWithQuotes, doubleQuotedValue, singleQuotedValue, unquotedValue) => {
      const originalUrl = (doubleQuotedValue || singleQuotedValue || unquotedValue || "").trim();
      const uploadedUrl = uploadedUrlMap.get(originalUrl);
      if (!uploadedUrl || uploadedUrl === originalUrl) return match;

      if (doubleQuotedValue !== undefined) return `${prefix}"${uploadedUrl}"`;
      if (singleQuotedValue !== undefined) return `${prefix}'${uploadedUrl}'`;
      return `${prefix}${uploadedUrl}`;
    }
  );

  return { bodyHtml: rewrittenBodyHtml, uploadedUrlMap };
}

interface ImportRecord {
  rowIndex: number;
  slug: string;
  data: Record<string, unknown>;
  sourceData: Record<string, string>;
}

interface ImportBody {
  records: ImportRecord[];
  templateType: "practice" | "post" | "area";
  jobId: string;
  mode: "create" | "update" | "upsert";
}

const EMPTY_JOB_ID = "00000000-0000-0000-0000-000000000000";

function estimatePayloadBytes(value: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(value), "utf8");
  } catch {
    return 0;
  }
}

function summarizeSlugs(records: ImportRecord[], limit = 5): string[] {
  const slugs = records.map((record) => record.slug).filter(Boolean);
  if (slugs.length <= limit) return slugs;
  return [...slugs.slice(0, limit), `+${slugs.length - limit} more`];
}

/**
 * POST /api/bulk-import
 * Receives a batch of records, validates, and writes to Supabase.
 */
export const handleBulkImport: RequestHandler = async (req, res) => {
  const requestId = randomUUID().slice(0, 8);
  const startedAt = Date.now();

  try {
    const { records, templateType, jobId, mode } = req.body as ImportBody;

    if (!records?.length || !templateType || !jobId) {
      res.status(400).json({ error: "Missing required fields: records, templateType, jobId" });
      return;
    }

    const shouldTrackJob = jobId !== EMPTY_JOB_ID;
    console.info(`[bulk-import:${requestId}] start`, {
      templateType,
      mode,
      jobId: shouldTrackJob ? jobId : "tracking-disabled",
      recordCount: records.length,
      payloadBytes: estimatePayloadBytes(req.body),
      slugs: summarizeSlugs(records),
    });

    const supabase = getServiceClient();
    const results: { rowIndex: number; status: "success" | "failed"; error?: string; entityId?: string }[] = [];

    for (const record of records) {
      try {
        let entityId: string | undefined;

        if (templateType === "practice") {
          entityId = await importPracticePage(supabase, record, mode);
        } else if (templateType === "area") {
          entityId = await importAreaPage(supabase, record, mode);
        } else {
          entityId = await importPost(supabase, record, mode);
        }

        if (shouldTrackJob) {
          await supabase.from("import_job_items").insert({
            import_job_id: jobId,
            row_index: record.rowIndex,
            source_data: record.sourceData,
            target_slug: record.slug,
            status: "success",
            created_entity_id: entityId,
          });
        }

        results.push({ rowIndex: record.rowIndex, status: "success", entityId });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.warn(`[bulk-import:${requestId}] record failed`, {
          rowIndex: record.rowIndex,
          slug: record.slug,
          error: errorMsg,
        });

        if (shouldTrackJob) {
          await supabase.from("import_job_items").insert({
            import_job_id: jobId,
            row_index: record.rowIndex,
            source_data: record.sourceData,
            target_slug: record.slug,
            status: "failed",
            error_message: errorMsg,
          });
        }

        results.push({ rowIndex: record.rowIndex, status: "failed", error: errorMsg });
      }
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    if (shouldTrackJob) {
      const { data: job } = await supabase
        .from("import_jobs")
        .select("created_count, updated_count, failed_count, total_records")
        .eq("id", jobId)
        .single();

      if (job) {
        const updates: Record<string, number | string> = {
          failed_count: (job.failed_count || 0) + failedCount,
        };
        if (mode === "update") {
          updates.updated_count = (job.updated_count || 0) + successCount;
        } else {
          updates.created_count = (job.created_count || 0) + successCount;
        }

        const totalProcessed =
          (updates.created_count as number ?? job.created_count ?? 0) +
          (updates.updated_count as number ?? job.updated_count ?? 0) +
          (updates.failed_count as number);

        if (totalProcessed >= job.total_records) {
          updates.status = "completed";
          updates.completed_at = new Date().toISOString() as unknown as number;
        } else {
          updates.status = "processing";
        }

        await supabase.from("import_jobs").update(updates).eq("id", jobId);
      }
    }

    console.info(`[bulk-import:${requestId}] complete`, {
      durationMs: Date.now() - startedAt,
      recordCount: records.length,
      successCount,
      failedCount,
    });

    res.json({ results });
  } catch (err) {
    const body = req.body as Partial<ImportBody> | undefined;
    console.error(`[bulk-import:${requestId}] route failure`, {
      durationMs: Date.now() - startedAt,
      templateType: body?.templateType,
      mode: body?.mode,
      recordCount: Array.isArray(body?.records) ? body.records.length : 0,
      payloadBytes: estimatePayloadBytes(body),
      error: err instanceof Error ? err.message : err,
    });
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
};

async function importPracticePage(
  supabase: ServiceClient,
  record: ImportRecord,
  mode: string
): Promise<string> {
  // Upload og_image to media library
  let ogImage = (record.data.og_image as string) || null;
  if (ogImage) ogImage = await uploadSingleImage(supabase, ogImage).catch(() => ogImage);

  const pageData = {
    title: record.data.title as string,
    url_path: record.data.url_path as string,
    page_type: "practice_detail",
    content: record.data.content,
    meta_title: record.data.meta_title || null,
    meta_description: record.data.meta_description || null,
    canonical_url: record.data.canonical_url || null,
    og_title: record.data.og_title || null,
    og_description: record.data.og_description || null,
    og_image: ogImage,
    noindex: record.data.noindex || false,
    status: record.data.status || "draft",
  };

  if (mode === "update" || mode === "upsert") {
    // Try to find existing page by url_path
    const { data: existing } = await supabase
      .from("pages")
      .select("id")
      .eq("url_path", pageData.url_path)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("pages")
        .update(pageData)
        .eq("id", existing.id);
      if (error) throw new Error(`Update failed: ${error.message}`);
      return existing.id;
    }

    if (mode === "update") {
      throw new Error(`Page not found for update: ${pageData.url_path}`);
    }
  }

  const { data, error } = await supabase
    .from("pages")
    .insert(pageData)
    .select("id")
    .single();

  if (error) throw new Error(`Insert failed: ${error.message}`);
  return data.id;
}

async function importAreaPage(
  supabase: ServiceClient,
  record: ImportRecord,
  mode: string
): Promise<string> {
  // Upload og_image to media library
  let ogImage = (record.data.og_image as string) || null;
  if (ogImage) ogImage = await uploadSingleImage(supabase, ogImage).catch(() => ogImage);

  const pageData = {
    title: record.data.title as string,
    url_path: record.data.url_path as string,
    page_type: "area",
    content: record.data.content,
    meta_title: record.data.meta_title || null,
    meta_description: record.data.meta_description || null,
    canonical_url: record.data.canonical_url || null,
    og_title: record.data.og_title || null,
    og_description: record.data.og_description || null,
    og_image: ogImage,
    noindex: record.data.noindex || false,
    status: record.data.status || "draft",
  };

  if (mode === "update" || mode === "upsert") {
    const { data: existing } = await supabase
      .from("pages")
      .select("id")
      .eq("url_path", pageData.url_path)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("pages")
        .update(pageData)
        .eq("id", existing.id);
      if (error) throw new Error(`Update failed: ${error.message}`);
      return existing.id;
    }

    if (mode === "update") {
      throw new Error(`Area page not found for update: ${pageData.url_path}`);
    }
  }

  const { data, error } = await supabase
    .from("pages")
    .insert(pageData)
    .select("id")
    .single();

  if (error) throw new Error(`Insert failed: ${error.message}`);
  return data.id;
}

async function importPost(
  supabase: ServiceClient,
  record: ImportRecord,
  mode: string
): Promise<string> {
  const categoryId = await resolvePostCategoryId(
    supabase,
    record.data.category_name,
    record.data.category_slug
  );

  const { bodyHtml, uploadedUrlMap } = await rewriteBlogBodyImageUrls(supabase, record.data.body);

  // Upload featured_image and og_image to media library
  let featuredImage = normalizeOptionalText(record.data.featured_image);
  if (featuredImage) {
    featuredImage = uploadedUrlMap.get(featuredImage)
      || await uploadSingleImage(supabase, featuredImage).catch(() => featuredImage);
  }

  let ogImage = normalizeOptionalText(record.data.og_image);
  if (ogImage) {
    ogImage = uploadedUrlMap.get(ogImage)
      || await uploadSingleImage(supabase, ogImage).catch(() => ogImage);
  }

  const status = normalizeOptionalText(record.data.status) === "published" ? "published" : "draft";
  const providedPublishedAt = normalizePublishedAt(record.data.published_at);

  const basePostData = {
    title: record.data.title as string,
    slug: record.data.slug as string,
    body: bodyHtml,
    excerpt: record.data.excerpt || null,
    featured_image: featuredImage,
    category_id: categoryId,
    meta_title: record.data.meta_title || null,
    meta_description: record.data.meta_description || null,
    canonical_url: record.data.canonical_url || null,
    og_title: record.data.og_title || null,
    og_description: record.data.og_description || null,
    og_image: ogImage,
    noindex: record.data.noindex || false,
    status,
  };

  if (mode === "update" || mode === "upsert") {
    const { data: existing, error: existingError } = await supabase
      .from("posts")
      .select("id, published_at")
      .eq("slug", basePostData.slug)
      .maybeSingle();

    if (existingError) {
      throw new Error(`Existing post lookup failed: ${existingError.message}`);
    }

    if (existing) {
      const publishedAt = providedPublishedAt
        || existing.published_at
        || (status === "published" ? new Date().toISOString() : null);

      const { error } = await supabase
        .from("posts")
        .update({
          ...basePostData,
          published_at: publishedAt,
        })
        .eq("id", existing.id);
      if (error) throw new Error(`Update failed: ${error.message}`);
      return existing.id;
    }

    if (mode === "update") {
      throw new Error(`Post not found for update: ${basePostData.slug}`);
    }
  }

  const publishedAt = providedPublishedAt || (status === "published" ? new Date().toISOString() : null);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      ...basePostData,
      published_at: publishedAt,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Insert failed: ${error.message}`);
  return data.id;
}
