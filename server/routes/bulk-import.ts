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

/**
 * POST /api/bulk-import
 * Receives a batch of records, validates, and writes to Supabase.
 */
export const handleBulkImport: RequestHandler = async (req, res) => {
  try {
    const { records, templateType, jobId, mode } = req.body as ImportBody;

    if (!records?.length || !templateType || !jobId) {
      res.status(400).json({ error: "Missing required fields: records, templateType, jobId" });
      return;
    }

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

        // Update import_job_items
        await supabase.from("import_job_items").insert({
          import_job_id: jobId,
          row_index: record.rowIndex,
          source_data: record.sourceData,
          target_slug: record.slug,
          status: "success",
          created_entity_id: entityId,
        });

        results.push({ rowIndex: record.rowIndex, status: "success", entityId });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";

        await supabase.from("import_job_items").insert({
          import_job_id: jobId,
          row_index: record.rowIndex,
          source_data: record.sourceData,
          target_slug: record.slug,
          status: "failed",
          error_message: errorMsg,
        });

        results.push({ rowIndex: record.rowIndex, status: "failed", error: errorMsg });
      }
    }

    // Update job counters
    const successCount = results.filter((r) => r.status === "success").length;
    const failedCount = results.filter((r) => r.status === "failed").length;

    const updateField = mode === "update" ? "updated_count" : "created_count";

    // Use RPC or raw update
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

      // Check if all records processed
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

    res.json({ results });
  } catch (err) {
    console.error("Bulk import error:", err);
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

  // Upload featured_image and og_image to media library
  let featuredImage = (record.data.featured_image as string) || null;
  if (featuredImage) featuredImage = await uploadSingleImage(supabase, featuredImage).catch(() => featuredImage);

  let ogImage = (record.data.og_image as string) || null;
  if (ogImage) ogImage = await uploadSingleImage(supabase, ogImage).catch(() => ogImage);

  const status = record.data.status || "draft";
  const providedPublishedAt = normalizeOptionalText(record.data.published_at);
  const publishedAt = status === "published"
    ? providedPublishedAt || new Date().toISOString()
    : providedPublishedAt;

  const postData = {
    title: record.data.title as string,
    slug: record.data.slug as string,
    body: record.data.body || null,
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
    published_at: publishedAt,
  };

  if (mode === "update" || mode === "upsert") {
    const { data: existing } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", postData.slug)
      .single();

    if (existing) {
      const { error } = await supabase
        .from("posts")
        .update(postData)
        .eq("id", existing.id);
      if (error) throw new Error(`Update failed: ${error.message}`);
      return existing.id;
    }

    if (mode === "update") {
      throw new Error(`Post not found for update: ${postData.slug}`);
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .insert(postData)
    .select("id")
    .single();

  if (error) throw new Error(`Insert failed: ${error.message}`);
  return data.id;
}
