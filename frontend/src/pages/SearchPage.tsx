import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, BookOpen, Users, Gamepad2 } from "lucide-react";
import { search } from "@/api/search";

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);

  const { data, isLoading } = useQuery({
    queryKey: ["search", initialQuery],
    queryFn: () => search({ q: initialQuery }),
    enabled: !!initialQuery,
  });

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "product": return BookOpen;
      case "publisher": return Users;
      case "game_system": return Gamepad2;
      default: return Search;
    }
  };

  const getLink = (result: { type: string; data: { slug?: string } }) => {
    switch (result.type) {
      case "product": return `/products/${result.data.slug}`;
      case "publisher": return `/publishers/${result.data.slug}`;
      case "game_system": return `/systems/${result.data.slug}`;
      default: return "#";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-neutral-900 mb-6">Search</h1>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, publishers, systems..."
            className="input pl-12 text-lg py-3"
            autoFocus
          />
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-5 bg-neutral-200 rounded w-1/2 mb-2" />
              <div className="h-4 bg-neutral-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : initialQuery && data ? (
        <div>
          <p className="text-neutral-500 mb-4">{data.total} results for "{data.query}"</p>
          {data.results.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-500">No results found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.results.map((result, i) => {
                const Icon = getIcon(result.type);
                const item = result.data as { slug?: string; name?: string; title?: string };
                return (
                  <Link key={i} to={getLink(result)} className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900">{item.title || item.name}</h3>
                      <p className="text-sm text-neutral-500 capitalize">{result.type.replace("_", " ")}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12 text-neutral-500">Enter a search term to get started</div>
      )}
    </div>
  );
}
