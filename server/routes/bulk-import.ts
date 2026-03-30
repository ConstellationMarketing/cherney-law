import { RequestHandler } from "express";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = SupabaseClient<any, "public", any>;

function getServiceClient(): ServiceClient {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

interface ImportRecord {
  rowIndex: number;
  slug: string;
  data: Record<string, unknown>;
  sourceData: Record<string, string>;
}

interface ImportBody {
  records: ImportRecord[];
  templateType: "practice" | "post";
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
    og_image: record.data.og_image || null,
    noindex: record.data.noindex || false,
    schema_type: record.data.schema_type || "LegalService",
    schema_data: record.data.schema_data || null,
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

async function importPost(
  supabase: ServiceClient,
  record: ImportRecord,
  mode: string
): Promise<string> {
  // Resolve category if provided
  let categoryId: string | null = null;
  const categoryName = record.data.category_name as string | null;
  if (categoryName) {
    const { data: cat } = await supabase
      .from("post_categories")
      .select("id")
      .ilike("name", categoryName)
      .single();

    if (cat) {
      categoryId = cat.id;
    }
  }

  const postData = {
    title: record.data.title as string,
    slug: record.data.slug as string,
    body: record.data.body || null,
    excerpt: record.data.excerpt || null,
    featured_image: record.data.featured_image || null,
    category_id: categoryId,
    meta_title: record.data.meta_title || null,
    meta_description: record.data.meta_description || null,
    canonical_url: record.data.canonical_url || null,
    og_title: record.data.og_title || null,
    og_description: record.data.og_description || null,
    og_image: record.data.og_image || null,
    noindex: record.data.noindex || false,
    status: record.data.status || "draft",
    published_at: record.data.published_at || null,
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
