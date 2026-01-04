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
      className="group block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
    >
      <div className="aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-gray-100">
        {product.thumbnail_url ? (
          <img
            src={product.thumbnail_url}
            alt={product.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            <StarIcon className="h-12 w-12" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600">
          {product.title}
        </h3>
        
        <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
          {product.publisher && <span>{typeof product.publisher === 'string' ? product.publisher : product.publisher.name}</span>}
          {product.game_system && (
            <>
              <span>•</span>
              <span>{typeof product.game_system === 'string' ? product.game_system : product.game_system.name}</span>
            </>
          )}
        </div>
        
        {product.level_range_min && product.level_range_max && (
          <div className="mt-1 text-sm text-gray-500">
            Levels {product.level_range_min}-{product.level_range_max}
          </div>
        )}
        
        {product.msrp && (
          <div className="mt-2 text-sm font-medium text-gray-900">
            ${product.msrp}
          </div>
        )}
        
        {/* Attribution for "from following" recommendations */}
        {showAttribution && source && (
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded px-2 py-1">
            <UsersIcon className="h-3 w-3" />
            <span>
              {source.name} rated it {source.rating}★
            </span>
          </div>
        )}
        
        {/* Reason badge (for debugging or power users) */}
        {reason && process.env.NODE_ENV === "development" && (
          <div className="mt-2 text-xs text-gray-500">
            Reason: {reason}
          </div>
        )}
      </div>
    </Link>
  );
}
