import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLibrary } from "@/hooks/use-library";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen } from "lucide-react";
import {
  getStats,
  getReadingHistory,
  getEnhancedLibrary,
  setMangaStatus,
  type ReadingStatus,
  type EnhancedLibraryEntry,
} from "@/lib/library-enhanced";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUSES: { id: ReadingStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "reading", label: "Reading" },
  { id: "completed", label: "Completed" },
  { id: "on-hold", label: "On Hold" },
  { id: "dropped", label: "Dropped" },
  { id: "plan-to-read", label: "Plan to Read" },
];

const STATUS_BADGE: Record<ReadingStatus, string> = {
  reading: "",
  completed: "✓",
  "on-hold": "⏸",
  dropped: "✕",
  "plan-to-read": "♦",
};

// ─── Recently read strip ──────────────────────────────────────────────────────

function RecentlyReadStrip() {
  const navigate = useNavigate();
  const history = getReadingHistory().slice(0, 6);
  if (history.length === 0) return null;

  return (
    <section className="mb-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Continue Reading
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {history.map((s) => (
          <motion.button
            key={`${s.chapterId}`}
            onClick={() => navigate(`/read/${s.mangaId}/${s.chapterId}?src=${s.sourceId}`)}
            className="flex-shrink-0 w-[100px] text-left"
            whileTap={{ scale: 0.97 }}
          >
            <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted">
              {s.coverUrl ? (
                <img
                  src={s.coverUrl}
                  alt={s.mangaTitle}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
                  No Cover
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent pt-8 pb-1.5 px-1.5">
                <p className="text-[10px] font-bold text-primary leading-none">
                  Ch. {s.chapterNum}
                </p>
              </div>
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] font-medium leading-tight text-foreground">
              {s.mangaTitle}
            </p>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar() {
  const stats = getStats();
  return (
    <div className="mb-4 flex gap-2">
      <StatChip label="Manga" value={stats.totalManga} />
      <StatChip label="Chapters" value={stats.totalChaptersRead} />
      <StatChip label={stats.currentStreak === 1 ? "Day streak" : "Day streak"} value={`🔥 ${stats.currentStreak}`} />
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-xl border border-border bg-card py-2">
      <span className="text-sm font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ─── Status filter pills ──────────────────────────────────────────────────────

function StatusFilters({
  active,
  counts,
  onChange,
}: {
  active: ReadingStatus | "all";
  counts: Record<string, number>;
  onChange: (s: ReadingStatus | "all") => void;
}) {
  return (
    <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {STATUSES.map(({ id, label }) => {
        const count = id === "all" ? counts.__all__ : counts[id];
        const isActive = active === id;
        return (
          <motion.button
            key={id}
            onClick={() => onChange(id)}
            whileTap={{ scale: 0.95 }}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {label}
            {count !== undefined && count > 0 && (
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Manga card with status badge ─────────────────────────────────────────────

function LibraryCard({
  entry,
  onLongPress,
}: {
  entry: EnhancedLibraryEntry;
  onLongPress: (entry: EnhancedLibraryEntry) => void;
}) {
  const navigate = useNavigate();
  const badge = STATUS_BADGE[entry.status];

  let pressTimer: ReturnType<typeof setTimeout> | null = null;

  const startPress = () => {
    pressTimer = setTimeout(() => onLongPress(entry), 500);
  };
  const cancelPress = () => {
    if (pressTimer) clearTimeout(pressTimer);
  };

  return (
    <motion.button
      onClick={() => navigate(`/manga/${entry.manga.id}?src=${entry.manga.sourceId || "mangadex"}`)}
      onMouseDown={startPress}
      onMouseUp={cancelPress}
      onMouseLeave={cancelPress}
      onTouchStart={startPress}
      onTouchEnd={cancelPress}
      className="group relative flex flex-col text-left"
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted">
        {entry.manga.coverUrl ? (
          <img
            src={entry.manga.coverUrl}
            alt={entry.manga.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
            No Cover
          </div>
        )}

        {/* Status badge */}
        {badge && (
          <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-[10px] font-bold text-foreground">
            {badge}
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/90 to-transparent" />
      </div>
      <div className="mt-1.5 space-y-0.5 px-0.5">
        <p className="line-clamp-2 text-xs font-medium leading-tight text-foreground">
          {entry.manga.title}
        </p>
        {entry.lastReadChapter && (
          <p className="text-[10px] text-muted-foreground">Ch. {entry.lastReadChapter}</p>
        )}
      </div>
    </motion.button>
  );
}

// ─── Status change sheet ──────────────────────────────────────────────────────

function StatusSheet({
  entry,
  onClose,
  onChanged,
}: {
  entry: EnhancedLibraryEntry | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  if (!entry) return null;

  const handleSelect = (status: ReadingStatus) => {
    setMangaStatus(entry.manga.id, status);
    onChanged();
    onClose();
  };

  return (
    <Sheet open={!!entry} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl pb-8">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-left text-sm line-clamp-1">{entry.manga.title}</SheetTitle>
        </SheetHeader>
        <div className="space-y-1">
          {STATUSES.filter((s) => s.id !== "all").map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleSelect(id as ReadingStatus)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                entry.status === id
                  ? "bg-primary/15 font-semibold text-primary"
                  : "hover:bg-secondary text-foreground"
              }`}
            >
              {entry.status === id && <span className="text-primary">✓</span>}
              {entry.status !== id && <span className="w-4" />}
              {label}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const { library } = useLibrary();
  const [activeStatus, setActiveStatus] = useState<ReadingStatus | "all">("all");
  const [selectedEntry, setSelectedEntry] = useState<EnhancedLibraryEntry | null>(null);
  const [tick, setTick] = useState(0);

  const enhanced = getEnhancedLibrary();

  const counts: Record<string, number> = { __all__: library.length };
  for (const entry of enhanced) {
    counts[entry.status] = (counts[entry.status] ?? 0) + 1;
  }

  const filtered =
    activeStatus === "all"
      ? enhanced
      : enhanced.filter((e) => e.status === activeStatus);

  return (
    <div className="safe-bottom min-h-screen px-4 pt-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Library</h1>
        <span className="text-xs text-muted-foreground">{library.length} titles</span>
      </header>

      {library.length === 0 ? (
        <motion.div
          className="flex flex-col items-center justify-center gap-4 py-32"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
            <BookOpen size={28} className="text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">Your library is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse and add manga to start reading
            </p>
          </div>
        </motion.div>
      ) : (
        <>
          <StatsBar key={tick} />
          <RecentlyReadStrip key={`history-${tick}`} />
          <StatusFilters active={activeStatus} counts={counts} onChange={setActiveStatus} />

          <AnimatePresence mode="wait">
            <motion.div
              key={activeStatus}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6"
            >
              {filtered.map((entry) => (
                <LibraryCard
                  key={entry.manga.id}
                  entry={entry}
                  onLongPress={setSelectedEntry}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <p className="text-sm">No manga with this status</p>
            </div>
          )}
        </>
      )}

      <StatusSheet
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
        onChanged={() => setTick((t) => t + 1)}
      />
    </div>
  );
}
