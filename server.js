import express from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

// ── API Proxies to bypass CORS ──────────────────────────────────────────

// MangaDex API
app.use("/api/mangadex", createProxyMiddleware({
  target: "https://api.mangadex.org",
  changeOrigin: true,
  pathRewrite: { "^/api/mangadex": "" },
}));

// Bato.to GraphQL
app.use("/api/bato", createProxyMiddleware({
  target: "https://bato.to",
  changeOrigin: true,
  pathRewrite: { "^/api/bato": "/apo/" },
}));

// MangaSee Scraper Proxy
app.use("/api/mangasee", createProxyMiddleware({
  target: "https://mangasee123.com",
  changeOrigin: true,
  pathRewrite: { "^/api/mangasee": "" },
}));

// MangaShelf Image Proxy - streams image bytes bypassing browser CORS and adds caching headers
app.get("/api/proxy-image", async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl || typeof imageUrl !== "string") {
    return res.status(400).send("Missing or invalid ?url= parameter");
  }

  try {
    const fetchResponse = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://mangasee123.com/",
      }
    });
    
    if (!fetchResponse.ok) {
      return res.status(fetchResponse.status).send(`Upstream image fetch failed: ${fetchResponse.status}`);
    }

    const contentType = fetchResponse.headers.get("content-type");
    if (contentType) res.setHeader("Content-Type", contentType);

    // aggressive cache headers (1 year)
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const arrayBuffer = await fetchResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.send(buffer);
  } catch (error) {
    console.error("Image proxy error:", error);
    res.status(502).send("Bad Gateway");
  }
});

// ── Serve React App ─────────────────────────────────────────────────────

const distPath = path.join(__dirname, "dist");
// Serve static files from the dist directory
app.use(express.static(distPath));

// Fallback all other requests to index.html for React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

// Start the production server
app.listen(PORT, () => {
  console.log(`✅ Production server running at http://localhost:${PORT}`);
});
