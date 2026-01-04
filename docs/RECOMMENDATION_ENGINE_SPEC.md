# Recommendation Engine Specification

## What

A comprehensive recommendation system for Codex that helps users discover TTRPG products through personalized suggestions, social connections, and content-based matching.

## Why

TTRPG enthusiasts face discovery challenges:
- Thousands of products across multiple publishers and systems
- Difficulty finding follow-up content after completing adventures
- No way to discover GMs with similar taste who share quality notes
- Publishers and authors have no direct channel to their audience

A recommendation engine solves these problems by surfacing relevant content based on user behavior, preferences, and community signals.

## Scope

### In Scope
- User-to-user follow system (GM follows)
- Publisher and author follow system
- Collaborative filtering ("users who liked X also liked Y")
- Content-based recommendations (similar tags, themes, genres)
- Follow-up adventure recommendations (sequels, expansions)
- Trending and popular content lists
- Personalized home feed
- API endpoints for all recommendation types
- Frontend components for discovery

### Out of Scope
- Machine learning models (using algorithmic approaches instead)
- Real-time notifications (future enhancement)
- Email digest of recommendations (future enhancement)
- Recommendation explanations ("because you liked X")

---

## Data Models

### New Models

#### UserFollow

Enables users to follow other users whose GM notes and taste they find valuable.

```python
class UserFollow(models.Model):
    """Follow relationship between users."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    follower = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="following",
    )
    followed = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="followers",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["follower", "followed"]
        indexes = [
            models.Index(fields=["follower"]),
            models.Index(fields=["followed"]),
        ]

    def clean(self):
        if self.follower == self.followed:
            raise ValidationError("Users cannot follow themselves.")
```

#### PublisherFollow

Enables users to follow publishers for new releases.

```python
class PublisherFollow(models.Model):
    """Follow relationship between user and publisher."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="publisher_follows",
    )
    publisher = models.ForeignKey(
        "catalog.Publisher",
        on_delete=models.CASCADE,
        related_name="followers",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "publisher"]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["publisher"]),
        ]
```

#### AuthorFollow

Enables users to follow authors/creators.

```python
class AuthorFollow(models.Model):
    """Follow relationship between user and author."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="author_follows",
    )
    author = models.ForeignKey(
        "catalog.Author",
        on_delete=models.CASCADE,
        related_name="followers",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "author"]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["author"]),
        ]
```

### Model Additions to Existing Models

#### User Model Updates

```python
# Add to User model
follower_count = models.PositiveIntegerField(default=0)
following_count = models.PositiveIntegerField(default=0)
```

#### Publisher Model Updates

```python
# Add to Publisher model
follower_count = models.PositiveIntegerField(default=0)
```

#### Author Model Updates

```python
# Add to Author model
follower_count = models.PositiveIntegerField(default=0)
```

---

## Recommendation Algorithms

### 1. Collaborative Filtering: "Users Who Liked X Also Liked Y"

**Algorithm:**
1. Find users who rated the same products highly (rating >= 4) as the current user
2. Weight these users by taste similarity (Jaccard coefficient on liked products)
3. Aggregate products these similar users liked that current user hasn't interacted with
4. Score by frequency and average rating among similar users
5. Filter out products user already has in their runs

**SQL Pseudocode:**
```sql
-- Step 1: Get current user's highly-rated products
WITH user_liked AS (
    SELECT product_id FROM adventure_runs 
    WHERE user_id = :current_user AND rating >= 4
),
-- Step 2: Find similar users (shared high ratings)
similar_users AS (
    SELECT ar.user_id, COUNT(*) as shared_count
    FROM adventure_runs ar
    WHERE ar.product_id IN (SELECT product_id FROM user_liked)
      AND ar.rating >= 4
      AND ar.user_id != :current_user
    GROUP BY ar.user_id
    HAVING COUNT(*) >= 2  -- minimum overlap threshold
),
-- Step 3: Get their other highly-rated products
recommendations AS (
    SELECT ar.product_id, 
           COUNT(DISTINCT ar.user_id) as recommender_count,
           AVG(ar.rating) as avg_rating
    FROM adventure_runs ar
    JOIN similar_users su ON ar.user_id = su.user_id
    WHERE ar.rating >= 4
      AND ar.product_id NOT IN (
          SELECT product_id FROM adventure_runs WHERE user_id = :current_user
      )
    GROUP BY ar.product_id
)
SELECT * FROM recommendations
ORDER BY recommender_count DESC, avg_rating DESC
LIMIT 20;
```

