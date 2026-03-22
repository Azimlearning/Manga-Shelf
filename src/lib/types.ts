// ─── Shared types used across all manga sources ───────────────────────────

export interface MangaResult {
  id: string;
  sourceId: string; // 'mangadex' | 'bato'
  title: string;
  coverUrl: string;
  status: string;
  tags: string[];
  description?: string;
}

export interface Chapter {
  id: string;
  mangaId: string;
  number: string;
  title: string;
  date: string;
  groupName: string;
  isRead: boolean;
  isDownloaded: boolean;
}

export interface MangaDetail extends MangaResult {
  authors: string[];
  chapters: Chapter[];
}

export interface Source {
  id: string; // 'mangadex' | 'bato'
  name: string;
  language: string;
  search: (query: string, page: number) => Promise<MangaResult[]>;
  getPopular: () => Promise<MangaResult[]>;
  getDetail: (id: string) => Promise<MangaDetail>;
  getChapters: (mangaId: string) => Promise<Chapter[]>;
  getPages: (chapterId: string) => Promise<string[]>;
}
