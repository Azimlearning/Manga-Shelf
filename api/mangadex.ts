import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const { path, ...rest } = req.query;
  const apiPath = Array.isArray(path) ? path.join("/") : (path || "");

  // Build query string from remaining params
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(rest)) {
    if (Array.isArray(val)) {
      val.forEach((v) => params.append(key, v));
    } else if (val) {
      params.append(key, val);
    }
  }

  const qs = params.toString();
  const url = `https://api.mangadex.org/${apiPath}${qs ? "?" + qs : ""}`;

  try {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.text();
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/json");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(response.status).send(data);
  } catch (err: any) {
    res.status(502).json({ error: "Upstream request failed", details: err.message });
  }
}
