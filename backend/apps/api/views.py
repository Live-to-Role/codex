from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from rapidfuzz import fuzz

from apps.core.throttling import IdentifyRateThrottle, SearchRateThrottle
from apps.api.validators import validate_contribution_data, validate_foreign_key_access

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
from apps.catalog.permissions import CanModerateContribution, get_moderation_queryset

from .serializers import (
    AuthorDetailSerializer,
    AuthorListSerializer,
    CommentCreateSerializer,
    CommentSerializer,
    ContributionCreateSerializer,
    ContributionReviewSerializer,
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
    throttle_classes = [IdentifyRateThrottle]

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
    """ViewSet for contributions with moderation workflow."""

    queryset = Contribution.objects.select_related(
        "product",
        "product__publisher",
        "product__game_system",
        "user",
        "reviewed_by",
    ).order_by("-created_at")
    permission_classes = [IsAuthenticated]
    filterset_fields = ["status", "source", "contribution_type"]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # For moderation queue, filter by what user can moderate
        if self.request.query_params.get("moderation") == "true":
            queryset = get_moderation_queryset(user, queryset)
        elif not (user.is_superuser or getattr(user, "is_moderator", False)):
            # Regular users only see their own contributions
            queryset = queryset.filter(user=user)

        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return ContributionCreateSerializer
        return ContributionSerializer

    def create(self, request, *args, **kwargs):
        """Submit a new contribution with permission-based routing."""
        serializer = ContributionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        contribution_type = data.get("contribution_type", "edit_product")
        product = data.get("product")
        contribution_data = data.get("data", {})

        # Validate and sanitize contribution data
        contribution_data = validate_contribution_data(contribution_data, contribution_type)
        validate_foreign_key_access(contribution_data, request.user)

        # Check if user can edit directly (bypass moderation)
        can_edit_directly = self._can_edit_directly(request.user, product, contribution_type)

        if can_edit_directly:
            if contribution_type == "new_product":
                # Create product directly
                new_product = self._create_product_from_data(contribution_data, request.user)
                return Response({
                    "status": "applied",
                    "message": "Product created successfully",
                    "product_id": str(new_product.id),
                    "product_slug": new_product.slug,
                }, status=status.HTTP_201_CREATED)
            elif product:
                # Apply edit directly
                self._apply_changes_to_product(product, contribution_data, request.user)
                return Response({
                    "status": "applied",
                    "message": "Changes applied successfully",
                    "product_id": str(product.id),
                    "product_slug": product.slug,
                }, status=status.HTTP_200_OK)

        # Create pending contribution for moderation
        contribution = Contribution.objects.create(
            contribution_type=contribution_type,
            product=product,
            user=request.user,
            data=contribution_data,
            file_hash=data.get("file_hash", ""),
            source=data.get("source", Contribution.ContributionSource.WEB),
            status=Contribution.ContributionStatus.PENDING,
        )

        return Response({
            "status": "pending",
            "message": "Contribution submitted for review",
            "contribution_id": str(contribution.id),
        }, status=status.HTTP_201_CREATED)

    def _can_edit_directly(self, user, product, contribution_type):
        """Check if user can bypass moderation."""
        if user.is_superuser or getattr(user, "is_moderator", False):
            return True

        if product and product.publisher:
            if user in product.publisher.representatives.all():
                return True

        # For new products, check if user is a publisher rep
        if contribution_type == "new_product":
            if user.represented_publishers.exists():
                return True

        return False

    @action(detail=True, methods=["post"], permission_classes=[CanModerateContribution])
    def review(self, request, pk=None):
        """Approve or reject a contribution."""
        contribution = self.get_object()

        serializer = ContributionReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        action_type = serializer.validated_data["action"]
        review_notes = serializer.validated_data.get("review_notes", "")

        from django.utils import timezone

        if action_type == "approve":
            if contribution.contribution_type == "new_product":
                product = self._create_product_from_data(contribution.data, contribution.user)
                contribution.product = product
            elif contribution.product:
                self._apply_changes_to_product(
                    contribution.product,
                    contribution.data,
                    contribution.user,
                )

            contribution.status = Contribution.ContributionStatus.APPROVED

            # Update contributor reputation
            if contribution.user:
                contribution.user.contribution_count += 1
                contribution.user.reputation += 10
                contribution.user.save()
        else:
            contribution.status = Contribution.ContributionStatus.REJECTED

        contribution.reviewed_by = request.user
        contribution.review_notes = review_notes
        contribution.reviewed_at = timezone.now()
        contribution.save()

        return Response({
            "status": contribution.status,
            "message": f"Contribution {action_type}d successfully",
        })

    def _apply_changes_to_product(self, product, changes, user):
        """Apply changes to a product and create revision record."""
        old_values = {}
        new_values = {}

        editable_fields = [
            "title", "description", "product_type", "page_count",
            "level_range_min", "level_range_max", "dtrpg_url",
            "itch_url", "tags"
        ]

        for field in editable_fields:
            if field in changes:
                old_values[field] = getattr(product, field, None)
                setattr(product, field, changes[field])
                new_values[field] = changes[field]

        # Handle foreign key fields
        if "publisher_id" in changes:
            old_values["publisher"] = str(product.publisher_id) if product.publisher_id else None
            product.publisher_id = changes["publisher_id"]
            new_values["publisher"] = changes["publisher_id"]

        if "game_system_id" in changes:
            old_values["game_system"] = str(product.game_system_id) if product.game_system_id else None
            product.game_system_id = changes["game_system_id"]
            new_values["game_system"] = changes["game_system_id"]

        product.save()

        # Create revision for history
        Revision.objects.create(
            product=product,
            user=user,
            changes={
                field: {"old": str(old_values.get(field, "")), "new": str(new_values.get(field, ""))}
                for field in new_values.keys()
            },
            comment="Edit applied",
        )

    def _create_product_from_data(self, data, user):
        """Create a new product from contribution data."""
        from django.utils.text import slugify
        import uuid

        title = data.get("title", "Untitled Product")
        base_slug = slugify(title)[:200]

        # Ensure unique slug
        slug = base_slug
        counter = 1
        while Product.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        product = Product.objects.create(
            title=title,
            slug=slug,
            description=data.get("description", ""),
            product_type=data.get("product_type", "other"),
            page_count=data.get("page_count"),
            level_range_min=data.get("level_range_min"),
            level_range_max=data.get("level_range_max"),
            dtrpg_url=data.get("dtrpg_url", ""),
            itch_url=data.get("itch_url", ""),
            tags=data.get("tags", []),
            publisher_id=data.get("publisher_id"),
            game_system_id=data.get("game_system_id"),
            status=Product.ProductStatus.PUBLISHED,
            created_by=user,
        )

        # Create initial revision
        Revision.objects.create(
            product=product,
            user=user,
            changes={"created": {"old": "", "new": "Product created"}},
            comment="Initial creation",
        )

        return product


class SearchView(APIView):
    """
    Search across products, publishers, authors, and game systems.
    """

    permission_classes = [AllowAny]
    throttle_classes = [SearchRateThrottle]

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
