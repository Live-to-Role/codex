"""
API views for recommendation system.
"""

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet, ModelViewSet, ReadOnlyModelViewSet

from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly

from apps.catalog.models import Author, Product, Publisher
from apps.catalog.services import RecommendationService
from apps.users.models import User, UserFollow

from .serializers import UserPublicSerializer
from .serializers_recommendations import (
    FollowResponseSerializer,
    ForYouRecommendationsSerializer,
    RecommendationListSerializer,
    RecommendationProductSerializer,
    ScoredProductSerializer,
    SuggestedFollowSerializer,
)


class RecommendationViewSet(GenericViewSet):
    """
    ViewSet for recommendation endpoints.
    
    All endpoints are read-only and return product recommendations.
    """
    
    permission_classes = []
    serializer_class = ScoredProductSerializer
    
    def get_service(self):
        """Get recommendation service with current user."""
        user = self.request.user if self.request.user.is_authenticated else None
        return RecommendationService(user=user)
    
    def list(self, request):
        """Get personalized recommendations for the home feed."""
        if not request.user.is_authenticated:
            # Return empty recommendations for anonymous users
            return Response({
                "collaborative": [],
                "content_based": [],
                "from_following": [],
                "follow_ups": [],
                "trending": [],
                "new_releases": [],
            })
        
        service = RecommendationService(user=request.user)
        recommendations = service.get_for_you()
        
        serializer = ForYouRecommendationsSerializer(recommendations)
        return Response(serializer.data)
    
    @action(detail=False, url_path="similar-users")
    def similar_users(self, request):
        """Get products liked by users with similar taste."""
        if not request.user.is_authenticated:
            return Response([])
        
        limit = min(int(request.query_params.get("limit", 20)), 50)
        service = RecommendationService(user=request.user)
        recommendations = service.get_collaborative_recommendations(limit=limit)
        
        serializer = ScoredProductSerializer(recommendations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, url_path="similar-products")
    def similar_products(self, request):
        """Get products similar to a specific product."""
        product_slug = request.query_params.get("product")
        if not product_slug:
            return Response(
                {"detail": "Product slug is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        product = get_object_or_404(Product, slug=product_slug)
        limit = min(int(request.query_params.get("limit", 6)), 20)
        
        service = RecommendationService()
        recommendations = service.get_similar_products(product, limit=limit)
        
        serializer = ScoredProductSerializer(recommendations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, url_path="follow-ups")
    def follow_ups(self, request):
        """Get sequels and expansions for completed adventures."""
        if not request.user.is_authenticated:
            return Response([])
        
        limit = min(int(request.query_params.get("limit", 10)), 20)
        service = RecommendationService(user=request.user)
        recommendations = service.get_follow_ups(limit=limit)
        
        serializer = ScoredProductSerializer(recommendations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, url_path="from-following")
    def from_following(self, request):
        """Get products rated highly by users you follow."""
        if not request.user.is_authenticated:
            return Response([])
        
        limit = min(int(request.query_params.get("limit", 20)), 50)
        service = RecommendationService(user=request.user)
        recommendations = service.get_from_following(limit=limit)
        
        serializer = ScoredProductSerializer(recommendations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, url_path="new-releases")
    def new_releases(self, request):
        """Get new releases from publishers/authors you follow."""
        if not request.user.is_authenticated:
            return Response([])
        
        days = min(int(request.query_params.get("days", 90)), 365)
        limit = min(int(request.query_params.get("limit", 20)), 50)
        
        service = RecommendationService(user=request.user)
        products = service.get_new_releases(days=days, limit=limit)
        
        serializer = RecommendationProductSerializer(products, many=True)
        return Response(serializer.data)
    
    @action(detail=False)
    def trending(self, request):
        """Get currently trending products."""
        days = min(int(request.query_params.get("days", 30)), 365)
        limit = min(int(request.query_params.get("limit", 20)), 50)
        
        service = RecommendationService()
        recommendations = service.get_trending(days=days, limit=limit)
        
        serializer = ScoredProductSerializer(recommendations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, url_path="top-rated")
    def top_rated(self, request):
        """Get top rated products, optionally filtered."""
        game_system = request.query_params.get("game_system")
        product_type = request.query_params.get("product_type")
        limit = min(int(request.query_params.get("limit", 20)), 50)
        
        service = RecommendationService()
        recommendations = service.get_top_rated(
            game_system=game_system,
            product_type=product_type,
            limit=limit,
        )
        
        serializer = ScoredProductSerializer(recommendations, many=True)
        return Response(serializer.data)
    
    @action(detail=False, url_path="suggested-follows")
    def suggested_follows(self, request):
        """Get suggested users to follow."""
        if not request.user.is_authenticated:
            return Response([])
        
        limit = min(int(request.query_params.get("limit", 10)), 20)
        service = RecommendationService(user=request.user)
        suggestions = service.get_suggested_follows(limit=limit)
        
        serializer = SuggestedFollowSerializer(suggestions, many=True)
        return Response(serializer.data)


class ProductRecommendationViewSet(GenericViewSet):
    """
    Recommendations for a specific product.
    """
    
    permission_classes = []
    lookup_field = "slug"
    
    def retrieve(self, request, slug=None):
        """Get recommendations based on a specific product."""
        product = get_object_or_404(Product, slug=slug)
        limit = min(int(request.query_params.get("limit", 6)), 20)
        
        service = RecommendationService()
        recommendations = service.get_similar_products(product, limit=limit)
        
        serializer = ScoredProductSerializer(recommendations, many=True)
        return Response(serializer.data)


class UserFollowViewSet(GenericViewSet):
    """
    Handle user follow/unfollow actions.
    """
    
    queryset = User.objects.all()
    lookup_field = "id"
    
    def get_permissions(self):
        if self.action in ["follow", "unfollow"]:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()
    
    @action(detail=True, methods=["post"])
    def follow(self, request, id=None):
        """Follow a user."""
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        
        user_to_follow = self.get_object()
        
        if user_to_follow == request.user:
            return Response(
                {"detail": "You cannot follow yourself."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        follow, created = UserFollow.objects.get_or_create(
            follower=request.user,
            followed=user_to_follow,
        )
        
        serializer = FollowResponseSerializer({
            "is_following": True,
            "follower_count": user_to_follow.follower_count,
        })
        
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
    
    @action(detail=True, methods=["delete"])
    def unfollow(self, request, id=None):
        """Unfollow a user."""
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        
        user_to_unfollow = self.get_object()
        
        try:
            follow = UserFollow.objects.get(
                follower=request.user,
                followed=user_to_unfollow,
            )
            follow.delete()
            
            serializer = FollowResponseSerializer({
                "is_following": False,
                "follower_count": user_to_unfollow.follower_count,
            })
            
            return Response(serializer.data)
        except UserFollow.DoesNotExist:
            return Response(
                {"detail": "You are not following this user."},
                status=status.HTTP_404_NOT_FOUND,
            )


class UserFollowListViewSet(ReadOnlyModelViewSet):
    """
    List followers or following for a user.
    """
    
    serializer_class = UserPublicSerializer
    lookup_field = "id"
    
    def get_queryset(self):
        user_id = self.kwargs.get("id")
        user = get_object_or_404(User, id=user_id)
        
        if self.action == "followers":
            return User.objects.filter(
                id__in=UserFollow.objects.filter(followed=user).values("follower_id")
            )
        elif self.action == "following":
            return User.objects.filter(
                id__in=UserFollow.objects.filter(follower=user).values("followed_id")
            )
        
        return User.objects.none()
    
    @action(detail=False)
    def followers(self, request, id=None):
        """List user's followers."""
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False)
    def following(self, request, id=None):
        """List who user follows."""
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class CurrentUserFollowingListViewSet(ReadOnlyModelViewSet):
    """
    List current user's following/followers.
    """
    
    serializer_class = UserPublicSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return User.objects.none()
        
        if self.action == "following":
            return User.objects.filter(
                id__in=UserFollow.objects.filter(
                    follower=self.request.user
                ).values("followed_id")
            )
        elif self.action == "followers":
            return User.objects.filter(
                id__in=UserFollow.objects.filter(
                    followed=self.request.user
                ).values("follower_id")
            )
        
        return User.objects.none()
    
    @action(detail=False)
    def following(self, request):
        """List current user's following."""
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False)
    def followers(self, request):
        """List current user's followers."""
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class PublisherFollowViewSet(GenericViewSet):
    """
    Handle publisher follow/unfollow actions.
    """
    
    queryset = Publisher.objects.all()
    lookup_field = "slug"
    
    def get_permissions(self):
        if self.action in ["follow", "unfollow"]:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()
    
    @action(detail=True, methods=["post"])
    def follow(self, request, slug=None):
        """Follow a publisher."""
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        
        publisher = self.get_object()
        
        from apps.catalog.models import PublisherFollow
        
        follow, created = PublisherFollow.objects.get_or_create(
            user=request.user,
            publisher=publisher,
        )
        
        serializer = FollowResponseSerializer({
            "is_following": True,
            "follower_count": publisher.follower_count,
        })
        
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
    
    @action(detail=True, methods=["delete"])
    def unfollow(self, request, slug=None):
        """Unfollow a publisher."""
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        
        publisher = self.get_object()
        
        from apps.catalog.models import PublisherFollow
        
        try:
            follow = PublisherFollow.objects.get(
                user=request.user,
                publisher=publisher,
            )
            follow.delete()
            
            serializer = FollowResponseSerializer({
                "is_following": False,
                "follower_count": publisher.follower_count,
            })
            
            return Response(serializer.data)
        except PublisherFollow.DoesNotExist:
            return Response(
                {"detail": "You are not following this publisher."},
                status=status.HTTP_404_NOT_FOUND,
            )


class AuthorFollowViewSet(GenericViewSet):
    """
    Handle author follow/unfollow actions.
    """
    
    queryset = Author.objects.all()
    lookup_field = "slug"
    
    def get_permissions(self):
        if self.action in ["follow", "unfollow"]:
            self.permission_classes = [IsAuthenticated]
        return super().get_permissions()
    
    @action(detail=True, methods=["post"])
    def follow(self, request, slug=None):
        """Follow an author."""
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        
        author = self.get_object()
        
        from apps.catalog.models import AuthorFollow
        
        follow, created = AuthorFollow.objects.get_or_create(
            user=request.user,
            author=author,
        )
        
        serializer = FollowResponseSerializer({
            "is_following": True,
            "follower_count": author.follower_count,
        })
        
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )
    
    @action(detail=True, methods=["delete"])
    def unfollow(self, request, slug=None):
        """Unfollow an author."""
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        
        author = self.get_object()
        
        from apps.catalog.models import AuthorFollow
        
        try:
            follow = AuthorFollow.objects.get(
                user=request.user,
                author=author,
            )
            follow.delete()
            
            serializer = FollowResponseSerializer({
                "is_following": False,
                "follower_count": author.follower_count,
            })
            
            return Response(serializer.data)
        except AuthorFollow.DoesNotExist:
            return Response(
                {"detail": "You are not following this author."},
                status=status.HTTP_404_NOT_FOUND,
            )
