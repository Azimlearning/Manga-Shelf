import type { Source, MangaResult, MangaDetail, Chapter } from "@/lib/types";
import * as mangadex from "./mangadex";
import * as bato from "./bato";
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

// ─── Bato.to source ───────────────────────────────────────────────────────
const batoSource: Source = {
  id: "bato",
  name: "Bato.to",
  language: "en",
  search: (query: string, page: number): Promise<MangaResult[]> =>
    bato.searchManga(query, page),
  getPopular: (): Promise<MangaResult[]> => bato.getPopular(),
  getDetail: (id: string): Promise<MangaDetail> => bato.getMangaDetail(id),
  getChapters: (mangaId: string): Promise<Chapter[]> => bato.getChapterList(mangaId),
  getPages: (chapterId: string): Promise<string[]> => bato.getChapterPages(chapterId),
};

// ─── MangaSee source ──────────────────────────────────────────────────────
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

// ─── Registry ─────────────────────────────────────────────────────────────
export const sources: Source[] = [mangadexSource, batoSource, mangaseeSource];

export function getSource(id: string): Source {
  const src = sources.find((s) => s.id === id);
  if (!src) throw new Error(`Unknown source: ${id}`);
  return src;
}

export type { Source, MangaResult, MangaDetail, Chapter };
