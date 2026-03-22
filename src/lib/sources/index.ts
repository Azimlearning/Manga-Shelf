import type { Source, MangaResult, MangaDetail, Chapter } from "@/lib/types";
import * as mangadex from "./mangadex";
import * as mangaplus from "./mangaplus";

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
  healthCheck: async () => {
    try {
      const res = await fetch("/api/mangadex?path=manga&limit=1");
      return res.ok;
    } catch {
      return false;
    }
  },
};

// ─── MangaPlus source ─────────────────────────────────────────────────────
const mangaplusSource: Source = {
  id: "mangaplus",
  name: "MangaPlus",
  language: "en",
  search: (query: string, page: number): Promise<MangaResult[]> =>
    mangaplus.searchManga(query, page),
  getPopular: (): Promise<MangaResult[]> => mangaplus.getPopular(),
  getDetail: (id: string): Promise<MangaDetail> => mangaplus.getMangaDetail(id),
  getChapters: (mangaId: string): Promise<Chapter[]> => mangaplus.getChapterList(mangaId),
  getPages: (chapterId: string): Promise<string[]> => mangaplus.getChapterPages(chapterId),
  healthCheck: () => mangaplus.healthCheck(),
};

// ─── Registry ─────────────────────────────────────────────────────────────
export const allSources: Source[] = [mangadexSource, mangaplusSource];

export function getSource(id: string): Source {
  const src = allSources.find((s) => s.id === id);
  if (!src) throw new Error(`Unknown source: ${id}`);
  return src;
}

// Re-exported for backward compat — Browse page now uses allSources + health checks
export const sources = allSources;
export const disabledSources: { id: string; name: string; reason: string }[] = [];

export type { Source, MangaResult, MangaDetail, Chapter };
