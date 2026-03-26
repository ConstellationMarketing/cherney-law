import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleGoogleReviews } from "./routes/google-reviews";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Fix cached-redirect pollution: the browser may have a permanently-cached
  // 301 that adds a trailing slash to Vite-internal paths (/@vite/client,
  // /@react-refresh, /__vite_hmr, etc.).  Strip the trailing slash via an
  // internal URL rewrite so Vite can serve those files correctly.
  // This does NOT redirect public pages – that is handled by Netlify in prod.
  app.use((req, res, next) => {
    const { path } = req;
    if (
      (path.startsWith("/@") || path.startsWith("/__")) &&
      path.endsWith("/") &&
      path.length > 2
    ) {
      // Rewrite in-place – no redirect sent to the browser, so the cached 301
      // stays harmless and the module loads correctly.
      req.url = req.url.slice(0, -1); // strip the trailing slash
    }
    return next();
  });

  // API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/google-reviews", handleGoogleReviews);

  return app;
}
