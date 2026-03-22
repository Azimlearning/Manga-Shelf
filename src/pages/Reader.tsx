import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getChapterPages } from "@/lib/mangadex";
import { useLibrary, useReadingSettings } from "@/hooks/use-library";
import { ArrowLeft, ChevronLeft, ChevronRight, Settings2 } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BG_CLASSES: Record<string, string> = {
  dark: "bg-[hsl(225,15%,5%)]",
  light: "bg-[hsl(0,0%,100%)]",
  sepia: "bg-[hsl(35,40%,90%)]",
};

export default function ReaderPage() {
  const { mangaId, chapterId } = useParams<{ mangaId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { markRead, settings } = useReaderState(mangaId!, chapterId!);
  const [showUI, setShowUI] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const { data: pages, isLoading } = useQuery({
    queryKey: ["chapter-pages", chapterId],
    queryFn: () => getChapterPages(chapterId!),
    enabled: !!chapterId,
  });

  // Mark as read when 80% through
  useEffect(() => {
    if (!pages) return;
    const threshold = Math.floor(pages.length * 0.8);
    if (currentPage >= threshold) {
      markRead();
    }
  }, [currentPage, pages, markRead]);

  const bgClass = BG_CLASSES[settings.readerBackground] || BG_CLASSES.dark;

  if (isLoading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${bgClass}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!pages) return null;

  return (
    <div className={`relative min-h-screen ${bgClass}`}>
      {/* Top bar */}
      <AnimatePresence>
        {showUI && (
          <motion.header
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed inset-x-0 top-0 z-50 flex items-center gap-3 bg-background/80 px-4 py-3 backdrop-blur-lg"
          >
            <button onClick={() => navigate(`/manga/${mangaId}`)} className="text-foreground">
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1 truncate text-sm font-medium text-foreground">
              {currentPage + 1} / {pages.length}
            </div>
            <button onClick={() => setShowSettings(!showSettings)} className="text-foreground">
              <Settings2 size={18} />
            </button>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && <ReaderSettingsPanel />}
      </AnimatePresence>

      {/* Reader content */}
      {settings.readingMode === "vertical" ? (
        <VerticalReader
          pages={pages}
          onTap={() => setShowUI(!showUI)}
          onPageChange={setCurrentPage}
        />
      ) : (
        <HorizontalReader
          pages={pages}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          rtl={settings.readingDirection === "rtl"}
          onTap={() => setShowUI(!showUI)}
        />
      )}
    </div>
  );
}

function useReaderState(mangaId: string, chapterId: string) {
  const { markRead: mark } = useLibrary();
  const { settings, update } = useReadingSettings();

  const markRead = useCallback(() => {
    mark(mangaId, chapterId, "");
  }, [mangaId, chapterId, mark]);

  return { markRead, settings, updateSettings: update };
}

function VerticalReader({ pages, onTap, onPageChange }: { pages: string[]; onTap: () => void; onPageChange: (p: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-page"));
            if (!isNaN(idx)) onPageChange(idx);
          }
        });
      },
      { threshold: 0.5 }
    );

    container.querySelectorAll("[data-page]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pages, onPageChange]);

  return (
    <div ref={containerRef} className="hide-scrollbar" onClick={onTap}>
      {pages.map((url, i) => (
        <div key={i} data-page={i} className="flex items-center justify-center">
          <img
            src={url}
            alt={`Page ${i + 1}`}
            className="w-full max-w-3xl"
            loading={i < 3 ? "eager" : "lazy"}
          />
        </div>
      ))}
    </div>
  );
}

function HorizontalReader({
  pages,
  currentPage,
  onPageChange,
  rtl,
  onTap,
}: {
  pages: string[];
  currentPage: number;
  onPageChange: (p: number) => void;
  rtl: boolean;
  onTap: () => void;
}) {
  const goNext = () => onPageChange(Math.min(currentPage + 1, pages.length - 1));
  const goPrev = () => onPageChange(Math.max(currentPage - 1, 0));

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const third = rect.width / 3;

    if (x < third) {
      rtl ? goNext() : goPrev();
    } else if (x > third * 2) {
      rtl ? goPrev() : goNext();
    } else {
      onTap();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center" onClick={handleClick}>
      <AnimatePresence mode="wait">
        <motion.img
          key={currentPage}
          src={pages[currentPage]}
          alt={`Page ${currentPage + 1}`}
          className="max-h-screen w-auto max-w-full object-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        />
      </AnimatePresence>

      {/* Page dots */}
      <div className="fixed inset-x-0 bottom-4 flex items-center justify-center gap-1 px-4">
        <button onClick={goPrev} className="p-1 text-foreground/50"><ChevronLeft size={16} /></button>
        <span className="text-xs text-foreground/50">{currentPage + 1} / {pages.length}</span>
        <button onClick={goNext} className="p-1 text-foreground/50"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}

function ReaderSettingsPanel() {
  const { settings, update } = useReadingSettings();

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      className="fixed inset-x-0 top-14 z-40 mx-4 rounded-xl border border-border bg-card p-4 shadow-2xl"
    >
      <div className="space-y-4">
        {/* Reading mode */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">Mode</p>
          <div className="flex gap-2">
            {(["vertical", "horizontal"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => update({ readingMode: mode })}
                className={`flex-1 rounded-lg py-2 text-xs font-medium capitalize transition-colors ${
                  settings.readingMode === mode ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Direction (only for horizontal) */}
        {settings.readingMode === "horizontal" && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">Direction</p>
            <div className="flex gap-2">
              {(["rtl", "ltr"] as const).map((dir) => (
                <button
                  key={dir}
                  onClick={() => update({ readingDirection: dir })}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium uppercase transition-colors ${
                    settings.readingDirection === dir ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Background */}
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase">Background</p>
          <div className="flex gap-2">
            {(["dark", "light", "sepia"] as const).map((bg) => (
              <button
                key={bg}
                onClick={() => update({ readerBackground: bg })}
                className={`flex-1 rounded-lg py-2 text-xs font-medium capitalize transition-colors ${
                  settings.readerBackground === bg ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
