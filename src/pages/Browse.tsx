import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/SearchBar";
import { sources, getSource } from "@/lib/sources";
import type { MangaResult } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";

// ─── Source selector pill ─────────────────────────────────────────────────

function SourcePill({
  sourceId,
  active,
  onClick,
}: {
  sourceId: string;
  active: boolean;
  onClick: () => void;
}) {
  const src = sources.find((s) => s.id === sourceId);
  if (!src) return null;
  return (
    <motion.button
      id={`source-pill-${sourceId}`}
      onClick={onClick}
      whileTap={{ scale: 0.95 }}
      className={`relative rounded-full px-4 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
      }`}
    >
      {src.name}
    </motion.button>
  );
}

// ─── Manga grid (inline, accepts unified MangaResult) ─────────────────────

function MangaGridItem({ manga }: { manga: MangaResult }) {
  return (
    <motion.a
      href={`/manga/${manga.id}?src=${manga.sourceId}`}
      onClick={(e) => {
        e.preventDefault();
        // Use window.location to preserve the sourceId as a query param
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

// ─── Browse page ──────────────────────────────────────────────────────────

export default function BrowsePage() {
  const [activeSourceId, setActiveSourceId] = useState<string>("mangadex");
  const [query, setQuery] = useState("");

  const source = getSource(activeSourceId);

  const { data: popular, isLoading: loadingPopular } = useQuery({
    queryKey: ["popular-manga", activeSourceId],
    queryFn: () => source.getPopular(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const { data: searchResults, isLoading: loadingSearch } = useQuery({
    queryKey: ["search-manga", activeSourceId, query],
    queryFn: () => source.search(query, 0),
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  const manga: MangaResult[] = query.length >= 2 ? searchResults ?? [] : popular ?? [];
  const loading = query.length >= 2 ? loadingSearch : loadingPopular;

  return (
    <div className="safe-bottom min-h-screen px-4 pt-4">
      <header className="mb-4">
        <h1 className="mb-3 text-xl font-bold text-foreground">Browse</h1>
        <SearchBar onSearch={setQuery} autoFocus />
      </header>

      {/* Source selector pills */}
      <div
        id="source-selector"
        className="mb-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide"
        role="tablist"
        aria-label="Select manga source"
      >
        {sources.map((s) => (
          <SourcePill
            key={s.id}
            sourceId={s.id}
            active={s.id === activeSourceId}
            onClick={() => {
              setActiveSourceId(s.id);
              setQuery(""); // reset search when switching source
            }}
          />
        ))}
      </div>

      {/* Section label */}
      <div className="mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {query.length >= 2 ? `Results for "${query}"` : "Popular"}
        </p>
      </div>

      {/* Error state for Bato */}
      <AnimatePresence>
        {activeSourceId === "bato" && !loading && manga.length === 0 && !query && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-4 text-center text-xs text-muted-foreground"
          >
            Bato.to popular list may be slow — try searching a title instead.
          </motion.p>
        )}
      </AnimatePresence>

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