**Performance Considerations:**
- Cache results per user, invalidate on new rating
- Precompute user similarity matrix for users with 5+ ratings
- Use materialized view for users with insufficient data

---

### 2. Content-Based: "Similar Products"

**Algorithm:**
1. Build a preference profile from user's highly-rated products
2. Extract weighted features: tags, themes, genres, game_system, publisher, level_range
3. Score candidate products by feature overlap
4. Apply diversity penalty to avoid showing only one type

**Feature Weights:**
| Feature | Weight | Rationale |
|---------|--------|-----------|
| tags | 1.0 | Direct topic match |
| themes | 0.8 | Narrative style match |
| genres | 0.9 | Play style match |
| game_system | 0.7 | System familiarity |
| publisher | 0.4 | Quality association |
| level_range overlap | 0.5 | Campaign fit |

**Scoring Function:**
```python
def similarity_score(user_profile, product):
    score = 0
    
    # Tag overlap (Jaccard)
    tag_overlap = len(set(user_profile.tags) & set(product.tags))
    tag_union = len(set(user_profile.tags) | set(product.tags))
    if tag_union > 0:
        score += 1.0 * (tag_overlap / tag_union)
    
    # Theme overlap
    theme_overlap = len(set(user_profile.themes) & set(product.themes))
    theme_union = len(set(user_profile.themes) | set(product.themes))
    if theme_union > 0:
        score += 0.8 * (theme_overlap / theme_union)
    
    # Genre overlap
    genre_overlap = len(set(user_profile.genres) & set(product.genres))
    genre_union = len(set(user_profile.genres) | set(product.genres))
    if genre_union > 0:
        score += 0.9 * (genre_overlap / genre_union)
    
    # Game system match
    if product.game_system_id in user_profile.preferred_systems:
        score += 0.7
    
    # Publisher match
    if product.publisher_id in user_profile.preferred_publishers:
        score += 0.4
    
    # Level range overlap
    if user_profile.level_range and product.level_range_min:
        range_overlap = calculate_range_overlap(
            user_profile.level_range, 
            (product.level_range_min, product.level_range_max)
        )
        score += 0.5 * range_overlap
    
    return score
```

---

### 3. Follow-Up Adventures

**Algorithm:**
1. Get user's completed adventure runs
2. Query ProductRelation for sequels, expansions, prequels
3. Filter out products user already has
4. Sort by relation type priority: sequel > expansion > prequel > related

**Priority Order:**
1. **Sequel** - Direct continuation
2. **Expansion** - Same product line, additional content
3. **Prequel** - Origin story
4. **Conversion** - Same adventure, different system
5. **Related** - Thematically similar

---

### 4. From Followed Users

**Algorithm:**
1. Get list of users the current user follows
2. Aggregate their highly-rated products (rating >= 4)
3. Weight by recency of their interaction
4. Filter out products current user already has
5. Show author attribution for social proof

---

### 5. From Followed Publishers/Authors

**Algorithm:**
1. Get followed publishers and authors
2. Query recent products (last 90 days) from these sources
3. Sort by publication date descending
4. Include products user may already own (they want updates)

---

### 6. Trending Products

**Algorithm:**
1. Count `want_to_run` status additions in last 30 days
2. Count completed runs in last 30 days
3. Combine with velocity factor (rate of change)
4. Apply minimum threshold to filter noise

**Scoring:**
```python
trending_score = (
    want_to_run_count * 1.0 +
    completed_count * 2.0 +
    new_notes_count * 0.5
) * recency_decay(avg_interaction_date)
```

---

### 7. Top Rated by Category

**Algorithm:**
1. Aggregate ratings by category (game_system, product_type, tag)
2. Require minimum 3 ratings for inclusion
3. Calculate Wilson score for ranking (handles low sample sizes)
4. Cache results, refresh daily

**Wilson Score Lower Bound:**
```python
import math

def wilson_score(positive, total, confidence=0.95):
    """
    Calculate Wilson score lower bound for ranking.
    Handles uncertainty in small sample sizes.
    """
    if total == 0:
        return 0
    
    z = 1.96  # 95% confidence
    phat = positive / total
    
    return (
        phat + z*z/(2*total) - z * math.sqrt((phat*(1-phat) + z*z/(4*total))/total)
    ) / (1 + z*z/total)
```

---

### 8. "Because You Ran X" (Per-Product Recommendations)

**Algorithm:**
1. For a given product, find similar products by:
   - Same series
   - Same publisher + similar level range
   - Overlapping tags (>= 2 shared)
   - Same game system + similar product type
