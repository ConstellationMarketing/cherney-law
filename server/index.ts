import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleGoogleReviews } from "./routes/google-reviews";
import { handleBulkImport } from "./routes/bulk-import";
import { handleBulkImportFetch } from "./routes/bulk-import-fetch";
import { handleBulkImportImages } from "./routes/bulk-import-images";
import { handleAiSplitAreaContent } from "./routes/ai-split-area-content";
import {
  handleAiStatus,
  handleAiGenerateMeta,
  handleAiScoreContent,
  handleAiSuggestMapping,
  handleAiSuggestRewrite,
} from "./routes/ai-assist";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
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
  app.post("/api/bulk-import-fetch", handleBulkImportFetch);
  app.post("/api/bulk-import-images", handleBulkImportImages);
  app.post("/api/ai-split-area-content", handleAiSplitAreaContent);

  // AI assist routes for bulk importer
  app.get("/api/ai-status", handleAiStatus);
  app.post("/api/ai-generate-meta", handleAiGenerateMeta);
  app.post("/api/ai-score-content", handleAiScoreContent);
  app.post("/api/ai-suggest-mapping", handleAiSuggestMapping);
  app.post("/api/ai-suggest-rewrite", handleAiSuggestRewrite);

  return app;
}
