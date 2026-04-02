import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    fs: {
      allow: ["./client", "./shared", "./vendor"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
    // Prevent the browser from caching the dev HTML so that after a server
    // restart the fresh script hashes are always picked up (avoids the
    // stale ?v=xxxx SyntaxError on react-dom_client.js).
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  build: {
    outDir: "dist/spa",
  },
  optimizeDeps: {
    // Explicitly listing core deps ensures the configHash (and therefore
    // browserHash) changes when this list is modified — useful for busting
    // stale browser-cached dep bundles after server restarts.
    include: ["react", "react-dom", "react-dom/client", "react-router-dom"],
  },
  plugins: [react(), expressPlugin()],
  resolve: {
  alias: {
    "@": path.resolve(__dirname, "./vendor/cms-core/client"),
    "@shared": path.resolve(__dirname, "./vendor/cms-core/shared"),
    "@site": path.resolve(__dirname, "./client"),
  },
},
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      // Fix cached-redirect pollution: the Builder preview proxy (or the
      // browser) may have permanently-cached a stale 301 that appended a
      // trailing slash to Vite-internal paths like /@vite/client or
      // /@react-refresh.  Strip that slash via an internal URL rewrite at
      // the raw Connect level — before any other middleware runs — so Vite
      // can open the file without the ENOTDIR error.
      server.middlewares.use((req, _res, next) => {
        if (req.url) {
          const qsIdx = req.url.indexOf("?");
          const pathname = qsIdx >= 0 ? req.url.slice(0, qsIdx) : req.url;
          if (
            (pathname.startsWith("/@") || pathname.startsWith("/__")) &&
            pathname.endsWith("/") &&
            pathname.length > 2
          ) {
            req.url =
              pathname.slice(0, -1) + (qsIdx >= 0 ? req.url.slice(qsIdx) : "");
          }
        }
        next();
      });

      const app = createServer();
      server.middlewares.use(app);
    },
  };
}
