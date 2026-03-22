// ─── IndexedDB offline chapter storage ────────────────────────────────────
// DB: "mangashelf_offline" / Store: "pages"
// Key pattern: `chapter_{chapterId}_page_{index}`

const DB_NAME = "mangashelf_offline";
const STORE_NAME = "pages";
const METADATA_KEY = "downloaded_chapters";

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => {
      _db = req.result;
      resolve(req.result);
    };
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, key: string, value: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function idbGet(db: IDBDatabase, key: string): Promise<Blob | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Metadata helpers ─────────────────────────────────────────────────────

interface DownloadedChapterMeta {
  chapterId: string;
  pageCount: number;
  downloadedAt: number;
}

function getMetadata(): Record<string, DownloadedChapterMeta> {
  try {
    const raw = localStorage.getItem(METADATA_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMetadata(meta: Record<string, DownloadedChapterMeta>) {
  localStorage.setItem(METADATA_KEY, JSON.stringify(meta));
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Check whether a chapter has been fully downloaded.
 * This is synchronous (reads localStorage metadata only).
 */
export function isChapterDownloaded(chapterId: string): boolean {
  return !!getMetadata()[chapterId];
}

/**
 * Download all pages of a chapter and store them in IndexedDB.
 * Calls onProgress(downloaded, total) after each page.
 */
export async function downloadChapter(
  chapterId: string,
  pages: string[],
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const db = await openDB();
  let done = 0;

  for (let i = 0; i < pages.length; i++) {
    const key = `chapter_${chapterId}_page_${i}`;
    // Fetch page as Blob via the proxy
    const res = await fetch(pages[i]);
    if (!res.ok) throw new Error(`Failed to fetch page ${i}: ${res.status}`);
    const blob = await res.blob();
    await idbPut(db, key, blob);
    done++;
    onProgress?.(done, pages.length);
  }

  // Save metadata
  const meta = getMetadata();
  meta[chapterId] = { chapterId, pageCount: pages.length, downloadedAt: Date.now() };
  saveMetadata(meta);
}

/**
 * Retrieve downloaded chapter pages as local Blob URLs.
 * Returns null if the chapter is not downloaded.
 */
export async function getDownloadedChapter(chapterId: string): Promise<string[] | null> {
  const meta = getMetadata();
  const info = meta[chapterId];
  if (!info) return null;

  const db = await openDB();
  const urls: string[] = [];

  for (let i = 0; i < info.pageCount; i++) {
    const key = `chapter_${chapterId}_page_${i}`;
    const blob = await idbGet(db, key);
    if (!blob) return null; // incomplete download — treat as not downloaded
    urls.push(URL.createObjectURL(blob));
  }

  return urls;
}

/**
 * Delete a downloaded chapter from IndexedDB.
 */
export async function deleteDownloadedChapter(chapterId: string): Promise<void> {
  const meta = getMetadata();
  const info = meta[chapterId];
  if (!info) return;

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  for (let i = 0; i < info.pageCount; i++) {
    store.delete(`chapter_${chapterId}_page_${i}`);
  }
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });

  delete meta[chapterId];
  saveMetadata(meta);
}

/** Get all downloaded chapter IDs */
export function getDownloadedChapterIds(): string[] {
  return Object.keys(getMetadata());
}
