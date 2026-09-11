import { useEffect, useMemo, useState } from "react";
import { Search, Grid3X3, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AnimeCard from "@/components/AnimeCard";
import { getAnimeByCategory } from "@/services/animeApi";
import type { AnimeBasic } from "@/types/anime";

const TVSeries = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [series, setSeries] = useState<AnimeBasic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnimeByCategory("all", 1)
      .then((result) => setSeries(result.data || []))
      .catch((error) => console.error("Failed to fetch series:", error))
      .finally(() => setLoading(false));
  }, []);

  const filteredSeries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return [...series]
      .filter((item) => !query || item.title.toLowerCase().includes(query))
      .sort((a, b) => {
        if (sortBy === "name") return a.title.localeCompare(b.title);
        return (Date.parse(b.tvInfo?.releaseDate || "") || 0) - (Date.parse(a.tvInfo?.releaseDate || "") || 0);
      });
  }, [searchQuery, series, sortBy]);

  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">TV Series</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search TV series..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Sort by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Newest</SelectItem>
              <SelectItem value="name">A-Z</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border border-border rounded-lg p-1">
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")}><Grid3X3 className="h-4 w-4" /></Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")}><List className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="ml-3 text-muted-foreground">Loading TV series...</span></div>
      ) : (
        <>
          <p className="text-muted-foreground mb-6">Showing {filteredSeries.length} of {series.length} results</p>
          <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" : "grid-cols-2 md:grid-cols-4"}`}>
            {filteredSeries.map((item) => (
              <AnimeCard key={item.id} id={item.id} title={item.title} image={item.poster} year={Number(item.tvInfo?.releaseDate?.match(/\d{4}/)?.[0]) || undefined} subtitle={item.tvInfo?.sub ? "SUB" : undefined} isDubbed={!!item.tvInfo?.dub} className="h-full" />
            ))}
          </div>
          {filteredSeries.length === 0 && <div className="text-center py-12"><p className="text-muted-foreground">No TV series found.</p></div>}
        </>
      )}
    </div>
  );
};

export default TVSeries;
