import type { Source, MangaResult, MangaDetail, Chapter } from "@/lib/types";
import * as mangadex from "./mangadex";
import * as mangaplus from "./mangaplus";
import * as comick from "./comick";
import * as batoto from "./batoto";
import * as mangakakalot from "./mangakakalot";
import * as mangareader from "./mangareader";

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

// ─── Comick source ────────────────────────────────────────────────────────
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

// ─── Bato.to source ───────────────────────────────────────────────────────
const batotoSource: Source = {
  id: "batoto",
  name: "Bato.to",
  language: "en",
  search: (query: string, page: number): Promise<MangaResult[]> =>
    batoto.searchManga(query, page),
  getPopular: (): Promise<MangaResult[]> => batoto.getPopular(),
  getDetail: (id: string): Promise<MangaDetail> => batoto.getMangaDetail(id),
  getChapters: (mangaId: string): Promise<Chapter[]> => batoto.getChapterList(mangaId),
  getPages: (chapterId: string): Promise<string[]> => batoto.getChapterPages(chapterId),
  healthCheck: () => batoto.healthCheck(),
};

// ─── Mangakakalot source ──────────────────────────────────────────────────
const mangakakalotSource: Source = {
  id: "mangakakalot",
  name: "Mangakakalot",
  language: "en",
  search: (query: string, page: number): Promise<MangaResult[]> =>
    mangakakalot.searchManga(query, page),
  getPopular: (): Promise<MangaResult[]> => mangakakalot.getPopular(),
  getDetail: (id: string): Promise<MangaDetail> => mangakakalot.getMangaDetail(id),
  getChapters: (mangaId: string): Promise<Chapter[]> => mangakakalot.getChapterList(mangaId),
  getPages: (chapterId: string): Promise<string[]> => mangakakalot.getChapterPages(chapterId),
  healthCheck: () => mangakakalot.healthCheck(),
};

// ─── MangaReader source ───────────────────────────────────────────────────
const mangareaderSource: Source = {
  id: "mangareader",
  name: "MangaReader",
  language: "en",
  search: (query: string, page: number): Promise<MangaResult[]> =>
    mangareader.searchManga(query, page),
  getPopular: (): Promise<MangaResult[]> => mangareader.getPopular(),
  getDetail: (id: string): Promise<MangaDetail> => mangareader.getMangaDetail(id),
  getChapters: (mangaId: string): Promise<Chapter[]> => mangareader.getChapterList(mangaId),
  getPages: (chapterId: string): Promise<string[]> => mangareader.getChapterPages(chapterId),
  healthCheck: () => mangareader.healthCheck(),
};

// ─── Registry ─────────────────────────────────────────────────────────────
export const allSources: Source[] = [
  mangadexSource,
  comickSource,
  batotoSource,
  mangakakalotSource,
  mangareaderSource,
  mangaplusSource,
];

export function getSource(id: string): Source {
  const src = allSources.find((s) => s.id === id);
  if (!src) throw new Error(`Unknown source: ${id}`);
  return src;
}

// Re-exported for backward compat
export const sources = allSources;
export const disabledSources: { id: string; name: string; reason: string }[] = [];

export type { Source, MangaResult, MangaDetail, Chapter };
