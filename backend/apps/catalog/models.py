import uuid

from django.conf import settings
from django.core.validators import MaxLengthValidator, MaxValueValidator, MinValueValidator
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

    representatives = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="represented_publishers",
        help_text="Users who can directly edit this publisher's products and moderate contributions",
    )

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
    CORE_RULEBOOK = "core_rulebook", "Core Rulebook"
    SETTING = "setting", "Setting"
    CHARACTER_OPTIONS = "character_options", "Character Options"
    GM_TOOLS = "gm_tools", "GM Tools"
    MAP = "map", "Map"
    ZINE = "zine", "Zine"
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
    
    # Flexible marketplace URLs with affiliate support
    # Schema: [{"platform": "dtrpg", "url": "https://..."}, ...]
    marketplace_urls = models.JSONField(
        default=list,
        blank=True,
        help_text="Marketplace URLs: [{platform, url, label?}]. Max 4 entries.",
    )

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
    genres = models.JSONField(default=list, blank=True, help_text="Genre tags like ['horror', 'mystery']")
    
    # Simple author field for Grimoire contributions (before ProductCredit linking)
    author_names = models.JSONField(
        default=list,
        blank=True,
        help_text="Author names as strings, pending ProductCredit linking",
    )

    cover_url = models.URLField(blank=True)
    thumbnail_url = models.URLField(blank=True)

    series = models.ForeignKey(
        "ProductSeries",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    series_order = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Order within the series (1, 2, 3...)",
    )

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

    class ContributionType(models.TextChoices):
        NEW_PRODUCT = "new_product", "New Product"
        EDIT_PRODUCT = "edit_product", "Edit Product"
        NEW_PUBLISHER = "new_publisher", "New Publisher"
        NEW_SYSTEM = "new_system", "New Game System"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    contribution_type = models.CharField(
        max_length=20,
        choices=ContributionType.choices,
        default=ContributionType.EDIT_PRODUCT,
    )
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

    # Concurrency control for moderation
    claimed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="claimed_contributions",
    )
    claimed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    # Claim expiry in minutes
    CLAIM_EXPIRY_MINUTES = 10

    @property
    def is_claimed(self) -> bool:
        """Check if this contribution is currently claimed by someone."""
        from datetime import timedelta
        from django.utils import timezone
        
        if not self.claimed_by or not self.claimed_at:
            return False
        expiry = self.claimed_at + timedelta(minutes=self.CLAIM_EXPIRY_MINUTES)
        return timezone.now() < expiry

    def claim(self, user) -> bool:
        """Attempt to claim this contribution for review."""
        if self.is_claimed and self.claimed_by != user:
            return False
        
        from django.utils import timezone
        self.claimed_by = user
        self.claimed_at = timezone.now()
        self.save(update_fields=["claimed_by", "claimed_at"])
        return True

    def release_claim(self):
        """Release the claim on this contribution."""
        self.claimed_by = None
        self.claimed_at = None
        self.save(update_fields=["claimed_by", "claimed_at"])

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "contribution"
        verbose_name_plural = "contributions"

    def __str__(self):
        if self.product:
            return f"Edit to {self.product.title} by {self.user}"
        return f"New product contribution by {self.user}"


class ProductImage(models.Model):
    """Cover images and other product images."""

    class ImageType(models.TextChoices):
        COVER = "cover", "Cover"
        THUMBNAIL = "thumbnail", "Thumbnail"
        PREVIEW = "preview", "Preview Page"
        OTHER = "other", "Other"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image_type = models.CharField(
        max_length=20,
        choices=ImageType.choices,
        default=ImageType.COVER,
    )
    url = models.URLField(help_text="URL to the hosted image")
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    file_size = models.PositiveIntegerField(null=True, blank=True, help_text="Size in bytes")
    alt_text = models.CharField(max_length=255, blank=True)

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_images",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["image_type", "created_at"]
        verbose_name = "product image"
        verbose_name_plural = "product images"

    def __str__(self):
        return f"{self.get_image_type_display()} for {self.product.title}"


class ProductSeries(models.Model):
    """A series or product line grouping related products."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(blank=True)
    publisher = models.ForeignKey(
        Publisher,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="series",
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_series",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "product series"
        verbose_name_plural = "product series"

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Comment(models.Model):
    """User comments/discussion on products."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="comments",
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="replies",
        help_text="Parent comment for threaded replies",
    )
    content = models.TextField()
    is_edited = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]
        verbose_name = "comment"
        verbose_name_plural = "comments"

    def __str__(self):
        return f"Comment by {self.user} on {self.product.title}"


class RunStatus(models.TextChoices):
    """Status of an adventure run."""

    WANT_TO_RUN = "want_to_run", "Want to Run"
    RUNNING = "running", "Currently Running"
    COMPLETED = "completed", "Completed"


