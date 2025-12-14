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
  History,
  ChevronDown,
  ChevronUp,
  Edit,
} from "lucide-react";
import { useState } from "react";
import { getProduct, getProductRevisions } from "@/api/products";
import { formatDate, formatShortDate } from "@/lib/utils";
import type { Revision } from "@/api/products";
import { ProductComments } from "@/components/ProductComments";
import { RelatedProducts } from "@/components/RelatedProducts";
import { addAffiliateTracking } from "@/lib/affiliate";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [showHistory, setShowHistory] = useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProduct(slug!),
    enabled: !!slug,
  });

  const { data: revisions } = useQuery({
    queryKey: ["productRevisions", slug],
    queryFn: () => getProductRevisions(slug!),
    enabled: !!slug && showHistory,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-codex-tan rounded w-1/2 mb-4" />
          <div className="h-4 bg-codex-tan rounded w-1/3 mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="aspect-[3/4] bg-codex-tan" style={{ borderRadius: '2px' }} />
            <div className="md:col-span-2 space-y-4">
              <div className="h-4 bg-codex-tan rounded" />
              <div className="h-4 bg-codex-tan rounded" />
              <div className="h-4 bg-codex-tan rounded w-2/3" />
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
          <BookOpen className="w-12 h-12 text-codex-brown/40 mx-auto mb-4" />
          <h2 className="font-display text-xl font-semibold text-codex-ink mb-2">
            Tome Not Found
          </h2>
          <p className="text-codex-brown/70 mb-4">
            The product you seek doesn't exist or has been removed from the archives.
          </p>
          <Link to="/products" className="btn-primary">
            Browse the Archives
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-codex-brown/70 mb-6">
        <Link to="/products" className="hover:text-codex-ink">
          Products
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-codex-ink truncate">{product.title}</span>
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
              <div className="w-full aspect-[3/4] bg-codex-tan flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-codex-brown/40" />
              </div>
            )}
          </div>

          {(product.dtrpg_url || product.itch_url) && (
            <div className="card p-4 space-y-2">
              <h3 className="font-display font-medium text-codex-ink">Acquire</h3>
              {product.dtrpg_url && (
                <a
                  href={addAffiliateTracking(product.dtrpg_url)}
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
            <div className="flex items-start justify-between gap-4">
              <h1 className="font-display text-3xl font-semibold text-codex-ink mb-2 tracking-wide">
                {product.title}
              </h1>
              <Link
                to={`/products/${product.slug}/edit`}
                className="btn-ghost flex items-center gap-1 text-sm flex-shrink-0"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
            </div>
            {product.publisher && (
              <p className="text-lg text-codex-brown">
                by{" "}
                <Link
                  to={`/publishers/${product.publisher.slug}`}
                  className="text-codex-dark hover:text-codex-olive"
                >
                  {product.publisher.name}
                </Link>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-codex-brown">
            {product.game_system && (
              <Link
                to={`/systems/${product.game_system.slug}`}
                className="flex items-center gap-1 hover:text-codex-olive"
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
            <div className="prose prose-stone max-w-none text-codex-brown leading-relaxed">
              <p>{product.description}</p>
            </div>
          )}

          {(product.level_range_min || product.level_range_max) && (
            <div className="card p-4">
              <h3 className="font-display font-medium text-codex-ink mb-2">Adventure Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {(product.level_range_min || product.level_range_max) && (
                  <div>
                    <span className="text-codex-brown/70">Level Range:</span>{" "}
                    <span className="text-codex-ink">
                      {product.level_range_min}
                      {product.level_range_max && product.level_range_max !== product.level_range_min
                        ? `-${product.level_range_max}`
                        : ""}
                    </span>
                  </div>
                )}
                {product.estimated_runtime && (
                  <div>
                    <span className="text-codex-brown/70">Runtime:</span>{" "}
                    <span className="text-codex-ink">{product.estimated_runtime}</span>
                  </div>
                )}
                {product.party_size_min && (
                  <div>
                    <span className="text-codex-brown/70">Party Size:</span>{" "}
                    <span className="text-codex-ink">
                      {product.party_size_min}
                      {product.party_size_max && product.party_size_max !== product.party_size_min
                        ? `-${product.party_size_max}`
                        : ""}
                    </span>
                  </div>
                )}
                {product.setting && (
                  <div>
                    <span className="text-codex-brown/70">Setting:</span>{" "}
                    <span className="text-codex-ink">{product.setting}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {product.credits && product.credits.length > 0 && (
            <div className="card p-4">
              <h3 className="font-display font-medium text-codex-ink mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Credits
              </h3>
              <div className="space-y-2">
                {product.credits.map((credit) => (
                  <div key={credit.id} className="flex items-center justify-between text-sm">
                    <Link
                      to={`/authors/${credit.author.slug}`}
                      className="text-codex-dark hover:text-codex-olive"
                    >
                      {credit.author.name}
                    </Link>
                    <span className="text-codex-brown/70">{credit.role_display}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.tags && product.tags.length > 0 && (
            <div>
              <h3 className="font-display font-medium text-codex-ink mb-2">Tags</h3>
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
            <div className="card p-4 bg-amber-900/5 border-amber-900/20">
              <h3 className="font-display font-medium text-amber-900 mb-2 flex items-center gap-2">
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

          <div className="text-sm text-codex-brown/60 pt-4 border-t border-codex-brown/20">
            {product.created_at && (
              <p>Added {formatDate(product.created_at)}</p>
            )}
            {product.updated_at && product.updated_at !== product.created_at && (
              <p>Last updated {formatDate(product.updated_at)}</p>
            )}
          </div>

          <div className="pt-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 text-sm text-codex-brown/70 hover:text-codex-ink transition-colors"
            >
              <History className="w-4 h-4" />
              Edit History
              {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            {showHistory && (
              <div className="mt-3 space-y-2">
                {revisions && revisions.length > 0 ? (
                  revisions.map((revision: Revision) => (
                    <div key={revision.id} className="card p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-codex-brown/70">
                          {revision.user?.public_name || "Anonymous"}
                        </span>
                        <span className="text-codex-brown/50 text-xs">
                          {formatDate(revision.created_at)}
                        </span>
                      </div>
                      {revision.comment && (
                        <p className="text-codex-ink">{revision.comment}</p>
                      )}
                      {Object.keys(revision.changes).length > 0 && (
                        <div className="mt-2 text-xs text-codex-brown/60">
                          Changed: {Object.keys(revision.changes).join(", ")}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-codex-brown/50 py-2">
                    No edit history available.
                  </p>
                )}
              </div>
            )}
          </div>

          <RelatedProducts productSlug={product.slug} />

          <ProductComments productSlug={product.slug} />
        </div>
      </div>
    </div>
  );
}
