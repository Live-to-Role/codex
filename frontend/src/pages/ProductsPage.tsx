import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Grid, List, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { getProducts } from "@/api/products";
import { getSystems } from "@/api/systems";
import type { Product } from "@/types";

export function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const page = parseInt(searchParams.get("page") || "1");
  const search = searchParams.get("search") || "";
  const system = searchParams.get("system") || "";
  const productType = searchParams.get("type") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["products", { page, search, system, productType }],
    queryFn: () =>
      getProducts({
        page,
        search,
        game_system__slug: system || undefined,
        product_type: productType || undefined,
      }),
  });

  const { data: systemsData } = useQuery({
    queryKey: ["systems"],
    queryFn: () => getSystems(),
  });

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const goToPage = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", String(newPage));
    setSearchParams(newParams);
  };

  const totalPages = data ? Math.ceil(data.count / 50) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Products</h1>
          <p className="text-neutral-500 mt-1">
            {data?.count?.toLocaleString() || 0} products in the database
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost ${showFilters ? "bg-neutral-100" : ""}`}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <div className="flex border border-neutral-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-neutral-100" : "hover:bg-neutral-50"}`}
              aria-label="Grid view"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-neutral-100" : "hover:bg-neutral-50"}`}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="card p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => updateFilter("search", e.target.value)}
                placeholder="Search products..."
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Game System
              </label>
              <select
                value={system}
                onChange={(e) => updateFilter("system", e.target.value)}
                className="input"
              >
                <option value="">All Systems</option>
                {systemsData?.results?.map((s) => (
                  <option key={s.id} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Product Type
              </label>
              <select
                value={productType}
                onChange={(e) => updateFilter("type", e.target.value)}
                className="input"
              >
                <option value="">All Types</option>
                <option value="adventure">Adventure</option>
                <option value="sourcebook">Sourcebook</option>
                <option value="supplement">Supplement</option>
                <option value="bestiary">Bestiary</option>
                <option value="tools">Tools</option>
                <option value="magazine">Magazine</option>
                <option value="core_rules">Core Rules</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-neutral-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-neutral-200 rounded" />
                <div className="h-3 bg-neutral-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === "grid" ? (
        <ProductGrid products={data?.results || []} />
      ) : (
        <ProductList products={data?.results || []} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
            className="btn-ghost disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-neutral-600 px-4">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => goToPage(page + 1)}
            disabled={page >= totalPages}
            className="btn-ghost disabled:opacity-50"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <p className="text-neutral-500">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {products.map((product) => (
        <Link
          key={product.id}
          to={`/products/${product.slug}`}
          className="card overflow-hidden hover:shadow-md transition-shadow group"
        >
          <div className="aspect-[3/4] bg-neutral-200 relative">
            {product.cover_url || product.thumbnail_url ? (
              <img
                src={product.thumbnail_url || product.cover_url}
                alt={product.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-neutral-400" />
              </div>
            )}
          </div>
          <div className="p-3">
            <h3 className="font-medium text-sm text-neutral-900 line-clamp-2 group-hover:text-primary-600 transition-colors">
              {product.title}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              {product.game_system_slug && (
                <span className="badge-primary text-xs">{product.game_system_name}</span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ProductList({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <p className="text-neutral-500">No products found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {products.map((product) => (
        <Link
          key={product.id}
          to={`/products/${product.slug}`}
          className="card p-4 flex gap-4 hover:shadow-md transition-shadow group"
        >
          <div className="w-16 h-20 bg-neutral-200 rounded overflow-hidden flex-shrink-0">
            {product.cover_url || product.thumbnail_url ? (
              <img
                src={product.thumbnail_url || product.cover_url}
                alt={product.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-neutral-400" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">
              {product.title}
            </h3>
            <p className="text-sm text-neutral-500 mt-1">
              {product.publisher_name}
              {product.page_count && ` · ${product.page_count} pages`}
            </p>
            <div className="flex items-center gap-2 mt-2">
              {product.game_system_name && (
                <span className="badge-primary">{product.game_system_name}</span>
              )}
              {product.product_type_display && (
                <span className="badge-secondary">{product.product_type_display}</span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
