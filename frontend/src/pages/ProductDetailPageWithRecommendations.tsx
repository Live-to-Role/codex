import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getProduct } from "@/api/products";
import { ProductDetailPage } from "./ProductDetailPage";
import { useSimilarProducts } from "@/hooks/useRecommendations";
import { RecommendationCard } from "@/components/RecommendationCard";
import type { Product } from "@/types";

export function ProductDetailPageWithRecommendations() {
  const { slug } = useParams<{ slug: string }>();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => getProduct(slug!),
    enabled: !!slug,
  });

  const { data: similarProducts } = useSimilarProducts(
    slug || "",
    6
  );

  if (isLoading || error || !product) {
    return <ProductDetailPage />;
  }

  return (
    <div>
      <ProductDetailPage />
      
      {similarProducts && similarProducts.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-codex-brown/20">
          <h2 className="font-display text-2xl font-semibold text-codex-ink mb-6 tracking-wide">
            Similar Products
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {similarProducts.map((item) => (
              <RecommendationCard
                key={item.product.id}
                product={item.product as Product}
                score={item.score}
                reason={item.reason}
                showAttribution={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
