"""
Custom permission classes for the Codex contribution system.

These permissions implement the federated moderation model where:
- Moderators can edit/moderate anything
- Publisher representatives can edit their publisher's products
- Publisher representatives can moderate contributions for their game systems
- Regular users must submit contributions for moderation
"""

from rest_framework import permissions

from .models import GameSystem


class CanEditProduct(permissions.BasePermission):
    """
    Permission check for direct product editing (bypassing moderation).
    
    Returns True if user can edit without going through the contribution queue.
    """

    def has_object_permission(self, request, view, obj):
        user = request.user

        if not user.is_authenticated:
            return False

        # Admins and moderators can edit anything
        if user.is_superuser or getattr(user, "is_moderator", False):
            return True

        # Publisher reps can edit their publisher's products
        if obj.publisher and user in obj.publisher.representatives.all():
            return True

        return False


class CanModerateContribution(permissions.BasePermission):
    """
    Permission check for approving/rejecting contributions.
    
    Users can moderate contributions if:
    - They are a superuser or moderator (global access)
    - They are a rep for the product's publisher
    - They are a rep for the publisher that owns the product's game system
    """

    def has_object_permission(self, request, view, obj):
        user = request.user

        if not user.is_authenticated:
            return False

        # Admins and moderators can moderate anything
        if user.is_superuser or getattr(user, "is_moderator", False):
            return True

        product = obj.product
        if product:
            # Rep for product's publisher
            if product.publisher and user in product.publisher.representatives.all():
                return True

            # Rep for game system's publisher
            if product.game_system and product.game_system.publisher:
                if user in product.game_system.publisher.representatives.all():
                    return True

        return False


class IsPublisherRepresentative(permissions.BasePermission):
    """
    Check if user is a representative for any publisher.
    
    Useful for views that should only be accessible to publisher reps.
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.represented_publishers.exists()


class CanAccessModerationQueue(permissions.BasePermission):
    """
    Check if user can access the moderation queue.
    
    Returns True if user is a moderator or represents at least one publisher.
    """

    def has_permission(self, request, view):
        user = request.user

        if not user.is_authenticated:
            return False

        # Moderators and admins always have access
        if user.is_superuser or getattr(user, "is_moderator", False):
            return True

        # Publisher reps have access to their filtered queue
        if user.represented_publishers.exists():
            return True

        return False


def get_moderation_queryset(user, base_queryset):
    """
    Filter a contribution queryset to only include items the user can moderate.
    
    Args:
        user: The authenticated user
        base_queryset: The base Contribution queryset to filter
        
    Returns:
        Filtered queryset of contributions the user can moderate
    """
    from django.db.models import Q

    if user.is_superuser or getattr(user, "is_moderator", False):
        return base_queryset

    # Get all publishers where user is a representative
    user_publishers = user.represented_publishers.all()

    if not user_publishers.exists():
        return base_queryset.none()

    # Get game systems owned by those publishers
    owned_systems = GameSystem.objects.filter(publisher__in=user_publishers)

    # Filter contributions to those the user can moderate
    return base_queryset.filter(
        Q(product__publisher__in=user_publishers)
        | Q(product__game_system__in=owned_systems)
    )
