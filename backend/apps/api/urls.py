from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AdventureRunViewSet,
    AuthorViewSet,
    CommunityNoteViewSet,
    ContributionViewSet,
    GameSystemViewSet,
    HealthView,
    IdentifyView,
    ProductSeriesViewSet,
    ProductViewSet,
    PublisherViewSet,
    SearchView,
)
from .views_recommendations import (
    AuthorFollowViewSet,
    CurrentUserFollowingListViewSet,
    ProductRecommendationViewSet,
    RecommendationViewSet,
    PublisherFollowViewSet,
    UserFollowListViewSet,
    UserFollowViewSet,
)

router = DefaultRouter()
router.register(r"publishers", PublisherViewSet)
router.register(r"authors", AuthorViewSet)
router.register(r"systems", GameSystemViewSet)
router.register(r"products", ProductViewSet)
router.register(r"series", ProductSeriesViewSet)
router.register(r"contributions", ContributionViewSet)
router.register(r"community-notes", CommunityNoteViewSet)
router.register(r"adventure-runs", AdventureRunViewSet, basename="adventure-runs")

# Recommendation endpoints
router.register(r"recommendations", RecommendationViewSet, basename="recommendations")
router.register(r"users", UserFollowViewSet, basename="user-follows")

urlpatterns = [
    path("", include(router.urls)),
    path("identify", IdentifyView.as_view(), name="identify"),
    path("search", SearchView.as_view(), name="search"),
    path("health", HealthView.as_view(), name="health"),
    # Follow management
    path("me/following/", CurrentUserFollowingListViewSet.as_view({"get": "following"}), name="current-user-following"),
    path("me/followers/", CurrentUserFollowingListViewSet.as_view({"get": "followers"}), name="current-user-followers"),
    # Publisher follow endpoints
    path("publishers/<slug:slug>/follow/", PublisherFollowViewSet.as_view({"post": "follow", "delete": "unfollow"}), name="publisher-follows-follow"),
    # Author follow endpoints
    path("authors/<slug:slug>/follow/", AuthorFollowViewSet.as_view({"post": "follow", "delete": "unfollow"}), name="author-follows-follow"),
    # Product recommendations
    path("products/<slug>/recommendations/", ProductRecommendationViewSet.as_view({"get": "retrieve"}), name="product-recommendations"),
]
