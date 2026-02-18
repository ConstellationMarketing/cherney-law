import type { Handler, HandlerEvent } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface SearchReplaceRequest {
  searchText: string;
  replaceText: string;
  caseSensitive: boolean;
  statusFilter: "all" | "published" | "draft";
  dryRun: boolean;
  confirmToken?: string;
  rollback?: boolean;
  operationId?: string;
}

interface Match {
  pageId: string;
  pageTitle: string;
  pageUrl: string;
  fieldPath: string;
  oldValue: string;
  newValue: string;
}

interface PreviewResult {
  matches: Match[];
  totalMatches: number;
  affectedPages: number;
  confirmToken: string;
}

interface ExecuteResult {
  operationId: string;
  totalChanges: number;
  affectedPages: number;
}

interface RollbackResult {
  operationId: string;
  restoredChanges: number;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceString(
  value: string,
  search: string,
  replace: string,
  caseSensitive: boolean,
): string {
  if (caseSensitive) {
    return value.split(search).join(replace);
  }
  return value.replace(new RegExp(escapeRegex(search), "gi"), replace);
}

function containsSearch(
  value: string,
  search: string,
  caseSensitive: boolean,
): boolean {
  if (caseSensitive) {
    return value.includes(search);
  }
  return value.toLowerCase().includes(search.toLowerCase());
}

function traverseAndReplace(
  obj: unknown,
  search: string,
  replace: string,
  caseSensitive: boolean,
  path: string,
  matches: { path: string; oldValue: string; newValue: string }[],
): unknown {
  if (typeof obj === "string") {
    if (containsSearch(obj, search, caseSensitive)) {
      const newValue = replaceString(obj, search, replace, caseSensitive);
      matches.push({ path, oldValue: obj, newValue });
      return newValue;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item, i) =>
      traverseAndReplace(
        item,
        search,
        replace,
        caseSensitive,
        `${path}[${i}]`,
        matches,
      ),
    );
  }

  if (obj && typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = traverseAndReplace(
        value,
        search,
        replace,
        caseSensitive,
        path ? `${path}.${key}` : key,
        matches,
      );
    }
    return result;
  }

  return obj;
}

export const handler: Handler = async (event: HandlerEvent) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  // Check if Supabase is configured
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Supabase not configured" }),
    };
  }

  // Verify auth token from request
  const authHeader = event.headers.authorization;
  if (!authHeader) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Authorization header required" }),
    };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Verify the token with Supabase
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: "Invalid or expired token" }),
    };
  }

  try {
    const body: SearchReplaceRequest = JSON.parse(event.body || "{}");

    // Handle rollback
    if (body.rollback && body.operationId) {
      return await handleRollback(supabase, body.operationId, user.id, headers);
    }

    // Validate inputs
    if (!body.searchText || body.searchText.trim() === "") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Search text is required" }),
      };
    }

    if (!body.dryRun && !body.replaceText && body.replaceText !== "") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Replace text is required" }),
      };
    }

    if (!body.dryRun && body.searchText === body.replaceText) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Search and replace text cannot be the same",
        }),
      };
    }

    // Build query
    let query = supabase.from("pages").select("*");

    if (body.statusFilter === "published") {
      query = query.eq("status", "published");
    } else if (body.statusFilter === "draft") {
      query = query.eq("status", "draft");
    }

    const { data: pages, error: fetchError } = await query;

    if (fetchError) {
      throw fetchError;
    }

    const textFields = [
      "title",
      "meta_title",
      "meta_description",
      "og_title",
      "og_description",
    ];
    const allMatches: Match[] = [];
    const affectedPageIds = new Set<string>();

    // Process each page
    for (const page of pages || []) {
      // Check text fields
      for (const field of textFields) {
        const value = page[field];
        if (
          typeof value === "string" &&
          containsSearch(value, body.searchText, body.caseSensitive)
        ) {
          const newValue = replaceString(
            value,
            body.searchText,
            body.replaceText || "",
            body.caseSensitive,
          );
          allMatches.push({
            pageId: page.id,
            pageTitle: page.title,
            pageUrl: page.url_path,
            fieldPath: field,
            oldValue: value,
            newValue,
          });
          affectedPageIds.add(page.id);
        }
      }

      // Check content JSONB field
      if (page.content) {
        const contentMatches: {
          path: string;
          oldValue: string;
          newValue: string;
        }[] = [];
        traverseAndReplace(
          page.content,
          body.searchText,
          body.replaceText || "",
          body.caseSensitive,
          "content",
          contentMatches,
        );

        for (const match of contentMatches) {
          allMatches.push({
            pageId: page.id,
            pageTitle: page.title,
            pageUrl: page.url_path,
            fieldPath: match.path,
            oldValue: match.oldValue,
            newValue: match.newValue,
          });
          affectedPageIds.add(page.id);
        }
      }
    }

    // Dry run - return preview
    if (body.dryRun) {
      const confirmToken = Buffer.from(
        JSON.stringify({
          searchText: body.searchText,
          replaceText: body.replaceText,
          caseSensitive: body.caseSensitive,
          statusFilter: body.statusFilter,
          timestamp: Date.now(),
        }),
      ).toString("base64");

      const result: PreviewResult = {
        matches: allMatches,
        totalMatches: allMatches.length,
        affectedPages: affectedPageIds.size,
        confirmToken,
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    // Execute mode - verify confirm token
    if (!body.confirmToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Confirm token required. Run preview first.",
        }),
      };
    }

    // Generate operation ID
    const operationId = crypto.randomUUID();

    // Group matches by page
    const matchesByPage = new Map<string, Match[]>();
    for (const match of allMatches) {
      const existing = matchesByPage.get(match.pageId) || [];
      existing.push(match);
      matchesByPage.set(match.pageId, existing);
    }

    // Process each affected page
    for (const [pageId, pageMatches] of matchesByPage) {
      // Get current page data
      const { data: page, error: pageError } = await supabase
        .from("pages")
        .select("*")
        .eq("id", pageId)
        .single();

      if (pageError || !page) continue;

      // Record audit entries
      for (const match of pageMatches) {
        await supabase.from("search_replace_audit").insert({
          operation_id: operationId,
          table_name: "pages",
          row_id: pageId,
          field_path: match.fieldPath,
          old_value: match.oldValue,
          new_value: match.newValue,
          user_id: user.id,
        });
      }

      // Build update object
      const updates: Record<string, unknown> = {};

      // Update text fields
      for (const field of textFields) {
        const value = page[field];
        if (
          typeof value === "string" &&
          containsSearch(value, body.searchText, body.caseSensitive)
        ) {
          updates[field] = replaceString(
            value,
            body.searchText,
            body.replaceText,
            body.caseSensitive,
          );
        }
      }

      // Update content if needed
      const contentMatches: {
        path: string;
        oldValue: string;
        newValue: string;
      }[] = [];
      const newContent = traverseAndReplace(
        page.content,
        body.searchText,
        body.replaceText,
        body.caseSensitive,
        "content",
        contentMatches,
      );
      if (contentMatches.length > 0) {
        updates.content = newContent;
      }

      // Apply updates
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await supabase.from("pages").update(updates).eq("id", pageId);
      }
    }

    const result: ExecuteResult = {
      operationId,
      totalChanges: allMatches.length,
      affectedPages: affectedPageIds.size,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Search/replace error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Search/replace operation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};

