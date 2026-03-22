import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Strip "/api/mangadex" prefix to get the upstream path
  const upstream = (req.url || "").replace(/^\/api\/mangadex\/?/, "/");
  const target = `https://api.mangadex.org${upstream}`;

  try {
    const response = await fetch(target, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.text();
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/json");
    res.status(response.status).send(data);
  } catch (err: any) {
    res.status(502).json({ error: "Upstream request failed", details: err.message });
  }
}
