import type { MangaResult, MangaDetail, Chapter } from "@/lib/types";

const SOURCE_ID = "mangakakalot";
const BASE = "/api/consumet?provider=mangakakalot";

function proxyImage(url: string | undefined): string {
  if (!url) return "";
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

function mapResult(m: any): MangaResult {
  return {
    id: m.id,
    sourceId: SOURCE_ID,
    title: m.title ?? "Unknown",
    coverUrl: m.image ? proxyImage(m.image) : "",
    status: (m.status ?? "").toLowerCase().includes("completed") ? "completed" : "ongoing",
    tags: (m.genres ?? []).map((g: any) => (typeof g === "string" ? g : g.title ?? "")),
    description: m.description ?? "",
  };
}

export async function searchManga(query: string, page = 1): Promise<MangaResult[]> {
  const res = await fetch(`${BASE}&action=search&query=${encodeURIComponent(query)}&page=${page}`);
  const json = await res.json();
  return (json?.results ?? []).map(mapResult);
}

export async function getPopular(): Promise<MangaResult[]> {
  const res = await fetch(`${BASE}&action=popular&page=1`);
  const json = await res.json();
  return (json?.results ?? []).map(mapResult);
}

export async function getMangaDetail(id: string): Promise<MangaDetail> {
  const res = await fetch(`${BASE}&action=info&id=${encodeURIComponent(id)}`);
  const json = await res.json();

  return {
    id: json.id ?? id,
    sourceId: SOURCE_ID,
    title: json.title ?? "Unknown",
    coverUrl: json.image ? proxyImage(json.image) : "",
    status: (json.status ?? "").toLowerCase().includes("completed") ? "completed" : "ongoing",
    tags: (json.genres ?? []).map((g: any) => (typeof g === "string" ? g : g.title ?? "")),
    description: json.description ?? "",
    authors: json.authors ?? [],
    chapters: (json.chapters ?? []).map((ch: any) => mapChapter(ch, json.id ?? id)),
  };
}

export async function getChapterList(mangaId: string): Promise<Chapter[]> {
  const detail = await getMangaDetail(mangaId);
  return detail.chapters;
}

export async function getChapterPages(chapterId: string): Promise<string[]> {
  const res = await fetch(`${BASE}&action=pages&id=${encodeURIComponent(chapterId)}`);
  const json = await res.json();
  return (Array.isArray(json) ? json : []).map((p: any) => proxyImage(p.img ?? p.url ?? p));
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}&action=popular&page=1`);
    return res.ok;
  } catch {
    return false;
  }
}

function mapChapter(ch: any, mangaId: string): Chapter {
  return {
    id: ch.id,
    mangaId,
    number: ch.chapterNumber ?? ch.title?.replace(/[^0-9.]/g, "") ?? "?",
    title: ch.title ?? "",
    date: ch.releaseDate ?? ch.releasedDate ?? "",
    groupName: "Mangakakalot",
    isRead: false,
    isDownloaded: false,
  };
}
