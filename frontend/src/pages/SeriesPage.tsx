import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Library, BookOpen, Loader2, Search } from "lucide-react";
import { useState } from "react";
import { getSeries, type ProductSeries } from "@/api/series";

export function SeriesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["series", searchQuery],
    queryFn: () => getSeries({ search: searchQuery }),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-codex-dark flex items-center justify-center border border-codex-ink" style={{ borderRadius: "2px" }}>
          <Library className="w-5 h-5 text-codex-tan" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide">
            Product Series
          </h1>
          <p className="text-sm text-codex-brown/70">
            Browse product lines and series collections
          </p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-codex-brown/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search series..."
            className="input w-full pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-codex-olive" />
        </div>
      ) : data && data.results.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.results.map((series: ProductSeries) => (
            <Link
              key={series.id}
              to={`/series/${series.slug}`}
              className="card p-4 hover:border-codex-olive/50 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-codex-tan flex items-center justify-center flex-shrink-0 border border-codex-brown/20" style={{ borderRadius: "2px" }}>
                  <Library className="w-6 h-6 text-codex-brown/40" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-codex-ink group-hover:text-codex-olive truncate">
                    {series.name}
                  </h3>
                  {series.publisher_name && (
                    <p className="text-sm text-codex-brown/60 truncate">
                      {series.publisher_name}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-1 text-xs text-codex-brown/50">
                    <BookOpen className="w-3 h-3" />
                    <span>{series.product_count} product{series.product_count !== 1 ? "s" : ""}</span>
                  </div>
                </div>
              </div>
              {series.description && (
                <p className="text-sm text-codex-brown/60 mt-3 line-clamp-2">
                  {series.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center">
          <Library className="w-10 h-10 text-codex-brown/30 mx-auto mb-3" />
          <p className="text-codex-brown/70">
            {searchQuery ? "No series found matching your search." : "No product series available yet."}
          </p>
        </div>
      )}
    </div>
  );
}
