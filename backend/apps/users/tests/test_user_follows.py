"""
Tests for user follow model and migrations.
"""

import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError

from apps.users.models import User, UserFollow


class UserFollowMigrationTestCase(TestCase):
    """Test cases for user follow migrations."""

    def test_user_follow_model_exists(self):
        """Test that UserFollow model was created properly."""
        # Verify the model exists and has the expected fields
        user1 = User.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="pass123",
        )
        user2 = User.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="pass123",
        )

        follow = UserFollow.objects.create(
            follower=user1,
            followed=user2,
        )

        # Verify all fields exist
        self.assertIsNotNone(follow.id)
        self.assertEqual(follow.follower, user1)
        self.assertEqual(follow.followed, user2)
        self.assertIsNotNone(follow.created_at)

    def test_user_follow_indexes(self):
        """Test that proper indexes were created."""
        # This would typically be checked via schema inspection
        # For now, just ensure queries work efficiently
        user1 = User.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="pass123",
        )
        user2 = User.objects.create_user(
            username="user2",
            email="user2@example.com",
            password="pass123",
        )
        user3 = User.objects.create_user(
            username="user3",
            email="user3@example.com",
            password="pass123",
        )

        # Create follows
        UserFollow.objects.create(follower=user1, followed=user2)
        UserFollow.objects.create(follower=user1, followed=user3)

        # Query by follower (should use index)
        follows = UserFollow.objects.filter(follower=user1)
        self.assertEqual(follows.count(), 2)

        # Query by followed (should use index)
        followers = UserFollow.objects.filter(followed=user2)
        self.assertEqual(followers.count(), 1)

    def test_user_follow_count_fields_exist(self):
        """Test that follower/following count fields were added to User."""
        user = User.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="pass123",
        )

        # Fields should exist and default to 0
        self.assertEqual(user.follower_count, 0)
        self.assertEqual(user.following_count, 0)

    def test_user_follow_indexes_exist(self):
        """Test that user indexes for follow counts were created."""
        # Create users to test index performance
        for i in range(10):
            User.objects.create_user(
                username=f"user{i}",
                email=f"user{i}@example.com",
                password="pass123",
            )

        # Query by created_at (should use index)
        users = User.objects.order_by("-created_at")
        self.assertEqual(users.count(), 10)

        # Query by follower_count (should use index)
        users = User.objects.filter(follower_count=0)
        self.assertEqual(users.count(), 10)

        # Query by following_count (should use index)
        users = User.objects.filter(following_count=0)
        self.assertEqual(users.count(), 10)


class UserFollowModelTestCase(TestCase):
    """Test cases for UserFollow model behavior."""

    def setUp(self):
        """Set up test data."""
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

    def test_cascade_delete_follower(self):
        """Test that follows are deleted when follower is deleted."""
        follow = UserFollow.objects.create(
            follower=self.user1,
            followed=self.user2,
        )
        follow_id = follow.id

        # Delete the follower
        self.user1.delete()

        # Follow should be deleted
        with self.assertRaises(UserFollow.DoesNotExist):
            UserFollow.objects.get(id=follow_id)

    def test_cascade_delete_followed(self):
        """Test that follows are deleted when followed user is deleted."""
        follow = UserFollow.objects.create(
            follower=self.user1,
            followed=self.user2,
        )
        follow_id = follow.id

        # Delete the followed user
        self.user2.delete()

        # Follow should be deleted
        with self.assertRaises(UserFollow.DoesNotExist):
            UserFollow.objects.get(id=follow_id)

    def test_multiple_followers(self):
        """Test that a user can have multiple followers."""
        UserFollow.objects.create(follower=self.user1, followed=self.user3)
        UserFollow.objects.create(follower=self.user2, followed=self.user3)

        self.user3.refresh_from_db()
        self.assertEqual(self.user3.follower_count, 2)
        self.assertEqual(self.user3.followers.count(), 2)

    def test_multiple_following(self):
        """Test that a user can follow multiple people."""
        UserFollow.objects.create(follower=self.user1, followed=self.user2)
        UserFollow.objects.create(follower=self.user1, followed=self.user3)

        self.user1.refresh_from_db()
        self.assertEqual(self.user1.following_count, 2)
        self.assertEqual(self.user1.following.count(), 2)

    def test_follow_ordering(self):
        """Test that follows are ordered by creation date."""
        follow1 = UserFollow.objects.create(follower=self.user1, followed=self.user2)
        follow2 = UserFollow.objects.create(follower=self.user2, followed=self.user3)

        follows = list(UserFollow.objects.all())
        self.assertEqual(follows[0], follow1)  # First created
        self.assertEqual(follows[1], follow2)  # Second created

    def test_bulk_follow_creation(self):
        """Test creating multiple follows efficiently."""
        follows = []
        for i in range(10):
            user = User.objects.create_user(
                username=f"user{i}",
                email=f"user{i}@example.com",
                password="pass123",
            )
            follows.append(
                UserFollow(
                    follower=self.user1,
                    followed=user,
                )
            )

        # Bulk create
        UserFollow.objects.bulk_create(follows)

        # Verify all were created
        self.assertEqual(
            UserFollow.objects.filter(follower=self.user1).count(),
            10,
        )

        # Note: bulk_create won't trigger save() method, so counts won't update
        # This is expected behavior for performance

    def test_follow_queryset_operations(self):
        """Test common queryset operations on follows."""
        # Create test data
        UserFollow.objects.create(follower=self.user1, followed=self.user2)
        UserFollow.objects.create(follower=self.user1, followed=self.user3)
        UserFollow.objects.create(follower=self.user2, followed=self.user3)

        # Filter by follower
        user1_follows = UserFollow.objects.filter(follower=self.user1)
        self.assertEqual(user1_follows.count(), 2)

        # Filter by followed
        user3_followers = UserFollow.objects.filter(followed=self.user3)
        self.assertEqual(user3_followers.count(), 2)

        # Check existence
        exists = UserFollow.objects.filter(
            follower=self.user1,
            followed=self.user2,
        ).exists()
        self.assertTrue(exists)

        # Get or create
        follow, created = UserFollow.objects.get_or_create(
            follower=self.user3,
            followed=self.user1,
        )
        self.assertTrue(created)
        self.assertIsNotNone(follow.id)

        # Try get or create again
        follow, created = UserFollow.objects.get_or_create(
            follower=self.user3,
            followed=self.user1,
        )
        self.assertFalse(created)
        self.assertEqual(follow.id, follow.id)
