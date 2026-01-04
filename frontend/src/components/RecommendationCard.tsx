import { Product } from "@/types";
import { Link } from "react-router-dom";
import { StarIcon, UsersIcon } from "lucide-react";

interface RecommendationCardProps {
  product: Product;
  score?: number;
  reason?: string;
  source?: {
    type: "user";
    id: string;
    name: string;
    rating: number;
  };
  showAttribution?: boolean;
}

export function RecommendationCard({
  product,
  reason,
  source,
  showAttribution = true,
}: RecommendationCardProps) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group block card transition-shadow duration-200"
    >
      <div className="aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-codex-tan">
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-codex-brown/40">
            <StarIcon className="h-12 w-12" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-codex-ink line-clamp-2 group-hover:text-codex-olive">
          {product.title}
        </h3>
        
        <div className="mt-1 flex items-center gap-2 text-sm text-codex-brown/70">
          {product.publisher && <span>{typeof product.publisher === 'string' ? product.publisher : product.publisher.name}</span>}
          {product.game_system && (
            <>
              <span>•</span>
              <span>{typeof product.game_system === 'string' ? product.game_system : product.game_system.name}</span>
            </>
          )}
        </div>
        
        {product.level_range_min && product.level_range_max && (
          <div className="mt-1 text-sm text-codex-brown/70">
            Levels {product.level_range_min}-{product.level_range_max}
          </div>
        )}
        
        {product.msrp && (
          <div className="mt-2 text-sm font-medium text-codex-ink">
            ${product.msrp}
          </div>
        )}
        
        {/* Attribution for "from following" recommendations */}
        {showAttribution && source && (
          <div className="mt-3 flex items-center gap-2 text-xs text-codex-brown/70 bg-codex-tan/50 rounded px-2 py-1">
            <UsersIcon className="h-3 w-3" />
            <span>
              {source.name} rated it {source.rating}★
            </span>
          </div>
        )}
        
        {/* Reason badge (for debugging or power users) */}
        {reason && process.env.NODE_ENV === "development" && (
          <div className="mt-2 text-xs text-codex-brown/70">
            Reason: {reason}
          </div>
        )}
      </div>
    </Link>
  );
}
