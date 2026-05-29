import { useState, useEffect, useRef } from "react";
import { searchAnime } from "@/services/animeApi";

export interface SearchResult {
  id: string;
  title: string;
  poster: string;
  type?: string;
  tvInfo?: {
    sub?: number;
    dub?: number;
    eps?: number;
  };
}

export const useSearchSuggestions = (query: string, delay = 400) => {
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const timeout = setTimeout(async () => {
      // Cancel previous request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const data = await searchAnime(trimmed, 1);
        const results: SearchResult[] = (data?.data || []).slice(0, 8).map((item: any) => ({
          id: item.id,
          title: item.title,
          poster: item.poster,
          type: item.tvInfo?.showType,
          tvInfo: item.tvInfo,
        }));
        setSuggestions(results);
      } catch {
        // ignore aborted
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [query, delay]);

  return { suggestions, isLoading };
};
