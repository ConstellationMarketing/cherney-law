import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleGoogleReviews } from "./routes/google-reviews";
import { handleBulkImport } from "./routes/bulk-import";
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

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/google-reviews", handleGoogleReviews);
  app.post("/api/bulk-import", handleBulkImport);
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
  app.patch("/api/admin/pages/:id", handlePatchAdminPage);

  // AI assist routes for bulk importer
  app.get("/api/ai-status", handleAiStatus);
  app.post("/api/ai-generate-meta", handleAiGenerateMeta);
  app.post("/api/ai-score-content", handleAiScoreContent);
  app.post("/api/ai-suggest-mapping", handleAiSuggestMapping);
  app.post("/api/ai-suggest-rewrite", handleAiSuggestRewrite);

  return app;
}
