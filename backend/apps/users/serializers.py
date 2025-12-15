from dj_rest_auth.registration.serializers import RegisterSerializer
from rest_framework import serializers

from .models import User


class CustomRegisterSerializer(RegisterSerializer):
    """Custom registration serializer with proper email validation."""

    def validate_email(self, email):
        """Check if email already exists."""
        email = super().validate_email(email)
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return email


class UserSerializer(serializers.ModelSerializer):
    """Serializer for user details."""

    public_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "username",
            "display_name",
            "public_name",
            "bio",
            "avatar_url",
            "contribution_count",
            "reputation",
            "is_moderator",
            "is_publisher",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "contribution_count",
            "reputation",
            "is_moderator",
            "is_publisher",
            "created_at",
        ]


class UserPublicSerializer(serializers.ModelSerializer):
    """Serializer for public user info (used in contributions, etc.)."""

    public_name = serializers.ReadOnlyField()

    class Meta:
        model = User
        fields = [
            "id",
            "public_name",
            "avatar_url",
            "contribution_count",
            "reputation",
            "is_moderator",
            "is_publisher",
        ]
