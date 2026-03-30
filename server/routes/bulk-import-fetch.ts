import { RequestHandler } from "express";

/**
 * POST /api/bulk-import-fetch
 * Server-side JSON proxy for CORS-protected API feeds.
 */
export const handleBulkImportFetch: RequestHandler = async (req, res) => {
  try {
    const { url, headers } = req.body as {
      url: string;
      headers?: Record<string, string>;
    };

    if (!url) {
      res.status(400).json({ error: "Missing required field: url" });
      return;
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      res.status(400).json({ error: "Invalid URL" });
      return;
    }

    // Only allow http/https
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      res.status(400).json({ error: "Only HTTP/HTTPS URLs are allowed" });
      return;
    }

    const fetchHeaders: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "BulkImporter/1.0",
      ...(headers ?? {}),
    };

    const response = await fetch(url, {
      method: "GET",
      headers: fetchHeaders,
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      res.status(response.status).json({
        error: `Remote server responded with ${response.status}: ${response.statusText}`,
      });
      return;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const body = await response.text();

    res.set("Content-Type", contentType || "application/json");
    res.send(body);
  } catch (err) {
    console.error("Bulk import fetch error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Failed to fetch URL",
    });
  }
};
