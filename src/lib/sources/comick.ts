import type { MangaResult, MangaDetail, Chapter } from "@/lib/types";

const COMICK_API = "https://api.comick.app";
const SOURCE_ID = "comick";

function proxyImage(url: string | undefined): string {
  if (!url) return "";
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

export async function searchManga(query: string, page = 1): Promise<MangaResult[]> {
  const res = await fetch(`${COMICK_API}/v1.0/search?q=${encodeURIComponent(query)}&page=${page}`);
  const data = await res.json();

  return data.map((m: any) => ({
    id: m.slug,
    sourceId: SOURCE_ID,
    title: m.title || "Unknown",
    coverUrl: m.cover_url ? proxyImage(m.cover_url) : "",
    status: m.status === 1 ? "ongoing" : m.status === 2 ? "completed" : "unknown",
    tags: m.md_genres?.map((g: any) => g.name).filter(Boolean) || [],
    description: m.desc || "",
  }));
}

export async function getPopular(): Promise<MangaResult[]> {
  const res = await fetch(`${COMICK_API}/v1.0/search?sort=follow&page=1`);
  const data = await res.json();

  return data.map((m: any) => ({
    id: m.slug,
    sourceId: SOURCE_ID,
    title: m.title || "Unknown",
    coverUrl: m.cover_url ? proxyImage(m.cover_url) : "",
    status: m.status === 1 ? "ongoing" : m.status === 2 ? "completed" : "unknown",
    tags: m.md_genres?.map((g: any) => g.name).filter(Boolean) || [],
    description: m.desc || "",
  }));
}

export async function getMangaDetail(id: string): Promise<MangaDetail> {
  const res = await fetch(`${COMICK_API}/comic/${id}`);
  const json = await res.json();
  const m = json.comic;

  return {
    id: m.slug,
    sourceId: SOURCE_ID,
    title: m.title || "Unknown",
    coverUrl: m.cover_url ? proxyImage(m.cover_url) : "",
    status: m.status === 1 ? "ongoing" : m.status === 2 ? "completed" : "unknown",
    tags: m.md_titles?.map((t: any) => t.title).filter(Boolean) || [],
    description: m.desc || "",
    authors: json.authors?.map((a: any) => a.name) || [],
    chapters: [], // populated later by getChapterList
    hid: m.hid, // save hid for chapter fetch
  } as MangaDetail & { hid: string };
}

export async function getChapterList(mangaId: string): Promise<Chapter[]> {
  const detail = await getMangaDetail(mangaId);
  const hid = (detail as any).hid;
  
  const res = await fetch(`${COMICK_API}/comic/${hid}/chapters?limit=200&page=1&lang=en`);
  const json = await res.json();

  return json.chapters.map((ch: any) => ({
    id: ch.hid,
    mangaId: mangaId,
    number: ch.chap || "?",
    title: ch.title || "",
    date: ch.created_at || "",
    groupName: ch.group_name?.[0] || "Unknown",
    isRead: false,
    isDownloaded: false,
  }));
}

export async function getChapterPages(chapterId: string): Promise<string[]> {
  const res = await fetch(`${COMICK_API}/chapter/${chapterId}`);
  const json = await res.json();

  return json.chapter.md_images.map((img: any) => 
    proxyImage(`https://meo.comick.pictures/${img.b2key}`)
  );
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${COMICK_API}/v1.0/search?limit=1`);
    return res.ok;
  } catch {
    return false;
  }
}
