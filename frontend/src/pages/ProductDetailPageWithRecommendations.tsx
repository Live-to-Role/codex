import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { ExternalLinkIcon, StarIcon } from "lucide-react";
import { RecommendationSection } from "@/components/RecommendationSection";
import { FollowButton } from "@/components/FollowButton";
import { api } from "@/lib/api";
import { useSimilarProducts } from "@/hooks/useRecommendations";

interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  product_type: string;
  cover_url?: string;
  thumbnail_url?: string;
  publisher?: {
    id: string;
    name: string;
    slug: string;
    follower_count: number;
    is_following?: boolean;
  };
  game_system?: {
    id: string;
    name: string;
    slug: string;
  };
  authors?: Array<{
    id: string;
    name: string;
    slug: string;
    follower_count: number;
    is_following?: boolean;
  }>;
  publication_date?: string;
  page_count?: number;
  format: string;
  isbn?: string;
  msrp?: number;
  level_range_min?: number;
  level_range_max?: number;
  party_size_min?: number;
  party_size_max?: number;
  estimated_runtime?: string;
  setting?: string;
  tags?: string[];
  themes?: string[];
  genres?: string[];
  content_warnings?: string[];
  marketplace_urls?: Array<{
    platform: string;
    url: string;
    label?: string;
  }>;
  series?: {
    id: string;
    title: string;
    series_order?: number;
  };
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ProductDetailPageWithRecommendations() {
  const { slug } = useParams<{ slug: string }>();
  
  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const response = await api.get(`/products/${slug}/`);
      return response.data as Product;
    },
    enabled: !!slug,
  });

  const { data: similarProducts } = useSimilarProducts(slug || "", 6);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200" />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="h-8 w-3/4 rounded bg-gray-200" />
              <div className="mt-4 h-4 w-full rounded bg-gray-200" />
              <div className="mt-2 h-4 w-5/6 rounded bg-gray-200" />
            </div>
            <div className="h-64 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <>
      <Helmet>
        <title>{product.title} - Codex</title>
        <meta name="description" content={product.description.slice(0, 160)} />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                {product.publisher && (
                  <>
                    <span>{product.publisher.name}</span>
                    <span>•</span>
                  </>
                )}
                {product.game_system && (
                  <>
                    <span>{product.game_system.name}</span>
                    <span>•</span>
                  </>
                )}
                <span className="capitalize">{product.product_type}</span>
              </div>
              
              <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
                {product.title}
              </h1>
              
              {product.publication_date && (
                <p className="mt-2 text-sm text-gray-400">
                  Published {format(new Date(product.publication_date), "MMMM d, yyyy")}
                </p>
              )}
              
              {product.description && (
                <div className="mt-4 text-gray-300">
                  {product.description}
                </div>
              )}
              
              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.tags.slice(0, 10).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-800 px-3 py-1 text-xs text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Cover Image */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                {product.cover_url ? (
                  <img
                    src={product.cover_url}
                    alt={product.title}
                    className="w-full rounded-lg shadow-xl"
                  />
                ) : (
                  <div className="aspect-[3/4] w-full rounded-lg bg-gray-800" />
                )}
                
                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  {product.marketplace_urls?.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Buy on {link.platform}
                      <ExternalLinkIcon className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Product Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Details</h2>
              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {product.page_count && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Page Count</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.page_count} pages</dd>
                  </div>
                )}
                
                {product.format && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Format</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{product.format}</dd>
                  </div>
                )}
                
                {product.level_range_min && product.level_range_max && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Level Range</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      Levels {product.level_range_min}-{product.level_range_max}
                    </dd>
                  </div>
                )}
                
                {product.party_size_min && product.party_size_max && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Party Size</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {product.party_size_min}-{product.party_size_max} players
                    </dd>
                  </div>
                )}
                
                {product.estimated_runtime && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Runtime</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.estimated_runtime}</dd>
                  </div>
                )}
                
                {product.setting && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Setting</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.setting}</dd>
                  </div>
                )}
                
                {product.isbn && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">ISBN</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.isbn}</dd>
                  </div>
                )}
                
                {product.msrp && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">MSRP</dt>
                    <dd className="mt-1 text-sm text-gray-900">${product.msrp}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Themes & Genres */}
            {(product.themes?.length || product.genres?.length) && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Themes & Genres</h2>
                <div className="mt-4 space-y-3">
                  {product.themes && product.themes.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Themes</dt>
                      <dd className="mt-1 flex flex-wrap gap-2">
                        {product.themes.map((theme) => (
                          <span
                            key={theme}
                            className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                          >
                            {theme}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                  
                  {product.genres && product.genres.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Genres</dt>
                      <dd className="mt-1 flex flex-wrap gap-2">
                        {product.genres.map((genre) => (
                          <span
                            key={genre}
                            className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                          >
                            {genre}
                          </span>
                        ))}
                      </dd>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content Warnings */}
            {product.content_warnings && product.content_warnings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Content Warnings</h2>
                <div className="mt-4 rounded-lg bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">
                    This product contains content that may be sensitive to some readers:
                  </p>
                  <ul className="mt-2 list-disc list-inside text-sm text-amber-700">
                    {product.content_warnings.map((warning) => (
                      <li key={warning}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Publisher */}
            {product.publisher && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Publisher</h3>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {product.publisher.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {product.publisher.follower_count} followers
                    </p>
                  </div>
                  <FollowButton
                    targetType="publisher"
                    targetId={product.publisher.slug}
                    initialFollowing={product.publisher.is_following}
                    initialCount={product.publisher.follower_count}
                    size="sm"
                  />
                </div>
              </div>
            )}

            {/* Authors */}
            {product.authors && product.authors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Authors</h3>
                <div className="mt-3 space-y-3">
                  {product.authors.map((author) => (
                    <div key={author.id} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{author.name}</h4>
                        <p className="text-sm text-gray-500">
                          {author.follower_count} followers
                        </p>
                      </div>
                      <FollowButton
                        targetType="author"
                        targetId={author.slug}
                        initialFollowing={author.is_following}
                        initialCount={author.follower_count}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Series */}
            {product.series && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Series</h3>
                <div className="mt-3">
                  <h4 className="font-medium text-gray-900">
                    {product.series.title}
                  </h4>
                  {product.series.series_order && (
                    <p className="text-sm text-gray-500">
                      Book {product.series.series_order}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts && similarProducts.length > 0 && (
          <RecommendationSection
            title="Similar Products"
            products={similarProducts}
            loading={isLoading}
          />
        )}
      </div>
    </>
  );
}
