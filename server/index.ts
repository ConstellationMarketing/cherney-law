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

  // Enforce trailing slashes: 301-redirect non-trailing-slash URLs
  app.use((req, res, next) => {
    const { path } = req;

    // Reverse-redirect: strip trailing slash from Vite-internal paths
    // (browser may have cached an old 301 that added a trailing slash)
    if (
      (path.startsWith('/@') || path.startsWith('/__')) &&
      path.endsWith('/') &&
      path.length > 2
    ) {
      const stripped = path.slice(0, -1);
      const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      return res.redirect(302, `${stripped}${qs}`);
    }

    // Skip: root, already has trailing slash, API routes, admin, or static files (contain a dot)
    if (
      path === '/' ||
      path.endsWith('/') ||
      path.startsWith('/api/') ||
      path.startsWith('/admin') ||
      path.startsWith('/@') ||
      path.startsWith('/__') ||
      path.includes('.')
    ) {
      return next();
    }

    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    return res.redirect(301, `${path}/${qs}`);
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);
  app.get("/api/google-reviews", handleGoogleReviews);

  return app;
}
