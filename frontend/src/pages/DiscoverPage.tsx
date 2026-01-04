import { useAuth } from "@/contexts/AuthContext";
import { SuggestedFollows } from "@/components/SuggestedFollows";
import { useRecommendations } from "@/hooks/useRecommendations";
import { Compass } from "lucide-react";
import { RecommendationCard } from "@/components/RecommendationCard";
import type { Product } from "@/types";

export function DiscoverPage() {
  const { user } = useAuth();

  const { data: forYouData, isLoading: forYouLoading, error: forYouError } = useRecommendations(
    "for-you",
    { limit: 12 }
  );

  const { data: trendingData, isLoading: trendingLoading, error: trendingError } = useRecommendations(
    "trending",
    { limit: 12, days: 30 }
  );

  const { data: topRatedData, isLoading: topRatedLoading, error: topRatedError } = useRecommendations(
    "top-rated",
    { limit: 12 }
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Compass className="w-8 h-8 text-codex-olive" />
          <h1 className="font-display text-3xl font-semibold text-codex-ink tracking-wide">
            Discover
          </h1>
        </div>
        <p className="text-codex-brown/70">
          Explore new adventures, trending products, and personalized recommendations
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-8">
          {user && (
            <section className="py-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-codex-ink">For You</h2>
              </div>
              {forYouLoading ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-[3/4] w-full rounded-lg bg-codex-tan" />
                      <div className="mt-2 h-4 rounded bg-codex-tan" />
                      <div className="mt-1 h-3 w-3/4 rounded bg-codex-tan" />
                    </div>
                  ))}
                </div>
              ) : forYouError ? (
                <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                  Failed to load recommendations
                </div>
              ) : !forYouData || forYouData.length === 0 ? (
                <div className="rounded-lg bg-codex-tan/30 p-8 text-center text-codex-brown/70">
                  Start rating products to get personalized recommendations
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {forYouData.map((item) => (
                    <RecommendationCard
                      key={item.product.id}
                      product={item.product as Product}
                      score={item.score}
                      reason={item.reason}
                      source={item.source}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="py-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-codex-ink">Trending This Month</h2>
            </div>
            {trendingLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] w-full rounded-lg bg-codex-tan" />
                    <div className="mt-2 h-4 rounded bg-codex-tan" />
                    <div className="mt-1 h-3 w-3/4 rounded bg-codex-tan" />
                  </div>
                ))}
              </div>
            ) : trendingError ? (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                Failed to load trending products
              </div>
            ) : !trendingData || trendingData.length === 0 ? (
              <div className="rounded-lg bg-codex-tan/30 p-8 text-center text-codex-brown/70">
                No trending products available
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {trendingData.map((item) => (
                  <RecommendationCard
                    key={item.product.id}
                    product={item.product as Product}
                    score={item.score}
                    reason={item.reason}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="py-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-codex-ink">Top Rated</h2>
            </div>
            {topRatedLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-[3/4] w-full rounded-lg bg-codex-tan" />
                    <div className="mt-2 h-4 rounded bg-codex-tan" />
                    <div className="mt-1 h-3 w-3/4 rounded bg-codex-tan" />
                  </div>
                ))}
              </div>
            ) : topRatedError ? (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                Failed to load top rated products
              </div>
            ) : !topRatedData || topRatedData.length === 0 ? (
              <div className="rounded-lg bg-codex-tan/30 p-8 text-center text-codex-brown/70">
                No top rated products available
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {topRatedData.map((item) => (
                  <RecommendationCard
                    key={item.product.id}
                    product={item.product as Product}
                    score={item.score}
                    reason={item.reason}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        {user && (
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <SuggestedFollows />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
