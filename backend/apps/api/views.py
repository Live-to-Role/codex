from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from rapidfuzz import fuzz

from apps.catalog.models import (
    Author,
    Comment,
    Contribution,
    FileHash,
    GameSystem,
    Product,
    ProductCredit,
    ProductImage,
    ProductRelation,
    ProductSeries,
    Publisher,
    Revision,
)

from .serializers import (
    AuthorDetailSerializer,
    AuthorListSerializer,
    CommentCreateSerializer,
    CommentSerializer,
    ContributionCreateSerializer,
    ContributionSerializer,
    FileHashCreateSerializer,
    FileHashSerializer,
    GameSystemDetailSerializer,
    GameSystemListSerializer,
    IdentifyRequestSerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    ProductListSerializer,
    ProductRelationSerializer,
    ProductSeriesDetailSerializer,
    ProductSeriesListSerializer,
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

    def perform_update(self, serializer):
        """Create a revision when updating a product."""
        product = self.get_object()
        old_data = {
            "title": product.title,
            "description": product.description,
            "product_type": product.product_type,
            "page_count": product.page_count,
            "level_range_min": product.level_range_min,
            "level_range_max": product.level_range_max,
            "dtrpg_url": product.dtrpg_url,
            "itch_url": product.itch_url,
            "tags": product.tags,
        }

        instance = serializer.save()

        new_data = {
            "title": instance.title,
            "description": instance.description,
            "product_type": instance.product_type,
            "page_count": instance.page_count,
            "level_range_min": instance.level_range_min,
            "level_range_max": instance.level_range_max,
            "dtrpg_url": instance.dtrpg_url,
            "itch_url": instance.itch_url,
            "tags": instance.tags,
        }

        changes = {}
        for key in old_data:
            if old_data[key] != new_data[key]:
                changes[key] = {"old": old_data[key], "new": new_data[key]}

        if changes:
            comment = self.request.data.get("edit_comment", "")
            Revision.objects.create(
                product=instance,
                user=self.request.user if self.request.user.is_authenticated else None,
                changes=changes,
                comment=comment,
            )

    @action(detail=True, methods=["get"])
    def revisions(self, request, slug=None):
        """Get revision history for a product."""
        product = self.get_object()
        revisions = Revision.objects.filter(product=product).select_related("user")
        serializer = RevisionSerializer(revisions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get", "post"])
    def comments(self, request, slug=None):
        """
        GET: List all comments for this product.
        POST: Add a new comment (authenticated).
        """
        product = self.get_object()

        if request.method == "GET":
            comments = Comment.objects.filter(
                product=product,
                parent__isnull=True,
                is_deleted=False,
            ).select_related("user").prefetch_related("replies__user")
            serializer = CommentSerializer(comments, many=True)
            return Response(serializer.data)

        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required to post comments."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        data = request.data.copy()
        data["product"] = product.id
        serializer = CommentCreateSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        comment = serializer.save(user=request.user)
        return Response(CommentSerializer(comment).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"])
    def hashes(self, request, slug=None):
        """
        GET: List all file hashes for this product.
        POST: Register a new file hash for this product (authenticated).
        """
        product = self.get_object()

        if request.method == "GET":
            hashes = FileHash.objects.filter(product=product)
            serializer = FileHashSerializer(hashes, many=True)
            return Response(serializer.data)

        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required to register file hashes."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = FileHashCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(product=product, contributed_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get", "post"])
    def images(self, request, slug=None):
        """
        GET: List all images for this product.
        POST: Add a new image (authenticated).
        """
        product = self.get_object()

        if request.method == "GET":
            images = ProductImage.objects.filter(product=product)
            serializer = ProductImageSerializer(images, many=True)
            return Response(serializer.data)

        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication required to upload images."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        data = request.data.copy()
        data["product"] = product.id
        serializer = ProductImageSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        image = serializer.save(uploaded_by=request.user)

        if image.image_type == "cover" and not product.cover_url:
            product.cover_url = image.url
            product.save(update_fields=["cover_url"])
        elif image.image_type == "thumbnail" and not product.thumbnail_url:
            product.thumbnail_url = image.url
            product.save(update_fields=["thumbnail_url"])

        return Response(ProductImageSerializer(image).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def relations(self, request, slug=None):
        """Get related products."""
        product = self.get_object()
        relations = ProductRelation.objects.filter(from_product=product).select_related("to_product")
        serializer = ProductRelationSerializer(relations, many=True)
        return Response(serializer.data)


class ProductSeriesViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for product series."""

    queryset = ProductSeries.objects.select_related("publisher").annotate(
        product_count=Count("products")
    )
    permission_classes = [AllowAny]
    lookup_field = "slug"

    def get_serializer_class(self):
        if self.action == "list":
            return ProductSeriesListSerializer
        return ProductSeriesDetailSerializer


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

    @action(detail=True, methods=["patch"], permission_classes=[IsAuthenticated])
    def review(self, request, pk=None):
        """Review a contribution (approve or reject). Staff only."""
        if not request.user.is_staff:
            return Response(
                {"detail": "Only staff members can review contributions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        contribution = self.get_object()
        new_status = request.data.get("status")
        review_notes = request.data.get("review_notes", "")

        if new_status not in ["approved", "rejected"]:
            return Response(
                {"detail": "Status must be 'approved' or 'rejected'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from django.utils import timezone

        contribution.status = new_status
        contribution.review_notes = review_notes
        contribution.reviewed_by = request.user
        contribution.reviewed_at = timezone.now()
        contribution.save()

        if new_status == "approved" and contribution.data:
            self._apply_contribution(contribution)

        serializer = ContributionSerializer(contribution)
        return Response(serializer.data)

    def _apply_contribution(self, contribution):
        """Apply approved contribution data to the product."""
        if contribution.product:
            product = contribution.product
            data = contribution.data

            for field in ["title", "description", "product_type", "page_count",
                          "level_range_min", "level_range_max", "dtrpg_url",
                          "itch_url", "tags"]:
                if field in data:
                    setattr(product, field, data[field])

            product.save()

            Revision.objects.create(
                product=product,
                user=contribution.user,
                changes=data,
                comment=f"Applied from contribution {contribution.id}",
            )


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
