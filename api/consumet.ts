import type { VercelRequest, VercelResponse } from "@vercel/node";
import { MANGA } from "@consumet/extensions";

const providers: Record<string, any> = {
  mangakakalot: new MANGA.MangaKakalot(),
  mangareader: new MANGA.MangaReader(),
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  const { provider, action, query, id, page } = req.query as Record<string, string>;

  if (!provider || !providers[provider]) {
    return res.status(400).json({ error: `Unknown provider: ${provider}. Available: ${Object.keys(providers).join(", ")}` });
  }

  const p = providers[provider];

  try {
    let result: unknown;

    switch (action) {
      case "search":
        result = await p.search(query ?? "", Number(page ?? 1));
        break;
      case "popular":
        result = await p.fetchPopular(Number(page ?? 1));
        break;
      case "info":
        if (!id) return res.status(400).json({ error: "Missing id" });
        result = await p.fetchMangaInfo(id);
        break;
      case "pages":
        if (!id) return res.status(400).json({ error: "Missing id" });
        result = await p.fetchChapterPages(id);
        break;
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    res.setHeader("Cache-Control", "public, max-age=300");
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(502).json({ error: "Provider error", details: err.message });
  }
}
