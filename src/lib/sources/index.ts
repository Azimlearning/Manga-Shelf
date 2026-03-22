import type { Source, MangaResult, MangaDetail, Chapter } from "@/lib/types";
import * as mangadex from "./mangadex";
import * as mangaplus from "./mangaplus";
import * as comick from "./comick";

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

// ─── Comick source ─────────────────────────────────────────────────────────
const comickSource: Source = {
  id: "comick",
  name: "Comick",
  language: "en",
  search: (query: string, page: number): Promise<MangaResult[]> =>
    comick.searchManga(query, page),
  getPopular: (): Promise<MangaResult[]> => comick.getPopular(),
  getDetail: (id: string): Promise<MangaDetail> => comick.getMangaDetail(id),
  getChapters: (mangaId: string): Promise<Chapter[]> => comick.getChapterList(mangaId),
  getPages: (chapterId: string): Promise<string[]> => comick.getChapterPages(chapterId),
  healthCheck: () => comick.healthCheck(),
};

// ─── Registry ─────────────────────────────────────────────────────────────
export const allSources: Source[] = [mangadexSource, mangaplusSource, comickSource];

export function getSource(id: string): Source {
  const src = allSources.find((s) => s.id === id);
  if (!src) throw new Error(`Unknown source: ${id}`);
  return src;
}

// Re-exported for backward compat — Browse page now uses allSources + health checks
export const sources = allSources;
export const disabledSources: { id: string; name: string; reason: string }[] = [];

export type { Source, MangaResult, MangaDetail, Chapter };
