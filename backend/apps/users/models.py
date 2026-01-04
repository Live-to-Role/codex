import hashlib
import secrets
import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """Custom user model for Codex."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    avatar_url = models.URLField(blank=True)

    contribution_count = models.PositiveIntegerField(default=0)
    approved_contribution_count = models.PositiveIntegerField(default=0)
    reputation = models.IntegerField(default=0)

    is_moderator = models.BooleanField(default=False)
    is_publisher = models.BooleanField(default=False)

    # Trust system for auto-approval
    trust_revoked = models.BooleanField(default=False)
    trust_revoked_at = models.DateTimeField(null=True, blank=True)
    trust_revoked_reason = models.CharField(max_length=255, blank=True)

    # Security tracking
    is_flagged = models.BooleanField(default=False)
    last_contribution_ip = models.GenericIPAddressField(null=True, blank=True)
    avg_daily_contributions = models.FloatField(null=True, blank=True)

    # Follow counts
    follower_count = models.PositiveIntegerField(default=0)
    following_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["follower_count"]),
            models.Index(fields=["following_count"]),
        ]

    def __str__(self):
        return self.display_name or self.email

    @property
    def public_name(self):
        """Return the name to display publicly."""
        return self.display_name or self.username or self.email.split("@")[0]


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
        verbose_name = "user follow"
        verbose_name_plural = "user follows"
        indexes = [
            models.Index(fields=["follower", "created_at"]),
            models.Index(fields=["followed", "created_at"]),
        ]

    def __str__(self):
        return f"{self.follower} follows {self.followed}"

    def clean(self):
        if self.follower == self.followed:
            raise ValidationError("Users cannot follow themselves.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Update follower counts
        self.followed.follower_count = self.followed.followers.count()
        self.followed.save(update_fields=["follower_count"])
        self.follower.following_count = self.follower.following.count()
        self.follower.save(update_fields=["following_count"])

    def delete(self, *args, **kwargs):
        follower = self.follower
        followed = self.followed
        super().delete(*args, **kwargs)
        
        # Update follower counts
        followed.follower_count = followed.followers.count()
        followed.save(update_fields=["follower_count"])
        follower.following_count = follower.following.count()
        follower.save(update_fields=["following_count"])


class HashedAPIToken(models.Model):
    """
    API token with hashed storage.
    
    The actual token is only shown once on creation.
    We store a hash for validation.
    """
    
    key_hash = models.CharField(max_length=64, unique=True, db_index=True)
    key_prefix = models.CharField(max_length=8, help_text="First 8 chars for identification")
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="api_token",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "API Token"
        verbose_name_plural = "API Tokens"
    
    def __str__(self):
        return f"{self.key_prefix}... ({self.user.email})"
    
    @classmethod
    def generate_key(cls):
        """Generate a secure random token."""
        return secrets.token_urlsafe(32)
    
    @classmethod
    def hash_key(cls, key: str) -> str:
        """Hash a token for storage."""
        return hashlib.sha256(key.encode()).hexdigest()
    
    @classmethod
    def create_token(cls, user) -> tuple["HashedAPIToken", str]:
        """
        Create a new token for a user.
        
        Returns:
            Tuple of (token_instance, plain_text_key)
            
        The plain_text_key is only available at creation time.
        """
        cls.objects.filter(user=user).delete()
        
        plain_key = cls.generate_key()
        key_hash = cls.hash_key(plain_key)
        key_prefix = plain_key[:8]
        
        token = cls.objects.create(
            user=user,
            key_hash=key_hash,
            key_prefix=key_prefix,
        )
        
        return token, plain_key
    
    @classmethod
    def validate_key(cls, key: str):
        """
        Validate a token and return the associated user.
        
        Returns:
            User instance if valid, None otherwise
        """
        key_hash = cls.hash_key(key)
        try:
            token = cls.objects.select_related("user").get(key_hash=key_hash)
            token.last_used_at = timezone.now()
            token.save(update_fields=["last_used_at"])
            return token.user
        except cls.DoesNotExist:
            return None
