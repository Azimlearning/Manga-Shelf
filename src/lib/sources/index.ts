import type { Source, MangaResult, MangaDetail, Chapter } from "@/lib/types";
import * as mangadex from "./mangadex";
import * as mangasee from "./mangasee";

// ─── MangaDex source ──────────────────────────────────────────────────────
const mangadexSource: Source = {
  id: "mangadex",
  name: "MangaDex",
  language: "en",
  search: (query: string, page: number): Promise<MangaResult[]> =>
    mangadex.searchManga(query, page),
  getPopular: (): Promise<MangaResult[]> => mangadex.getPopular(),
  getDetail: (id: string): Promise<MangaDetail> => mangadex.getMangaDetail(id),
  getChapters: (mangaId: string): Promise<Chapter[]> => mangadex.getChapterList(mangaId),
  getPages: (chapterId: string): Promise<string[]> => mangadex.getChapterPages(chapterId),
};

// ─── MangaSee source (limited — blocked by most cloud hosts) ──────────────
const mangaseeSource: Source = {
  id: "mangasee",
  name: "MangaSee",
  language: "en",
  search: (query: string, page: number): Promise<MangaResult[]> =>
    mangasee.searchManga(query, page),
  getPopular: (): Promise<MangaResult[]> => mangasee.getPopular(),
  getDetail: (id: string): Promise<MangaDetail> => mangasee.getMangaDetail(id),
  getChapters: (mangaId: string): Promise<Chapter[]> => mangasee.getChapterList(mangaId),
  getPages: (chapterId: string): Promise<string[]> => mangasee.getChapterPages(chapterId),
};

// ─── Disabled / coming-soon sources (metadata only) ───────────────────────
export interface DisabledSource {
  id: string;
  name: string;
  reason: string;
}

export const disabledSources: DisabledSource[] = [
  { id: "mangaplus", name: "MangaPlus", reason: "Coming soon" },
  { id: "mangasee", name: "MangaSee (Limited)", reason: "Blocked by host — requires Cloudflare proxy" },
];

// ─── Registry ─────────────────────────────────────────────────────────────
export const sources: Source[] = [mangadexSource];

export function getSource(id: string): Source {
  const src = sources.find((s) => s.id === id);
  if (!src) throw new Error(`Unknown source: ${id}`);
  return src;
}

export type { Source, MangaResult, MangaDetail, Chapter };
