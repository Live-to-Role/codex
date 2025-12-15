"""
JSON schema validators for contribution data.
"""

from rest_framework import serializers

from apps.catalog.models import GameSystem, Publisher


# Allowed fields for contribution data to prevent injection of unexpected fields
ALLOWED_PRODUCT_FIELDS = {
    "title",
    "description",
    "product_type",
    "page_count",
    "level_range_min",
    "level_range_max",
    "dtrpg_url",
    "itch_url",
    "tags",
    "publisher_id",
    "game_system_id",
    "publication_date",
    "publication_year",  # Grimoire sends year as integer
    "format",
    "isbn",
    "msrp",
    "party_size_min",
    "party_size_max",
    "estimated_runtime",
    "setting",
    "themes",
    "content_warnings",
    "cover_url",
    "thumbnail_url",
    # Grimoire sends these as string names (not UUIDs)
    "publisher",
    "game_system",
}

# Valid product types (must match ProductType choices)
VALID_PRODUCT_TYPES = {
    "adventure",
    "sourcebook",
    "supplement",
    "bestiary",
    "tools",
    "magazine",
    "core_rules",
    "screen",
    "other",
}


def validate_contribution_data(data: dict, contribution_type: str) -> dict:
    """
    Validate and sanitize contribution data.
    
    Args:
        data: The contribution data dictionary
        contribution_type: Type of contribution (new_product, edit_product, etc.)
        
    Returns:
        Sanitized data dictionary
        
    Raises:
        serializers.ValidationError: If validation fails
    """
    if not isinstance(data, dict):
        raise serializers.ValidationError({"data": "Must be a dictionary."})
    
    # Filter to only allowed fields
    sanitized = {}
    unknown_fields = set(data.keys()) - ALLOWED_PRODUCT_FIELDS
    if unknown_fields:
        raise serializers.ValidationError({
            "data": f"Unknown fields not allowed: {', '.join(unknown_fields)}"
        })
    
    for key, value in data.items():
        if key in ALLOWED_PRODUCT_FIELDS:
            sanitized[key] = _validate_field(key, value)
    
    # Validate required fields for new products
    if contribution_type == "new_product":
        if not sanitized.get("title"):
            raise serializers.ValidationError({
                "data": "Title is required for new products."
            })
    
    return sanitized


def _validate_field(field: str, value):
    """Validate individual field values."""
    
    # String fields - sanitize and limit length
    string_fields = {
        "title": 500,
        "description": 10000,
        "dtrpg_url": 500,
        "itch_url": 500,
        "isbn": 20,
        "estimated_runtime": 50,
        "setting": 255,
        "cover_url": 500,
        "thumbnail_url": 500,
        "publisher": 255,  # Grimoire sends publisher name as string
        "game_system": 255,  # Grimoire sends game system name as string
    }
    
    if field in string_fields:
        if value is None:
            return ""
        if not isinstance(value, str):
            raise serializers.ValidationError({
                "data": f"{field} must be a string."
            })
        max_len = string_fields[field]
        if len(value) > max_len:
            raise serializers.ValidationError({
                "data": f"{field} exceeds maximum length of {max_len}."
            })
        return value.strip()
    
    # Integer fields
    int_fields = {"page_count", "level_range_min", "level_range_max", 
                  "party_size_min", "party_size_max", "publication_year"}
    if field in int_fields:
        if value is None:
            return None
        if not isinstance(value, int) or isinstance(value, bool):
            raise serializers.ValidationError({
                "data": f"{field} must be an integer."
            })
        if value < 0 or value > 10000:
            raise serializers.ValidationError({
                "data": f"{field} must be between 0 and 10000."
            })
        return value
    
    # Decimal fields
    if field == "msrp":
        if value is None:
            return None
        try:
            float_val = float(value)
            if float_val < 0 or float_val > 10000:
                raise serializers.ValidationError({
                    "data": "msrp must be between 0 and 10000."
                })
            return float_val
        except (TypeError, ValueError):
            raise serializers.ValidationError({
                "data": "msrp must be a number."
            })
    
    # Product type validation
    if field == "product_type":
        if value and value not in VALID_PRODUCT_TYPES:
            raise serializers.ValidationError({
                "data": f"Invalid product_type. Must be one of: {', '.join(VALID_PRODUCT_TYPES)}"
            })
        return value
    
    # Format validation
    if field == "format":
        valid_formats = {"pdf", "print", "both"}
        if value and value not in valid_formats:
            raise serializers.ValidationError({
                "data": f"Invalid format. Must be one of: {', '.join(valid_formats)}"
            })
        return value
    
    # List fields (tags, themes, content_warnings)
    list_fields = {"tags", "themes", "content_warnings"}
    if field in list_fields:
        if value is None:
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError({
                "data": f"{field} must be a list."
            })
        if len(value) > 50:
            raise serializers.ValidationError({
                "data": f"{field} cannot have more than 50 items."
            })
        # Validate each item is a string
        sanitized_list = []
        for item in value:
            if not isinstance(item, str):
                raise serializers.ValidationError({
                    "data": f"All items in {field} must be strings."
                })
            if len(item) > 100:
                raise serializers.ValidationError({
                    "data": f"Items in {field} cannot exceed 100 characters."
                })
            sanitized_list.append(item.strip())
        return sanitized_list
    
    # UUID fields (foreign keys)
    if field in {"publisher_id", "game_system_id"}:
        if value is None:
            return None
        # Validate it's a valid UUID string
        import uuid
        try:
            uuid.UUID(str(value))
            return str(value)
        except ValueError:
            raise serializers.ValidationError({
                "data": f"{field} must be a valid UUID."
            })
    
    # Date field
    if field == "publication_date":
        if value is None:
            return None
        # Accept ISO format date string
        if isinstance(value, str):
            import re
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", value):
                raise serializers.ValidationError({
                    "data": "publication_date must be in YYYY-MM-DD format."
                })
            return value
        raise serializers.ValidationError({
            "data": "publication_date must be a string in YYYY-MM-DD format."
        })
    
    return value


def validate_foreign_key_access(data: dict, user) -> None:
    """
    Validate that referenced foreign keys exist and user has appropriate access.
    
    Args:
        data: The contribution data dictionary
        user: The user making the contribution
        
    Raises:
        serializers.ValidationError: If validation fails
    """
    if "publisher_id" in data and data["publisher_id"]:
        publisher = Publisher.objects.filter(id=data["publisher_id"]).first()
        if not publisher:
            raise serializers.ValidationError({
                "data": "Referenced publisher does not exist."
            })
    
    if "game_system_id" in data and data["game_system_id"]:
        game_system = GameSystem.objects.filter(id=data["game_system_id"]).first()
        if not game_system:
            raise serializers.ValidationError({
                "data": "Referenced game system does not exist."
            })