class RunDifficulty(models.TextChoices):
    """Difficulty rating for a completed adventure run."""

    EASIER = "easier", "Easier than Expected"
    AS_WRITTEN = "as_written", "As Written"
    HARDER = "harder", "Harder than Expected"


class NoteType(models.TextChoices):
    """Types of community notes."""

    PREP_TIP = "prep_tip", "Prep Tip"
    MODIFICATION = "modification", "Modification"
    WARNING = "warning", "Warning"
    REVIEW = "review", "Review"


class SpoilerLevel(models.TextChoices):
    """Spoiler levels for community notes."""

    NONE = "none", "No Spoilers"
    MINOR = "minor", "Minor Spoilers"
    MAJOR = "major", "Major Spoilers"
    ENDGAME = "endgame", "Endgame Spoilers"


class NoteVisibility(models.TextChoices):
    """Visibility options for community notes."""

    ANONYMOUS = "anonymous", "Anonymous"
    PUBLIC = "public", "Public"


class AdventureRun(models.Model):
    """Tracks a user's experience running a product."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="adventure_runs",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="adventure_runs",
    )

    status = models.CharField(
        max_length=20,
        choices=RunStatus.choices,
        default=RunStatus.WANT_TO_RUN,
    )
    rating = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="1-5 stars: would run again rating",
    )
    difficulty = models.CharField(
        max_length=20,
        choices=RunDifficulty.choices,
        blank=True,
    )

    session_count = models.PositiveIntegerField(null=True, blank=True)
    player_count = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(20)],
    )
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["user", "product"]
        ordering = ["-updated_at"]
        verbose_name = "adventure run"
        verbose_name_plural = "adventure runs"
        indexes = [
            models.Index(fields=["product", "status"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.user} - {self.product.title} ({self.get_status_display()})"


class CommunityNote(models.Model):
    """GM notes shared with the community."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    adventure_run = models.ForeignKey(
        AdventureRun,
        on_delete=models.CASCADE,
        related_name="notes",
    )
    grimoire_note_id = models.CharField(
        max_length=50,
        blank=True,
        help_text="Reference to source note in Grimoire",
    )

    note_type = models.CharField(
        max_length=20,
        choices=NoteType.choices,
    )
    title = models.CharField(max_length=255)
    content = models.TextField(
        validators=[MaxLengthValidator(20000)],
    )
    spoiler_level = models.CharField(
        max_length=20,
        choices=SpoilerLevel.choices,
        default=SpoilerLevel.NONE,
    )
    visibility = models.CharField(
        max_length=20,
        choices=NoteVisibility.choices,
        default=NoteVisibility.PUBLIC,
    )

    upvote_count = models.PositiveIntegerField(default=0)

    is_flagged = models.BooleanField(default=False)
    flag_count = models.PositiveIntegerField(default=0)
    is_hidden = models.BooleanField(
        default=False,
        help_text="Hidden by moderator",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-upvote_count", "-created_at"]
        verbose_name = "community note"
        verbose_name_plural = "community notes"
        indexes = [
            models.Index(fields=["adventure_run"]),
            models.Index(fields=["note_type"]),
            models.Index(fields=["spoiler_level"]),
            models.Index(fields=["is_flagged"]),
        ]

    def __str__(self):
        return f"{self.title} - {self.get_note_type_display()}"

    @property
    def product(self):
        """Get the product this note is for."""
        return self.adventure_run.product

    @property
    def author(self):
        """Get the author (user) of this note."""
        return self.adventure_run.user


class NoteVote(models.Model):
    """Tracks upvotes on community notes."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="note_votes",
    )
    note = models.ForeignKey(
        CommunityNote,
        on_delete=models.CASCADE,
        related_name="votes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["user", "note"]
        verbose_name = "note vote"
        verbose_name_plural = "note votes"

    def __str__(self):
        return f"{self.user} upvoted {self.note.title}"


class FlagReason(models.TextChoices):
    """Reasons for flagging a community note."""

    SPAM = "spam", "Spam"
    INAPPROPRIATE = "inappropriate", "Inappropriate Content"
    SPOILER = "spoiler", "Unmarked Spoilers"
    OFFENSIVE = "offensive", "Offensive Language"
    OTHER = "other", "Other"


class NoteFlag(models.Model):
    """Content flags for moderation."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="note_flags",
    )
    note = models.ForeignKey(
        CommunityNote,
        on_delete=models.CASCADE,
        related_name="flags",
    )
    reason = models.CharField(
        max_length=20,
        choices=FlagReason.choices,
    )
    details = models.TextField(
        max_length=500,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    reviewed = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_flags",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ["user", "note"]
        ordering = ["-created_at"]
        verbose_name = "note flag"
        verbose_name_plural = "note flags"

    def __str__(self):
        return f"Flag on {self.note.title} - {self.get_reason_display()}"
