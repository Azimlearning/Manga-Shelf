import type { MangaResult, Chapter, MangaDetail } from "@/lib/types";

const MANGASEE_API = "/api/mangasee";
const SOURCE_ID = "mangasee";

let cachedDirectory: any[] | null = null;

// ─── Helpers ──────────────────────────────────────────────────────────────

async function getDirectory() {
  if (cachedDirectory) return cachedDirectory;
  const res = await fetch(`${MANGASEE_API}/_search.php`, { method: "POST" });
  cachedDirectory = await res.json();
  return cachedDirectory || [];
}

// ─── Public API ───────────────────────────────────────────────────────────

export async function searchManga(query: string, _page = 0): Promise<MangaResult[]> {
  const directory = await getDirectory();
  const lowerQuery = query.toLowerCase();
  
  const results = directory.filter((item) => 
    item.s.toLowerCase().includes(lowerQuery) || 
    (item.al && item.al.some((alias: string) => alias.toLowerCase().includes(lowerQuery)))
  ).slice(0, 20);

  return results.map((item) => ({
    id: item.i,
    sourceId: SOURCE_ID,
    title: item.s,
    // MangaSee covers are named by the index name under temp.compsci88.com
    coverUrl: `/api/proxy-image?url=${encodeURIComponent(`https://temp.compsci88.com/cover/${item.i}.jpg`)}`,
    status: "unknown",
    tags: [],
    description: "",
  }));
}

export async function getPopular(): Promise<MangaResult[]> {
  // MangaSee doesn't have a simple popular JSON endpoint, so we return a hardcoded list of popular index names 
  // or fetch the directory and return the first 20. We will return 20 known popular items parsed from directory.
  const directory = await getDirectory();
  const popularIds = [
    "One-Piece", "Jujutsu-Kaisen", "Chainsaw-Man", "My-Hero-Academia", 
    "Solo-Leveling", "Spy-X-Family", "Berserk", "One-Punch-Man", 
    "Demon-Slayer-Kimetsu-No-Yaiba", "Bleach", "Naruto"
  ];
  const results = directory.filter(item => popularIds.includes(item.i));
  
  if (results.length === 0) {
    return directory.slice(0, 20).map(mapSearchItem);
  }
  return results.map(mapSearchItem);
}

function mapSearchItem(item: any): MangaResult {
  return {
    id: item.i,
    sourceId: SOURCE_ID,
    title: item.s,
    coverUrl: `/api/proxy-image?url=${encodeURIComponent(`https://temp.compsci88.com/cover/${item.i}.jpg`)}`,
    status: "unknown",
    tags: [],
    description: "",
  };
}

export async function getMangaDetail(id: string): Promise<MangaDetail> {
  const res = await fetch(`${MANGASEE_API}/manga/${id}`);
  const html = await res.text();

  const titleMatch = html.match(/<h1>(.*?)<\/h1>/);
  const title = titleMatch ? titleMatch[1].replace(/&amp;/g, "&") : id;

  const descMatch = html.match(/<div class="top-5 Content">(.*?)<\/div>/s);
  const description = descMatch ? descMatch[1].replace(/<[^>]+>/g, "").trim() : "";

  const chapters = await getChapterList(id, html);

  return {
    id,
    sourceId: SOURCE_ID,
    title,
    coverUrl: `/api/proxy-image?url=${encodeURIComponent(`https://temp.compsci88.com/cover/${id}.jpg`)}`,
    status: "unknown",
    tags: [],
    description,
    authors: [],
    chapters,
  };
}

// ─── String manipulation for MangaSee's weird chapter IDs ───

// Returns eg "-chapter-10" or "-chapter-10.5" or "-chapter-10-index-2"
function getChapterUrlString(chObj: any) {
  let chStr = chObj.Chapter.substring(1, chObj.Chapter.length - 1);
  let index = "";
  let odd = chObj.Chapter[chObj.Chapter.length - 1];

  let urlStr = "-chapter-" + parseInt(chStr);
  if (odd !== "0") {
    urlStr += "." + odd;
  }
  if (chObj.Type === "Volume") {
    urlStr = "-volume-" + parseInt(chStr);
  }
  let indexStr = chObj.Chapter[0];
  if (indexStr !== "1") {
    urlStr += "-index-" + indexStr;
  }
  return urlStr;
}

export async function getChapterList(mangaId: string, prefetchHtml?: string): Promise<Chapter[]> {
  let html = prefetchHtml;
  if (!html) {
    const res = await fetch(`${MANGASEE_API}/manga/${mangaId}`);
    html = await res.text();
  }

  const match = html.match(/vm\.Chapters = (\[.*?\]);/);
  if (!match) return [];

  const rawChapters = JSON.parse(match[1]);

  return rawChapters.map((ch: any) => {
    let chStr = ch.Chapter.substring(1, ch.Chapter.length - 1);
    let odd = ch.Chapter[ch.Chapter.length - 1];
    let chapterNum = parseInt(chStr, 10).toString();
    if (odd !== "0") chapterNum += `.${odd}`;

    const urlPath = getChapterUrlString(ch);
    // Use composite ID: mangaId|chapterURLPath to be able to fetch pages later
    const compositeId = `${mangaId}|${urlPath}`;

    return {
      id: compositeId,
      mangaId,
      number: chapterNum,
      title: ch.ChapterName || `Chapter ${chapterNum}`,
      date: ch.Date || "",
      groupName: "MangaSee",
      isRead: false,
      isDownloaded: false,
    };
  });
}

export async function getChapterPages(chapterId: string): Promise<string[]> {
  const [mangaId, urlPath] = chapterId.split("|");
  const readUrl = `${MANGASEE_API}/read-online/${mangaId}${urlPath}.html`;
  const res = await fetch(readUrl);
  const html = await res.text();

  const curPathMatch = html.match(/vm\.CurPathName = "(.*?)";/);
  const curChapterMatch = html.match(/vm\.CurChapter = (\{.*?\});/);

  if (!curPathMatch || !curChapterMatch) {
    return [];
  }

  const host = curPathMatch[1]; // e.g. "scans-hot.leanbox.us"
  const chapterObj = JSON.parse(curChapterMatch[1]); // { Chapter: "10010", Page: "20", Directory: "foo" }

  const pages = parseInt(chapterObj.Page, 10);
  const directory = chapterObj.Directory === "" ? "" : chapterObj.Directory + "/";
  let chStr = chapterObj.Chapter.substring(1, chapterObj.Chapter.length - 1);
  let odd = chapterObj.Chapter[chapterObj.Chapter.length - 1];
  let chapterNumStr = String(parseInt(chStr));
  if (odd !== "0") chapterNumStr += "." + odd;

  // Format: https://{host}/manga/{mangaId}/{directory}{chapterNumStr}-{pageStr}.png
  const imageUrls = [];
  for (let i = 1; i <= pages; i++) {
    const pageStr = i.toString().padStart(3, "0");
    const originalUrl = `https://${host}/manga/${mangaId}/${directory}${chapterNumStr}-${pageStr}.png`;
    imageUrls.push(`/api/proxy-image?url=${encodeURIComponent(originalUrl)}`);
  }

  return imageUrls;
}
