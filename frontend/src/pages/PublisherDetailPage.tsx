import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, ExternalLink, BookOpen, ChevronRight, ChevronDown, BadgeCheck, Loader2 } from "lucide-react";
import { getPublisher, getPublisherProducts } from "@/api/publishers";
import type { Product } from "@/types";

interface GameSystemGroup {
  id: string | null;
  name: string;
  slug: string | null;
  logo_url?: string;
  products: Product[];
}

export function PublisherDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [expandedSystems, setExpandedSystems] = useState<Set<string | null>>(new Set());

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

  // Group products by game system
  const groupedProducts = useMemo(() => {
    if (!products) return [];
    
    const groups = new Map<string | null, GameSystemGroup>();
    
    for (const product of products) {
      const systemId = product.game_system?.id ?? null;
      
      if (!groups.has(systemId)) {
        groups.set(systemId, {
          id: systemId,
          name: product.game_system?.name ?? "System Neutral",
          slug: product.game_system?.slug ?? null,
          logo_url: product.game_system?.logo_url,
          products: [],
        });
      }
      
      groups.get(systemId)!.products.push(product);
    }
    
    // Sort groups: named systems first (alphabetically), then "System Neutral" last
    return Array.from(groups.values()).sort((a, b) => {
      if (a.id === null) return 1;
      if (b.id === null) return -1;
      return a.name.localeCompare(b.name);
    });
  }, [products]);

  // Initialize all systems as expanded on first load
  useMemo(() => {
    if (groupedProducts.length > 0 && expandedSystems.size === 0) {
      setExpandedSystems(new Set(groupedProducts.map(g => g.id)));
    }
  }, [groupedProducts, expandedSystems.size]);

  const toggleSystem = (systemId: string | null) => {
    setExpandedSystems(prev => {
      const next = new Set(prev);
      if (next.has(systemId)) {
        next.delete(systemId);
      } else {
        next.add(systemId);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-codex-olive" />
        </div>
      </div>
    );
  }

  if (!publisher) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <Users className="w-12 h-12 text-codex-brown/40 mx-auto mb-4" />
        <h2 className="font-display text-xl font-semibold text-codex-ink mb-2">Publisher Not Found</h2>
        <Link to="/publishers" className="btn-primary">Browse Publishers</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <nav className="flex items-center gap-2 text-sm text-codex-brown/70 mb-6">
        <Link to="/publishers" className="hover:text-codex-ink">Publishers</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-codex-ink">{publisher.name}</span>
      </nav>

      <div className="card p-6 mb-8">
        <div className="flex items-start gap-6">
          {publisher.logo_url ? (
            <img src={publisher.logo_url} alt={publisher.name} className="w-24 h-24 object-cover border border-codex-brown/20" style={{ borderRadius: '2px' }} />
          ) : (
            <div className="w-24 h-24 bg-codex-tan flex items-center justify-center border border-codex-brown/20" style={{ borderRadius: '2px' }}>
              <Users className="w-12 h-12 text-codex-brown/40" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-display text-3xl font-semibold text-codex-ink tracking-wide">{publisher.name}</h1>
              {publisher.is_verified && (
                <span className="badge-success flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  Verified Publisher
                </span>
              )}
            </div>
            {publisher.website && (
              <a href={publisher.website} target="_blank" rel="noopener noreferrer" className="text-codex-dark hover:text-codex-olive inline-flex items-center gap-1">
                {publisher.website} <ExternalLink className="w-4 h-4" />
              </a>
            )}
            {publisher.description && <p className="text-codex-brown/70 mt-4 leading-relaxed">{publisher.description}</p>}
            {publisher.founded_year && (
              <p className="text-sm text-codex-brown/50 mt-2">Founded {publisher.founded_year}</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold text-codex-ink mb-4 tracking-wide">
          Products ({products?.length || 0})
        </h2>
        
        <div className="space-y-4">
          {groupedProducts.map((group) => {
            const isExpanded = expandedSystems.has(group.id);
            
            return (
              <div key={group.id ?? "system-neutral"} className="card overflow-hidden">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleSystem(group.id)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-codex-tan/50 transition-colors text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-codex-brown/60 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-codex-brown/60 flex-shrink-0" />
                  )}
                  
                  {group.logo_url ? (
                    <img 
                      src={group.logo_url} 
                      alt={group.name} 
                      className="w-8 h-8 object-contain flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-codex-tan rounded flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-codex-brown/40" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    {group.slug ? (
                      <Link 
                        to={`/systems/${group.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-display font-semibold text-codex-ink hover:text-codex-olive"
                      >
                        {group.name}
                      </Link>
                    ) : (
                      <span className="font-display font-semibold text-codex-ink">
                        {group.name}
                      </span>
                    )}
                  </div>
                  
                  <span className="text-sm text-codex-brown/60 flex-shrink-0">
                    {group.products.length} {group.products.length === 1 ? "product" : "products"}
                  </span>
                </button>
                
                {/* Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-codex-brown/10 p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {group.products.map((product) => (
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
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
