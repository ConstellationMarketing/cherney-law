import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

/**
 * GET /api/admin/pages
 * Returns ALL pages (draft + published) using the service-role key,
 * bypassing RLS so admins can see imported draft pages.
 */
export const handleGetAdminPages: RequestHandler = async (_req, res) => {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data ?? []);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
};

/**
 * DELETE /api/admin/pages/:id
 * Deletes a page using the service-role key.
 */
export const handleDeleteAdminPage: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Missing page id" });
      return;
    }

    const supabase = getServiceClient();
    const { error } = await supabase.from("pages").delete().eq("id", id);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
};

/**
 * PATCH /api/admin/pages/:id
 * Updates a page (status, noindex, etc.) using the service-role key.
 */
export const handlePatchAdminPage: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: "Missing page id" });
      return;
    }

    const updates = req.body as Record<string, unknown>;
    if (!updates || Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No update fields provided" });
      return;
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("pages")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
};

/**
 * PATCH /api/admin/pages/bulk
 * Bulk-updates multiple pages using the service-role key.
 */
export const handleBulkPatchAdminPages: RequestHandler = async (req, res) => {
  try {
    const { ids, updates } = req.body as { ids: string[]; updates: Record<string, unknown> };
    if (!ids?.length || !updates) {
      res.status(400).json({ error: "Missing ids or updates" });
      return;
    }

    const supabase = getServiceClient();
    const { error } = await supabase
      .from("pages")
      .update(updates)
      .in("id", ids);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, count: ids.length });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
};

/**
 * DELETE /api/admin/pages/bulk
 * Bulk-deletes multiple pages using the service-role key.
 */
export const handleBulkDeleteAdminPages: RequestHandler = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const ids: string[] = req.body?.ids;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: "Missing or empty ids array" });
      return;
    }

    const supabase = getServiceClient();
    const { error } = await supabase.from("pages").delete().in("id", ids);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ success: true, count: ids.length });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal server error" });
  }
};
