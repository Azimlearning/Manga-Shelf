// All calls go through /api/mangadex proxy (Vercel serverless function)

export interface MangaSearchResult {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  status: string;
  tags: string[];
  author: string;
  contentRating: string;
}

export interface ChapterInfo {
  id: string;
  chapter: string;
  title: string;
  publishAt: string;
  scanlationGroup: string;
  pages: number;
}

function proxyApi(path: string, params: URLSearchParams): string {
  const p = new URLSearchParams(params);
  p.set("path", path);
  return `/api/mangadex?${p}`;
}

function proxyImage(url: string): string {
  if (!url) return "";
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

function extractTitle(attributes: any): string {
  const titles = attributes.title;
  return titles?.en || titles?.ja || titles?.["ja-ro"] || Object.values(titles || {})[0] as string || "Unknown";
}

function extractDescription(attributes: any): string {
  const desc = attributes.description;
  return desc?.en || Object.values(desc || {})[0] as string || "";
}

function extractCoverUrl(manga: any): string {
  const coverRel = manga.relationships?.find((r: any) => r.type === "cover_art");
  if (coverRel?.attributes?.fileName) {
    const raw = `https://uploads.mangadex.org/covers/${manga.id}/${coverRel.attributes.fileName}.256.jpg`;
    return proxyImage(raw);
  }
  return "";
}

function extractAuthor(manga: any): string {
  const authorRel = manga.relationships?.find((r: any) => r.type === "author");
  return authorRel?.attributes?.name || "Unknown";
}

export async function searchManga(query: string, offset = 0, limit = 20): Promise<{ data: MangaSearchResult[]; total: number }> {
  const params = new URLSearchParams({
    title: query,
    limit: String(limit),
    offset: String(offset),
    "order[relevance]": "desc",
  });
  params.append("includes[]", "cover_art");
  params.append("includes[]", "author");
  params.append("contentRating[]", "safe");

  const res = await fetch(proxyApi("manga", params));
  const json = await res.json();

  return {
    data: json.data.map((m: any) => ({
      id: m.id,
      title: extractTitle(m.attributes),
      description: extractDescription(m.attributes),
      coverUrl: extractCoverUrl(m),
      status: m.attributes.status,
      tags: m.attributes.tags?.map((t: any) => t.attributes?.name?.en).filter(Boolean) || [],
      author: extractAuthor(m),
      contentRating: m.attributes.contentRating,
    })),
    total: json.total,
  };
}

export async function getPopularManga(limit = 20): Promise<MangaSearchResult[]> {
  const params = new URLSearchParams({
    limit: String(limit),
    "order[followedCount]": "desc",
  });
  params.append("includes[]", "cover_art");
  params.append("includes[]", "author");
  params.append("contentRating[]", "safe");
  params.append("contentRating[]", "suggestive");

  const res = await fetch(proxyApi("manga", params));
  const json = await res.json();

  return json.data.map((m: any) => ({
    id: m.id,
    title: extractTitle(m.attributes),
    description: extractDescription(m.attributes),
    coverUrl: extractCoverUrl(m),
    status: m.attributes.status,
    tags: m.attributes.tags?.map((t: any) => t.attributes?.name?.en).filter(Boolean) || [],
    author: extractAuthor(m),
    contentRating: m.attributes.contentRating,
  }));
}

export async function getMangaDetail(id: string): Promise<MangaSearchResult> {
  const params = new URLSearchParams();
  params.append("includes[]", "cover_art");
  params.append("includes[]", "author");

  const res = await fetch(proxyApi(`manga/${id}`, params));
  const json = await res.json();
  const m = json.data;

  return {
    id: m.id,
    title: extractTitle(m.attributes),
    description: extractDescription(m.attributes),
    coverUrl: extractCoverUrl(m),
    status: m.attributes.status,
    tags: m.attributes.tags?.map((t: any) => t.attributes?.name?.en).filter(Boolean) || [],
    author: extractAuthor(m),
    contentRating: m.attributes.contentRating,
  };
}

export async function getMangaChapters(mangaId: string, offset = 0, limit = 100): Promise<{ data: ChapterInfo[]; total: number }> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    "order[chapter]": "desc",
  });
  params.append("translatedLanguage[]", "en");
  params.append("includes[]", "scanlation_group");

  const res = await fetch(proxyApi(`manga/${mangaId}/feed`, params));
  const json = await res.json();

  return {
    data: json.data.map((c: any) => ({
      id: c.id,
      chapter: c.attributes.chapter || "?",
      title: c.attributes.title || "",
      publishAt: c.attributes.publishAt,
      scanlationGroup: c.relationships?.find((r: any) => r.type === "scanlation_group")?.attributes?.name || "Unknown",
      pages: c.attributes.pages,
    })),
    total: json.total,
  };
}

export async function getChapterPages(chapterId: string): Promise<string[]> {
  const res = await fetch(proxyApi(`at-home/server/${chapterId}`, new URLSearchParams()));
  const json = await res.json();

  const baseUrl = json.baseUrl;
  const hash = json.chapter.hash;
  const pages = json.chapter.data as string[];

  return pages.map((p) => proxyImage(`${baseUrl}/data/${hash}/${p}`));
}
