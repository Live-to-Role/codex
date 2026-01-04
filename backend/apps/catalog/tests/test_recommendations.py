"""
Tests for the recommendation service.
"""

import pytest
from django.test import TestCase
from django.utils import timezone
from freezegun import freeze_time

from apps.catalog.models import (
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
from apps.catalog.services import RecommendationService, ScoredProduct
from apps.users.models import User, UserFollow


class RecommendationServiceTestCase(TestCase):
    """Test cases for RecommendationService."""

    def setUp(self):
        """Set up test data."""
        # Create users
        self.user1 = User.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="pass123",
        )
        self.user2 = User.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="pass123",
        )
        self.user3 = User.objects.create_user(
            username="user3",
            email="user3@example.com",
            password="pass123",
        )

        # Create publisher and author
        self.publisher = Publisher.objects.create(name="Test Publisher")
        self.author = Author.objects.create(name="Test Author")

        # Create game system
        from apps.catalog.models import GameSystem
        self.game_system = GameSystem.objects.create(
            name="Test System",
            slug="test-system",
        )

        # Create products
        self.product1 = Product.objects.create(
            title="Product 1",
            slug="product-1",
            publisher=self.publisher,
            game_system=self.game_system,
            product_type="adventure",
            tags=["fantasy", "magic"],
            themes=["heroic", "exploration"],
            genres=["adventure"],
            level_range_min=1,
            level_range_max=5,
            status="published",
        )
        self.product2 = Product.objects.create(
            title="Product 2",
            slug="product-2",
            publisher=self.publisher,
            game_system=self.game_system,
            product_type="adventure",
            tags=["fantasy", "combat"],
            themes=["dark", "survival"],
            genres=["adventure"],
            level_range_min=3,
            level_range_max=7,
            status="published",
        )
        self.product3 = Product.objects.create(
            title="Product 3",
            slug="product-3",
            publisher=self.publisher,
            game_system=self.game_system,
            product_type="adventure",
            tags=["sci-fi", "space"],
            themes=["exploration", "mystery"],
            genres=["sci-fi"],
            level_range_min=5,
            level_range_max=10,
            status="published",
        )

        # Create adventure runs with ratings
        with freeze_time("2024-01-01"):
            # User1 loves product1 and product2
            AdventureRun.objects.create(
                user=self.user1,
                product=self.product1,
                status=RunStatus.COMPLETED,
                rating=5,
                player_count=4,
                completed_at=timezone.now(),
            )
            AdventureRun.objects.create(
                user=self.user1,
                product=self.product2,
                status=RunStatus.COMPLETED,
                rating=4,
                player_count=4,
                completed_at=timezone.now(),
            )

        # User2 has similar taste to user1
        with freeze_time("2024-01-02"):
            AdventureRun.objects.create(
                user=self.user2,
                product=self.product1,
                status=RunStatus.COMPLETED,
                rating=5,
                player_count=3,
                completed_at=timezone.now(),
            )
            AdventureRun.objects.create(
                user=self.user2,
                product=self.product2,
                status=RunStatus.COMPLETED,
                rating=4,
                player_count=3,
                completed_at=timezone.now(),
            )
            # User2 also loves product3 (user1 hasn't seen it)
            AdventureRun.objects.create(
                user=self.user2,
                product=self.product3,
                status=RunStatus.COMPLETED,
                rating=5,
                player_count=3,
                completed_at=timezone.now(),
            )

        # User3 has different taste
        AdventureRun.objects.create(
            user=self.user3,
            product=self.product3,
            status=RunStatus.COMPLETED,
            rating=5,
            player_count=5,
            completed_at=timezone.now(),
        )

    def test_get_user_profile(self):
        """Test user preference profile generation."""
        service = RecommendationService(user=self.user1)
        profile = service.get_user_profile()

        # Check tags
        assert "fantasy" in profile.tags
        assert profile.tags["fantasy"] == 2  # Appears in both products
        assert "magic" in profile.tags
        assert "combat" in profile.tags

        # Check themes
        assert "heroic" in profile.themes
        assert "exploration" in profile.themes
        assert "dark" in profile.themes

        # Check genres
        assert "adventure" in profile.genres
        assert profile.genres["adventure"] == 2

        # Check system
        assert "test-system" in profile.preferred_systems

        # Check publisher
        assert str(self.publisher.id) in profile.preferred_publishers

        # Check level range
        assert profile.level_range == (1, 7)  # Min of all, max of all

        # Check party size
        assert profile.typical_party_size == 4

    def test_get_similar_users(self):
        """Test finding similar users."""
        service = RecommendationService(user=self.user1)
        similar_users = service.get_similar_users(min_overlap=2)

        # User2 should be similar (2 shared highly-rated products)
        assert self.user2 in similar_users
        # User3 should not be similar (no overlap)
        assert self.user3 not in similar_users

    def test_get_collaborative_recommendations(self):
        """Test collaborative filtering recommendations."""
        service = RecommendationService(user=self.user1)
        recommendations = service.get_collaborative_recommendations()

        # Should recommend product3 (liked by similar user2)
        product_ids = [r.product.id for r in recommendations]
        assert self.product3.id in product_ids
        # Should not recommend products user1 already has
        assert self.product1.id not in product_ids
        assert self.product2.id not in product_ids

    def test_get_content_recommendations(self):
        """Test content-based recommendations."""
        # Create a new product similar to user1's preferences
        similar_product = Product.objects.create(
            title="Similar Product",
            slug="similar-product",
            publisher=self.publisher,
            game_system=self.game_system,
            product_type="adventure",
            tags=["fantasy", "magic"],
            themes=["heroic"],
            genres=["adventure"],
            level_range_min=2,
            level_range_max=6,
            status="published",
        )

        service = RecommendationService(user=self.user1)
        recommendations = service.get_content_recommendations()

        product_ids = [r.product.id for r in recommendations]
        assert similar_product.id in product_ids

    def test_get_similar_products(self):
        """Test finding products similar to a specific product."""
        service = RecommendationService()
        recommendations = service.get_similar_products(self.product1)

        # product2 should be similar (same publisher, system, overlapping tags)
        product_ids = [r.product.id for r in recommendations]
        assert self.product2.id in product_ids
        # product3 should be less similar (different tags)
        assert self.product3.id in product_ids  # Still included but with lower score

    def test_get_follow_ups(self):
        """Test follow-up adventure recommendations."""
        # Create a sequel to product1
        sequel = Product.objects.create(
            title="Product 1 Sequel",
            slug="product-1-sequel",
            publisher=self.publisher,
            game_system=self.game_system,
            product_type="adventure",
            status="published",
        )

        # Create relation
        ProductRelation.objects.create(
            from_product=self.product1,
            to_product=sequel,
            relation_type="sequel",
        )

        service = RecommendationService(user=self.user1)
        recommendations = service.get_follow_ups()

        product_ids = [r.product.id for r in recommendations]
        assert sequel.id in product_ids

    def test_get_from_following(self):
        """Test recommendations from followed users."""
        # User1 follows user2
        UserFollow.objects.create(follower=self.user1, followed=self.user2)

        service = RecommendationService(user=self.user1)
        recommendations = service.get_from_following()

        # Should recommend products user2 liked
        product_ids = [r.product.id for r in recommendations]
        assert self.product3.id in product_ids

    def test_get_new_releases(self):
        """Test new releases from followed publishers."""
        # User1 follows publisher
        PublisherFollow.objects.create(user=self.user1, publisher=self.publisher)

        # Create new product
        new_product = Product.objects.create(
            title="New Product",
            slug="new-product",
            publisher=self.publisher,
            game_system=self.game_system,
            product_type="adventure",
            status="published",
            created_at=timezone.now(),
        )

        service = RecommendationService(user=self.user1)
        products = service.get_new_releases(days=365)

        assert new_product in products

    def test_get_suggested_follows(self):
        """Test suggested user follows."""
        # User2 has high-quality notes
        from apps.catalog.models import CommunityNote
        note = CommunityNote.objects.create(
            adventure_run=AdventureRun.objects.filter(user=self.user2).first(),
            note_type="gm_tip",
            title="Great Tip",
            content="This is a great tip",
        )
        
        # Add votes to note
        NoteVote.objects.create(user=self.user1, note=note)
        NoteVote.objects.create(user=self.user3, note=note)

        service = RecommendationService(user=self.user1)
        suggestions = service.get_suggested_follows()

        # Should suggest user2 (similar taste + quality notes)
        user_ids = [s.user.id for s in suggestions]
        assert self.user2.id in user_ids

    def test_get_trending(self):
        """Test trending products calculation."""
        # Create recent activity
        with freeze_time("2024-01-15"):
            for i in range(10):
                user = User.objects.create_user(
                    username=f"user{i}",
                    email=f"user{i}@example.com",
                    password="pass123",
                )
                AdventureRun.objects.create(
                    user=user,
                    product=self.product1,
                    status=RunStatus.WANT_TO_RUN,
                )

        service = RecommendationService()
        trending = service.get_trending(days=30)

        # product1 should be trending
        product_ids = [r.product.id for r in trending]
        assert self.product1.id in product_ids

    def test_get_top_rated(self):
        """Test top rated products calculation."""
        service = RecommendationService()
        top_rated = service.get_top_rated()

        # Should return products with ratings
        product_ids = [r.product.id for r in top_rated]
        assert self.product1.id in product_ids
        assert self.product2.id in product_ids
        assert self.product3.id in product_ids

    def test_get_for_you_anonymous(self):
        """Test 'for you' recommendations for anonymous users."""
        service = RecommendationService(user=None)
        recommendations = service.get_for_you()

        # Should only have trending for anonymous users
        assert len(recommendations.collaborative) == 0
        assert len(recommendations.content_based) == 0
        assert len(recommendations.from_following) == 0
        assert len(recommendations.follow_ups) == 0
        assert len(recommendations.new_releases) == 0
        assert len(recommendations.trending) > 0

    def test_get_for_you_authenticated(self):
        """Test 'for you' recommendations for authenticated users."""
        service = RecommendationService(user=self.user1)
        recommendations = service.get_for_you()

        # Should have all recommendation types
        assert len(recommendations.collaborative) >= 0
        assert len(recommendations.content_based) >= 0
        assert len(recommendations.from_following) >= 0
        assert len(recommendations.follow_ups) >= 0
        assert len(recommendations.trending) > 0
        assert len(recommendations.new_releases) >= 0

    def test_similarity_score_calculation(self):
        """Test similarity score calculation."""
        service = RecommendationService()
        profile = service.get_user_profile()

        # Exact match should have high score
        score1 = service._similarity_score(profile, self.product1)
        score2 = service._similarity_score(profile, self.product2)
        score3 = service._similarity_score(profile, self.product3)

        # Products 1 and 2 should have higher scores than 3
        assert score1 > score3
        assert score2 > score3

    def test_range_overlap_calculation(self):
        """Test range overlap calculation."""
        service = RecommendationService()

        # Complete overlap
        overlap = service._calculate_range_overlap((1, 5), (2, 4))
        assert overlap == 0.6  # 3/5

        # Partial overlap
        overlap = service._calculate_range_overlap((1, 5), (4, 8))
        assert overlap == 0.25  # 2/8

        # No overlap
        overlap = service._calculate_range_overlap((1, 5), (6, 10))
        assert overlap == 0.0

    def test_cold_start_user(self):
        """Test recommendations for new user with no ratings."""
        new_user = User.objects.create_user(
            username="newuser",
            email="newuser@example.com",
            password="pass123",
        )

        service = RecommendationService(user=new_user)
        
        # Should not fail for cold start
        profile = service.get_user_profile()
        assert len(profile.tags) == 0
        assert len(profile.themes) == 0
        assert len(profile.genres) == 0

        recommendations = service.get_collaborative_recommendations()
        assert len(recommendations) == 0

        content_recs = service.get_content_recommendations()
        assert len(content_recs) == 0
