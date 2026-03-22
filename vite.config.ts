import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import type { IncomingMessage, ServerResponse } from "http";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/mangadex": {
        target: "https://api.mangadex.org",
        changeOrigin: true,
        rewrite: (p: string) => p.replace(/^\/api\/mangadex/, ""),
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Custom plugin to handle /api/proxy-image in dev
    {
      name: "image-proxy",
      configureServer(server: any) {
        server.middlewares.use(
          "/api/proxy-image",
          async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
            const url = new URL(req.url || "/", `http://${req.headers.host}`);
            const imageUrl = url.searchParams.get("url");
            if (!imageUrl) {
              res.statusCode = 400;
              res.end("Missing ?url= parameter");
              return;
            }
            try {
              const upstream = await fetch(imageUrl, {
                headers: {
                  "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                  Referer: new URL(imageUrl).origin + "/",
                },
              });
              if (!upstream.ok) {
                res.statusCode = upstream.status;
                res.end("Upstream fetch failed");
                return;
              }
              const ct = upstream.headers.get("content-type");
              if (ct) res.setHeader("Content-Type", ct);
              res.setHeader("Cache-Control", "public, max-age=86400");
              res.setHeader("Access-Control-Allow-Origin", "*");
              const buf = Buffer.from(await upstream.arrayBuffer());
              res.end(buf);
            } catch {
              res.statusCode = 502;
              res.end("Bad Gateway");
            }
          }
        );
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
