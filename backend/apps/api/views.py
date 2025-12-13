from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from rapidfuzz import fuzz

from apps.catalog.models import (
    Author,
    Contribution,
    FileHash,
    GameSystem,
    Product,
    ProductCredit,
    Publisher,
    Revision,
)

from .serializers import (
    AuthorDetailSerializer,
    AuthorListSerializer,
    ContributionCreateSerializer,
    ContributionSerializer,
    GameSystemDetailSerializer,
    GameSystemListSerializer,
    IdentifyRequestSerializer,
    ProductDetailSerializer,
    ProductListSerializer,
    PublisherDetailSerializer,
    PublisherListSerializer,
    RevisionSerializer,
)


class IdentifyView(APIView):
    """
    Product identification endpoint for Grimoire integration.
    
    Supports identification by:
    - File hash (SHA-256): Exact match
    - Title/filename: Fuzzy matching
    """

    permission_classes = [AllowAny]

    def get(self, request):
        serializer = IdentifyRequestSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        hash_value = data.get("hash")
        title = data.get("title")
        filename = data.get("filename")

        if hash_value:
            result = self._identify_by_hash(hash_value)
            if result["match"] == "exact":
                return Response(result)

        if title or filename:
            result = self._identify_by_title(title, filename)
            return Response(result)

        return Response({
            "match": "none",
            "confidence": 0.0,
            "product": None,
            "suggestions": [],
        })

    def _identify_by_hash(self, hash_value: str) -> dict:
        """Look up product by file hash."""
        hash_value = hash_value.lower().strip()

        try:
            file_hash = FileHash.objects.select_related(
                "product",
                "product__publisher",
                "product__game_system",
            ).get(hash_sha256=hash_value)

            return {
                "match": "exact",
                "confidence": 1.0,
                "product": ProductDetailSerializer(file_hash.product).data,
                "suggestions": [],
            }
        except FileHash.DoesNotExist:
            pass

        if len(hash_value) == 32:
            try:
                file_hash = FileHash.objects.select_related(
                    "product",
                    "product__publisher",
                    "product__game_system",
                ).get(hash_md5=hash_value)

                return {
                    "match": "exact",
                    "confidence": 1.0,
                    "product": ProductDetailSerializer(file_hash.product).data,
                    "suggestions": [],
                }
            except FileHash.DoesNotExist:
                pass

        return {
            "match": "none",
            "confidence": 0.0,
            "product": None,
            "suggestions": [],
        }

    def _identify_by_title(self, title: str | None, filename: str | None) -> dict:
        """Fuzzy match product by title or filename."""
        search_term = title or filename or ""
        search_term = self._normalize_title(search_term)

        if not search_term:
            return {
                "match": "none",
                "confidence": 0.0,
                "product": None,
                "suggestions": [],
            }

        products = Product.objects.select_related(
            "publisher",
            "game_system",
        ).filter(
            status__in=["published", "verified"]
        )[:1000]

        scored_products = []
        for product in products:
            normalized_title = self._normalize_title(product.title)

            ratio = fuzz.ratio(search_term, normalized_title)
            partial_ratio = fuzz.partial_ratio(search_term, normalized_title)
            token_sort_ratio = fuzz.token_sort_ratio(search_term, normalized_title)

            score = max(ratio, partial_ratio, token_sort_ratio) / 100.0

            if score > 0.5:
                scored_products.append((score, product))

        scored_products.sort(key=lambda x: x[0], reverse=True)

        if not scored_products:
            return {
                "match": "none",
                "confidence": 0.0,
                "product": None,
                "suggestions": [],
            }

        best_score, best_product = scored_products[0]

        if best_score >= 0.9:
            return {
                "match": "exact",
                "confidence": best_score,
                "product": ProductDetailSerializer(best_product).data,
                "suggestions": [],
            }
        elif best_score >= 0.7:
            suggestions = [
                ProductListSerializer(p).data 
                for score, p in scored_products[1:6]
            ]
            return {
                "match": "fuzzy",
                "confidence": best_score,
                "product": ProductDetailSerializer(best_product).data,
                "suggestions": suggestions,
            }
        else:
            suggestions = [
                ProductListSerializer(p).data 
                for score, p in scored_products[:5]
            ]
            return {
                "match": "none",
                "confidence": best_score,
                "product": None,
                "suggestions": suggestions,
            }

    def _normalize_title(self, title: str) -> str:
        """Normalize a title for comparison."""
        import re
        title = title.lower()
        title = re.sub(r"\.pdf$", "", title)
        title = re.sub(r"[_\-]+", " ", title)
        title = re.sub(r"[^\w\s]", "", title)
        title = re.sub(r"\s+", " ", title)
        return title.strip()


