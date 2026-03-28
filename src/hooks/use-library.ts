import { useState, useCallback } from "react";
import {
  getLibrary,
  addToLibrary,
  removeFromLibrary,
  isInLibrary,
  markChapterRead,
  isChapterRead,
  toggleChapterRead,
  getSettings,
  saveSettings,
  type LibraryEntry,
  type ReadingSettings,
} from "@/lib/library";
import {
  getEnhancedLibrary,
  setMangaStatus,
  type EnhancedLibraryEntry,
  type ReadingStatus,
} from "@/lib/library-enhanced";
import type { MangaResult } from "@/lib/types";

export function useLibrary() {
  const [library, setLibrary] = useState<LibraryEntry[]>(getLibrary);
  const [, setTick] = useState(0);

  const refresh = useCallback(() => {
    setLibrary(getLibrary());
    setTick((t) => t + 1);
  }, []);

  const add = useCallback((manga: MangaResult) => {
    addToLibrary(manga);
    refresh();
  }, [refresh]);

  const remove = useCallback((mangaId: string) => {
    removeFromLibrary(mangaId);
    refresh();
  }, [refresh]);

  const inLibrary = useCallback((mangaId: string) => isInLibrary(mangaId), []);

  const markRead = useCallback((mangaId: string, chapterId: string, chapterNum: string) => {
    markChapterRead(mangaId, chapterId, chapterNum);
    refresh();
  }, [refresh]);

  const chapterRead = useCallback((mangaId: string, chapterId: string) => isChapterRead(mangaId, chapterId), []);

  const toggleRead = useCallback((mangaId: string, chapterId: string) => {
    toggleChapterRead(mangaId, chapterId);
    refresh();
  }, [refresh]);

  return { library, add, remove, inLibrary, markRead, chapterRead, toggleRead, refresh };
}

export function useReadingSettings() {
  const [settings, setSettingsState] = useState<ReadingSettings>(getSettings);

  const update = useCallback((partial: Partial<ReadingSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
  }, []);

  return { settings, update };
}

export function useEnhancedLibrary() {
  const [entries, setEntries] = useState<EnhancedLibraryEntry[]>(getEnhancedLibrary);
  const [, setTick] = useState(0);

  const refresh = useCallback(() => {
    setEntries(getEnhancedLibrary());
    setTick((t) => t + 1);
  }, []);

  const setStatus = useCallback((mangaId: string, status: ReadingStatus) => {
    setMangaStatus(mangaId, status);
    refresh();
  }, [refresh]);

  return { entries, setStatus, refresh };
}