2. Weight by user's past preferences if authenticated
3. Return top 6 recommendations

---

### 9. Party Size Matching

**Algorithm:**
1. Calculate user's typical party size from completed runs
2. Filter products where party_size range overlaps
3. Prioritize exact matches over range overlaps

---

## API Endpoints

### Follow Endpoints

```
POST   /api/users/{user_id}/follow/          # Follow a user
DELETE /api/users/{user_id}/follow/          # Unfollow a user
GET    /api/users/{user_id}/followers/       # List user's followers
GET    /api/users/{user_id}/following/       # List who user follows
GET    /api/me/following/                    # Current user's following list

POST   /api/publishers/{slug}/follow/        # Follow publisher
DELETE /api/publishers/{slug}/follow/        # Unfollow publisher
GET    /api/me/followed-publishers/          # List followed publishers

POST   /api/authors/{slug}/follow/           # Follow author
DELETE /api/authors/{slug}/follow/           # Unfollow author
GET    /api/me/followed-authors/             # List followed authors
```

### Recommendation Endpoints

```
GET /api/recommendations/for-you/
    # Personalized mix of all recommendation types
    # Returns: { collaborative: [], content: [], from_following: [], trending: [] }

GET /api/recommendations/similar-users/
    # "Users who liked X also liked Y"
    # Query params: limit (default 20)

GET /api/recommendations/similar-products/?product={slug}
    # Content-based similar products
    # Query params: product (required), limit (default 6)

GET /api/recommendations/follow-ups/
    # Sequels/expansions for completed runs
    # Query params: limit (default 10)

GET /api/recommendations/from-following/
    # Products from followed users
    # Query params: limit (default 20)

GET /api/recommendations/new-releases/
    # From followed publishers/authors
    # Query params: days (default 90), limit (default 20)

GET /api/recommendations/trending/
    # Trending products
    # Query params: days (default 30), limit (default 20)

GET /api/recommendations/top-rated/
    # Top rated by category
    # Query params: game_system, product_type, limit (default 20)

GET /api/recommendations/suggested-follows/
    # Suggested users to follow
    # Query params: limit (default 10)

GET /api/products/{slug}/recommendations/
    # "Because you looked at X" - per-product recommendations
    # Query params: limit (default 6)
```

### Response Schemas

#### RecommendationResponse

```json
{
  "results": [
    {
      "product": { /* ProductListSerializer */ },
      "score": 0.85,
      "reason": "similar_tags",  // optional, for debugging
      "source": {  // optional, for "from following" type
        "type": "user",
        "id": "uuid",
        "name": "GameMaster42",
        "rating": 5
      }
    }
  ],
  "total": 45,
  "has_more": true
}
```

#### FollowResponse

```json
{
  "is_following": true,
  "follower_count": 127
}
```

#### SuggestedFollowResponse

```json
{
  "results": [
    {
      "user": { /* UserPublicSerializer */ },
      "reason": "high_quality_notes",
      "shared_products": 5,
      "note_upvotes": 42
    }
  ]
}
```

---

## Service Architecture

### RecommendationService

Central service class encapsulating all recommendation logic.

```python
class RecommendationService:
    """
    Central service for generating recommendations.
    
    All recommendation methods return QuerySets or lists of Product objects
    with optional scoring metadata.
    """
    
    def __init__(self, user: User | None = None):
        self.user = user
        self._user_profile = None  # Lazy-loaded
    
    # === User Profile ===
    
    def get_user_profile(self) -> UserPreferenceProfile:
        """Build preference profile from user's rated products."""
        ...
    
    # === Collaborative Filtering ===
    
    def get_similar_users(self, min_overlap: int = 2) -> QuerySet[User]:
        """Find users with similar taste."""
        ...
    
    def get_collaborative_recommendations(self, limit: int = 20) -> list[ScoredProduct]:
        """Products liked by similar users."""
        ...
    
    # === Content-Based ===
    
    def get_content_recommendations(self, limit: int = 20) -> list[ScoredProduct]:
        """Products matching user's preference profile."""
        ...
    
    def get_similar_products(self, product: Product, limit: int = 6) -> list[ScoredProduct]:
        """Products similar to a specific product."""
        ...
    
    # === Social ===
    
    def get_from_following(self, limit: int = 20) -> list[ScoredProduct]:
        """Products rated highly by followed users."""
        ...
    
    def get_new_releases(self, days: int = 90, limit: int = 20) -> QuerySet[Product]:
        """Recent products from followed publishers/authors."""
        ...
    
    def get_suggested_follows(self, limit: int = 10) -> list[SuggestedFollow]:
        """Users the current user might want to follow."""
        ...
    
    # === Discovery ===
    
    def get_follow_ups(self, limit: int = 10) -> QuerySet[Product]:
        """Sequels/expansions for completed runs."""
        ...
    
    def get_trending(self, days: int = 30, limit: int = 20) -> list[ScoredProduct]:
        """Currently trending products."""
        ...
    
    def get_top_rated(
        self, 
        game_system: str | None = None,
        product_type: str | None = None,
        limit: int = 20
    ) -> list[ScoredProduct]:
        """Top rated products, optionally filtered."""
        ...
    
    # === Aggregated ===
    
    def get_for_you(self) -> ForYouRecommendations:
        """
        Personalized mix for the home feed.
        Returns multiple recommendation types in one call.
        """
        ...
```

