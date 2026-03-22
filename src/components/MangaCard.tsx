import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface MangaCardProps {
  id: string;
  title: string;
  coverUrl: string;
  lastReadChapter?: string;
  unreadCount?: number;
}

export default function MangaCard({ id, title, coverUrl, lastReadChapter, unreadCount }: MangaCardProps) {
  const navigate = useNavigate();

  return (
    <motion.button
      onClick={() => navigate(`/manga/${id}`)}
      className="group relative flex flex-col text-left"
      whileTap={{ scale: 0.97 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-muted">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground text-xs">
            No Cover
          </div>
        )}

        {/* Unread badge */}
        {unreadCount !== undefined && unreadCount > 0 && (
          <div className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5">
            <span className="text-[10px] font-bold text-primary-foreground">{unreadCount}</span>
          </div>
        )}

        {/* Bottom gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/90 to-transparent" />
      </div>

      <div className="mt-1.5 space-y-0.5 px-0.5">
        <p className="line-clamp-2 text-xs font-medium leading-tight text-foreground">{title}</p>
        {lastReadChapter && (
          <p className="text-[10px] text-muted-foreground">Ch. {lastReadChapter}</p>
        )}
      </div>
    </motion.button>
  );
}
