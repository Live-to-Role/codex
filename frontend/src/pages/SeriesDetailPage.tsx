import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Library, BookOpen, ChevronRight, Loader2, Users } from "lucide-react";
import { getSeriesDetail } from "@/api/series";

export function SeriesDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: series, isLoading } = useQuery({
    queryKey: ["series", slug],
    queryFn: () => getSeriesDetail(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-codex-olive" />
        </div>
      </div>
    );
  }

  if (!series) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <Library className="w-12 h-12 text-codex-brown/40 mx-auto mb-4" />
        <h2 className="font-display text-xl font-semibold text-codex-ink mb-2">
          Series Not Found
        </h2>
        <Link to="/series" className="btn-primary">
          Browse Series
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-codex-brown/70 mb-6">
        <Link to="/series" className="hover:text-codex-ink">
          Series
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-codex-ink">{series.name}</span>
      </nav>

      <div className="card p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-codex-tan flex items-center justify-center flex-shrink-0 border border-codex-brown/20" style={{ borderRadius: "2px" }}>
            <Library className="w-8 h-8 text-codex-brown/40" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide mb-2">
              {series.name}
            </h1>
            {series.publisher && (
              <Link
                to={`/publishers/${series.publisher.slug}`}
                className="inline-flex items-center gap-1 text-codex-brown/70 hover:text-codex-olive"
              >
                <Users className="w-4 h-4" />
                {series.publisher.name}
              </Link>
            )}
            {series.description && (
              <p className="text-codex-brown/70 mt-4 leading-relaxed">
                {series.description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold text-codex-ink mb-4 tracking-wide">
          Products in this Series ({series.products?.length || 0})
        </h2>
        {series.products && series.products.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {series.products.map((product) => (
              <Link
                key={product.id}
                to={`/products/${product.slug}`}
                className="card overflow-hidden hover:border-codex-olive/50 transition-colors group"
              >
                <div className="aspect-[3/4] bg-codex-tan">
                  {product.thumbnail_url || product.cover_url ? (
                    <img
                      src={product.thumbnail_url || product.cover_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-codex-brown/30" />
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <h3 className="text-sm font-medium text-codex-ink line-clamp-2 group-hover:text-codex-olive">
                    {product.title}
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <BookOpen className="w-10 h-10 text-codex-brown/30 mx-auto mb-3" />
            <p className="text-codex-brown/70">No products in this series yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
