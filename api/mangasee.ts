import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // Strip "/api/mangasee" prefix to get the upstream path
  const upstream = (req.url || "").replace(/^\/api\/mangasee\/?/, "/");
  const target = `https://mangasee123.com${upstream}`;

  try {
    const response = await fetch(target, {
      method: req.method,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    const contentType = response.headers.get("content-type") || "text/html";
    const data = await response.text();
    res.setHeader("Content-Type", contentType);
    res.status(response.status).send(data);
  } catch (err: any) {
    res.status(502).json({ error: "Upstream request failed", details: err.message });
  }
}