async function handleRollback(
  supabase: ReturnType<typeof createClient>,
  operationId: string,
  userId: string,
  headers: Record<string, string>,
) {
  try {
    // Get audit records for this operation
    const { data: auditRecords, error: auditError } = await supabase
      .from("search_replace_audit")
      .select("*")
      .eq("operation_id", operationId)
      .eq("rolled_back", false)
      .order("created_at", { ascending: false });

    if (auditError) throw auditError;

    if (!auditRecords || auditRecords.length === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: "No records found for this operation or already rolled back",
        }),
      };
    }

    // Group by page
    const recordsByPage = new Map<string, typeof auditRecords>();
    for (const record of auditRecords) {
      const existing = recordsByPage.get(record.row_id) || [];
      existing.push(record);
      recordsByPage.set(record.row_id, existing);
    }

    // Restore each page
    for (const [pageId, records] of recordsByPage) {
      const { data: page, error: pageError } = await supabase
        .from("pages")
        .select("*")
        .eq("id", pageId)
        .single();

      if (pageError || !page) continue;

      const updates: Record<string, unknown> = {};
      let content = page.content;

      for (const record of records) {
        if (record.field_path.startsWith("content")) {
          // Handle content field restoration
          const pathParts = record.field_path.split(/\.|\[|\]/).filter(Boolean);
          pathParts.shift(); // Remove 'content' prefix

          let target = content;
          for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            const numPart = parseInt(part);
            target = isNaN(numPart) ? target[part] : target[numPart];
          }

          const lastPart = pathParts[pathParts.length - 1];
          const numLastPart = parseInt(lastPart);
          if (isNaN(numLastPart)) {
            target[lastPart] = record.old_value;
          } else {
            target[numLastPart] = record.old_value;
          }
        } else {
          // Simple field
          updates[record.field_path] = record.old_value;
        }
      }

      // Check if content was modified
      const hasContentChanges = records.some((r) =>
        r.field_path.startsWith("content"),
      );
      if (hasContentChanges) {
        updates.content = content;
      }

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await supabase.from("pages").update(updates).eq("id", pageId);
      }
    }

    // Mark audit records as rolled back
    await supabase
      .from("search_replace_audit")
      .update({
        rolled_back: true,
        rolled_back_at: new Date().toISOString(),
      })
      .eq("operation_id", operationId);

    const result: RollbackResult = {
      operationId,
      restoredChanges: auditRecords.length,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error("Rollback error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Rollback failed",
        message: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
}
