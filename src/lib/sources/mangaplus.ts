import type { MangaResult, MangaDetail, Chapter } from "@/lib/types";

const MANGAPLUS_API = "https://jumpg-webapi.tokyo-cdn.com/api";
const SOURCE_ID = "mangaplus";

let cachedTitles: any[] | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────

function coverUrl(titleId: number | string): string {
  return `https://cdn.mangaplus.shueisha.co.jp/thumbnail/${titleId}/cover_main.jpg`;
}

async function fetchAllTitles(): Promise<any[]> {
  if (cachedTitles) return cachedTitles;

  const res = await fetch(`${MANGAPLUS_API}/title_list/allV2`);
  if (!res.ok) throw new Error(`MangaPlus allV2 failed: ${res.status}`);
  const json = await res.json();

  // The response structure has allTitlesViewV2.AllTitlesGroup[] → each has titles[]
  const groups = json?.success?.allTitlesViewV2?.AllTitlesGroup ?? json?.success?.allTitlesViewV2?.allTitlesGroup ?? [];
  const titles: any[] = [];
  for (const group of groups) {
    const list = group.titles ?? group.Titles ?? [];
    titles.push(...list);
  }

  cachedTitles = titles;
  return titles;
}

function mapTitle(t: any): MangaResult {
  const id = String(t.titleId ?? t.title_id ?? t.id ?? "");
  const title = t.name ?? t.titleName ?? t.title ?? "Unknown";
  return {
    id,
    sourceId: SOURCE_ID,
    title,
    coverUrl: coverUrl(id),
    status: t.status ?? "unknown",
    tags: [],
    description: t.author ?? "",
  };
}

// ─── Health check ─────────────────────────────────────────────────────────

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${MANGAPLUS_API}/title_list/allV2`, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────

export async function searchManga(query: string, _page = 0): Promise<MangaResult[]> {
  const titles = await fetchAllTitles();
  const lower = query.toLowerCase();
  return titles
    .filter((t) => {
      const name = (t.name ?? t.titleName ?? t.title ?? "").toLowerCase();
      return name.includes(lower);
    })
    .slice(0, 30)
    .map(mapTitle);
}

export async function getPopular(): Promise<MangaResult[]> {
  const titles = await fetchAllTitles();
  // Return first 20 titles as "popular" — allV2 is roughly sorted by popularity
  return titles.slice(0, 20).map(mapTitle);
}

export async function getMangaDetail(id: string): Promise<MangaDetail> {
  const res = await fetch(`${MANGAPLUS_API}/title_detail?title_id=${id}`);
  const json = await res.json();

  const detail = json?.success?.titleDetailView ?? {};
  const title = detail.title ?? {};
  const chapterListGroup = detail.chapterListGroup ?? [];

  const chapters: Chapter[] = [];
  for (const group of chapterListGroup) {
    const firstChapterList = group.firstChapterList ?? [];
    const lastChapterList = group.lastChapterList ?? [];
    for (const ch of [...firstChapterList, ...lastChapterList]) {
      chapters.push({
        id: String(ch.chapterId ?? ch.chapter_id ?? ""),
        mangaId: id,
        number: String(ch.name ?? ch.chapterNumber ?? ""),
        title: ch.subTitle ?? ch.sub_title ?? `Chapter ${ch.name ?? ""}`,
        date: ch.startTimeStamp ? new Date(ch.startTimeStamp * 1000).toISOString() : "",
        groupName: "MangaPlus",
        isRead: false,
        isDownloaded: false,
      });
    }
  }

  return {
    id,
    sourceId: SOURCE_ID,
    title: title.name ?? title.titleName ?? "Unknown",
    coverUrl: coverUrl(id),
    status: title.status ?? "unknown",
    tags: [],
    description: title.author ?? "",
    authors: [title.author ?? ""].filter(Boolean),
    chapters,
  };
}

export async function getChapterList(mangaId: string): Promise<Chapter[]> {
  const detail = await getMangaDetail(mangaId);
  return detail.chapters;
}

export async function getChapterPages(chapterId: string): Promise<string[]> {
  const res = await fetch(
    `${MANGAPLUS_API}/manga_viewer?chapter_id=${chapterId}&split=false&img_quality=super_high`
  );
  const json = await res.json();

  const pages = json?.success?.mangaViewer?.pages ?? [];
  return pages
    .filter((p: any) => p.mangaPage?.imageUrl)
    .map((p: any) => p.mangaPage.imageUrl);
}
