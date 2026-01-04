"""
Tests for recommendation API endpoints.
"""

import json
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.catalog.models import (
    AdventureRun,
    Author,
    AuthorFollow,
    Product,
    ProductRelation,
    Publisher,
    PublisherFollow,
    RunStatus,
)
from apps.users.models import HashedAPIToken, User, UserFollow


class RecommendationAPITestCase(APITestCase):
    """Test cases for recommendation API endpoints."""

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

        # Create API token for authentication
        self.token = HashedAPIToken.create_token(self.user1)[1]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.token}")

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
            status="published",
        )
        self.product2 = Product.objects.create(
            title="Product 2",
            slug="product-2",
            publisher=self.publisher,
            game_system=self.game_system,
            product_type="adventure",
            status="published",
        )

        # Create adventure runs
        AdventureRun.objects.create(
            user=self.user1,
            product=self.product1,
            status=RunStatus.COMPLETED,
            rating=5,
        )
        AdventureRun.objects.create(
            user=self.user2,
            product=self.product1,
            status=RunStatus.COMPLETED,
            rating=5,
        )
        AdventureRun.objects.create(
            user=self.user2,
            product=self.product2,
            status=RunStatus.COMPLETED,
            rating=4,
        )

    def test_recommendations_list_authenticated(self):
        """Test getting recommendations for authenticated user."""
        url = reverse("recommendations-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should have all recommendation sections
        self.assertIn("collaborative", data)
        self.assertIn("content_based", data)
        self.assertIn("from_following", data)
        self.assertIn("follow_ups", data)
        self.assertIn("trending", data)
        self.assertIn("new_releases", data)

    def test_recommendations_list_anonymous(self):
        """Test getting recommendations for anonymous user."""
        # Remove authentication
        self.client.credentials()
        
        url = reverse("recommendations-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should only have trending for anonymous users
        self.assertEqual(data["collaborative"], [])
        self.assertEqual(data["content_based"], [])
        self.assertEqual(data["from_following"], [])
        self.assertEqual(data["follow_ups"], [])
        self.assertEqual(data["new_releases"], [])
        self.assertGreater(len(data["trending"]), 0)

    def test_similar_users_recommendations(self):
        """Test similar users recommendations endpoint."""
        url = reverse("recommendations-similar-users")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should return list of recommendations
        self.assertIsInstance(data, list)

    def test_similar_products_recommendations(self):
        """Test similar products recommendations endpoint."""
        url = reverse("recommendations-similar-products")
        response = self.client.get(url, {"product": "product-1"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should return list of recommendations
        self.assertIsInstance(data, list)
        
        # Test without product parameter
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_follow_ups_recommendations(self):
        """Test follow-ups recommendations endpoint."""
        # Create a sequel
        sequel = Product.objects.create(
            title="Product 1 Sequel",
            slug="product-1-sequel",
            publisher=self.publisher,
            game_system=self.game_system,
            product_type="adventure",
            status="published",
        )
        
        ProductRelation.objects.create(
            from_product=self.product1,
            to_product=sequel,
            relation_type="sequel",
        )

        url = reverse("recommendations-follow-ups")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should return the sequel
        product_ids = [item["product"]["id"] for item in data]
        self.assertIn(str(sequel.id), product_ids)

    def test_from_following_recommendations(self):
        """Test from-following recommendations endpoint."""
        # User1 follows user2
        UserFollow.objects.create(follower=self.user1, followed=self.user2)

        url = reverse("recommendations-from-following")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should return products user2 liked
        self.assertIsInstance(data, list)

    def test_new_releases_recommendations(self):
        """Test new releases recommendations endpoint."""
        # Follow publisher
        PublisherFollow.objects.create(user=self.user1, publisher=self.publisher)

        url = reverse("recommendations-new-releases")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should return list of products
        self.assertIsInstance(data, list)

    def test_trending_recommendations(self):
        """Test trending recommendations endpoint."""
        url = reverse("recommendations-trending")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should return list of trending products
        self.assertIsInstance(data, list)

    def test_top_rated_recommendations(self):
        """Test top rated recommendations endpoint."""
        url = reverse("recommendations-top-rated")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should return list of top rated products
        self.assertIsInstance(data, list)
        
        # Test with filters
        response = self.client.get(url, {"game_system": "test-system"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_suggested_follows(self):
        """Test suggested follows endpoint."""
        url = reverse("recommendations-suggested-follows")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should return list of suggested users
        self.assertIsInstance(data, list)
        if data:
            self.assertIn("user", data[0])
            self.assertIn("reason", data[0])
            self.assertIn("shared_products", data[0])
            self.assertIn("note_upvotes", data[0])

    def test_product_recommendations(self):
        """Test product-specific recommendations endpoint."""
        url = reverse("product-recommendations", kwargs={"slug": "product-1"})
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should return list of similar products
        self.assertIsInstance(data, list)

    def test_follow_user(self):
        """Test following a user."""
        url = reverse("user-follows-follow", kwargs={"id": self.user2.id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        
        self.assertTrue(data["is_following"])
        self.assertEqual(data["follower_count"], 1)
        
        # Test duplicate follow
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unfollow_user(self):
        """Test unfollowing a user."""
        # First follow
        UserFollow.objects.create(follower=self.user1, followed=self.user2)
        
        url = reverse("user-follows-unfollow", kwargs={"id": self.user2.id})
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        self.assertFalse(data["is_following"])
        self.assertEqual(data["follower_count"], 0)

    def test_follow_self_error(self):
        """Test that users cannot follow themselves."""
        url = reverse("user-follows-follow", kwargs={"id": self.user1.id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_follow_unauthenticated(self):
        """Test follow actions without authentication."""
        self.client.credentials()
        
        url = reverse("user-follows-follow", kwargs={"id": self.user2.id})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_follow_publisher(self):
        """Test following a publisher."""
        url = reverse("publisher-follows-follow", kwargs={"slug": self.publisher.slug})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        
        self.assertTrue(data["is_following"])
        self.assertEqual(data["follower_count"], 1)

    def test_follow_author(self):
        """Test following an author."""
        url = reverse("author-follows-follow", kwargs={"slug": self.author.slug})
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        
        self.assertTrue(data["is_following"])
        self.assertEqual(data["follower_count"], 1)

    def test_user_following_list(self):
        """Test getting user's following list."""
        # Create some follows
        UserFollow.objects.create(follower=self.user1, followed=self.user2)
        
        url = reverse("current-user-following")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should return paginated results
        self.assertIn("results", data)
        self.assertEqual(len(data["results"]), 1)
        self.assertEqual(data["results"][0]["id"], str(self.user2.id))

    def test_user_followers_list(self):
        """Test getting user's followers list."""
        # Create a follow
        UserFollow.objects.create(follower=self.user2, followed=self.user1)
        
        url = reverse("current-user-followers")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should return paginated results
        self.assertIn("results", data)
        self.assertEqual(len(data["results"]), 1)
        self.assertEqual(data["results"][0]["id"], str(self.user2.id))

    def test_recommendation_limits(self):
        """Test that recommendation endpoints respect limit parameter."""
        url = reverse("recommendations-trending")
        response = self.client.get(url, {"limit": 5})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        # Should not return more than requested
        self.assertLessEqual(len(data), 5)

    def test_recommendation_parameters(self):
        """Test various recommendation parameters."""
        # Test days parameter
        url = reverse("recommendations-trending")
        response = self.client.get(url, {"days": 7, "limit": 10})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test game_system filter
        url = reverse("recommendations-top-rated")
        response = self.client.get(url, {"game_system": "test-system", "limit": 10})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Test product_type filter
        url = reverse("recommendations-top-rated")
        response = self.client.get(url, {"product_type": "adventure", "limit": 10})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
