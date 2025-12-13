import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Gamepad2, BookOpen, ChevronRight } from "lucide-react";
import { getSystem, getSystemProducts } from "@/api/systems";

export function SystemDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: system, isLoading } = useQuery({
    queryKey: ["system", slug],
    queryFn: () => getSystem(slug!),
    enabled: !!slug,
  });

  const { data: products } = useQuery({
    queryKey: ["system-products", slug],
    queryFn: () => getSystemProducts(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return <div className="max-w-4xl mx-auto px-4 py-8"><div className="animate-pulse"><div className="h-8 bg-neutral-200 rounded w-1/3 mb-4" /></div></div>;
  }

  if (!system) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <Gamepad2 className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Game System Not Found</h2>
        <Link to="/systems" className="btn-primary">Browse Systems</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
        <Link to="/systems" className="hover:text-neutral-700">Systems</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-neutral-900">{system.name}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">{system.name}</h1>
        {system.publisher && (
          <p className="text-neutral-600">
            Published by <Link to={`/publishers/${system.publisher.slug}`} className="text-primary-600 hover:text-primary-700">{system.publisher.name}</Link>
          </p>
        )}
        {system.description && <p className="text-neutral-600 mt-4">{system.description}</p>}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Products ({products?.length || 0})</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {products?.map((product) => (
            <Link key={product.id} to={`/products/${product.slug}`} className="card overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-[3/4] bg-neutral-200">
                {product.thumbnail_url || product.cover_url ? (
                  <img src={product.thumbnail_url || product.cover_url} alt={product.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-8 h-8 text-neutral-400" /></div>
                )}
              </div>
              <div className="p-2"><h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary-600">{product.title}</h3></div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