class PublisherViewSet(viewsets.ModelViewSet):
    """ViewSet for publishers."""

    queryset = Publisher.objects.annotate(
        product_count=Count("products")
    ).order_by("name")
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"
    filterset_fields = ["is_verified"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at", "product_count"]

    def get_serializer_class(self):
        if self.action == "list":
            return PublisherListSerializer
        return PublisherDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["get"])
    def products(self, request, slug=None):
        """List all products by this publisher."""
        publisher = self.get_object()
        products = Product.objects.filter(
            publisher=publisher,
            status__in=["published", "verified"],
        ).select_related("game_system")
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class AuthorViewSet(viewsets.ModelViewSet):
    """ViewSet for authors."""

    queryset = Author.objects.order_by("name")
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"
    search_fields = ["name", "bio"]
    ordering_fields = ["name", "created_at"]

    def get_serializer_class(self):
        if self.action == "list":
            return AuthorListSerializer
        return AuthorDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["get"])
    def credits(self, request, slug=None):
        """List all credits for this author."""
        author = self.get_object()
        credits = ProductCredit.objects.filter(
            author=author
        ).select_related("product", "product__publisher", "product__game_system")
        
        products = [credit.product for credit in credits]
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class GameSystemViewSet(viewsets.ModelViewSet):
    """ViewSet for game systems."""

    queryset = GameSystem.objects.annotate(
        product_count=Count("products")
    ).select_related("publisher").order_by("name")
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"
    filterset_fields = ["publisher"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "year_released", "product_count"]

    def get_serializer_class(self):
        if self.action == "list":
            return GameSystemListSerializer
        return GameSystemDetailSerializer

    @action(detail=True, methods=["get"])
    def products(self, request, slug=None):
        """List all products for this game system."""
        game_system = self.get_object()
        products = Product.objects.filter(
            game_system=game_system,
            status__in=["published", "verified"],
        ).select_related("publisher")
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)


class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for products."""

    queryset = Product.objects.select_related(
        "publisher",
        "game_system",
        "created_by",
    ).prefetch_related(
        "credits__author",
        "file_hashes",
    ).order_by("title")
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = "slug"
    filterset_fields = ["status", "product_type", "game_system__slug", "publisher__slug"]
    search_fields = ["title", "description", "dtrpg_id"]
    ordering_fields = ["title", "publication_date", "created_at", "page_count"]

    def get_queryset(self):
        queryset = super().get_queryset()

        if not self.request.user.is_authenticated:
            queryset = queryset.filter(status__in=["published", "verified"])
        elif not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(status__in=["published", "verified"]) | 
                Q(created_by=self.request.user)
            )

        level_min = self.request.query_params.get("level_min")
        level_max = self.request.query_params.get("level_max")
        if level_min:
            queryset = queryset.filter(level_range_min__gte=int(level_min))
        if level_max:
            queryset = queryset.filter(level_range_max__lte=int(level_max))

        tags = self.request.query_params.get("tags")
        if tags:
            tag_list = [t.strip() for t in tags.split(",")]
            for tag in tag_list:
                queryset = queryset.filter(tags__contains=[tag])

        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return ProductListSerializer
        return ProductDetailSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["get"])
    def revisions(self, request, slug=None):
        """Get revision history for a product."""
        product = self.get_object()
        revisions = Revision.objects.filter(product=product).select_related("user")
        serializer = RevisionSerializer(revisions, many=True)
        return Response(serializer.data)


class ContributionViewSet(viewsets.ModelViewSet):
    """ViewSet for contributions."""

    queryset = Contribution.objects.select_related(
        "product",
        "user",
        "reviewed_by",
    ).order_by("-created_at")
    permission_classes = [IsAuthenticatedOrReadOnly]
    filterset_fields = ["status", "source"]

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            queryset = queryset.filter(user=self.request.user)
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return ContributionCreateSerializer
        return ContributionSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class SearchView(APIView):
    """
    Search across products, publishers, authors, and game systems.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if not query:
            return Response({"results": [], "total": 0})

        limit = min(int(request.query_params.get("limit", 20)), 100)
        search_type = request.query_params.get("type", "all")

        results = []

        if search_type in ["all", "products"]:
            products = Product.objects.filter(
                Q(title__icontains=query) | Q(description__icontains=query),
                status__in=["published", "verified"],
            ).select_related("publisher", "game_system")[:limit]
            
            for product in products:
                results.append({
                    "type": "product",
                    "data": ProductListSerializer(product).data,
                })

        if search_type in ["all", "publishers"]:
            publishers = Publisher.objects.filter(
                Q(name__icontains=query) | Q(description__icontains=query)
            )[:limit]
            
            for publisher in publishers:
                results.append({
                    "type": "publisher",
                    "data": PublisherListSerializer(publisher).data,
                })

        if search_type in ["all", "authors"]:
            authors = Author.objects.filter(
                Q(name__icontains=query) | Q(bio__icontains=query)
            )[:limit]
            
            for author in authors:
                results.append({
                    "type": "author",
                    "data": AuthorListSerializer(author).data,
                })

        if search_type in ["all", "systems"]:
            systems = GameSystem.objects.filter(
                Q(name__icontains=query) | Q(description__icontains=query)
            )[:limit]
            
            for system in systems:
                results.append({
                    "type": "game_system",
                    "data": GameSystemListSerializer(system).data,
                })

        return Response({
            "results": results[:limit],
            "total": len(results),
            "query": query,
        })


class HealthView(APIView):
    """Health check endpoint."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "status": "healthy",
            "service": "codex-api",
            "version": "1.0.0",
        })
