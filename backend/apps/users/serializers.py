from rest_framework import serializers

from .models import User


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
