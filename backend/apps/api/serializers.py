from rest_framework import serializers

from apps.catalog.models import (
    AdventureRun,
    Author,
    Comment,
    CommunityNote,
    Contribution,
    FileHash,
    FlagReason,
    GameSystem,
    NoteFlag,
    NoteVote,
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
    claimed_by = UserPublicSerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    source_display = serializers.CharField(source="get_source_display", read_only=True)

    class Meta:
        model = Contribution
        fields = [
            "id",
            "contribution_type",
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
            "claimed_by",
            "claimed_at",
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
    """Serializer for creating contributions.
    
    Supports both new Codex format and legacy Grimoire format:
    - New: contribution_type + product
    - Legacy: product_id (null = new product, uuid = edit)
    """

    # Accept legacy field name for Grimoire compatibility
    product_id = serializers.UUIDField(required=False, write_only=True, allow_null=True)

    class Meta:
        model = Contribution
        fields = ["contribution_type", "product", "product_id", "data", "file_hash", "source"]
        extra_kwargs = {
            "contribution_type": {"required": False},
            "product": {"required": False},
        }

    def validate(self, attrs):
        # Handle product_id → product mapping (Grimoire compatibility)
        product_id = attrs.pop("product_id", None)
        if product_id and not attrs.get("product"):
            try:
                attrs["product"] = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                raise serializers.ValidationError({"product_id": "Product not found."})

        # Auto-infer contribution_type if not provided
        if not attrs.get("contribution_type"):
            if attrs.get("product"):
                attrs["contribution_type"] = Contribution.ContributionType.EDIT_PRODUCT
            else:
                attrs["contribution_type"] = Contribution.ContributionType.NEW_PRODUCT

        contribution_type = attrs.get("contribution_type")
        product = attrs.get("product")

        if contribution_type == Contribution.ContributionType.EDIT_PRODUCT and not product:
            raise serializers.ValidationError({
                "product": "Product is required for edit contributions."
            })

        if contribution_type == Contribution.ContributionType.NEW_PRODUCT and product:
            raise serializers.ValidationError({
                "product": "Product should not be provided for new product contributions."
            })

        return attrs


class ContributionReviewSerializer(serializers.Serializer):
    """Serializer for reviewing (approving/rejecting) contributions."""

    action = serializers.ChoiceField(choices=["approve", "reject"])
    review_notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)


class BatchReviewSerializer(serializers.Serializer):
    """Serializer for batch reviewing multiple contributions."""

    contribution_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        max_length=100,
    )
    action = serializers.ChoiceField(choices=["approve", "reject"])
    review_notes = serializers.CharField(max_length=1000, required=False, allow_blank=True, default="")


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


