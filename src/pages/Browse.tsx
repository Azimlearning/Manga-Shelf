import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import SearchBar from "@/components/SearchBar";
import MangaGrid from "@/components/MangaGrid";
import { searchManga, getPopularManga } from "@/lib/mangadex";

export default function BrowsePage() {
  const [query, setQuery] = useState("");

  const { data: popular, isLoading: loadingPopular } = useQuery({
    queryKey: ["popular-manga"],
    queryFn: () => getPopularManga(20),
    staleTime: 5 * 60 * 1000,
  });

  const { data: searchResults, isLoading: loadingSearch } = useQuery({
    queryKey: ["search-manga", query],
    queryFn: () => searchManga(query),
    enabled: query.length >= 2,
    staleTime: 2 * 60 * 1000,
  });

  const manga = query.length >= 2 ? searchResults?.data ?? [] : popular ?? [];
  const loading = query.length >= 2 ? loadingSearch : loadingPopular;

  return (
    <div className="safe-bottom min-h-screen px-4 pt-4">
      <header className="mb-4">
        <h1 className="mb-3 text-xl font-bold text-foreground">Browse</h1>
        <SearchBar onSearch={setQuery} autoFocus />
      </header>

      <div className="mb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {query.length >= 2 ? `Results for "${query}"` : "Popular"}
        </p>
      </div>

      <MangaGrid manga={manga} loading={loading} />
    </div>
  );
}
