import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Loader2 } from "lucide-react";
import apiClient from "@/api/client";
import type { Product } from "@/types";

interface ProductRelation {
  id: string;
  to_product: Product;
  relation_type: string;
  relation_type_display: string;
  notes: string;
}

interface RelatedProductsProps {
  productSlug: string;
}

async function getProductRelations(slug: string): Promise<ProductRelation[]> {
  try {
    const response = await apiClient.get<ProductRelation[]>(`/products/${slug}/relations/`);
    return response.data;
  } catch {
    return [];
  }
}

export function RelatedProducts({ productSlug }: RelatedProductsProps) {
  const { data: relations, isLoading } = useQuery({
    queryKey: ["productRelations", productSlug],
    queryFn: () => getProductRelations(productSlug),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-codex-olive" />
      </div>
    );
  }

  if (!relations || relations.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 pt-6 border-t border-codex-brown/20">
      <h3 className="font-display font-medium text-codex-ink mb-4">
        Related Products
      </h3>
      <div className="space-y-3">
        {relations.map((relation) => (
          <Link
            key={relation.id}
            to={`/products/${relation.to_product.slug}`}
            className="flex items-center gap-3 p-3 bg-codex-cream/50 hover:bg-codex-tan/50 transition-colors group"
            style={{ borderRadius: "2px" }}
          >
            <div className="w-12 h-16 bg-codex-tan flex-shrink-0 border border-codex-brown/20" style={{ borderRadius: "2px" }}>
              {relation.to_product.thumbnail_url || relation.to_product.cover_url ? (
                <img
                  src={relation.to_product.thumbnail_url || relation.to_product.cover_url}
                  alt={relation.to_product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-codex-brown/30" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-codex-olive font-medium uppercase tracking-wide">
                {relation.relation_type_display}
              </span>
              <h4 className="font-medium text-codex-ink group-hover:text-codex-olive truncate">
                {relation.to_product.title}
              </h4>
              {relation.notes && (
                <p className="text-xs text-codex-brown/60 truncate">{relation.notes}</p>
              )}
            </div>
            <ArrowRight className="w-4 h-4 text-codex-brown/30 group-hover:text-codex-olive flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
