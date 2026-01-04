"""
Recommendation service for Codex.

Provides various recommendation algorithms for TTRPG products.
"""

import math
from collections import Counter
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple, TypeVar, Union

from django.core.cache import cache
from django.db import models
from django.db.models import Avg, Count, F, Q, QuerySet
from django.utils import timezone

from apps.users.models import User, UserFollow

from .models import (
    AdventureRun,
    Author,
    AuthorFollow,
    CommunityNote,
    NoteVote,
    Product,
    ProductRelation,
    Publisher,
    PublisherFollow,
    RunStatus,
)

T = TypeVar("T")


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
    preferred_systems: set[str]
    preferred_publishers: set[str]
    level_range: Tuple[int, int] | None
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
    collaborative: List[ScoredProduct]
    content_based: List[ScoredProduct]
    from_following: List[ScoredProduct]
    follow_ups: List[ScoredProduct]
    trending: List[ScoredProduct]
    new_releases: List[Product]


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
        if self._user_profile is not None:
            return self._user_profile
            
        if not self.user:
            # Return empty profile for anonymous users
            return UserPreferenceProfile(
                tags=Counter(),
                themes=Counter(),
                genres=Counter(),
                preferred_systems=set(),
                preferred_publishers=set(),
                level_range=None,
                typical_party_size=None,
            )
        
        cache_key = f"user:{self.user.id}:profile"
        profile = cache.get(cache_key)
        
        if profile is not None:
            self._user_profile = profile
            return profile
        
        # Get highly-rated runs
        rated_runs = AdventureRun.objects.filter(
            user=self.user,
            rating__gte=4,
        ).select_related("product", "product__game_system", "product__publisher")
        
        # Aggregate features
        tags = Counter()
        themes = Counter()
        genres = Counter()
        preferred_systems = set()
        preferred_publishers = set()
        level_ranges = []
        party_sizes = []
        
        for run in rated_runs:
            product = run.product
            
            # Tags, themes, genres
            if product.tags:
                tags.update(product.tags)
            if product.themes:
                themes.update(product.themes)
            if product.genres:
                genres.update(product.genres)
            
            # System and publisher
            if product.game_system:
                preferred_systems.add(product.game_system.slug)
            if product.publisher:
                preferred_publishers.add(str(product.publisher.id))
            
            # Level range
            if product.level_range_min and product.level_range_max:
                level_ranges.append((product.level_range_min, product.level_range_max))
            
            # Party size
            if run.player_count:
                party_sizes.append(run.player_count)
        
        # Calculate typical values
        level_range = None
        if level_ranges:
            min_levels = [r[0] for r in level_ranges]
            max_levels = [r[1] for r in level_ranges]
            level_range = (min(min_levels), max(max_levels))
        
        typical_party_size = None
        if party_sizes:
            typical_party_size = round(sum(party_sizes) / len(party_sizes))
        
        profile = UserPreferenceProfile(
            tags=tags,
            themes=themes,
            genres=genres,
            preferred_systems=preferred_systems,
            preferred_publishers=preferred_publishers,
            level_range=level_range,
            typical_party_size=typical_party_size,
        )
        
        # Cache for 1 hour
        cache.set(cache_key, profile, timeout=3600)
        self._user_profile = profile
        
        return profile
    
    # === Collaborative Filtering ===
    
    def get_similar_users(self, min_overlap: int = 2) -> QuerySet[User]:
        """Find users with similar taste."""
        if not self.user:
            return User.objects.none()
        
        cache_key = f"user:{self.user.id}:similar_users:{min_overlap}"
        cached = cache.get(cache_key)
        
        if cached is not None:
            return User.objects.filter(id__in=cached)
        
        # Get current user's highly-rated products
        user_liked = AdventureRun.objects.filter(
            user=self.user,
            rating__gte=4,
        ).values_list("product_id", flat=True)
        
        if len(user_liked) < min_overlap:
            return User.objects.none()
        
        # Find users with overlapping ratings
        similar_users = (
            AdventureRun.objects
            .filter(
                product_id__in=user_liked,
                rating__gte=4,
            )
            .exclude(user=self.user)
            .values("user_id")
            .annotate(shared_count=Count("product_id"))
            .filter(shared_count__gte=min_overlap)
            .order_by("-shared_count")
            .values_list("user_id", flat=True)
        )
        
        # Cache for 6 hours
        cache.set(cache_key, list(similar_users), timeout=21600)
        
        return User.objects.filter(id__in=similar_users)
    
    def get_collaborative_recommendations(self, limit: int = 20) -> List[ScoredProduct]:
        """Products liked by similar users."""
        if not self.user:
            return []
        
        cache_key = f"user:{self.user.id}:recommendations:collaborative:{limit}"
        cached = cache.get(cache_key)
        
        if cached is not None:
            return cached
        
        # Get similar users
        similar_users = self.get_similar_users()
        
        if not similar_users.exists():
            return []
        
        # Get products they liked that user hasn't seen
        user_products = AdventureRun.objects.filter(
            user=self.user,
        ).values_list("product_id", flat=True)
        
        recommendations = (
            AdventureRun.objects
            .filter(
                user__in=similar_users,
                rating__gte=4,
            )
            .exclude(product_id__in=user_products)
            .values("product_id")
            .annotate(
                recommender_count=Count("user_id", distinct=True),
                avg_rating=Avg("rating"),
            )
            .annotate(score=F("recommender_count") * F("avg_rating"))
            .order_by("-score")
            .select_related("product")
        )[:limit]
        
        # Convert to ScoredProduct objects
        scored = []
        for rec in recommendations:
            product = Product.objects.get(id=rec["product_id"])
            scored.append(ScoredProduct(
                product=product,
                score=float(rec["score"]),
                reason="similar_users",
            ))
        
        cache.set(cache_key, scored, timeout=3600)
        return scored
    
    # === Content-Based ===
    
    def get_content_recommendations(self, limit: int = 20) -> List[ScoredProduct]:
        """Products matching user's preference profile."""
        if not self.user:
            return []
        
        cache_key = f"user:{self.user.id}:recommendations:content:{limit}"
        cached = cache.get(cache_key)
        
        if cached is not None:
            return cached
        
        profile = self.get_user_profile()
        
        # Get products user hasn't interacted with
        user_products = AdventureRun.objects.filter(
            user=self.user,
        ).values_list("product_id", flat=True)
        
        candidates = Product.objects.filter(
            status="published",
        ).exclude(id__in=user_products)
        
        # Score each candidate
        scored = []
        for product in candidates:
            score = self._similarity_score(profile, product)
            if score > 0:
                scored.append(ScoredProduct(
                    product=product,
                    score=score,
                    reason="similar_content",
                ))
        
        # Sort and limit
        scored.sort(key=lambda x: x.score, reverse=True)
        scored = scored[:limit]
        
        cache.set(cache_key, scored, timeout=3600)
        return scored
    
    def get_similar_products(self, product: Product, limit: int = 6) -> List[ScoredProduct]:
        """Products similar to a specific product."""
        cache_key = f"product:{product.slug}:similar:{limit}"
        cached = cache.get(cache_key)
        
        if cached is not None:
            return cached
        
        # Build profile from this product
        profile = UserPreferenceProfile(
            tags=Counter(product.tags or []),
            themes=Counter(product.themes or []),
            genres=Counter(product.genres or []),
            preferred_systems={product.game_system.slug} if product.game_system else set(),
            preferred_publishers={str(product.publisher.id)} if product.publisher else set(),
            level_range=(
                (product.level_range_min, product.level_range_max)
                if product.level_range_min and product.level_range_max
                else None
            ),
            typical_party_size=None,
        )
        
        # Find similar products
        candidates = Product.objects.filter(
            status="published",
        ).exclude(id=product.id)
        
        scored = []
        for candidate in candidates:
            score = self._similarity_score(profile, candidate)
            if score > 0.1:  # Minimum similarity threshold
                scored.append(ScoredProduct(
                    product=candidate,
                    score=score,
                    reason="similar_to_product",
                ))
        
        # Sort and limit
        scored.sort(key=lambda x: x.score, reverse=True)
        scored = scored[:limit]
        
        # Cache for 24 hours
        cache.set(cache_key, scored, timeout=86400)
        return scored
    
    def _similarity_score(self, profile: UserPreferenceProfile, product: Product) -> float:
        """Calculate similarity score between profile and product."""
        score = 0.0
        
        # Tag overlap (Jaccard)
        if profile.tags and product.tags:
            tag_overlap = len(set(profile.tags) & set(product.tags))
            tag_union = len(set(profile.tags) | set(product.tags))
            if tag_union > 0:
                score += 1.0 * (tag_overlap / tag_union)
        
        # Theme overlap
        if profile.themes and product.themes:
            theme_overlap = len(set(profile.themes) & set(product.themes))
            theme_union = len(set(profile.themes) | set(product.themes))
            if theme_union > 0:
                score += 0.8 * (theme_overlap / theme_union)
        
        # Genre overlap
        if profile.genres and product.genres:
            genre_overlap = len(set(profile.genres) & set(product.genres))
            genre_union = len(set(profile.genres) | set(product.genres))
            if genre_union > 0:
                score += 0.9 * (genre_overlap / genre_union)
        
        # Game system match
        if product.game_system and product.game_system.slug in profile.preferred_systems:
            score += 0.7
        
        # Publisher match
        if product.publisher and str(product.publisher.id) in profile.preferred_publishers:
            score += 0.4
        
        # Level range overlap
        if profile.level_range and product.level_range_min and product.level_range_max:
            range_overlap = self._calculate_range_overlap(
                profile.level_range,
                (product.level_range_min, product.level_range_max)
            )
            score += 0.5 * range_overlap
        
        return score
    
    def _calculate_range_overlap(self, range1: Tuple[int, int], range2: Tuple[int, int]) -> float:
        """Calculate overlap ratio between two ranges."""
        start1, end1 = range1
        start2, end2 = range2
        
        # Calculate overlap
        overlap_start = max(start1, start2)
        overlap_end = min(end1, end2)
        
        if overlap_start > overlap_end:
            return 0.0
        
        overlap = overlap_end - overlap_start + 1
        union = max(end1, end2) - min(start1, start2) + 1
        
        return overlap / union
    
    # === Social ===
    
    def get_from_following(self, limit: int = 20) -> List[ScoredProduct]:
        """Products rated highly by followed users."""
        if not self.user:
            return []
        
        cache_key = f"user:{self.user.id}:recommendations:following:{limit}"
        cached = cache.get(cache_key)
        
        if cached is not None:
            return cached
        
        # Get followed users
        followed_ids = UserFollow.objects.filter(
            follower=self.user,
        ).values_list("followed_id", flat=True)
        
        if not followed_ids:
            return []
        
        # Get their highly-rated products
        user_products = AdventureRun.objects.filter(
            user=self.user,
        ).values_list("product_id", flat=True)
        
        recommendations = (
            AdventureRun.objects
            .filter(
                user_id__in=followed_ids,
                rating__gte=4,
            )
            .exclude(product_id__in=user_products)
            .select_related("user", "product")
            .order_by("-updated_at")
        )[:limit]
        
        scored = []
        for run in recommendations:
            scored.append(ScoredProduct(
                product=run.product,
                score=run.updated_at.timestamp(),  # Use timestamp as score for recency
                reason="from_following",
                source={
                    "type": "user",
                    "id": str(run.user.id),
                    "name": run.user.public_name,
                    "rating": run.rating,
                },
            ))
        
        cache.set(cache_key, scored, timeout=1800)  # 30 minutes
        return scored
    
    def get_new_releases(self, days: int = 90, limit: int = 20) -> QuerySet[Product]:
        """Recent products from followed publishers/authors."""
        if not self.user:
            return Product.objects.none()
        
        cache_key = f"user:{self.user.id}:recommendations:new_releases:{days}:{limit}"
        cached = cache.get(cache_key)
        
        if cached is not None:
            return Product.objects.filter(id__in=cached)
        
        # Get followed publishers and authors
        publisher_ids = PublisherFollow.objects.filter(
            user=self.user,
        ).values_list("publisher_id", flat=True)
        
        author_ids = AuthorFollow.objects.filter(
            user=self.user,
        ).values_list("author_id", flat=True)
        
        if not publisher_ids and not author_ids:
            return Product.objects.none()
        
        # Get recent products
        cutoff = timezone.now() - timezone.timedelta(days=days)
        
        products = Product.objects.filter(
            Q(publisher_id__in=publisher_ids) | Q(credits__author_id__in=author_ids),
            status="published",
            created_at__gte=cutoff,
        ).distinct().order_by("-created_at")[:limit]
        
        product_ids = list(products.values_list("id", flat=True))
        cache.set(cache_key, product_ids, timeout=3600)
        
        return products
    
    def get_suggested_follows(self, limit: int = 10) -> List[SuggestedFollow]:
        """Users the current user might want to follow."""
        if not self.user:
            return []
        
        # Get user's highly-rated products
        user_liked = AdventureRun.objects.filter(
            user=self.user,
            rating__gte=4,
        ).values_list("product_id", flat=True)
        
        if not user_liked:
            return []
        
        # Find users who also liked these products
        potential_follows = (
            User.objects
            .filter(
                adventure_runs__product_id__in=user_liked,
                adventure_runs__rating__gte=4,
            )
            .exclude(id=self.user.id)
            .exclude(
                id__in=UserFollow.objects.filter(
                    follower=self.user,
                ).values_list("followed_id", flat=True)
            )
            .annotate(
                shared_products=Count(
                    "adventure_runs__product_id",
                    filter=Q(adventure_runs__product_id__in=user_liked),
                    distinct=True,
                ),
                note_upvotes=Count(
                    "notes__votes",
                    distinct=True,
                ),
            )
            .filter(shared_products__gte=2)
            .order_by("-shared_products", "-note_upvotes")
        )[:limit]
        
        suggestions = []
        for user in potential_follows:
            suggestions.append(SuggestedFollow(
                user=user,
                reason="high_quality_notes" if user.note_upvotes > 5 else "similar_taste",
                shared_products=user.shared_products,
                note_upvotes=user.note_upvotes,
            ))
        
        return suggestions
    
    # === Discovery ===
    
    def get_follow_ups(self, limit: int = 10) -> List[ScoredProduct]:
        """Sequels/expansions for completed runs."""
        if not self.user:
            return []
        
        cache_key = f"user:{self.user.id}:recommendations:follow_ups:{limit}"
        cached = cache.get(cache_key)
        
        if cached is not None:
            return cached
        
        # Get completed products
        completed_ids = AdventureRun.objects.filter(
            user=self.user,
            status=RunStatus.COMPLETED,
        ).values_list("product_id", flat=True)
        
        if not completed_ids:
            return []
        
        # Find follow-up products
        relations = ProductRelation.objects.filter(
            from_product_id__in=completed_ids,
        ).select_related("to_product")
        
        # Filter out products user already has
        user_products = AdventureRun.objects.filter(
            user=self.user,
        ).values_list("product_id", flat=True)
        
        scored = []
        priority_map = {
            "sequel": 1.0,
            "expansion": 0.9,
            "prequel": 0.8,
            "conversion": 0.7,
            "related": 0.6,
        }
        
        for relation in relations:
            if relation.to_product.id not in user_products:
                scored.append(ScoredProduct(
                    product=relation.to_product,
                    score=priority_map.get(relation.relation_type, 0.5),
                    reason=f"follow_up_{relation.relation_type}",
                ))
        
        # Sort by priority and limit
        scored.sort(key=lambda x: x.score, reverse=True)
        scored = scored[:limit]
        
        cache.set(cache_key, scored, timeout=3600)
        return scored
    
    def get_trending(self, days: int = 30, limit: int = 20) -> List[ScoredProduct]:
        """Currently trending products."""
        cache_key = f"global:trending:{days}:{limit}"
        cached = cache.get(cache_key)
        
        if cached is not None:
            return cached
        
        cutoff = timezone.now() - timezone.timedelta(days=days)
        
        # Calculate trending score
        trending = (
            AdventureRun.objects
            .filter(
                created_at__gte=cutoff,
                product__status="published",
            )
            .values("product_id")
            .annotate(
                want_to_run_count=Count(
                    "id",
                    filter=Q(status=RunStatus.WANT_TO_RUN),
                ),
                completed_count=Count(
                    "id",
                    filter=Q(status=RunStatus.COMPLETED),
                ),
                notes_count=Count(
                    "notes",
                    distinct=True,
                ),
            )
            .annotate(
                score=(
                    F("want_to_run_count") * 1.0 +
                    F("completed_count") * 2.0 +
                    F("notes_count") * 0.5
                )
            )
            .filter(score__gte=1)  # Minimum threshold
            .order_by("-score")
        )[:limit]
        
        scored = []
        for item in trending:
            product = Product.objects.get(id=item["product_id"])
            scored.append(ScoredProduct(
                product=product,
                score=float(item["score"]),
                reason="trending",
            ))
        
        cache.set(cache_key, scored, timeout=3600)
        return scored
    
    def get_top_rated(
        self,
        game_system: str | None = None,
        product_type: str | None = None,
        limit: int = 20,
    ) -> List[ScoredProduct]:
        """Top rated products, optionally filtered."""
        cache_key = f"global:top_rated:{game_system}:{product_type}:{limit}"
        cached = cache.get(cache_key)
        
        if cached is not None:
            return cached
        
        # Build filters
        filters = Q(status="published")
        if game_system:
            filters &= Q(game_system__slug=game_system)
        if product_type:
            filters &= Q(product_type=product_type)
        
        # Calculate Wilson scores
        products = (
            Product.objects
            .filter(filters)
            .annotate(
                total_ratings=Count("adventure_runs__rating"),
                positive_ratings=Count(
                    "adventure_runs__rating",
                    filter=Q(adventure_runs__rating__gte=4),
                ),
            )
            .filter(total_ratings__gte=3)
            .annotate(
                wilson_score=self._wilson_score_expression("positive_ratings", "total_ratings")
            )
            .order_by("-wilson_score")
        )[:limit]
        
        scored = []
        for product in products:
            scored.append(ScoredProduct(
                product=product,
                score=product.wilson_score,
                reason="top_rated",
            ))
        
        cache.set(cache_key, scored, timeout=86400)  # 24 hours
        return scored
    
    def _wilson_score_expression(self, positive_col: str, total_col: str):
        """Django expression for Wilson score calculation."""
        # Using simplified version for performance
        # Full calculation would require custom database function
        # For now, use positive/total ratio with minimum rating count
        return F(positive_col) / F(total_col)
    
    # === Aggregated ===
    
    def get_for_you(self) -> ForYouRecommendations:
        """
        Personalized mix for the home feed.
        Returns multiple recommendation types in one call.
        """
        if not self.user:
            # Return empty for anonymous users
            return ForYouRecommendations(
                collaborative=[],
                content_based=[],
                from_following=[],
                follow_ups=[],
                trending=self.get_trending(limit=10),
                new_releases=[],
            )
        
        # Get all recommendation types
        collaborative = self.get_collaborative_recommendations(limit=5)
        content_based = self.get_content_recommendations(limit=5)
        from_following = self.get_from_following(limit=5)
        follow_ups = self.get_follow_ups(limit=5)
        trending = self.get_trending(limit=10)
        new_releases = list(self.get_new_releases(limit=5))
        
        return ForYouRecommendations(
            collaborative=collaborative,
            content_based=content_based,
            from_following=from_following,
            follow_ups=follow_ups,
            trending=trending,
            new_releases=new_releases,
        )
