"""
Tests for follow models and their relationships.
"""

import pytest
from django.test import TestCase
from django.core.exceptions import ValidationError

from apps.catalog.models import Author, AuthorFollow, Publisher, PublisherFollow
from apps.users.models import User, UserFollow


class UserFollowTestCase(TestCase):
    """Test cases for UserFollow model."""

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

    def test_create_follow(self):
        """Test creating a follow relationship."""
        follow = UserFollow.objects.create(
            follower=self.user1,
            followed=self.user2,
        )

        self.assertEqual(follow.follower, self.user1)
        self.assertEqual(follow.followed, self.user2)
        self.assertIsNotNone(follow.created_at)

    def test_follow_counts_updated_on_create(self):
        """Test that follower counts are updated when follow is created."""
        # Initial counts should be 0
        self.assertEqual(self.user2.follower_count, 0)
        self.assertEqual(self.user1.following_count, 0)

        # Create follow
        UserFollow.objects.create(follower=self.user1, followed=self.user2)

        # Refresh from database
        self.user2.refresh_from_db()
        self.user1.refresh_from_db()

        # Counts should be updated
        self.assertEqual(self.user2.follower_count, 1)
        self.assertEqual(self.user1.following_count, 1)

    def test_follow_counts_updated_on_delete(self):
        """Test that follower counts are updated when follow is deleted."""
        # Create follow
        follow = UserFollow.objects.create(follower=self.user1, followed=self.user2)

        # Verify counts
        self.user2.refresh_from_db()
        self.user1.refresh_from_db()
        self.assertEqual(self.user2.follower_count, 1)
        self.assertEqual(self.user1.following_count, 1)

        # Delete follow
        follow.delete()

        # Refresh and verify counts
        self.user2.refresh_from_db()
        self.user1.refresh_from_db()
        self.assertEqual(self.user2.follower_count, 0)
        self.assertEqual(self.user1.following_count, 0)

    def test_unique_constraint(self):
        """Test that duplicate follows are prevented."""
        UserFollow.objects.create(follower=self.user1, followed=self.user2)

        # Attempt to create duplicate
        with self.assertRaises(Exception):  # IntegrityError
            UserFollow.objects.create(follower=self.user1, followed=self.user2)

    def test_cannot_follow_self(self):
        """Test that users cannot follow themselves."""
        follow = UserFollow(follower=self.user1, followed=self.user1)
        
        with self.assertRaises(ValidationError):
            follow.clean()

    def test_follow_relationships(self):
        """Test the reverse relationships work correctly."""
        follow = UserFollow.objects.create(
            follower=self.user1,
            followed=self.user2,
        )

        # Check follower's following
        self.assertIn(self.user2, self.user1.following.all())
        self.assertEqual(self.user1.following.count(), 1)

        # Check followed's followers
        self.assertIn(self.user1, self.user2.followers.all())
        self.assertEqual(self.user2.followers.count(), 1)

    def test_string_representation(self):
        """Test the string representation of UserFollow."""
        follow = UserFollow.objects.create(
            follower=self.user1,
            followed=self.user2,
        )

        expected = f"{self.user1} follows {self.user2}"
        self.assertEqual(str(follow), expected)


class PublisherFollowTestCase(TestCase):
    """Test cases for PublisherFollow model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="pass123",
        )
        self.publisher = Publisher.objects.create(name="Test Publisher")

    def test_create_follow(self):
        """Test creating a publisher follow."""
        follow = PublisherFollow.objects.create(
            user=self.user,
            publisher=self.publisher,
        )

        self.assertEqual(follow.user, self.user)
        self.assertEqual(follow.publisher, self.publisher)
        self.assertIsNotNone(follow.created_at)

    def test_follow_counts_updated_on_create(self):
        """Test that publisher follower count is updated."""
        self.assertEqual(self.publisher.follower_count, 0)

        PublisherFollow.objects.create(user=self.user, publisher=self.publisher)

        self.publisher.refresh_from_db()
        self.assertEqual(self.publisher.follower_count, 1)

    def test_follow_counts_updated_on_delete(self):
        """Test that publisher follower count is updated on delete."""
        follow = PublisherFollow.objects.create(user=self.user, publisher=self.publisher)
        
        self.publisher.refresh_from_db()
        self.assertEqual(self.publisher.follower_count, 1)

        follow.delete()
        
        self.publisher.refresh_from_db()
        self.assertEqual(self.publisher.follower_count, 0)

    def test_unique_constraint(self):
        """Test that duplicate follows are prevented."""
        PublisherFollow.objects.create(user=self.user, publisher=self.publisher)

        with self.assertRaises(Exception):  # IntegrityError
            PublisherFollow.objects.create(user=self.user, publisher=self.publisher)

    def test_follow_relationships(self):
        """Test the reverse relationships work correctly."""
        follow = PublisherFollow.objects.create(
            user=self.user,
            publisher=self.publisher,
        )

        # Check user's publisher follows
        self.assertIn(self.publisher, self.user.publisher_follows.all())
        self.assertEqual(self.user.publisher_follows.count(), 1)

        # Check publisher's followers
        self.assertIn(self.user, self.publisher.followers.all())
        self.assertEqual(self.publisher.followers.count(), 1)

    def test_string_representation(self):
        """Test the string representation of PublisherFollow."""
        follow = PublisherFollow.objects.create(
            user=self.user,
            publisher=self.publisher,
        )

        expected = f"{self.user} follows {self.publisher}"
        self.assertEqual(str(follow), expected)


class AuthorFollowTestCase(TestCase):
    """Test cases for AuthorFollow model."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username="user1",
            email="user1@example.com",
            password="pass123",
        )
        self.author = Author.objects.create(name="Test Author")

    def test_create_follow(self):
        """Test creating an author follow."""
        follow = AuthorFollow.objects.create(
            user=self.user,
            author=self.author,
        )

        self.assertEqual(follow.user, self.user)
        self.assertEqual(follow.author, self.author)
        self.assertIsNotNone(follow.created_at)

    def test_follow_counts_updated_on_create(self):
        """Test that author follower count is updated."""
        self.assertEqual(self.author.follower_count, 0)

        AuthorFollow.objects.create(user=self.user, author=self.author)

        self.author.refresh_from_db()
        self.assertEqual(self.author.follower_count, 1)

    def test_follow_counts_updated_on_delete(self):
        """Test that author follower count is updated on delete."""
        follow = AuthorFollow.objects.create(user=self.user, author=self.author)
        
        self.author.refresh_from_db()
        self.assertEqual(self.author.follower_count, 1)

        follow.delete()
        
        self.author.refresh_from_db()
        self.assertEqual(self.author.follower_count, 0)

    def test_unique_constraint(self):
        """Test that duplicate follows are prevented."""
        AuthorFollow.objects.create(user=self.user, author=self.author)

        with self.assertRaises(Exception):  # IntegrityError
            AuthorFollow.objects.create(user=self.user, author=self.author)

    def test_follow_relationships(self):
        """Test the reverse relationships work correctly."""
        follow = AuthorFollow.objects.create(
            user=self.user,
            author=self.author,
        )

        # Check user's author follows
        self.assertIn(self.author, self.user.author_follows.all())
        self.assertEqual(self.user.author_follows.count(), 1)

        # Check author's followers
        self.assertIn(self.user, self.author.followers.all())
        self.assertEqual(self.author.followers.count(), 1)

    def test_string_representation(self):
        """Test the string representation of AuthorFollow."""
        follow = AuthorFollow.objects.create(
            user=self.user,
            author=self.author,
        )

        expected = f"{self.user} follows {self.author}"
        self.assertEqual(str(follow), expected)
