import { Product } from "@/types";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { RecommendationCard } from "./RecommendationCard";

interface RecommendationSectionProps {
  title: string;
  products: (Product & { score?: number; reason?: string; source?: any })[];
  seeAllLink?: string;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
}

export function RecommendationSection({
  title,
  products,
  seeAllLink,
  loading = false,
  error,
  emptyMessage = "No recommendations available",
}: RecommendationSectionProps) {
  if (loading) {
    return (
      <div className="py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-codex-ink tracking-wide">{title}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] w-full rounded-lg bg-codex-tan" />
              <div className="mt-2 h-4 rounded bg-codex-tan" />
              <div className="mt-1 h-3 w-3/4 rounded bg-codex-tan" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-codex-ink tracking-wide">{title}</h2>
        </div>
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
          Failed to load recommendations
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-codex-ink tracking-wide">{title}</h2>
        </div>
        <div className="rounded-lg bg-codex-tan/30 p-8 text-center text-codex-brown/70">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-codex-ink tracking-wide">{title}</h2>
        {seeAllLink && (
          <Link
            to={seeAllLink}
            className="flex items-center gap-1 text-sm text-codex-olive hover:text-codex-dark"
          >
            See all
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {products.map((product) => (
          <RecommendationCard
            key={product.id}
            product={product}
            score={product.score}
            reason={product.reason}
            source={product.source}
          />
        ))}
      </div>
    </div>
  );
}
