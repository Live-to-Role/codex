"""
Serializers for recommendation endpoints.
"""

from rest_framework import serializers

from apps.catalog.models import Product
from apps.catalog.services import ScoredProduct, SuggestedFollow
from apps.users.models import User
from apps.users.serializers import UserPublicSerializer


class RecommendationProductSerializer(serializers.ModelSerializer):
    """Lightweight serializer for recommended products."""
    
    class Meta:
        model = Product
        fields = [
            "id",
            "slug",
            "title",
            "product_type",
            "cover_url",
            "thumbnail_url",
            "publisher",
            "game_system",
            "level_range_min",
            "level_range_max",
            "msrp",
        ]
    
    publisher = serializers.StringRelatedField()
    game_system = serializers.StringRelatedField()


class ScoredProductSerializer(serializers.Serializer):
    """Serializer for products with recommendation scores."""
    
    product = RecommendationProductSerializer(read_only=True)
    score = serializers.FloatField(read_only=True)
    reason = serializers.CharField(read_only=True, allow_null=True)
    source = serializers.JSONField(read_only=True, allow_null=True)


class SuggestedFollowSerializer(serializers.Serializer):
    """Serializer for suggested user follows."""
    
    user = UserPublicSerializer(read_only=True)
    reason = serializers.CharField(read_only=True)
    shared_products = serializers.IntegerField(read_only=True)
    note_upvotes = serializers.IntegerField(read_only=True)


class FollowResponseSerializer(serializers.Serializer):
    """Response for follow/unfollow actions."""
    
    is_following = serializers.BooleanField()
    follower_count = serializers.IntegerField()


class ForYouRecommendationsSerializer(serializers.Serializer):
    """Serializer for aggregated recommendations."""
    
    collaborative = ScoredProductSerializer(many=True)
    content_based = ScoredProductSerializer(many=True)
    from_following = ScoredProductSerializer(many=True)
    follow_ups = ScoredProductSerializer(many=True)
    trending = ScoredProductSerializer(many=True)
    new_releases = RecommendationProductSerializer(many=True)


class RecommendationListSerializer(serializers.Serializer):
    """Paginated list of recommendations."""
    
    results = ScoredProductSerializer(many=True)
    total = serializers.IntegerField()
    has_more = serializers.BooleanField()


class UserFollowSerializer(serializers.ModelSerializer):
    """Serializer for user follow relationships."""
    
    follower = UserPublicSerializer(read_only=True)
    followed = UserPublicSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ["id", "public_name", "avatar_url", "follower_count", "following_count"]
