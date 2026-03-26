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

    // Internal rewrite: strip trailing slash from Vite-internal paths
    // Use a rewrite (not a redirect) so the browser's cached 301 doesn't
    // cause an infinite redirect loop.
    if (
      (path.startsWith('/@') || path.startsWith('/__')) &&
      path.endsWith('/') &&
      path.length > 2
    ) {
      req.url = req.url.replace(/\/(\?|$)/, '$1');
      return next();
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
