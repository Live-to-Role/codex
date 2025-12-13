import uuid

from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Publisher(models.Model):
    """Publisher of TTRPG products."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    website = models.URLField(blank=True)
    description = models.TextField(blank=True)
    founded_year = models.PositiveIntegerField(null=True, blank=True)
    logo_url = models.URLField(blank=True)

    is_verified = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_publishers",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "publisher"
        verbose_name_plural = "publishers"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Author(models.Model):
    """Author/creator of TTRPG content."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    bio = models.TextField(blank=True)
    website = models.URLField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_authors",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "author"
        verbose_name_plural = "authors"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class GameSystem(models.Model):
    """RPG game system (e.g., DCC, 5e, Shadowdark)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    publisher = models.ForeignKey(
        Publisher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="game_systems",
    )
    edition = models.CharField(max_length=50, blank=True)
    parent_system = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="variants",
        help_text="Parent system for variants/hacks",
    )
    year_released = models.PositiveIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "game system"
        verbose_name_plural = "game systems"

    def __str__(self):
        if self.edition:
            return f"{self.name} ({self.edition})"
        return self.name


class ProductType(models.TextChoices):
    """Types of TTRPG products."""

    ADVENTURE = "adventure", "Adventure"
    SOURCEBOOK = "sourcebook", "Sourcebook"
    SUPPLEMENT = "supplement", "Supplement"
    BESTIARY = "bestiary", "Bestiary"
    TOOLS = "tools", "Tools"
    MAGAZINE = "magazine", "Magazine"
    CORE_RULES = "core_rules", "Core Rules"
    SCREEN = "screen", "GM Screen"
    OTHER = "other", "Other"


class ProductStatus(models.TextChoices):
    """Product verification status."""

    DRAFT = "draft", "Draft"
    PUBLISHED = "published", "Published"
    VERIFIED = "verified", "Verified"


class ProductFormat(models.TextChoices):
    """Product format."""

    PDF = "pdf", "PDF"
    PRINT = "print", "Print"
    BOTH = "both", "PDF + Print"


class Product(models.Model):
    """A TTRPG product (adventure, sourcebook, etc.)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=500)
    slug = models.SlugField(max_length=500, unique=True, blank=True)
    description = models.TextField(blank=True)

    publisher = models.ForeignKey(
        Publisher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    game_system = models.ForeignKey(
        GameSystem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    product_type = models.CharField(
        max_length=20,
        choices=ProductType.choices,
        default=ProductType.OTHER,
    )

    publication_date = models.DateField(null=True, blank=True)
    page_count = models.PositiveIntegerField(null=True, blank=True)
    format = models.CharField(
        max_length=10,
        choices=ProductFormat.choices,
        default=ProductFormat.PDF,
    )
    isbn = models.CharField(max_length=20, blank=True)
    msrp = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    dtrpg_id = models.CharField(max_length=50, blank=True, db_index=True)
    dtrpg_url = models.URLField(blank=True)
    itch_id = models.CharField(max_length=100, blank=True)
    itch_url = models.URLField(blank=True)
    other_urls = models.JSONField(default=list, blank=True)

    level_range_min = models.PositiveIntegerField(null=True, blank=True)
    level_range_max = models.PositiveIntegerField(null=True, blank=True)
    party_size_min = models.PositiveIntegerField(null=True, blank=True)
    party_size_max = models.PositiveIntegerField(null=True, blank=True)
    estimated_runtime = models.CharField(
        max_length=50,
        blank=True,
        help_text="e.g., 'one-shot', '2-3 sessions', 'campaign'",
    )
    setting = models.CharField(max_length=255, blank=True)

    tags = models.JSONField(default=list, blank=True)
    themes = models.JSONField(default=list, blank=True)
    content_warnings = models.JSONField(default=list, blank=True)

    cover_url = models.URLField(blank=True)
    thumbnail_url = models.URLField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=ProductStatus.choices,
        default=ProductStatus.DRAFT,
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_products",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]
        verbose_name = "product"
        verbose_name_plural = "products"
        indexes = [
            models.Index(fields=["title"]),
            models.Index(fields=["status"]),
            models.Index(fields=["product_type"]),
        ]

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.title)[:450]
            slug = base_slug
            counter = 1
            while Product.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)


