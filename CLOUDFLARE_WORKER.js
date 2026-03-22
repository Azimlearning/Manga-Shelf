// Cloudflare Worker proxy for MangaDex API and image proxying.
// Deploy at workers.cloudflare.com (free tier).
//
// Usage:
//   API:   https://your-worker.workers.dev/proxy/manga?limit=20
//   Image: https://your-worker.workers.dev/image?url=<encoded-url>
//
// Then update src/lib/sources/mangadex.ts to point at your worker URL
// instead of /api/mangadex and /api/proxy-image.

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    // Image proxy: /image?url=<encoded>
    if (url.pathname.startsWith("/image")) {
      const targetUrl = url.searchParams.get("url");
      if (!targetUrl) return new Response("Missing url param", { status: 400, headers: cors });

      const imgRes = await fetch(decodeURIComponent(targetUrl), {
        headers: { "User-Agent": "MangaShelf-PWA/1.0" },
      });
      const newRes = new Response(imgRes.body, imgRes);
      Object.entries(cors).forEach(([k, v]) => newRes.headers.set(k, v));
      newRes.headers.set("Cache-Control", "public, max-age=86400");
      return newRes;
    }

    // API proxy: /proxy/{path}?params
    const apiPath = url.pathname.replace(/^\/proxy\/?/, "");
    const target = `https://api.mangadex.org/${apiPath}${url.search}`;

    const response = await fetch(target, {
      method: request.method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "MangaShelf-PWA/1.0",
      },
      body: request.method !== "GET" ? request.body : undefined,
    });

    const newResponse = new Response(response.body, response);
    Object.entries(cors).forEach(([k, v]) => newResponse.headers.set(k, v));
    newResponse.headers.set("Cache-Control", "public, max-age=300");
    return newResponse;
  },
};
