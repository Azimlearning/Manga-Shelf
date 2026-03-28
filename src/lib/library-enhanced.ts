import { getLibrary, getSettings, saveSettings } from "./library";
import type { LibraryEntry, ReadingSettings } from "./library";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReadingStatus = "reading" | "completed" | "on-hold" | "dropped" | "plan-to-read";

export interface EnhancedLibraryEntry extends LibraryEntry {
  status: ReadingStatus;
  rating?: number;
  notes?: string;
}

export interface ReadingSession {
  mangaId: string;
  mangaTitle: string;
  coverUrl: string;
  chapterId: string;
  chapterNum: string;
  sourceId: string;
  readAt: number;
}

export interface LibraryStats {
  totalManga: number;
  totalChaptersRead: number;
  currentStreak: number;
}

// ─── Storage keys ─────────────────────────────────────────────────────────────

const ENHANCED_KEY = "mangashelf_library_v2";
const HISTORY_KEY = "mangashelf_reading_history";
const MAX_HISTORY = 100;

// ─── Enhanced library helpers ─────────────────────────────────────────────────

function getEnhancedRaw(): Record<string, { status: ReadingStatus; rating?: number; notes?: string }> {
  try {
    const raw = localStorage.getItem(ENHANCED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveEnhancedRaw(data: Record<string, { status: ReadingStatus; rating?: number; notes?: string }>) {
  localStorage.setItem(ENHANCED_KEY, JSON.stringify(data));
}

/** Get library entries merged with enhanced status fields. */
export function getEnhancedLibrary(): EnhancedLibraryEntry[] {
  const base = getLibrary();
  const enhanced = getEnhancedRaw();
  return base.map((entry) => ({
    ...entry,
    status: enhanced[entry.manga.id]?.status ?? "reading",
    rating: enhanced[entry.manga.id]?.rating,
    notes: enhanced[entry.manga.id]?.notes,
  }));
}

/** Set the reading status for a manga. */
export function setMangaStatus(mangaId: string, status: ReadingStatus) {
  const data = getEnhancedRaw();
  data[mangaId] = { ...data[mangaId], status };
  saveEnhancedRaw(data);
}

/** Get the reading status for a manga, or null if not in enhanced storage. */
export function getMangaStatus(mangaId: string): ReadingStatus | null {
  return getEnhancedRaw()[mangaId]?.status ?? null;
}

// ─── Reading history ──────────────────────────────────────────────────────────

export function getReadingHistory(): ReadingSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Prepend a reading session and cap history at MAX_HISTORY entries. */
export function recordReadingSession(session: ReadingSession) {
  const history = getReadingHistory();
  // Deduplicate: remove existing entry for same chapterId before prepending
  const filtered = history.filter((s) => s.chapterId !== session.chapterId);
  const next = [session, ...filtered].slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

// ─── Statistics ───────────────────────────────────────────────────────────────

export function getStats(): LibraryStats {
  const library = getLibrary();
  const history = getReadingHistory();

  const totalManga = library.length;
  const totalChaptersRead = library.reduce((sum, e) => sum + e.readChapters.length, 0);
  const currentStreak = computeStreak(history);

  return { totalManga, totalChaptersRead, currentStreak };
}

function computeStreak(history: ReadingSession[]): number {
  if (history.length === 0) return 0;

  // Collect distinct calendar days (YYYY-MM-DD) from history
  const days = new Set(
    history.map((s) => new Date(s.readAt).toISOString().slice(0, 10))
  );

  const today = new Date().toISOString().slice(0, 10);

  // If haven't read today, streak starts from yesterday (or 0 if nothing recent)
  let cursor = today;
  if (!days.has(cursor)) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (!days.has(yesterday)) return 0;
    cursor = yesterday;
  }

  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    const prev = new Date(new Date(cursor).getTime() - 86400000).toISOString().slice(0, 10);
    cursor = prev;
  }

  return streak;
}

// ─── Backup & restore ─────────────────────────────────────────────────────────

export function exportLibraryBackup(): string {
  const library = getLibrary();
  const enhanced = getEnhancedRaw();
  const history = getReadingHistory();
  const settings = getSettings();

  return JSON.stringify({ version: 1, library, enhanced, history, settings }, null, 2);
}

export function importLibraryBackup(json: string) {
  const data = JSON.parse(json);
  if (!data || typeof data !== "object") throw new Error("Invalid backup file");
  if (data.version !== 1) throw new Error("Unsupported backup version");
  if (!Array.isArray(data.library)) throw new Error("Missing library data");

  localStorage.setItem("mangashelf_library", JSON.stringify(data.library));
  if (data.enhanced && typeof data.enhanced === "object") {
    localStorage.setItem(ENHANCED_KEY, JSON.stringify(data.enhanced));
  }
  if (Array.isArray(data.history)) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(data.history));
  }
  if (data.settings && typeof data.settings === "object") {
    saveSettings(data.settings as ReadingSettings);
  }
}
