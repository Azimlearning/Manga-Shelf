import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/SearchBar";
import { allSources, getSource } from "@/lib/sources";
import type { MangaResult, Source } from "@/lib/types";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";

// ─── Source selector pill ─────────────────────────────────────────────────

function SourcePill({
  name,
  active,
  onClick,
}: {
  name: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`relative rounded-full px-4 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      }`}
    >
      {name}
    </motion.button>
  );
}

// ─── Manga grid item ─────────────────────────────────────────────────────

function MangaGridItem({ manga }: { manga: MangaResult }) {
  return (
    <motion.a
      href={`/manga/${manga.id}?src=${manga.sourceId}`}
      onClick={(e) => {
        e.preventDefault();
        window.location.href = `/manga/${manga.id}?src=${manga.sourceId}`;
      }}
      className="group relative flex flex-col text-left"
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted">
        {manga.coverUrl ? (
          <img
            src={manga.coverUrl}
            alt={manga.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
            No Cover
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/90 to-transparent" />
      </div>
      <p className="mt-1.5 line-clamp-2 px-0.5 text-xs font-medium leading-tight text-foreground">
        {manga.title}
      </p>
    </motion.a>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="aspect-[2/3] w-full animate-shimmer rounded-lg bg-gradient-to-r from-muted via-secondary to-muted bg-[length:200%_100%]" />
          <div className="mt-2 h-3 w-3/4 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

// ─── Latest Updates card ──────────────────────────────────────────────────

interface LatestChapter {
  chapterId: string;
  chapterNumber: string;
  chapterTitle: string;
  mangaId: string;
  mangaTitle: string;
  coverUrl: string;
  publishAt: string;
  groupName: string;
}

function LatestUpdateCard({ ch }: { ch: LatestChapter }) {
  const timeAgo = (() => {
    try {
      return formatDistanceToNow(new Date(ch.publishAt), { addSuffix: true });
    } catch {
      return "";
    }
  })();

  return (
    <motion.a
      href={`/manga/${ch.mangaId}?src=mangadex`}
      onClick={(e) => {
        e.preventDefault();
        window.location.href = `/manga/${ch.mangaId}?src=mangadex`;
      }}
      className="flex-shrink-0 w-[140px] group"
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted">
        {ch.coverUrl ? (
          <img
            src={ch.coverUrl}
            alt={ch.mangaTitle}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
            No Cover
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/60 to-transparent pt-10 pb-2 px-2">
          <p className="text-[10px] font-bold text-primary leading-none">
            Ch. {ch.chapterNumber}
          </p>
        </div>
      </div>
      <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-tight text-foreground">
        {ch.mangaTitle}
      </p>
      <p className="text-[10px] text-muted-foreground truncate">{ch.groupName}</p>
      <p className="text-[9px] text-muted-foreground/70">{timeAgo}</p>
    </motion.a>
  );
}

function LatestUpdatesSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-[140px]">
          <div className="aspect-[2/3] w-full animate-shimmer rounded-lg bg-gradient-to-r from-muted via-secondary to-muted bg-[length:200%_100%]" />
          <div className="mt-1.5 h-3 w-3/4 rounded bg-muted" />
          <div className="mt-1 h-2 w-1/2 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

// ─── Health check hook ────────────────────────────────────────────────────

function useHealthySources() {
  const [healthySources, setHealthySources] = useState<Source[]>([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const results = await Promise.allSettled(
        allSources.map(async (src) => {
          if (!src.healthCheck) return { src, ok: true };
          const ok = await src.healthCheck();
          return { src, ok };
        })
      );

      if (cancelled) return;

      const healthy = results
        .filter((r): r is PromiseFulfilledResult<{ src: Source; ok: boolean }> => r.status === "fulfilled" && r.value.ok)
        .map((r) => r.value.src);

      setHealthySources(healthy);
      setChecking(false);
    }

    check();
    return () => { cancelled = true; };
  }, []);

  return { healthySources, checking };
}

// ─── Browse page ──────────────────────────────────────────────────────────

export default function BrowsePage() {
  const { healthySources, checking } = useHealthySources();
  const showPills = healthySources.length > 1;

  const [activeSourceId, setActiveSourceId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Auto-select first healthy source
  useEffect(() => {
    if (!checking && healthySources.length > 0 && !activeSourceId) {
      setActiveSourceId(healthySources[0].id);
    }
  }, [checking, healthySources, activeSourceId]);

  const source = activeSourceId ? (() => { try { return getSource(activeSourceId); } catch { return null; } })() : null;

  const { data: popular, isLoading: loadingPopular } = useQuery({
    queryKey: ["popular-manga", activeSourceId],
    queryFn: () => source!.getPopular(),
    enabled: !!source,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: searchResults, isLoading: loadingSearch } = useQuery({
    queryKey: ["search-manga", activeSourceId, query],
    queryFn: () => source!.search(query, 0),
    enabled: !!source && query.length >= 2,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  // Latest updates from MangaDex
  const showLatest = activeSourceId === "mangadex" && query.length < 2;
  const { data: latestChapters, isLoading: loadingLatest } = useQuery({
    queryKey: ["latest-updates"],
    queryFn: async (): Promise<LatestChapter[]> => {
      const params = new URLSearchParams({
        path: "chapter",
        limit: "24",
        "order[publishAt]": "desc",
      });
      params.append("translatedLanguage[]", "en");
      params.append("includes[]", "manga");
      params.append("includes[]", "scanlation_group");

      const res = await fetch(`/api/mangadex?${params}`);
      const json = await res.json();

      return (json.data ?? []).map((c: any) => {
        const mangaRel = c.relationships?.find((r: any) => r.type === "manga");
        const groupRel = c.relationships?.find((r: any) => r.type === "scanlation_group");
        const mangaId = mangaRel?.id ?? "";

        const coverRel = mangaRel?.relationships?.find((r: any) => r.type === "cover_art");
        let coverUrl = "";
        if (coverRel?.attributes?.fileName) {
          const raw = `https://uploads.mangadex.org/covers/${mangaId}/${coverRel.attributes.fileName}.256.jpg`;
          coverUrl = `/api/proxy-image?url=${encodeURIComponent(raw)}`;
        }

        const titles = mangaRel?.attributes?.title ?? {};
        const mangaTitle =
          titles.en ?? titles.ja ?? titles["ja-ro"] ?? (Object.values(titles)[0] as string) ?? "Unknown";

        return {
          chapterId: c.id,
          chapterNumber: c.attributes?.chapter ?? "?",
          chapterTitle: c.attributes?.title ?? "",
          mangaId,
          mangaTitle,
          coverUrl,
          publishAt: c.attributes?.publishAt ?? "",
          groupName: groupRel?.attributes?.name ?? "Unknown",
        };
      });
    },
    enabled: showLatest,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const manga: MangaResult[] = query.length >= 2 ? searchResults ?? [] : popular ?? [];
  const loading = checking || (query.length >= 2 ? loadingSearch : loadingPopular);

  return (
    <div className="safe-bottom min-h-screen px-4 pt-4">
      <header className="mb-4">
        <h1 className="mb-3 text-xl font-bold text-foreground">Browse</h1>
        <SearchBar onSearch={setQuery} autoFocus />
      </header>

      {/* Source selector pills — only if multiple sources are healthy */}
      {showPills && (
        <div
          className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide"
          role="tablist"
          aria-label="Select manga source"
        >
          {healthySources.map((s) => (
            <SourcePill
              key={s.id}
              name={s.name}
              active={s.id === activeSourceId}
              onClick={() => {
                setActiveSourceId(s.id);
                setQuery("");
              }}
            />
          ))}
        </div>
      )}

      {/* Recently Updated — horizontal scroll */}
      {showLatest && (
        <section className="mb-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Recently Updated
          </p>
          {loadingLatest ? (
            <LatestUpdatesSkeleton />
          ) : latestChapters && latestChapters.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {latestChapters.map((ch) => (
                <LatestUpdateCard key={ch.chapterId} ch={ch} />
              ))}
            </div>
          ) : null}
        </section>
      )}

      {/* Section label */}
      <div className="mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {query.length >= 2 ? `Results for "${query}"` : "Popular"}
        </p>
      </div>

      {/* Grid */}
      {loading ? (
        <SkeletonGrid />
      ) : manga.length === 0 && query.length >= 2 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-sm">No results found</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {manga.map((m) => (
            <MangaGridItem key={m.id} manga={m} />
          ))}
        </div>
      )}
    </div>
  );
}
