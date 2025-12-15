# Hashed API Token Storage Implementation Plan

## Status: ✅ IMPLEMENTED (December 14, 2025)

## Overview

Replace DRF's plain-text token storage with hashed tokens to protect API keys even if the database is compromised.

## Previous State (Before Implementation)

- **Model:** Uses `rest_framework.authtoken.models.Token`
- **Storage:** Tokens stored as plain text in `authtoken_token` table
- **Risk:** Database breach exposes all API keys

## Implementation Plan

### Phase 1: Create Custom Token Model

```python
# backend/apps/users/models.py

import hashlib
import secrets
from django.conf import settings
from django.db import models


class HashedAPIToken(models.Model):
    """
    API token with hashed storage.
    
    The actual token is only shown once on creation.
    We store a hash for validation.
    """
    
    key_hash = models.CharField(max_length=64, unique=True, db_index=True)
    key_prefix = models.CharField(max_length=8, help_text="First 8 chars for identification")
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="api_token",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = "API Token"
        verbose_name_plural = "API Tokens"
    
    def __str__(self):
        return f"{self.key_prefix}... ({self.user.email})"
    
    @classmethod
    def generate_key(cls):
        """Generate a secure random token."""
        return secrets.token_urlsafe(32)
    
    @classmethod
    def hash_key(cls, key: str) -> str:
        """Hash a token for storage."""
        return hashlib.sha256(key.encode()).hexdigest()
    
    @classmethod
    def create_token(cls, user) -> tuple["HashedAPIToken", str]:
        """
        Create a new token for a user.
        
        Returns:
            Tuple of (token_instance, plain_text_key)
            
        The plain_text_key is only available at creation time.
        """
        # Delete existing token if any
        cls.objects.filter(user=user).delete()
        
        # Generate new key
        plain_key = cls.generate_key()
        key_hash = cls.hash_key(plain_key)
        key_prefix = plain_key[:8]
        
        token = cls.objects.create(
            user=user,
            key_hash=key_hash,
            key_prefix=key_prefix,
        )
        
        return token, plain_key
    
    @classmethod
    def validate_key(cls, key: str):
        """
        Validate a token and return the associated user.
        
        Returns:
            User instance if valid, None otherwise
        """
        key_hash = cls.hash_key(key)
        try:
            token = cls.objects.select_related("user").get(key_hash=key_hash)
            # Update last used timestamp
            from django.utils import timezone
            token.last_used_at = timezone.now()
            token.save(update_fields=["last_used_at"])
            return token.user
        except cls.DoesNotExist:
            return None
```

### Phase 2: Create Custom Authentication Class

```python
# backend/apps/users/authentication.py

from rest_framework import authentication, exceptions

from .models import HashedAPIToken


class HashedTokenAuthentication(authentication.BaseAuthentication):
    """
    Token authentication using hashed storage.
    
    Clients should authenticate by passing the token in the Authorization header:
        Authorization: Token <token>
    """
    
    keyword = "Token"
    
    def authenticate(self, request):
        auth_header = authentication.get_authorization_header(request)
        
        if not auth_header:
            return None
        
        try:
            auth_parts = auth_header.decode().split()
        except UnicodeDecodeError:
            raise exceptions.AuthenticationFailed("Invalid token header encoding.")
        
        if len(auth_parts) != 2:
            return None
        
        if auth_parts[0].lower() != self.keyword.lower():
            return None
        
        token = auth_parts[1]
        return self.authenticate_credentials(token)
    
    def authenticate_credentials(self, key):
        user = HashedAPIToken.validate_key(key)
        
        if user is None:
            raise exceptions.AuthenticationFailed("Invalid token.")
        
        if not user.is_active:
            raise exceptions.AuthenticationFailed("User inactive or deleted.")
        
        return (user, key)
    
    def authenticate_header(self, request):
        return self.keyword
```

### Phase 3: Update Views