### Data Classes

```python
@dataclass
class ScoredProduct:
    """Product with recommendation score and metadata."""
    product: Product
    score: float
    reason: str | None = None
    source: dict | None = None  # For "from following" attribution

@dataclass
class UserPreferenceProfile:
    """Aggregated user preferences from their rated products."""
    tags: Counter[str]
    themes: Counter[str]
    genres: Counter[str]
    preferred_systems: set[UUID]
    preferred_publishers: set[UUID]
    level_range: tuple[int, int] | None
    typical_party_size: int | None

@dataclass
class SuggestedFollow:
    """A user suggested for following."""
    user: User
    reason: str
    shared_products: int
    note_upvotes: int

@dataclass
class ForYouRecommendations:
    """Aggregated recommendations for home feed."""
    collaborative: list[ScoredProduct]
    content_based: list[ScoredProduct]
    from_following: list[ScoredProduct]
    follow_ups: list[ScoredProduct]
    trending: list[ScoredProduct]
    new_releases: list[Product]
```

---

## Caching Strategy

### Cache Keys

| Key Pattern | TTL | Invalidation |
|-------------|-----|--------------|
| `user:{id}:profile` | 1 hour | On new rating |
| `user:{id}:similar_users` | 6 hours | On new rating |
| `user:{id}:recommendations:collaborative` | 1 hour | On new rating |
| `user:{id}:recommendations:content` | 1 hour | On new rating |
| `user:{id}:recommendations:following` | 30 min | On new follow, or followed user rates |
| `user:{id}:follow_ups` | 1 hour | On run completion |
| `global:trending:{days}` | 1 hour | Time-based |
| `global:top_rated:{system}:{type}` | 24 hours | Time-based |
| `product:{slug}:similar` | 24 hours | On product update |

### Implementation

Use Django's cache framework with Redis backend:

```python
from django.core.cache import cache

def get_collaborative_recommendations(self, limit: int = 20):
    cache_key = f"user:{self.user.id}:recommendations:collaborative"
    cached = cache.get(cache_key)
    if cached is not None:
        return cached[:limit]
    
    results = self._compute_collaborative_recommendations()
    cache.set(cache_key, results, timeout=3600)  # 1 hour
    return results[:limit]
```

---

## Frontend Components

### New Pages

#### `/discover` - Discovery Hub

Main recommendation page with sections:
- **For You** - Personalized recommendations (if authenticated)
- **Trending** - Currently popular products
- **New Releases** - Recent publications
- **Top Rated** - Filterable by system/type

#### `/users/{username}` - User Profile (Enhanced)

Add:
- Follow button
- Follower/following counts
- Public runs and notes (existing)
- "Products They Love" section (highly rated)

#### `/users/{username}/followers` - Follower List

#### `/users/{username}/following` - Following List

### New Components

#### `FollowButton`

```tsx
interface FollowButtonProps {
  targetType: 'user' | 'publisher' | 'author';
  targetId: string;
  initialFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
}

function FollowButton({ targetType, targetId, initialFollowing, onFollowChange }: FollowButtonProps) {
  // Optimistic update with TanStack Query mutation
}
```

#### `RecommendationCard`

Enhanced ProductCard with recommendation context:
- Source attribution ("Liked by GameMaster42")
- Recommendation reason badge
- Score indicator (optional)

#### `RecommendationSection`

Horizontal scrollable section for recommendation lists:
- Title with "See All" link
- Loading skeleton
- Empty state

#### `SuggestedFollows`

Sidebar component showing users to follow:
- Avatar, name, reason
- Quick follow button
- Shared product count

#### `FollowUpAdventures`

Section on product detail page:
- Shows sequels, expansions, related
- Grouped by relation type

