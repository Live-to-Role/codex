import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  FileText,
  ExternalLink,
  Users,
  Tag,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { getProduct } from "@/api/products";
import { formatDate, formatShortDate } from "@/lib/utils";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProduct(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/2 mb-4" />
          <div className="h-4 bg-neutral-200 rounded w-1/3 mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="aspect-[3/4] bg-neutral-200 rounded-lg" />
            <div className="md:col-span-2 space-y-4">
              <div className="h-4 bg-neutral-200 rounded" />
              <div className="h-4 bg-neutral-200 rounded" />
              <div className="h-4 bg-neutral-200 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Product Not Found
          </h2>
          <p className="text-neutral-500 mb-4">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/products" className="btn-primary">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
        <Link to="/products" className="hover:text-neutral-700">
          Products
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-neutral-900 truncate">{product.title}</span>
      </nav>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <div className="card overflow-hidden">
            {product.cover_url ? (
              <img
                src={product.cover_url}
                alt={product.title}
                className="w-full aspect-[3/4] object-cover"
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-neutral-200 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-neutral-400" />
              </div>
            )}
          </div>

          {(product.dtrpg_url || product.itch_url) && (
            <div className="card p-4 space-y-2">
              <h3 className="font-medium text-neutral-900">Buy</h3>
              {product.dtrpg_url && (
                <a
                  href={product.dtrpg_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full justify-center"
                >
                  DriveThruRPG
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              {product.itch_url && (
                <a
                  href={product.itch_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full justify-center"
                >
                  itch.io
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {product.status === "verified" && (
                <span className="badge-success">Verified</span>
              )}
              {product.product_type_display && (
                <span className="badge-secondary">{product.product_type_display}</span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              {product.title}
            </h1>
            {product.publisher && (
              <p className="text-lg text-neutral-600">
                by{" "}
                <Link
                  to={`/publishers/${product.publisher.slug}`}
                  className="text-primary-600 hover:text-primary-700"
                >
                  {product.publisher.name}
                </Link>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
            {product.game_system && (
              <Link
                to={`/systems/${product.game_system.slug}`}
                className="flex items-center gap-1 hover:text-primary-600"
              >
                <Tag className="w-4 h-4" />
                {product.game_system.name}
              </Link>
            )}
            {product.page_count && (
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {product.page_count} pages
              </span>
            )}
            {product.publication_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatShortDate(product.publication_date)}
              </span>
            )}
          </div>

          {product.description && (
            <div className="prose prose-neutral max-w-none">
              <p>{product.description}</p>
            </div>
          )}

          {(product.level_range_min || product.level_range_max) && (
            <div className="card p-4">
              <h3 className="font-medium text-neutral-900 mb-2">Adventure Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {(product.level_range_min || product.level_range_max) && (
                  <div>
                    <span className="text-neutral-500">Level Range:</span>{" "}
                    <span className="text-neutral-900">
                      {product.level_range_min}
                      {product.level_range_max && product.level_range_max !== product.level_range_min
                        ? `-${product.level_range_max}`
                        : ""}
                    </span>
                  </div>
                )}
                {product.estimated_runtime && (
                  <div>
                    <span className="text-neutral-500">Runtime:</span>{" "}
                    <span className="text-neutral-900">{product.estimated_runtime}</span>
                  </div>
                )}
                {product.party_size_min && (
                  <div>
                    <span className="text-neutral-500">Party Size:</span>{" "}
                    <span className="text-neutral-900">
                      {product.party_size_min}
                      {product.party_size_max && product.party_size_max !== product.party_size_min
                        ? `-${product.party_size_max}`
                        : ""}
                    </span>
                  </div>
                )}
                {product.setting && (
                  <div>
                    <span className="text-neutral-500">Setting:</span>{" "}
                    <span className="text-neutral-900">{product.setting}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {product.credits && product.credits.length > 0 && (
            <div className="card p-4">
              <h3 className="font-medium text-neutral-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Credits
              </h3>
              <div className="space-y-2">
                {product.credits.map((credit) => (
                  <div key={credit.id} className="flex items-center justify-between text-sm">
                    <Link
                      to={`/authors/${credit.author.slug}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {credit.author.name}
                    </Link>
                    <span className="text-neutral-500">{credit.role_display}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.tags && product.tags.length > 0 && (
            <div>
              <h3 className="font-medium text-neutral-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="badge-secondary">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {product.content_warnings && product.content_warnings.length > 0 && (
            <div className="card p-4 bg-amber-50 border-amber-200">
              <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Content Warnings
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.content_warnings.map((warning) => (
                  <span key={warning} className="badge-warning">
                    {warning}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-sm text-neutral-500 pt-4 border-t border-neutral-200">
            {product.created_at && (
              <p>Added {formatDate(product.created_at)}</p>
            )}
            {product.updated_at && product.updated_at !== product.created_at && (
              <p>Last updated {formatDate(product.updated_at)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
