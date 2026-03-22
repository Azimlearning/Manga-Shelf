import type { MangaResult, Chapter, MangaDetail } from "@/lib/types";

// Bato.to GraphQL endpoint — proxied through Vite /api/bato → https://bato.to/apo/
const BATO_API = "/api/bato";
const SOURCE_ID = "bato";

async function gql<T = any>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const res = await fetch(BATO_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Bato.to GraphQL error: ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

// ─── Mappers ──────────────────────────────────────────────────────────────

function mapComic(c: any): MangaResult {
  return {
    id: String(c.id),
    sourceId: SOURCE_ID,
    title: c.name ?? "Unknown",
    coverUrl: c.imageBig ?? "",
    status: "unknown",
    tags: c.genres ?? [],
    description: c.summary ?? "",
  };
}

function mapChapter(ch: any, mangaId: string): Chapter {
  return {
    id: String(ch.id),
    mangaId,
    number: ch.dname ?? ch.title ?? "?",
    title: ch.title ?? "",
    date: ch.dateCreate ? new Date(Number(ch.dateCreate) * 1000).toISOString() : "",
    groupName: "Bato.to",
    isRead: false,
    isDownloaded: false,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────

export async function searchManga(query: string, _page = 0): Promise<MangaResult[]> {
  const data = await gql<{ searchComics: { items: any[] } }>(`
    query SearchComics($word: String!) {
      searchComics(select: { word: $word, lang: "en" }) {
        items {
          id
          name
          urlPath
          imageBig
          genres
          authors { name }
        }
      }
    }
  `, { word: query });

  return (data.searchComics?.items ?? []).map(mapComic);
}

export async function getPopular(): Promise<MangaResult[]> {
  // Bato.to doesn't have a clean popular endpoint; try getComics then fall back
  try {
    const data = await gql<{ getComics: { items: any[] } }>(`
      query PopularComics {
        getComics(select: { lang: "en", sort: "views_w", page: 1 }) {
          items {
            id
            name
            imageBig
            genres
            authors { name }
          }
        }
      }
    `);
    const items = data.getComics?.items ?? [];
    if (items.length) return items.map(mapComic);
  } catch {
    // ignore and fall through to fallback
  }
  // Fallback: search for a popular title
  return searchManga("one piece", 0).catch(() => []);
}

export async function getMangaDetail(id: string): Promise<MangaDetail> {
  const data = await gql<{ getComicDetail: any }>(`
    query ComicDetail($comicId: ID!) {
      getComicDetail(comicId: $comicId) {
        id
        name
        altNames
        authors { name }
        genres
        summary
        imageBig
        urlPath
        chapList {
          id
          title
          dname
          dateCreate
        }
      }
    }
  `, { comicId: id });

  const c = data.getComicDetail;
  if (!c) throw new Error(`Bato: comic ${id} not found`);

  const chapters: Chapter[] = (c.chapList ?? []).map((ch: any) => mapChapter(ch, id));

  return {
    id: String(c.id),
    sourceId: SOURCE_ID,
    title: c.name ?? "Unknown",
    coverUrl: c.imageBig ?? "",
    status: "unknown",
    tags: c.genres ?? [],
    description: c.summary ?? "",
    authors: (c.authors ?? []).map((a: any) => a.name),
    chapters,
  };
}

export async function getChapterList(mangaId: string): Promise<Chapter[]> {
  const detail = await getMangaDetail(mangaId);
  return detail.chapters;
}

export async function getChapterPages(chapterId: string): Promise<string[]> {
  const data = await gql<{ getChapterDetail: any }>(`
    query ChapterDetail($chapterId: ID!) {
      getChapterDetail(chapterId: $chapterId) {
        id
        title
        images { url }
      }
    }
  `, { chapterId });

  const ch = data.getChapterDetail;
  if (!ch) throw new Error(`Bato: chapter ${chapterId} not found`);

  return (ch.images ?? [])
    .map((img: any) => img.url)
    .filter(Boolean)
    .map((url: string) => `/api/proxy-image?url=${encodeURIComponent(url)}`);
}
