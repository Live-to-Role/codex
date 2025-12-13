import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, ExternalLink, BookOpen, ChevronRight } from "lucide-react";
import { getPublisher, getPublisherProducts } from "@/api/publishers";

export function PublisherDetailPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: publisher, isLoading } = useQuery({
    queryKey: ["publisher", slug],
    queryFn: () => getPublisher(slug!),
    enabled: !!slug,
  });

  const { data: products } = useQuery({
    queryKey: ["publisher-products", slug],
    queryFn: () => getPublisherProducts(slug!),
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-neutral-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!publisher) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <Users className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Publisher Not Found</h2>
        <Link to="/publishers" className="btn-primary">Browse Publishers</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-neutral-500 mb-6">
        <Link to="/publishers" className="hover:text-neutral-700">Publishers</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-neutral-900">{publisher.name}</span>
      </nav>

      <div className="flex items-start gap-6 mb-8">
        {publisher.logo_url ? (
          <img src={publisher.logo_url} alt={publisher.name} className="w-24 h-24 rounded-lg object-cover" />
        ) : (
          <div className="w-24 h-24 bg-neutral-200 rounded-lg flex items-center justify-center">
            <Users className="w-12 h-12 text-neutral-400" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-neutral-900">{publisher.name}</h1>
            {publisher.is_verified && <span className="badge-success">Verified</span>}
          </div>
          {publisher.website && (
            <a href={publisher.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
              {publisher.website} <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {publisher.description && <p className="text-neutral-600 mt-4">{publisher.description}</p>}
        </div>
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
              <div className="p-2">
                <h3 className="text-sm font-medium line-clamp-2 group-hover:text-primary-600">{product.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
