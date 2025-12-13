import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, ChevronLeft, ChevronRight } from "lucide-react";
import { getPublishers } from "@/api/publishers";

export function PublishersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["publishers", { page, search }],
    queryFn: () => getPublishers({ page, search }),
  });

  const goToPage = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(newPage));
    setSearchParams(newParams);
  };

  const totalPages = data ? Math.ceil(data.count / 50) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Publishers</h1>
        <p className="text-neutral-500 mt-1">
          {data?.count?.toLocaleString() || 0} publishers in the database
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse">
              <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-neutral-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {data?.results?.map((publisher) => (
            <Link
              key={publisher.id}
              to={`/publishers/${publisher.slug}`}
              className="card p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-3">
                {publisher.logo_url ? (
                  <img
                    src={publisher.logo_url}
                    alt={publisher.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-neutral-200 rounded flex items-center justify-center">
                    <Users className="w-6 h-6 text-neutral-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">
                    {publisher.name}
                  </h3>
                  {publisher.product_count !== undefined && (
                    <p className="text-sm text-neutral-500">
                      {publisher.product_count} products
                    </p>
                  )}
                  {publisher.is_verified && (
                    <span className="badge-success text-xs mt-1">Verified</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button onClick={() => goToPage(page - 1)} disabled={page <= 1} className="btn-ghost disabled:opacity-50">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="text-neutral-600 px-4">Page {page} of {totalPages}</span>
          <button onClick={() => goToPage(page + 1)} disabled={page >= totalPages} className="btn-ghost disabled:opacity-50">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
