import { Link } from "react-router-dom";
import { Play, Loader2 } from "lucide-react";
import type { SearchResult } from "@/hooks/useSearchSuggestions";

interface Props {
  suggestions: SearchResult[];
  isLoading: boolean;
  query: string;
  onSelect: () => void;
}

const SearchSuggestions = ({ suggestions, isLoading, query, onSelect }: Props) => {
  if (query.trim().length < 2) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 z-[100] bg-popover border border-border rounded-lg shadow-xl overflow-hidden max-h-[420px] overflow-y-auto">
      {isLoading && suggestions.length === 0 && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
        </div>
      )}

      {!isLoading && suggestions.length === 0 && (
        <div className="py-6 text-center text-sm text-muted-foreground">
          No results found for "{query}"
        </div>
      )}

      {suggestions.map((item) => (
        <Link
          key={item.id}
          to={`/anime/${item.id}`}
          onClick={onSelect}
          className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/50 transition-colors"
        >
          <img
            src={item.poster}
            alt={item.title}
            className="w-10 h-14 object-cover rounded flex-shrink-0"
            loading="lazy"
            width={40}
            height={56}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{item.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              {item.type && <span>{item.type}</span>}
              {item.tvInfo?.sub && <span>SUB: {item.tvInfo.sub}</span>}
              {item.tvInfo?.dub && <span>DUB: {item.tvInfo.dub}</span>}
            </div>
          </div>
          <Play className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </Link>
      ))}

      {suggestions.length > 0 && (
        <Link
          to={`/search?q=${encodeURIComponent(query)}`}
          onClick={onSelect}
          className="block text-center py-3 text-sm text-primary hover:bg-accent/30 transition-colors border-t border-border"
        >
          View all results for "{query}"
        </Link>
      )}
    </div>
  );
};

export default SearchSuggestions;
