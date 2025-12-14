from rest_framework import serializers

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
from apps.users.serializers import UserPublicSerializer


class PublisherListSerializer(serializers.ModelSerializer):
    """Serializer for publisher list views."""

    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Publisher
        fields = [
            "id",
            "name",
            "slug",
            "logo_url",
            "is_verified",
            "product_count",
        ]


class PublisherDetailSerializer(serializers.ModelSerializer):
    """Serializer for publisher detail views."""

    created_by = UserPublicSerializer(read_only=True)

    class Meta:
        model = Publisher
        fields = [
            "id",
            "name",
            "slug",
            "website",
            "description",
            "founded_year",
            "logo_url",
            "is_verified",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "is_verified", "created_at", "updated_at"]


class AuthorListSerializer(serializers.ModelSerializer):
    """Serializer for author list views."""

    class Meta:
        model = Author
        fields = ["id", "name", "slug"]


class AuthorDetailSerializer(serializers.ModelSerializer):
    """Serializer for author detail views."""

    created_by = UserPublicSerializer(read_only=True)

    class Meta:
        model = Author
        fields = [
            "id",
            "name",
            "slug",
            "bio",
            "website",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_at", "updated_at"]


class GameSystemListSerializer(serializers.ModelSerializer):
    """Serializer for game system list views."""

    publisher_name = serializers.CharField(source="publisher.name", read_only=True)
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = GameSystem
        fields = [
            "id",
            "name",
            "slug",
            "edition",
            "publisher_name",
            "product_count",
        ]


class GameSystemDetailSerializer(serializers.ModelSerializer):
    """Serializer for game system detail views."""

    publisher = PublisherListSerializer(read_only=True)
    parent_system = serializers.SerializerMethodField()

    class Meta:
        model = GameSystem
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "publisher",
            "edition",
            "parent_system",
            "year_released",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_parent_system(self, obj):
        if obj.parent_system:
            return GameSystemListSerializer(obj.parent_system).data
        return None


class ProductCreditSerializer(serializers.ModelSerializer):
    """Serializer for product credits."""

    author = AuthorListSerializer(read_only=True)
    author_id = serializers.UUIDField(write_only=True)
    role_display = serializers.CharField(source="get_role_display", read_only=True)

    class Meta:
        model = ProductCredit
        fields = ["id", "author", "author_id", "role", "role_display", "notes"]


class FileHashSerializer(serializers.ModelSerializer):
    """Serializer for file hashes."""

    contributed_by = UserPublicSerializer(read_only=True)

    class Meta:
        model = FileHash
        fields = [
            "id",
            "hash_sha256",
            "hash_md5",
            "file_size_bytes",
            "file_name",
            "source",
            "contributed_by",
            "created_at",
        ]
        read_only_fields = ["id", "contributed_by", "created_at"]


class ProductListSerializer(serializers.ModelSerializer):
    """Serializer for product list views."""

    publisher_name = serializers.CharField(source="publisher.name", read_only=True)
    game_system_name = serializers.CharField(source="game_system.name", read_only=True)
    game_system_slug = serializers.CharField(source="game_system.slug", read_only=True)
    product_type_display = serializers.CharField(source="get_product_type_display", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "slug",
            "publisher_name",
            "game_system_name",
            "game_system_slug",
            "product_type",
            "product_type_display",
            "page_count",
            "thumbnail_url",
            "cover_url",
            "level_range_min",
            "level_range_max",
            "tags",
            "status",
        ]


class ProductDetailSerializer(serializers.ModelSerializer):
    """Serializer for product detail views."""

    publisher = PublisherListSerializer(read_only=True)
    publisher_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    game_system = GameSystemListSerializer(read_only=True)
    game_system_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    credits = ProductCreditSerializer(many=True, read_only=True)
    file_hashes = FileHashSerializer(many=True, read_only=True)
    created_by = UserPublicSerializer(read_only=True)
    product_type_display = serializers.CharField(source="get_product_type_display", read_only=True)
    format_display = serializers.CharField(source="get_format_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "title",
            "slug",
            "description",
            "publisher",
            "publisher_id",
            "game_system",
            "game_system_id",
            "product_type",
            "product_type_display",
            "publication_date",
            "page_count",
            "format",
            "format_display",
            "isbn",
            "msrp",
            "dtrpg_id",
            "dtrpg_url",
            "itch_id",
            "itch_url",
            "other_urls",
            "level_range_min",
            "level_range_max",
            "party_size_min",
            "party_size_max",
            "estimated_runtime",
            "setting",
            "tags",
            "themes",
            "content_warnings",
            "cover_url",
            "thumbnail_url",
            "status",
            "status_display",
            "credits",
            "file_hashes",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "slug", "created_by", "created_at", "updated_at"]


class ProductRelationSerializer(serializers.ModelSerializer):
    """Serializer for product relations."""

    from_product = ProductListSerializer(read_only=True)
    to_product = ProductListSerializer(read_only=True)
    relation_type_display = serializers.CharField(source="get_relation_type_display", read_only=True)

    class Meta:
        model = ProductRelation
        fields = [
            "id",
            "from_product",
            "to_product",
            "relation_type",
            "relation_type_display",
            "notes",
        ]


class RevisionSerializer(serializers.ModelSerializer):
    """Serializer for product revisions."""

    user = UserPublicSerializer(read_only=True)

    class Meta:
        model = Revision
        fields = ["id", "user", "changes", "comment", "created_at"]


class ContributionSerializer(serializers.ModelSerializer):
    """Serializer for contributions."""

    user = UserPublicSerializer(read_only=True)
    reviewed_by = UserPublicSerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    source_display = serializers.CharField(source="get_source_display", read_only=True)

    class Meta:
        model = Contribution
        fields = [
            "id",
            "product",
            "user",
            "data",
            "file_hash",
            "source",
            "source_display",
            "status",
            "status_display",
            "reviewed_by",
            "review_notes",
            "reviewed_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "status",
            "reviewed_by",
            "review_notes",
            "reviewed_at",
            "created_at",
        ]


class ContributionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating contributions."""

    class Meta:
        model = Contribution
        fields = ["product", "data", "file_hash", "source"]


class FileHashCreateSerializer(serializers.ModelSerializer):
    """Serializer for registering new file hashes."""

    class Meta:
        model = FileHash
        fields = ["hash_sha256", "hash_md5", "file_size_bytes", "file_name"]

    def validate_hash_sha256(self, value):
        value = value.lower().strip()
        if len(value) != 64:
            raise serializers.ValidationError("SHA-256 hash must be 64 characters.")
        if FileHash.objects.filter(hash_sha256=value).exists():
            raise serializers.ValidationError("This file hash is already registered.")
        return value

    def validate_hash_md5(self, value):
        if value:
            return value.lower().strip()
        return value


class IdentifyRequestSerializer(serializers.Serializer):
    """Serializer for /identify endpoint request."""

    hash = serializers.CharField(required=False, max_length=64, help_text="SHA-256 file hash")
    title = serializers.CharField(required=False, max_length=500, help_text="Product title for fuzzy matching")
    filename = serializers.CharField(required=False, max_length=500, help_text="Original filename")

    def validate(self, data):
        if not data.get("hash") and not data.get("title") and not data.get("filename"):
            raise serializers.ValidationError(
                "At least one of 'hash', 'title', or 'filename' must be provided."
            )
        return data


class IdentifyResponseSerializer(serializers.Serializer):
    """Serializer for /identify endpoint response."""

    match = serializers.ChoiceField(choices=["exact", "fuzzy", "none"])
    confidence = serializers.FloatField()
    product = ProductDetailSerializer(allow_null=True)
    suggestions = ProductListSerializer(many=True)


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for comments."""

    user = UserPublicSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "product",
            "user",
            "parent",
            "content",
            "is_edited",
            "is_deleted",
            "replies",
            "reply_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "is_edited", "is_deleted", "created_at", "updated_at"]

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.filter(is_deleted=False), many=True).data
        return []

    def get_reply_count(self, obj):
        return obj.replies.filter(is_deleted=False).count()


class CommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating comments."""

    class Meta:
        model = Comment
        fields = ["product", "parent", "content"]


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for product images."""

    uploaded_by = UserPublicSerializer(read_only=True)
    image_type_display = serializers.CharField(source="get_image_type_display", read_only=True)

    class Meta:
        model = ProductImage
        fields = [
            "id",
            "product",
            "image_type",
            "image_type_display",
            "url",
            "width",
            "height",
            "file_size",
            "alt_text",
            "uploaded_by",
            "created_at",
        ]
        read_only_fields = ["id", "uploaded_by", "created_at"]


class ProductSeriesListSerializer(serializers.ModelSerializer):
    """Serializer for series list views."""

    product_count = serializers.IntegerField(read_only=True)
    publisher_name = serializers.CharField(source="publisher.name", read_only=True)

    class Meta:
        model = ProductSeries
        fields = ["id", "name", "slug", "description", "publisher_name", "product_count"]


class ProductSeriesDetailSerializer(serializers.ModelSerializer):
    """Serializer for series detail views."""

    publisher = PublisherListSerializer(read_only=True)
    products = serializers.SerializerMethodField()

    class Meta:
        model = ProductSeries
        fields = ["id", "name", "slug", "description", "publisher", "products", "created_at"]

    def get_products(self, obj):
        products = obj.products.all().order_by("series_order", "title")
        return ProductListSerializer(products, many=True).data


class ProductRelationSerializer(serializers.ModelSerializer):
    """Serializer for product relations."""

    to_product = ProductListSerializer(read_only=True)
    relation_type_display = serializers.CharField(source="get_relation_type_display", read_only=True)

    class Meta:
        model = ProductRelation
        fields = ["id", "to_product", "relation_type", "relation_type_display", "notes"]