### Page Modifications

#### Home Page

Add recommendation sections (authenticated users):
1. Continue Your Adventures (from follow-ups)
2. From GMs You Follow
3. Trending This Month
4. New From Publishers You Follow

#### Product Detail Page

Add:
- "Similar Products" section
- "Follow-Up Adventures" section (if relations exist)
- Publisher/Author follow buttons

---

## Database Indexes

```python
# New indexes for recommendation queries

# UserFollow - bidirectional lookup
models.Index(fields=["follower", "created_at"]),
models.Index(fields=["followed", "created_at"]),

# PublisherFollow
models.Index(fields=["user"]),
models.Index(fields=["publisher"]),

# AuthorFollow  
models.Index(fields=["user"]),
models.Index(fields=["author"]),

# AdventureRun - for collaborative filtering
models.Index(fields=["product", "rating"]),
models.Index(fields=["user", "rating"]),
models.Index(fields=["status", "created_at"]),  # For trending

# Product - for content filtering
models.Index(fields=["game_system", "status"]),
models.Index(fields=["publisher", "status", "created_at"]),
```

---

## Privacy Considerations

### Public by Default

- Follow relationships are public (like Twitter)
- Highly-rated products are visible on profiles
- Users can be discovered via "suggested follows"

### User Controls

- Users can make their runs private (existing `visibility` field)
- Anonymous note posting remains supported
- No exposure of specific ratings in recommendations (only "liked")

### Data Minimization

- Similar user calculations don't expose individual users
- Collaborative filtering shows products, not which specific users liked them
- Only followed user attribution is shown

---

## Performance Targets

| Endpoint | Target P95 | Strategy |
|----------|------------|----------|
| `/recommendations/for-you/` | < 500ms | Parallel queries + caching |
| `/recommendations/similar-users/` | < 300ms | Precomputed similarity matrix |
| `/recommendations/trending/` | < 100ms | Cached aggregation |
| `/products/{slug}/recommendations/` | < 200ms | Cached per product |
| Follow/unfollow actions | < 100ms | Direct write + async count update |

---

## Testing Strategy

### Unit Tests

- `RecommendationService` methods with mocked data
- Scoring functions with edge cases
- Cache invalidation logic

### Integration Tests

- API endpoints with test database
- Follow/unfollow flows
- Recommendation diversity (not all same publisher)

### Test Scenarios

1. **Cold start** - New user with no ratings
2. **Sparse data** - User with 1-2 ratings
3. **Active user** - User with 20+ ratings
4. **No similar users** - Unique taste profile
5. **Heavy following** - User follows 50+ accounts
6. **Popular product** - Product with 100+ ratings

---

## Migration Plan

### Phase 1: Models and Basic APIs

1. Create migration for new models
2. Implement follow/unfollow endpoints
3. Add follower counts to existing models
4. Deploy and verify

### Phase 2: Recommendation Service

1. Implement `RecommendationService`
2. Add recommendation endpoints
3. Set up caching infrastructure
4. Deploy behind feature flag

### Phase 3: Frontend Integration

1. Add follow buttons to UI
2. Create discovery page
3. Add recommendation sections to home/product pages
4. Enable feature flag

### Phase 4: Optimization

1. Monitor performance metrics
2. Add precomputation jobs for heavy calculations
3. Tune cache TTLs based on usage patterns
4. A/B test recommendation algorithms

---

## Acceptance Criteria

- [ ] Users can follow/unfollow other users
- [ ] Users can follow/unfollow publishers
- [ ] Users can follow/unfollow authors
- [ ] Follower counts display on profiles
- [ ] `/discover` page shows personalized recommendations
- [ ] Product pages show similar products
- [ ] Product pages show follow-up adventures
- [ ] Home page shows recommendations for authenticated users
- [ ] "Suggested follows" appear for users with good notes
- [ ] Trending products list updates automatically
- [ ] Top rated products filterable by system
- [ ] All recommendation endpoints respond < 500ms P95
- [ ] Recommendations respect product visibility (no drafts)
- [ ] Anonymous users see trending/top-rated only (no personalization)

---

## Future Enhancements

1. **Recommendation explanations** - "Because you liked X"
2. **Notification system** - "New product from publisher you follow"
3. **Email digests** - Weekly recommendation summary
4. **Negative signals** - "Not interested" button
5. **Explicit preferences** - Let users set favorite systems/genres
6. **Group recommendations** - Suggest products for a party's combined preferences
7. **Campaign planning** - Recommend adventure sequences for a campaign arc