```python
# backend/apps/users/views.py

from .models import HashedAPIToken

class APIKeyView(APIView):
    """Manage API keys for Grimoire integration."""

    permission_classes = [IsAuthenticated]
    throttle_classes = [APIKeyRateThrottle]

    def get(self, request):
        """Get current API key info (masked) or indicate none exists."""
        try:
            token = HashedAPIToken.objects.get(user=request.user)
            return Response({
                "has_key": True,
                "key_preview": f"{token.key_prefix}...",
                "created": token.created_at,
                "last_used": token.last_used_at,
            })
        except HashedAPIToken.DoesNotExist:
            return Response({
                "has_key": False,
                "key_preview": None,
                "created": None,
                "last_used": None,
            })

    def post(self, request):
        """Generate a new API key (replaces existing if any)."""
        token, plain_key = HashedAPIToken.create_token(request.user)
        return Response({
            "key": plain_key,
            "message": "API key generated. Copy it now - it won't be shown again.",
            "created": token.created_at,
        }, status=status.HTTP_201_CREATED)

    def delete(self, request):
        """Revoke the current API key."""
        deleted, _ = HashedAPIToken.objects.filter(user=request.user).delete()
        if deleted:
            return Response({"message": "API key revoked successfully."})
        return Response(
            {"message": "No API key to revoke."},
            status=status.HTTP_404_NOT_FOUND
        )
```

### Phase 4: Update Settings

```python
# backend/codex/settings/base.py

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "apps.users.authentication.HashedTokenAuthentication",  # Replace TokenAuthentication
        "rest_framework.authentication.SessionAuthentication",
    ],
    # ... rest of settings
}
```

### Phase 5: Migration

```python
# Migration to create new table and migrate existing tokens

from django.db import migrations

def migrate_tokens(apps, schema_editor):
    """
    Migrate existing tokens to hashed storage.
    
    NOTE: This is a one-way migration. Existing tokens will be
    invalidated and users will need to regenerate.
    """
    OldToken = apps.get_model("authtoken", "Token")
    HashedAPIToken = apps.get_model("users", "HashedAPIToken")
    
    # We cannot migrate existing tokens because we don't have
    # the original key to hash. Users must regenerate.
    # Just log how many will be affected.
    count = OldToken.objects.count()
    if count > 0:
        print(f"WARNING: {count} existing API tokens will be invalidated.")
        print("Users will need to regenerate their API keys.")

class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]
    
    operations = [
        migrations.CreateModel(
            name="HashedAPIToken",
            fields=[
                # ... field definitions
            ],
        ),
        migrations.RunPython(migrate_tokens, migrations.RunPython.noop),
    ]
```

### Phase 6: Cleanup ✅ COMPLETED

After migration is stable:
1. ✅ Remove `rest_framework.authtoken` from `INSTALLED_APPS`
2. Drop the `authtoken_token` table (if exists - run manually in production)
3. ✅ Update documentation

## Testing Checklist

- [x] Token generation returns plain key only once
- [x] Token validation works with hashed storage
- [x] Invalid tokens are rejected
- [x] Token regeneration invalidates old token
- [x] Token deletion works
- [x] Last used timestamp updates
- [ ] Grimoire integration still works (requires manual testing)

## Estimated Effort

| Task | Time |
|------|------|
| Model + Authentication class | 1-2 hours |
| Update views | 30 min |
| Migration | 1 hour |
| Testing | 2 hours |
| Documentation | 30 min |
| **Total** | **5-6 hours** |

## Risks

- **Breaking change:** All existing API tokens invalidated
- **User communication:** Need to notify users to regenerate keys
- **Grimoire impact:** Users must update their Grimoire settings

## Decision

**Recommendation:** Implement when:
1. User base is small (fewer tokens to invalidate)
2. Can communicate the change to affected users
3. Have Grimoire update ready to guide users through regeneration

**Priority:** Lower than HTTP-only cookies since:
- Requires database breach to exploit
- Affects fewer users (only those with API keys)
- Has user-facing impact (key regeneration)
