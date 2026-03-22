import type { MangaSearchResult } from "./mangadex";

export interface LibraryEntry {
  manga: MangaSearchResult;
  addedAt: number;
  lastReadChapter: string;
  lastReadAt: number;
  readChapters: string[]; // chapter IDs
}

export interface ReadingSettings {
  readingMode: "vertical" | "horizontal";
  readingDirection: "ltr" | "rtl";
  readerBackground: "dark" | "light" | "sepia";
}

const LIBRARY_KEY = "mangashelf_library";
const SETTINGS_KEY = "mangashelf_settings";

export function getLibrary(): LibraryEntry[] {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLibrary(library: LibraryEntry[]) {
  localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
}

export function addToLibrary(manga: MangaSearchResult) {
  const lib = getLibrary();
  if (lib.find((e) => e.manga.id === manga.id)) return;
  lib.push({
    manga,
    addedAt: Date.now(),
    lastReadChapter: "",
    lastReadAt: 0,
    readChapters: [],
  });
  saveLibrary(lib);
}

export function removeFromLibrary(mangaId: string) {
  const lib = getLibrary().filter((e) => e.manga.id !== mangaId);
  saveLibrary(lib);
}

export function isInLibrary(mangaId: string): boolean {
  return getLibrary().some((e) => e.manga.id === mangaId);
}

export function markChapterRead(mangaId: string, chapterId: string, chapterNum: string) {
  const lib = getLibrary();
  const entry = lib.find((e) => e.manga.id === mangaId);
  if (!entry) return;
  if (!entry.readChapters.includes(chapterId)) {
    entry.readChapters.push(chapterId);
  }
  entry.lastReadChapter = chapterNum;
  entry.lastReadAt = Date.now();
  saveLibrary(lib);
}

export function isChapterRead(mangaId: string, chapterId: string): boolean {
  const entry = getLibrary().find((e) => e.manga.id === mangaId);
  return entry?.readChapters.includes(chapterId) ?? false;
}

export function toggleChapterRead(mangaId: string, chapterId: string) {
  const lib = getLibrary();
  const entry = lib.find((e) => e.manga.id === mangaId);
  if (!entry) return;
  const idx = entry.readChapters.indexOf(chapterId);
  if (idx >= 0) {
    entry.readChapters.splice(idx, 1);
  } else {
    entry.readChapters.push(chapterId);
  }
  saveLibrary(lib);
}

export function getSettings(): ReadingSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : defaultSettings();
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: ReadingSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function defaultSettings(): ReadingSettings {
  return {
    readingMode: "vertical",
    readingDirection: "rtl",
    readerBackground: "dark",
  };
}
