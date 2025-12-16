from django.contrib import admin
from django.utils import timezone

from .models import (
    AdventureRun,
    Author,
    CommunityNote,
    Contribution,
    FileHash,
    GameSystem,
    NoteFlag,
    NoteVote,
    Product,
    ProductCredit,
    ProductRelation,
    Publisher,
    Revision,
)


@admin.register(Publisher)
class PublisherAdmin(admin.ModelAdmin):
    list_display = ["name", "website", "is_verified", "created_at"]
    list_filter = ["is_verified"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Author)
class AuthorAdmin(admin.ModelAdmin):
    list_display = ["name", "website", "created_at"]
    search_fields = ["name", "bio"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["created_at", "updated_at"]


@admin.register(GameSystem)
class GameSystemAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "publisher", "edition", "year_released"]
    list_filter = ["publisher"]
    search_fields = ["name", "description"]
    readonly_fields = ["created_at", "updated_at"]


class ProductCreditInline(admin.TabularInline):
    model = ProductCredit
    extra = 1
    autocomplete_fields = ["author"]


class FileHashInline(admin.TabularInline):
    model = FileHash
    extra = 0
    readonly_fields = ["hash_sha256", "hash_md5", "file_size_bytes", "contributed_by", "created_at"]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "publisher",
        "game_system",
        "product_type",
        "status",
        "created_at",
    ]
    list_filter = ["status", "product_type", "game_system", "publisher"]
    search_fields = ["title", "description", "dtrpg_id"]
    prepopulated_fields = {"slug": ("title",)}
    readonly_fields = ["created_at", "updated_at"]
    autocomplete_fields = ["publisher", "game_system"]
    inlines = [ProductCreditInline, FileHashInline]

    fieldsets = (
        (None, {"fields": ("title", "slug", "description", "status")}),
        (
            "Classification",
            {"fields": ("publisher", "game_system", "product_type")},
        ),
        (
            "Publication Info",
            {
                "fields": (
                    "publication_date",
                    "page_count",
                    "format",
                    "isbn",
                    "msrp",
                )
            },
        ),
        (
            "External IDs",
            {
                "fields": ("dtrpg_id", "dtrpg_url", "itch_id", "itch_url", "other_urls"),
                "classes": ("collapse",),
            },
        ),
        (
            "Adventure Details",
            {
                "fields": (
                    "level_range_min",
                    "level_range_max",
                    "party_size_min",
                    "party_size_max",
                    "estimated_runtime",
                    "setting",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Community Data",
            {
                "fields": ("tags", "themes", "content_warnings"),
                "classes": ("collapse",),
            },
        ),
        (
            "Images",
            {"fields": ("cover_url", "thumbnail_url"), "classes": ("collapse",)},
        ),
        (
            "Metadata",
            {
                "fields": ("created_by", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )


@admin.register(ProductCredit)
class ProductCreditAdmin(admin.ModelAdmin):
    list_display = ["product", "author", "role"]
    list_filter = ["role"]
    search_fields = ["product__title", "author__name"]
    autocomplete_fields = ["product", "author"]


@admin.register(FileHash)
class FileHashAdmin(admin.ModelAdmin):
    list_display = ["hash_sha256_short", "product", "source", "contributed_by", "created_at"]
    list_filter = ["source"]
    search_fields = ["hash_sha256", "hash_md5", "product__title"]
    readonly_fields = ["created_at"]

    @admin.display(description="SHA256")
    def hash_sha256_short(self, obj):
        return f"{obj.hash_sha256[:16]}..."


@admin.register(ProductRelation)
class ProductRelationAdmin(admin.ModelAdmin):
    list_display = ["from_product", "relation_type", "to_product"]
    list_filter = ["relation_type"]
    search_fields = ["from_product__title", "to_product__title"]
    autocomplete_fields = ["from_product", "to_product"]


@admin.register(Revision)
class RevisionAdmin(admin.ModelAdmin):
    list_display = ["product", "user", "comment", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["product__title", "user__email", "comment"]
    readonly_fields = ["product", "user", "changes", "created_at"]


@admin.register(Contribution)
class ContributionAdmin(admin.ModelAdmin):
    list_display = ["id", "title_preview", "contribution_type", "user", "source", "status", "created_at"]
    list_filter = ["status", "source", "contribution_type"]
    search_fields = ["data__title", "product__title", "user__email"]
    readonly_fields = ["created_at", "claimed_by", "claimed_at"]
    actions = [
        "approve_contributions",
        "reject_contributions",
        "approve_from_trusted_users",
        "approve_grimoire_contributions",
        "reprocess_orphaned_approvals",
    ]

    @admin.display(description="Title")
    def title_preview(self, obj):
        if obj.product:
            return obj.product.title[:50]
        title = obj.data.get("title", "")
        return title[:50] if title else "(no title)"

    def _create_product_from_data(self, data, user):
        """Create a new product from contribution data."""
        from django.utils.text import slugify
        from apps.core.storage import upload_base64_image, generate_thumbnail
        
        title = data.get("title", "Untitled Product")
        base_slug = slugify(title)[:200]
        
        # Ensure unique slug
        slug = base_slug
        counter = 1
        while Product.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        
        # Map string names to foreign keys if needed
        publisher = None
        if data.get("publisher_id"):
            publisher = Publisher.objects.filter(id=data["publisher_id"]).first()
        elif data.get("publisher"):
            publisher = Publisher.objects.filter(name__iexact=data["publisher"]).first()
        
        game_system = None
        if data.get("game_system_id"):
            game_system = GameSystem.objects.filter(id=data["game_system_id"]).first()
        elif data.get("game_system"):
            game_system = GameSystem.objects.filter(name__iexact=data["game_system"]).first()
        
        # Handle author field - normalize to list
        author_names = []
        if data.get("author"):
            author_names = [data["author"]] if isinstance(data["author"], str) else data["author"]
        if data.get("authors"):
            author_names.extend(data["authors"] if isinstance(data["authors"], list) else [data["authors"]])
        
        # Handle genre field - normalize to list
        genres = []
        if data.get("genre"):
            genres = [data["genre"]] if isinstance(data["genre"], str) else data["genre"]
        if data.get("genres"):
            genres.extend(data["genres"] if isinstance(data["genres"], list) else [data["genres"]])
        
        # Handle cover image upload
        cover_url = ""
        thumbnail_url = ""
        if data.get("cover_image_base64"):
            cover_url = upload_base64_image(
                data["cover_image_base64"],
                folder="covers",
                filename_prefix=slug
            ) or ""
            if cover_url:
                thumbnail_url = generate_thumbnail(
                    data["cover_image_base64"],
                    max_size=(300, 400)
                ) or ""

        product = Product.objects.create(
            title=title,
            slug=slug,
            description=data.get("description", ""),
            publisher=publisher,
            game_system=game_system,
            product_type=data.get("product_type", "adventure"),
            page_count=data.get("page_count"),
            level_range_min=data.get("level_range_min"),
            level_range_max=data.get("level_range_max"),
            party_size_min=data.get("party_size_min"),
            party_size_max=data.get("party_size_max"),
            estimated_runtime=data.get("estimated_runtime", ""),
            dtrpg_url=data.get("dtrpg_url", ""),
            itch_url=data.get("itch_url", ""),
            cover_url=cover_url,
            thumbnail_url=thumbnail_url,
            tags=data.get("tags", []),
            themes=data.get("themes", []),
            genres=genres,
            author_names=author_names,
            created_by=user,
            status="published",
        )
        return product

    @admin.action(description="Approve selected contributions")
    def approve_contributions(self, request, queryset):
        approved_count = 0
        for contribution in queryset.filter(status="pending"):
            if contribution.contribution_type == "new_product":
                product = self._create_product_from_data(contribution.data, contribution.user)
                contribution.product = product
            elif contribution.product:
                # Apply edits to existing product
                product = contribution.product
                for field in ["title", "description", "page_count", "level_range_min", 
                              "level_range_max", "dtrpg_url", "itch_url", "tags"]:
                    if field in contribution.data:
                        setattr(product, field, contribution.data[field])
                product.save()
            
            contribution.status = "approved"
            contribution.reviewed_by = request.user
            contribution.reviewed_at = timezone.now()
            contribution.save()
            approved_count += 1
        
        self.message_user(request, f"Approved {approved_count} contribution(s) and created/updated products.")

    @admin.action(description="Reject selected contributions")
    def reject_contributions(self, request, queryset):
        count = queryset.filter(status="pending").update(
            status="rejected", 
            reviewed_by=request.user,
            reviewed_at=timezone.now()
        )
        self.message_user(request, f"Rejected {count} contribution(s).")

    @admin.action(description="Approve all from trusted users (10+ approved)")
    def approve_from_trusted_users(self, request, queryset):
        trusted_contributions = queryset.filter(
            status="pending",
            user__approved_contribution_count__gte=10,
            user__trust_revoked=False,
        )
        approved_count = 0
        for contribution in trusted_contributions:
            if contribution.contribution_type == "new_product":
                product = self._create_product_from_data(contribution.data, contribution.user)
                contribution.product = product
            elif contribution.product:
                product = contribution.product
                for field in ["title", "description", "page_count", "level_range_min",
                              "level_range_max", "dtrpg_url", "itch_url", "tags"]:
                    if field in contribution.data:
                        setattr(product, field, contribution.data[field])
                product.save()

            contribution.status = "approved"
            contribution.reviewed_by = request.user
            contribution.reviewed_at = timezone.now()
            if contribution.user:
                contribution.user.approved_contribution_count += 1
                contribution.user.save(update_fields=["approved_contribution_count"])
            contribution.save()
            approved_count += 1

        self.message_user(request, f"Approved {approved_count} contribution(s) from trusted users.")

    @admin.action(description="Approve all Grimoire contributions")
    def approve_grimoire_contributions(self, request, queryset):
        grimoire_contributions = queryset.filter(
            status="pending",
            source="grimoire",
        )
        approved_count = 0
        for contribution in grimoire_contributions:
            if contribution.contribution_type == "new_product":
                product = self._create_product_from_data(contribution.data, contribution.user)
                contribution.product = product
            elif contribution.product:
                product = contribution.product
                for field in ["title", "description", "page_count", "level_range_min",
                              "level_range_max", "dtrpg_url", "itch_url", "tags"]:
                    if field in contribution.data:
                        setattr(product, field, contribution.data[field])
                product.save()

            contribution.status = "approved"
            contribution.reviewed_by = request.user
            contribution.reviewed_at = timezone.now()
            if contribution.user:
                contribution.user.approved_contribution_count += 1
                contribution.user.save(update_fields=["approved_contribution_count"])
            contribution.save()
            approved_count += 1

        self.message_user(request, f"Approved {approved_count} Grimoire contribution(s).")

    @admin.action(description="Re-process approved contributions missing products")
    def reprocess_orphaned_approvals(self, request, queryset):
        """Create products for approved new_product contributions that have no linked product."""
        orphaned = queryset.filter(
            status="approved",
            contribution_type="new_product",
            product__isnull=True,
        )
        created_count = 0
        for contribution in orphaned:
            product = self._create_product_from_data(contribution.data, contribution.user)
            contribution.product = product
            contribution.save(update_fields=["product"])
            created_count += 1

        self.message_user(request, f"Created {created_count} product(s) from orphaned approvals.")


class CommunityNoteInline(admin.TabularInline):
    model = CommunityNote
    extra = 0
    readonly_fields = ["title", "note_type", "spoiler_level", "upvote_count", "created_at"]
    fields = ["title", "note_type", "spoiler_level", "upvote_count", "is_hidden", "created_at"]


@admin.register(AdventureRun)
class AdventureRunAdmin(admin.ModelAdmin):
    list_display = ["user", "product", "status", "rating", "difficulty", "created_at"]
    list_filter = ["status", "difficulty", "rating"]
    search_fields = ["user__email", "user__username", "product__title"]
    readonly_fields = ["created_at", "updated_at"]
    autocomplete_fields = ["user", "product"]
    inlines = [CommunityNoteInline]

    fieldsets = (
        (None, {"fields": ("user", "product", "status")}),
        (
            "Run Details",
            {"fields": ("rating", "difficulty", "session_count", "player_count", "completed_at")},
        ),
        (
            "Metadata",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )


class NoteFlagInline(admin.TabularInline):
    model = NoteFlag
    extra = 0
    readonly_fields = ["user", "reason", "details", "created_at", "reviewed", "reviewed_by", "reviewed_at"]
    fields = ["user", "reason", "details", "reviewed", "reviewed_by", "reviewed_at", "created_at"]


@admin.register(CommunityNote)
class CommunityNoteAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "note_type",
        "get_author",
        "get_product",
        "spoiler_level",
        "upvote_count",
        "is_flagged",
        "is_hidden",
        "created_at",
    ]
    list_filter = ["note_type", "spoiler_level", "visibility", "is_flagged", "is_hidden"]
    search_fields = ["title", "content", "adventure_run__user__email", "adventure_run__product__title"]
    readonly_fields = ["upvote_count", "flag_count", "created_at", "updated_at"]
    inlines = [NoteFlagInline]
    actions = ["hide_notes", "unhide_notes"]

    fieldsets = (
        (None, {"fields": ("adventure_run", "note_type", "title", "content")}),
        (
            "Visibility & Spoilers",
            {"fields": ("spoiler_level", "visibility")},
        ),
        (
            "Moderation",
            {"fields": ("is_flagged", "flag_count", "is_hidden")},
        ),
        (
            "Stats",
            {"fields": ("upvote_count", "grimoire_note_id"), "classes": ("collapse",)},
        ),
        (
            "Metadata",
            {"fields": ("created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    @admin.display(description="Author")
    def get_author(self, obj):
        return obj.adventure_run.user.email

    @admin.display(description="Product")
    def get_product(self, obj):
        return obj.adventure_run.product.title

    @admin.action(description="Hide selected notes")
    def hide_notes(self, request, queryset):
        queryset.update(is_hidden=True)

    @admin.action(description="Unhide selected notes")
    def unhide_notes(self, request, queryset):
        queryset.update(is_hidden=False, is_flagged=False)


@admin.register(NoteVote)
class NoteVoteAdmin(admin.ModelAdmin):
    list_display = ["user", "note", "created_at"]
    search_fields = ["user__email", "note__title"]
    readonly_fields = ["created_at"]


@admin.register(NoteFlag)
class NoteFlagAdmin(admin.ModelAdmin):
    list_display = ["note", "user", "reason", "reviewed", "reviewed_by", "created_at"]
    list_filter = ["reason", "reviewed"]
    search_fields = ["note__title", "user__email", "details"]
    readonly_fields = ["created_at"]
    actions = ["mark_reviewed_approve", "mark_reviewed_hide"]

    fieldsets = (
        (None, {"fields": ("note", "user", "reason", "details")}),
        (
            "Review",
            {"fields": ("reviewed", "reviewed_by", "reviewed_at")},
        ),
        (
            "Metadata",
            {"fields": ("created_at",), "classes": ("collapse",)},
        ),
    )

    @admin.action(description="Mark as reviewed (approve note)")
    def mark_reviewed_approve(self, request, queryset):
        queryset.update(reviewed=True, reviewed_by=request.user, reviewed_at=timezone.now())

    @admin.action(description="Mark as reviewed and hide note")
    def mark_reviewed_hide(self, request, queryset):
        for flag in queryset:
            flag.reviewed = True
            flag.reviewed_by = request.user
            flag.reviewed_at = timezone.now()
            flag.save()
            flag.note.is_hidden = True
            flag.note.save(update_fields=["is_hidden"])
