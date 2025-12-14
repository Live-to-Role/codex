import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Building2,
  BookOpen,
  TrendingUp,
  Eye,
  Edit,
  Plus,
  Loader2,
  BarChart3,
  Calendar,
  Users,
} from "lucide-react";
import { getPublisher, getPublisherProducts } from "@/api/publishers";

interface PublisherDashboardPageProps {
  publisherSlug?: string;
}

export function PublisherDashboardPage({ publisherSlug }: PublisherDashboardPageProps) {
  const slug = publisherSlug || "demo-publisher";

  const { data: publisher, isLoading: publisherLoading } = useQuery({
    queryKey: ["publisher", slug],
    queryFn: () => getPublisher(slug),
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["publisher-products", slug],
    queryFn: () => getPublisherProducts(slug),
  });

  const isLoading = publisherLoading || productsLoading;

  const stats = {
    totalProducts: products?.length || 0,
    verifiedProducts: products?.filter((p) => p.status === "verified").length || 0,
    totalViews: 12847,
    thisMonth: 1234,
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-codex-olive" />
        </div>
      </div>
    );
  }

  if (!publisher) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <Building2 className="w-12 h-12 text-codex-brown/40 mx-auto mb-4" />
        <h2 className="font-display text-xl font-semibold text-codex-ink mb-2">
          Publisher Dashboard
        </h2>
        <p className="text-codex-brown/70 mb-4">
          You don't have a publisher account linked yet.
        </p>
        <Link to="/publishers" className="btn-primary">
          Browse Publishers
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-codex-tan flex items-center justify-center border border-codex-brown/20" style={{ borderRadius: "2px" }}>
            {publisher.logo_url ? (
              <img src={publisher.logo_url} alt={publisher.name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-7 h-7 text-codex-brown/40" />
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-codex-ink tracking-wide">
              {publisher.name}
            </h1>
            <p className="text-sm text-codex-brown/70">Publisher Dashboard</p>
          </div>
        </div>
        <Link to={`/publishers/${publisher.slug}`} className="btn-ghost flex items-center gap-2">
          <Eye className="w-4 h-4" />
          View Public Page
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-codex-brown/60 mb-1">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm">Products</span>
          </div>
          <div className="font-display text-2xl font-semibold text-codex-ink">
            {stats.totalProducts}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-codex-brown/60 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Verified</span>
          </div>
          <div className="font-display text-2xl font-semibold text-codex-olive">
            {stats.verifiedProducts}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-codex-brown/60 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">Total Views</span>
          </div>
          <div className="font-display text-2xl font-semibold text-codex-ink">
            {stats.totalViews.toLocaleString()}
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-codex-brown/60 mb-1">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">This Month</span>
          </div>
          <div className="font-display text-2xl font-semibold text-codex-ink">
            {stats.thisMonth.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="card">
            <div className="p-4 border-b border-codex-brown/10 flex items-center justify-between">
              <h2 className="font-display font-semibold text-codex-ink">Your Products</h2>
              <button className="btn-primary flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
            <div className="divide-y divide-codex-brown/10">
              {products && products.length > 0 ? (
                products.slice(0, 10).map((product) => (
                  <div key={product.id} className="p-4 flex items-center gap-4">
                    <div className="w-12 h-16 bg-codex-tan flex-shrink-0 border border-codex-brown/20" style={{ borderRadius: "2px" }}>
                      {product.thumbnail_url || product.cover_url ? (
                        <img
                          src={product.thumbnail_url || product.cover_url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-codex-brown/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${product.slug}`}
                        className="font-medium text-codex-ink hover:text-codex-olive truncate block"
                      >
                        {product.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        {product.status === "verified" ? (
                          <span className="badge-success text-xs">Verified</span>
                        ) : product.status === "published" ? (
                          <span className="badge-secondary text-xs">Published</span>
                        ) : (
                          <span className="badge-warning text-xs">Draft</span>
                        )}
                        <span className="text-xs text-codex-brown/50">
                          {product.product_type_display}
                        </span>
                      </div>
                    </div>
                    <Link
                      to={`/products/${product.slug}/edit`}
                      className="btn-ghost p-2"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <BookOpen className="w-10 h-10 text-codex-brown/30 mx-auto mb-3" />
                  <p className="text-codex-brown/70">No products yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-4">
            <h3 className="font-display font-semibold text-codex-ink mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="btn-secondary w-full justify-start gap-2">
                <Plus className="w-4 h-4" />
                Add New Product
              </button>
              <button className="btn-secondary w-full justify-start gap-2">
                <Users className="w-4 h-4" />
                Manage Authors
              </button>
              <Link
                to={`/publishers/${publisher.slug}`}
                className="btn-secondary w-full justify-start gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Publisher Profile
              </Link>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="font-display font-semibold text-codex-ink mb-4">Recent Activity</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-codex-olive rounded-full mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-codex-ink">Product verified</p>
                  <p className="text-codex-brown/50 text-xs">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-codex-brown/30 rounded-full mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-codex-ink">New file hash registered</p>
                  <p className="text-codex-brown/50 text-xs">Yesterday</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-codex-brown/30 rounded-full mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-codex-ink">Community edit approved</p>
                  <p className="text-codex-brown/50 text-xs">3 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
