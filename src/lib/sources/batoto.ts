import type { MangaResult, MangaDetail, Chapter } from "@/lib/types";

const SOURCE_ID = "batoto";

function proxyImage(url: string | undefined): string {
  if (!url) return "";
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

async function gql(query: string, variables: Record<string, unknown> = {}): Promise<any> {
  const res = await fetch("/api/bato", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Bato.to API error: ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return json.data;
}

export async function searchManga(query: string, page = 1): Promise<MangaResult[]> {
  const data = await gql(
    `query Search($q: String!, $page: Int!) {
      searchComics(select: { q: $q, page: $page, size: 20 }) {
        items {
          id
          title
          urlCoverOri
          status
          genres
          summary
        }
      }
    }`,
    { q: query, page }
  );

  return (data?.searchComics?.items ?? []).map(mapComic);
}

export async function getPopular(): Promise<MangaResult[]> {
  const data = await gql(
    `query Popular {
      searchComics(select: { sortby: "field_score", page: 1, size: 20 }) {
        items {
          id
          title
          urlCoverOri
          status
          genres
          summary
        }
      }
    }`
  );

  return (data?.searchComics?.items ?? []).map(mapComic);
}

export async function getMangaDetail(id: string): Promise<MangaDetail> {
  const data = await gql(
    `query Detail($id: ID!) {
      getComicNode(id: $id) {
        id
        title
        urlCoverOri
        status
        genres
        summary
        authors { name }
      }
    }`,
    { id }
  );

  const m = data?.getComicNode;
  if (!m) throw new Error(`Bato.to: comic not found: ${id}`);

  return {
    id: m.id,
    sourceId: SOURCE_ID,
    title: m.title ?? "Unknown",
    coverUrl: m.urlCoverOri ? proxyImage(m.urlCoverOri) : "",
    status: mapStatus(m.status),
    tags: m.genres ?? [],
    description: m.summary ?? "",
    authors: (m.authors ?? []).map((a: any) => a.name),
    chapters: [],
  };
}

export async function getChapterList(mangaId: string): Promise<Chapter[]> {
  const data = await gql(
    `query Chapters($id: ID!) {
      getChapterList(comicId: $id, select: { lang: "en" }) {
        id
        title
        volume
        chapterNum
        dname
        uploadDate
      }
    }`,
    { id: mangaId }
  );

  return (data?.getChapterList ?? []).map((ch: any) => ({
    id: String(ch.id),
    mangaId,
    number: ch.chapterNum ? String(ch.chapterNum) : "?",
    title: ch.title || "",
    date: ch.uploadDate || "",
    groupName: ch.dname || "Unknown",
    isRead: false,
    isDownloaded: false,
  }));
}

export async function getChapterPages(chapterId: string): Promise<string[]> {
  const data = await gql(
    `query Pages($id: ID!) {
      getChapterNode(id: $id) {
        imageFile { urlList }
      }
    }`,
    { id: chapterId }
  );

  const urlList: string[] = data?.getChapterNode?.imageFile?.urlList ?? [];
  return urlList.map((url) => proxyImage(url));
}

export async function healthCheck(): Promise<boolean> {
  try {
    await gql(`query { searchComics(select: { page: 1, size: 1 }) { items { id } } }`);
    return true;
  } catch {
    return false;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapComic(m: any): MangaResult {
  return {
    id: String(m.id),
    sourceId: SOURCE_ID,
    title: m.title ?? "Unknown",
    coverUrl: m.urlCoverOri ? proxyImage(m.urlCoverOri) : "",
    status: mapStatus(m.status),
    tags: m.genres ?? [],
    description: m.summary ?? "",
  };
}

function mapStatus(s: string | undefined): string {
  if (!s) return "unknown";
  const lower = s.toLowerCase();
  if (lower.includes("ongoing") || lower.includes("releasing")) return "ongoing";
  if (lower.includes("completed") || lower.includes("complete")) return "completed";
  if (lower.includes("hiatus")) return "hiatus";
  return "unknown";
}
