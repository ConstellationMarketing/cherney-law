import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { extname } from "path";

function getServiceClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

interface ImageMapping {
  originalUrl: string;
  newUrl: string;
}

interface BulkImportImagesBody {
  imageUrls: string[];
}

const WORDPRESS_RESIZED_IMAGE_MARKER_PATTERN = /-(300x200|300x196)(?=(?:\.[^/?#]+)+$)/;

export function normalizeThirdPartyImageDownloadUrl(originalUrl: string): string {
  try {
    const url = new URL(originalUrl);
    const normalizedPathname = url.pathname.replace(WORDPRESS_RESIZED_IMAGE_MARKER_PATTERN, "");

    if (normalizedPathname === url.pathname) {
      return originalUrl;
    }

    url.pathname = normalizedPathname;
    return url.toString();
  } catch {
    return originalUrl;
  }
}

/**
 * POST /api/bulk-import-images
 * Downloads external image URLs server-side (bypasses CORS), uploads them to
 * Supabase Storage under uploads/imported/, inserts rows in the media table,
 * and returns the mapping of original → new public URLs.
 */
export const handleBulkImportImages: RequestHandler = async (req, res) => {
  const { imageUrls } = req.body as BulkImportImagesBody;

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    res.status(400).json({ error: "imageUrls must be a non-empty array" });
    return;
  }

  // Limit to 50 images per request
  const urls = imageUrls.slice(0, 50);

  let supabase: ReturnType<typeof getServiceClient>;
  try {
    supabase = getServiceClient();
  } catch (err) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  const mappings: ImageMapping[] = [];

  for (const originalUrl of urls) {
    try {
      const downloadUrl = normalizeThirdPartyImageDownloadUrl(originalUrl);

      // Fetch the image
      const response = await fetch(downloadUrl, {
        signal: AbortSignal.timeout(15_000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; BulkImporter/1.0)" },
      });

      if (!response.ok) {
        console.warn(`bulk-import-images: failed to fetch ${originalUrl} (${response.status})`);
        // Keep original URL if fetch fails
        mappings.push({ originalUrl, newUrl: originalUrl });
        continue;
      }

      const contentType = response.headers.get("content-type") ?? "image/jpeg";
      const mimeType = contentType.split(";")[0].trim();

      // Determine file extension from URL or content-type
      const urlExt = extname(new URL(downloadUrl).pathname).toLowerCase() || ".jpg";
      const mimeExtMap: Record<string, string> = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "image/svg+xml": ".svg",
        "image/avif": ".avif",
      };
      const ext = mimeExtMap[mimeType] ?? urlExt;

      const timestamp = Date.now();
      const uid = randomUUID().split("-")[0];
      const fileName = `imported-${timestamp}-${uid}${ext}`;
      const storagePath = `uploads/imported/${fileName}`;

      const buffer = Buffer.from(await response.arrayBuffer());

      // Upload to Supabase Storage (bucket: media)
      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(storagePath, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        console.warn(`bulk-import-images: upload failed for ${originalUrl}:`, uploadError.message);
        mappings.push({ originalUrl, newUrl: originalUrl });
        continue;
      }

      // Get the public URL
      const { data: publicData } = supabase.storage.from("media").getPublicUrl(storagePath);
      const newUrl = publicData.publicUrl;

      // Insert row into media table
      await supabase.from("media").insert({
        file_name: fileName,
        file_path: storagePath,
        public_url: newUrl,
        file_size: buffer.length,
        mime_type: mimeType,
        uploaded_by: null,
      });

      mappings.push({ originalUrl, newUrl });
    } catch (err) {
      console.warn(`bulk-import-images: error processing ${originalUrl}:`, err);
      // Non-fatal — keep original URL
      mappings.push({ originalUrl, newUrl: originalUrl });
    }
  }

  res.json({ mappings });
};
