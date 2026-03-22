import type { MangaResult, Chapter, MangaDetail } from "@/lib/types";

// All calls proxied through Vite dev-server → /api/mangadex → https://api.mangadex.org
const API = "/api/mangadex";
const SOURCE_ID = "mangadex";

/** Proxy any upstream image URL through our local image proxy */
function proxyImg(url: string): string {
  if (!url) return "";
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function extractTitle(attrs: any): string {
  const t = attrs?.title ?? {};
  return t.en ?? t.ja ?? t["ja-ro"] ?? (Object.values(t)[0] as string) ?? "Unknown";
}

function extractDescription(attrs: any): string {
  const d = attrs?.description ?? {};
  return d.en ?? (Object.values(d)[0] as string) ?? "";
}

function extractCoverUrl(manga: any): string {
  const rel = manga.relationships?.find((r: any) => r.type === "cover_art");
  if (rel?.attributes?.fileName) {
    const raw = `https://uploads.mangadex.org/covers/${manga.id}/${rel.attributes.fileName}.256.jpg`;
    return proxyImg(raw);
  }
  return "";
}

function extractAuthor(manga: any): string {
  const rel = manga.relationships?.find((r: any) => r.type === "author");
  return rel?.attributes?.name ?? "Unknown";
}

function mapManga(m: any): MangaResult {
  return {
    id: m.id,
    sourceId: SOURCE_ID,
    title: extractTitle(m.attributes),
    coverUrl: extractCoverUrl(m),
    status: m.attributes?.status ?? "unknown",
    tags: m.attributes?.tags?.map((t: any) => t.attributes?.name?.en).filter(Boolean) ?? [],
    description: extractDescription(m.attributes),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────

export async function searchManga(query: string, page = 0): Promise<MangaResult[]> {
  const params = new URLSearchParams({
    title: query,
    limit: "20",
    offset: String(page * 20),
    "order[relevance]": "desc",
  });
  params.append("includes[]", "cover_art");
  params.append("contentRating[]", "safe");
  params.append("contentRating[]", "suggestive");
  params.append("availableTranslatedLanguage[]", "en");

  const res = await fetch(`${API}/manga?${params}`);
  const json = await res.json();
  return (json.data ?? []).map(mapManga);
}

export async function getPopular(): Promise<MangaResult[]> {
  const params = new URLSearchParams({
    limit: "20",
    "order[followedCount]": "desc",
  });
  params.append("includes[]", "cover_art");
  params.append("contentRating[]", "safe");
  params.append("contentRating[]", "suggestive");
  // Use availableTranslatedLanguage[] for the /manga list endpoint (not translatedLanguage[])
  params.append("availableTranslatedLanguage[]", "en");

  const res = await fetch(`${API}/manga?${params}`);
  const json = await res.json();
  return (json.data ?? []).map(mapManga);
}

export async function getMangaDetail(id: string): Promise<MangaDetail> {
  const params = new URLSearchParams();
  params.append("includes[]", "cover_art");
  params.append("includes[]", "author");

  const res = await fetch(`${API}/manga/${id}?${params}`);
  const json = await res.json();
  const m = json.data;

  const chapters = await getChapterList(id);

  return {
    ...mapManga(m),
    authors: [extractAuthor(m)],
    chapters,
  };
}

export async function getChapterList(mangaId: string): Promise<Chapter[]> {
  const params = new URLSearchParams({
    limit: "500",
    "order[chapter]": "desc",
  });
  params.append("translatedLanguage[]", "en");
  params.append("includes[]", "scanlation_group");

  const res = await fetch(`${API}/manga/${mangaId}/feed?${params}`);
  const json = await res.json();

  return (json.data ?? []).map((c: any) => ({
    id: c.id,
    mangaId,
    number: c.attributes?.chapter ?? "?",
    title: c.attributes?.title ?? "",
    date: c.attributes?.publishAt ?? "",
    groupName:
      c.relationships?.find((r: any) => r.type === "scanlation_group")?.attributes?.name ??
      "Unknown",
    isRead: false,
    isDownloaded: false,
  }));
}

export async function getChapterPages(chapterId: string): Promise<string[]> {
  const res = await fetch(`${API}/at-home/server/${chapterId}`);
  const json = await res.json();

  const baseUrl: string = json.baseUrl;
  const hash: string = json.chapter.hash;
  const pages: string[] = json.chapter.data;

  return pages.map((p) => proxyImg(`${baseUrl}/data/${hash}/${p}`));
}
