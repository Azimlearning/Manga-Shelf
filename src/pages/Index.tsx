import { useLibrary } from "@/hooks/use-library";
import MangaCard from "@/components/MangaCard";
import { BookOpen } from "lucide-react";
import { motion } from "framer-motion";

export default function LibraryPage() {
  const { library } = useLibrary();

  return (
    <div className="safe-bottom min-h-screen px-4 pt-4">
      <header className="mb-5 flex items-center justify-between">
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
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {library.map((entry) => (
            <MangaCard
              key={entry.manga.id}
              id={entry.manga.id}
              title={entry.manga.title}
              coverUrl={entry.manga.coverUrl}
              lastReadChapter={entry.lastReadChapter || undefined}
              unreadCount={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
