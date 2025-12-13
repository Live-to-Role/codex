from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = [
        "email",
        "display_name",
        "is_active",
        "is_staff",
        "is_moderator",
        "contribution_count",
        "created_at",
    ]
    list_filter = ["is_active", "is_staff", "is_moderator", "is_publisher"]
    search_fields = ["email", "display_name", "username"]
    ordering = ["-created_at"]

    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Codex Profile",
            {
                "fields": (
                    "display_name",
                    "bio",
                    "avatar_url",
                    "contribution_count",
                    "reputation",
                    "is_moderator",
                    "is_publisher",
                )
            },
        ),
    )
