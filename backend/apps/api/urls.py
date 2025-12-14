from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AuthorViewSet,
    ContributionViewSet,
    GameSystemViewSet,
    HealthView,
    IdentifyView,
    ProductSeriesViewSet,
    ProductViewSet,
    PublisherViewSet,
    SearchView,
)

router = DefaultRouter()
router.register(r"publishers", PublisherViewSet)
router.register(r"authors", AuthorViewSet)
router.register(r"systems", GameSystemViewSet)
router.register(r"products", ProductViewSet)
router.register(r"series", ProductSeriesViewSet)
router.register(r"contributions", ContributionViewSet)

urlpatterns = [
    path("", include(router.urls)),
    path("identify", IdentifyView.as_view(), name="identify"),
    path("search", SearchView.as_view(), name="search"),
    path("health", HealthView.as_view(), name="health"),
]
