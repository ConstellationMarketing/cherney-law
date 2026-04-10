import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleGoogleReviews } from "./routes/google-reviews";
import { handleBulkImport, handleGetExistingPostSlugs } from "./routes/bulk-import";
import { handleBulkImportFetch } from "./routes/bulk-import-fetch";
import { handleBulkImportImages } from "./routes/bulk-import-images";
import { handleAiSplitAreaContent } from "./routes/ai-split-area-content";
import { handleAiSplitAreaBatch } from "./routes/ai-split-area-batch";
import {
  handleAiStatus,
  handleAiGenerateMeta,
  handleAiScoreContent,
  handleAiSuggestMapping,
  handleAiSuggestRewrite,
} from "./routes/ai-assist";
import {
  handleGetAdminPages,
  handleDeleteAdminPage,
  handleDuplicateAdminPage,
  handlePatchAdminPage,
  handleBulkPatchAdminPages,
  handleBulkDeleteAdminPages,
} from "./routes/admin-pages";
import {
  handleGetImportSession,
  handleListImportSessions,
  handleSaveImportSession,
  handleUpdateImportSessionStatus,
} from "./routes/import-sessions";
import {
  handleSitemapIndex,
  handlePagesSitemap,
  handlePostsSitemap,
} from "./routes/sitemap";

const DEFAULT_BODY_LIMIT = '10mb';
const IMPORTER_BODY_LIMIT = '150mb';
const IMPORTER_ROUTE_PATTERNS = [
  /^\/api\/import-sessions(?:\/[^/]+\/status)?$/,
  /^\/api\/bulk-import(?:\/post-slugs)?$/,
  /^\/api\/ai-split-area-batch$/,
];

function isImporterPayloadRoute(path: string) {
  return IMPORTER_ROUTE_PATTERNS.some((pattern) => pattern.test(path));
}

function getContentLengthBytes(contentLength: string | string[] | undefined) {
  const value = Array.isArray(contentLength) ? contentLength[0] : contentLength;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());

  // Express 5 + Vite Connect integration: DELETE request bodies are consumed by
  // express.json() but the parsed result is always {} (empty). Pre-read DELETE
  // bodies manually BEFORE express.json() runs, then mark req._body = true so
  // express.json() skips re-parsing and leaves req.body intact.
  app.use((req, _res, next) => {
    if (
      req.method !== 'DELETE' ||
      !req.headers['content-type']?.includes('application/json')
    ) {
      return next();
    }
    let raw = '';
    req.on('data', (chunk: Buffer) => { raw += chunk.toString('utf8'); });
    req.on('end', () => {
      if (raw) {
        try {
          req.body = JSON.parse(raw);
          (req as unknown as Record<string, unknown>)._body = true;
        } catch { /* leave body as-is, express.json() will handle the error */ }
      }
      next();
    });
    req.on('error', next);
  });

  const defaultJsonParser = express.json({ limit: DEFAULT_BODY_LIMIT });
  const importerJsonParser = express.json({ limit: IMPORTER_BODY_LIMIT });
  const defaultUrlencodedParser = express.urlencoded({ extended: true, limit: DEFAULT_BODY_LIMIT });
  const importerUrlencodedParser = express.urlencoded({ extended: true, limit: IMPORTER_BODY_LIMIT });

  app.use((req, res, next) => {
    const parser = isImporterPayloadRoute(req.path) ? importerJsonParser : defaultJsonParser;
    parser(req, res, next);
  });

  app.use((req, res, next) => {
    const parser = isImporterPayloadRoute(req.path) ? importerUrlencodedParser : defaultUrlencodedParser;
    parser(req, res, next);
  });

  app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const bodyParserError = err as { type?: string; message?: string } | undefined;
    if (bodyParserError?.type !== 'entity.too.large') {
      next(err);
      return;
    }

    const routeLimit = isImporterPayloadRoute(req.path) ? IMPORTER_BODY_LIMIT : DEFAULT_BODY_LIMIT;
    const payloadBytes = getContentLengthBytes(req.headers['content-length']);

    console.warn('[api] request payload exceeded configured limit', {
      path: req.path,
      method: req.method,
      routeLimit,
      payloadBytes,
    });

    res.status(413).json({
      error: isImporterPayloadRoute(req.path)
        ? `Importer payload exceeded the ${routeLimit} request limit. The importer will keep working, but the autosave or import payload must be smaller.`
        : `Request payload exceeded the ${routeLimit} request limit.`,
    });
  });

  // API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/sitemap.xml", handleSitemapIndex);
  app.get("/sitemap-pages.xml", handlePagesSitemap);
  app.get("/sitemap-posts.xml", handlePostsSitemap);

  app.get("/api/demo", handleDemo);
  app.get("/api/google-reviews", handleGoogleReviews);
  app.post("/api/bulk-import", handleBulkImport);
  app.post("/api/bulk-import/post-slugs", handleGetExistingPostSlugs);
  app.get("/api/import-sessions", handleListImportSessions);
  app.get("/api/import-sessions/:id", handleGetImportSession);
  app.post("/api/import-sessions", handleSaveImportSession);
  app.patch("/api/import-sessions/:id/status", handleUpdateImportSessionStatus);
  app.post("/api/bulk-import-fetch", handleBulkImportFetch);
  app.post("/api/bulk-import-images", handleBulkImportImages);
  app.post("/api/ai-split-area-content", handleAiSplitAreaContent);
  app.post("/api/ai-split-area-batch", handleAiSplitAreaBatch);

  // Admin pages routes (service-role — returns ALL pages including drafts)
  app.get("/api/admin/pages", handleGetAdminPages);
  app.delete("/api/admin/pages/bulk", handleBulkDeleteAdminPages);
  app.post("/api/admin/pages/bulk-delete", handleBulkDeleteAdminPages);
  app.patch("/api/admin/pages/bulk", handleBulkPatchAdminPages);
  app.delete("/api/admin/pages/:id", handleDeleteAdminPage);
  app.post("/api/admin/pages/:id/duplicate", handleDuplicateAdminPage);
  app.patch("/api/admin/pages/:id", handlePatchAdminPage);

  // AI assist routes for bulk importer
  app.get("/api/ai-status", handleAiStatus);
  app.post("/api/ai-generate-meta", handleAiGenerateMeta);
  app.post("/api/ai-score-content", handleAiScoreContent);
  app.post("/api/ai-suggest-mapping", handleAiSuggestMapping);
  app.post("/api/ai-suggest-rewrite", handleAiSuggestRewrite);

  return app;
}