class AdventureRunSerializer(serializers.ModelSerializer):
    """Serializer for adventure runs."""

    product = ProductListSerializer(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    difficulty_display = serializers.CharField(source="get_difficulty_display", read_only=True)
    note_count = serializers.SerializerMethodField()

    class Meta:
        model = AdventureRun
        fields = [
            "id",
            "product",
            "status",
            "status_display",
            "rating",
            "difficulty",
            "difficulty_display",
            "session_count",
            "player_count",
            "completed_at",
            "note_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def get_note_count(self, obj):
        return obj.notes.filter(is_hidden=False).count()


class AdventureRunCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating adventure runs."""

    class Meta:
        model = AdventureRun
        fields = [
            "status",
            "rating",
            "difficulty",
            "session_count",
            "player_count",
            "completed_at",
        ]

    def validate_rating(self, value):
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

    def validate_player_count(self, value):
        if value is not None and (value < 1 or value > 20):
            raise serializers.ValidationError("Player count must be between 1 and 20.")
        return value

    def validate(self, attrs):
        status = attrs.get("status")
        rating = attrs.get("rating")
        difficulty = attrs.get("difficulty")

        if status != "completed" and (rating is not None or difficulty):
            raise serializers.ValidationError(
                "Rating and difficulty can only be set for completed runs."
            )

        return attrs


class CommunityNoteSerializer(serializers.ModelSerializer):
    """Serializer for community notes."""

    author = serializers.SerializerMethodField()
    product_slug = serializers.CharField(source="adventure_run.product.slug", read_only=True)
    product_title = serializers.CharField(source="adventure_run.product.title", read_only=True)
    note_type_display = serializers.CharField(source="get_note_type_display", read_only=True)
    spoiler_level_display = serializers.CharField(source="get_spoiler_level_display", read_only=True)
    visibility_display = serializers.CharField(source="get_visibility_display", read_only=True)
    user_has_voted = serializers.SerializerMethodField()
    is_own_note = serializers.SerializerMethodField()

    class Meta:
        model = CommunityNote
        fields = [
            "id",
            "adventure_run",
            "product_slug",
            "product_title",
            "author",
            "note_type",
            "note_type_display",
            "title",
            "content",
            "spoiler_level",
            "spoiler_level_display",
            "visibility",
            "visibility_display",
            "upvote_count",
            "user_has_voted",
            "is_own_note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "adventure_run",
            "upvote_count",
            "created_at",
            "updated_at",
        ]

    def get_author(self, obj):
        """Return author info based on visibility setting."""
        if obj.visibility == "anonymous":
            return {"public_name": "Anonymous GM"}

        user = obj.adventure_run.user
        return {
            "id": str(user.id),
            "public_name": user.public_name,
            "avatar_url": user.avatar_url or None,
        }

    def get_user_has_voted(self, obj):
        """Check if current user has voted on this note."""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return NoteVote.objects.filter(user=request.user, note=obj).exists()

    def get_is_own_note(self, obj):
        """Check if current user is the author of this note."""
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        return obj.adventure_run.user_id == request.user.id


class CommunityNoteCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating community notes."""

    class Meta:
        model = CommunityNote
        fields = [
            "note_type",
            "title",
            "content",
            "spoiler_level",
            "visibility",
            "grimoire_note_id",
        ]

    def validate_title(self, value):
        import bleach
        value = bleach.clean(value, tags=[], strip=True).strip()
        if not value:
            raise serializers.ValidationError("Title is required.")
        if len(value) > 255:
            raise serializers.ValidationError("Title must be 255 characters or less.")
        return value

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Content is required.")
        if len(value) > 20000:
            raise serializers.ValidationError("Content must be 20,000 characters or less.")
        return value.strip()


class CommunityNoteUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating community notes."""

    class Meta:
        model = CommunityNote
        fields = [
            "note_type",
            "title",
            "content",
            "spoiler_level",
            "visibility",
        ]

    def validate_title(self, value):
        import bleach
        value = bleach.clean(value, tags=[], strip=True).strip()
        if not value:
            raise serializers.ValidationError("Title is required.")
        if len(value) > 255:
            raise serializers.ValidationError("Title must be 255 characters or less.")
        return value

    def validate_content(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Content is required.")
        if len(value) > 20000:
            raise serializers.ValidationError("Content must be 20,000 characters or less.")
        return value.strip()


class NoteFlagCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating note flags."""

    class Meta:
        model = NoteFlag
        fields = ["reason", "details"]

    def validate_details(self, value):
        import bleach
        if value:
            value = bleach.clean(value, tags=[], strip=True).strip()
            if len(value) > 500:
                raise serializers.ValidationError("Details must be 500 characters or less.")
        return value


class NoteFlagSerializer(serializers.ModelSerializer):
    """Serializer for viewing note flags (admin)."""

    user = UserPublicSerializer(read_only=True)
    note = CommunityNoteSerializer(read_only=True)
    reason_display = serializers.CharField(source="get_reason_display", read_only=True)
    reviewed_by = UserPublicSerializer(read_only=True)

    class Meta:
        model = NoteFlag
        fields = [
            "id",
            "user",
            "note",
            "reason",
            "reason_display",
            "details",
            "created_at",
            "reviewed",
            "reviewed_by",
            "reviewed_at",
        ]