class ProductCredit(models.Model):
    """Credit linking an author to a product with a specific role."""

    class CreditRole(models.TextChoices):
        AUTHOR = "author", "Author"
        CO_AUTHOR = "co_author", "Co-Author"
        ARTIST = "artist", "Artist"
        CARTOGRAPHER = "cartographer", "Cartographer"
        EDITOR = "editor", "Editor"
        LAYOUT = "layout", "Layout"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="credits",
    )
    author = models.ForeignKey(
        Author,
        on_delete=models.CASCADE,
        related_name="credits",
    )
    role = models.CharField(
        max_length=20,
        choices=CreditRole.choices,
        default=CreditRole.AUTHOR,
    )
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ["product", "author", "role"]
        ordering = ["role", "author__name"]
        verbose_name = "product credit"
        verbose_name_plural = "product credits"

    def __str__(self):
        return f"{self.author.name} - {self.get_role_display()} on {self.product.title}"


class FileHash(models.Model):
    """File hash for product identification."""

    class HashSource(models.TextChoices):
        USER_CONTRIBUTED = "user_contributed", "User Contributed"
        PUBLISHER_VERIFIED = "publisher_verified", "Publisher Verified"
        AI_IDENTIFIED = "ai_identified", "AI Identified"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="file_hashes",
    )
    hash_sha256 = models.CharField(max_length=64, unique=True, db_index=True)
    hash_md5 = models.CharField(max_length=32, blank=True, db_index=True)
    file_size_bytes = models.BigIntegerField(null=True, blank=True)
    file_name = models.CharField(max_length=500, blank=True)

    source = models.CharField(
        max_length=30,
        choices=HashSource.choices,
        default=HashSource.USER_CONTRIBUTED,
    )
    contributed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contributed_hashes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "file hash"
        verbose_name_plural = "file hashes"

    def __str__(self):
        return f"{self.hash_sha256[:16]}... -> {self.product.title}"


class ProductRelation(models.Model):
    """Relationships between products (sequels, conversions, etc.)."""

    class RelationType(models.TextChoices):
        SEQUEL = "sequel", "Sequel"
        PREQUEL = "prequel", "Prequel"
        CONVERSION = "conversion", "System Conversion"
        COMPILATION = "compilation", "Compilation"
        EXPANSION = "expansion", "Expansion"
        RELATED = "related", "Related"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    from_product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="relations_from",
    )
    to_product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="relations_to",
    )
    relation_type = models.CharField(
        max_length=20,
        choices=RelationType.choices,
        default=RelationType.RELATED,
    )
    notes = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["from_product", "to_product", "relation_type"]
        verbose_name = "product relation"
        verbose_name_plural = "product relations"

    def __str__(self):
        return f"{self.from_product.title} -> {self.get_relation_type_display()} -> {self.to_product.title}"


class Revision(models.Model):
    """Edit history for products."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="revisions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="revisions",
    )
    changes = models.JSONField(default=dict)
    comment = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "revision"
        verbose_name_plural = "revisions"

    def __str__(self):
        return f"Revision of {self.product.title} at {self.created_at}"


class Contribution(models.Model):
    """User contributions (new products or edits) for moderation."""

    class ContributionStatus(models.TextChoices):
        PENDING = "pending", "Pending Review"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    class ContributionSource(models.TextChoices):
        WEB = "web", "Web UI"
        GRIMOIRE = "grimoire", "Grimoire"
        API = "api", "API"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="contributions",
        help_text="Null if this is a new product contribution",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contributions",
    )
    data = models.JSONField(default=dict)
    file_hash = models.CharField(max_length=64, blank=True)

    source = models.CharField(
        max_length=20,
        choices=ContributionSource.choices,
        default=ContributionSource.WEB,
    )
    status = models.CharField(
        max_length=20,
        choices=ContributionStatus.choices,
        default=ContributionStatus.PENDING,
    )

    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_contributions",
    )
    review_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "contribution"
        verbose_name_plural = "contributions"

    def __str__(self):
        if self.product:
            return f"Edit to {self.product.title} by {self.user}"
        return f"New product contribution by {self.user}"
