import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getMangaDetail, getMangaChapters } from "@/lib/mangadex";
import { useLibrary } from "@/hooks/use-library";
import { ArrowLeft, BookmarkPlus, BookmarkCheck, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export default function MangaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { add, remove, inLibrary, chapterRead, toggleRead } = useLibrary();
  const [sortAsc, setSortAsc] = useState(false);

  const { data: manga, isLoading } = useQuery({
    queryKey: ["manga-detail", id],
    queryFn: () => getMangaDetail(id!),
    enabled: !!id,
  });

  const { data: chapters, isLoading: loadingChapters } = useQuery({
    queryKey: ["manga-chapters", id],
    queryFn: () => getMangaChapters(id!),
    enabled: !!id,
  });

  const saved = id ? inLibrary(id) : false;

  const sortedChapters = chapters?.data
    ? [...chapters.data].sort((a, b) => {
        const an = parseFloat(a.chapter) || 0;
        const bn = parseFloat(b.chapter) || 0;
        return sortAsc ? an - bn : bn - an;
      })
    : [];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!manga) return null;

  return (
    <div className="safe-bottom min-h-screen">
      {/* Header with cover background */}
      <div className="relative">
        <div className="absolute inset-0 h-64 overflow-hidden">
          {manga.coverUrl && (
            <img src={manga.coverUrl} alt="" className="h-full w-full object-cover blur-xl opacity-30 scale-110" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />
        </div>

        <div className="relative px-4 pt-4">
          <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="flex gap-4">
            <motion.div
              className="w-28 shrink-0 overflow-hidden rounded-lg shadow-2xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <img src={manga.coverUrl} alt={manga.title} className="aspect-[2/3] w-full object-cover" />
            </motion.div>

            <div className="flex flex-col justify-end gap-1.5 pb-1">
              <h1 className="text-lg font-bold leading-tight text-foreground">{manga.title}</h1>
              <p className="text-xs text-muted-foreground">{manga.author}</p>
              <div className="flex flex-wrap gap-1">
                <span className="rounded-md bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary capitalize">
                  {manga.status}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => saved ? remove(manga.id) : add(manga)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                saved
                  ? "bg-primary/15 text-primary"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              {saved ? <BookmarkCheck size={16} /> : <BookmarkPlus size={16} />}
              {saved ? "In Library" : "Add to Library"}
            </button>
          </div>

          {/* Synopsis */}
          {manga.description && (
            <div className="mt-4">
              <p className="text-xs leading-relaxed text-muted-foreground line-clamp-4">{manga.description}</p>
            </div>
          )}

          {/* Tags */}
          {manga.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {manga.tags.slice(0, 8).map((tag) => (
                <span key={tag} className="rounded-md bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chapters */}
      <div className="mt-6 px-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Chapters {chapters ? `(${chapters.total})` : ""}
          </h2>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {sortAsc ? "Oldest first" : "Newest first"}
          </button>
        </div>

        {loadingChapters ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 animate-shimmer rounded-lg bg-gradient-to-r from-muted via-secondary to-muted bg-[length:200%_100%]" />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {sortedChapters.map((ch) => {
              const read = chapterRead(manga.id, ch.id);
              return (
                <div
                  key={ch.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-secondary active:bg-secondary"
                >
                  <button
                    onClick={() => navigate(`/read/${manga.id}/${ch.id}`)}
                    className="flex flex-1 flex-col gap-0.5 text-left"
                  >
                    <span className={`text-sm font-medium ${read ? "text-muted-foreground" : "text-foreground"}`}>
                      Ch. {ch.chapter}
                      {ch.title ? ` — ${ch.title}` : ""}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {ch.scanlationGroup} · {new Date(ch.publishAt).toLocaleDateString()}
                    </span>
                  </button>
                  <button
                    onClick={() => toggleRead(manga.id, ch.id)}
                    className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
                  >
                    {read ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
