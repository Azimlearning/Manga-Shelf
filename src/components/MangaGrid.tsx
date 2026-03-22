import MangaCard from "./MangaCard";
import type { MangaSearchResult } from "@/lib/mangadex";

interface MangaGridProps {
  manga: MangaSearchResult[];
  loading?: boolean;
}

function SkeletonCard() {
  return (
    <div className="flex flex-col">
      <div className="aspect-[2/3] w-full animate-shimmer rounded-lg bg-gradient-to-r from-muted via-secondary to-muted bg-[length:200%_100%]" />
      <div className="mt-2 h-3 w-3/4 rounded bg-muted" />
      <div className="mt-1 h-2.5 w-1/2 rounded bg-muted" />
    </div>
  );
}

export default function MangaGrid({ manga, loading }: MangaGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (manga.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">No manga found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {manga.map((m) => (
        <MangaCard key={m.id} id={m.id} title={m.title} coverUrl={m.coverUrl} />
      ))}
    </div>
  );
}
