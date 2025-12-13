from django.contrib import admin

from .models import (
    Author,
    Contribution,
    FileHash,
    GameSystem,
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
    list_display = ["id", "product", "user", "source", "status", "created_at"]
    list_filter = ["status", "source"]
    search_fields = ["product__title", "user__email"]
    readonly_fields = ["created_at"]
    actions = ["approve_contributions", "reject_contributions"]

    @admin.action(description="Approve selected contributions")
    def approve_contributions(self, request, queryset):
        queryset.update(status="approved", reviewed_by=request.user)

    @admin.action(description="Reject selected contributions")
    def reject_contributions(self, request, queryset):
        queryset.update(status="rejected", reviewed_by=request.user)
