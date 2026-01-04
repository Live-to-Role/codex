export interface ScoredProduct {
  product: Product;
  score: number;
  reason?: string;
  source?: {
    type: "user";
    id: string;
    name: string;
    rating: number;
  };
}

export interface SuggestedFollow {
  user: {
    id: string;
    public_name: string;
    avatar_url?: string;
  };
  reason: string;
  shared_products: number;
  note_upvotes: number;
}

export interface ForYouRecommendations {
  collaborative: ScoredProduct[];
  content_based: ScoredProduct[];
  from_following: ScoredProduct[];
  follow_ups: ScoredProduct[];
  trending: ScoredProduct[];
  new_releases: Product[];
}

export interface RecommendationSection {
  title: string;
  type: "collaborative" | "content_based" | "from_following" | "follow_ups" | "trending" | "new_releases";
  products: ScoredProduct[];
  seeAllLink?: string;
}

export interface FollowStatus {
  isFollowing: boolean;
  followerCount: number;
}
