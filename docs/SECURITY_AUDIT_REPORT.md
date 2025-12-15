# Codex Security Audit Report

**Date:** December 14, 2025  
**Scope:** Backend (Django/DRF), Frontend (React), Database (PostgreSQL)

---

## Executive Summary

Overall, the Codex application demonstrates **good security fundamentals** with proper use of Django's security features and JWT authentication. However, there are several areas that require attention, ranging from critical to informational.

| Severity | Count |
|----------|-------|
| 🔴 Critical | 1 |
| 🟠 High | 3 |
| 🟡 Medium | 5 |
| 🔵 Low | 4 |
| ℹ️ Informational | 3 |

---

## 🔴 Critical Issues

### 1. Insecure Default SECRET_KEY in Base Settings
**File:** `backend/codex/settings/base.py:12`

```python
SECRET_KEY = config("SECRET_KEY", default="django-insecure-change-me-in-production")
```

**Risk:** If `SECRET_KEY` environment variable is not set, the application uses a predictable default key. This compromises:
- Session security
- CSRF token integrity
- Password reset token security
- Signed cookie security

**Recommendation:**
```python
SECRET_KEY = config("SECRET_KEY")  # Remove default - fail loudly if not set
```
Or at minimum:
```python
import secrets
SECRET_KEY = config("SECRET_KEY", default=secrets.token_urlsafe(50) if DEBUG else None)
if SECRET_KEY is None:
    raise ValueError("SECRET_KEY must be set in production")
```

---

## 🟠 High Severity Issues

### 2. JWT Tokens Not HTTP-Only
**File:** `backend/codex/settings/base.py:173`

```python
REST_AUTH = {
    "USE_JWT": True,
    "JWT_AUTH_HTTPONLY": False,  # ⚠️ Tokens accessible via JavaScript
    ...
}
```

**Risk:** Access tokens stored in localStorage are vulnerable to XSS attacks. Any XSS vulnerability would allow token theft.

**Frontend Impact:** `frontend/src/api/client.ts:14` stores tokens in localStorage:
```typescript
const token = localStorage.getItem("access_token");
```

**Recommendation:** 
- Set `JWT_AUTH_HTTPONLY: True` and use HTTP-only cookies
- If localStorage is required, implement token rotation on every request
- Add Content-Security-Policy headers to mitigate XSS

---

### 3. Email Verification Optional in Development
**File:** `backend/codex/settings/base.py:167`

```python
ACCOUNT_EMAIL_VERIFICATION = "optional"
```

**Risk:** Users can register and access the system without verifying email ownership, enabling:
- Account enumeration
- Spam registrations
- Impersonation

**Note:** Production correctly sets `ACCOUNT_EMAIL_VERIFICATION = "mandatory"` in `production.py:55`

**Recommendation:** Consider making email verification mandatory in all environments or add rate limiting for unverified accounts.

---

### 4. Weak Default Database Credentials
**File:** `backend/codex/settings/base.py:87`

```python
"USER": config("DB_USER", default="postgres"),
"PASSWORD": config("DB_PASSWORD", default="postgres"),
```

**Risk:** Default credentials if environment variables aren't set.

**Recommendation:** Remove defaults for production-critical settings:
```python
"USER": config("DB_USER"),
"PASSWORD": config("DB_PASSWORD"),
```

---

## 🟡 Medium Severity Issues

### 5. Overly Permissive CORS in Development
**File:** `backend/codex/settings/base.py:179-184`

```python
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="http://localhost:5173,http://127.0.0.1:5173",
    ...
)
CORS_ALLOW_CREDENTIALS = True
```

**Risk:** While acceptable for development, ensure production CORS is strictly limited. Currently production defaults to `https://codex.livetorole.com` which is correct.

**Recommendation:** Audit CORS origins before any domain changes.

---

### 6. Missing Rate Limiting on Authentication Endpoints
**File:** `backend/codex/settings/base.py:142-149`

```python
"DEFAULT_THROTTLE_RATES": {
    "anon": "100/hour",
    "user": "1000/hour",
},
```

**Risk:** Generic throttling doesn't specifically protect authentication endpoints from brute-force attacks.

**Recommendation:** Add specific throttle classes for auth endpoints:
```python
# Custom throttle for login attempts
class LoginRateThrottle(AnonRateThrottle):
    rate = '5/minute'
```

---

### 7. No Input Sanitization on JSONField Data
**File:** `backend/apps/api/views.py:561`

```python
contribution_data = data.get("data", {})
```

**Risk:** The `data` JSONField in Contribution model accepts arbitrary JSON without validation.

**Recommendation:** Add schema validation for contribution data:
```python
from jsonschema import validate
CONTRIBUTION_SCHEMA = {...}
validate(instance=contribution_data, schema=CONTRIBUTION_SCHEMA)
```

---

### 8. Potential Mass Assignment in Product Updates
**File:** `backend/apps/api/views.py:674-689`

```python
editable_fields = [
    "title", "description", "product_type", ...
]
for field in editable_fields:
    if field in changes:
        setattr(product, field, changes[field])
```

**Risk:** While there's an allowlist, foreign key handling (`publisher_id`, `game_system_id`) should validate the user has permission to assign those values.

**Recommendation:** Validate referenced objects exist and user has access:
```python
if "publisher_id" in changes:
    publisher = Publisher.objects.filter(id=changes["publisher_id"]).first()
    if not publisher:
        raise ValidationError("Invalid publisher")
```

---

### 9. Missing SECURE_BROWSER_XSS_FILTER and SECURE_CONTENT_TYPE_NOSNIFF
**File:** `backend/codex/settings/production.py`

**Risk:** Missing security headers that prevent certain browser-side attacks.

**Recommendation:** Add to production settings:
```python
SECURE_BROWSER_XSS_FILTER = True  # Deprecated but still useful
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
```

---

## 🔵 Low Severity Issues

### 10. Debug Logging in Production Code
**File:** `backend/codex/settings/base.py:216-220`

```python
"apps": {
    "handlers": ["console"],
    "level": "DEBUG",
    "propagate": False,
},
```

**Risk:** DEBUG level logging may expose sensitive information in logs.

**Recommendation:** Set app logging level based on environment:
```python
"level": config("APP_LOG_LEVEL", default="DEBUG" if DEBUG else "INFO"),
```

---

### 11. Fuzzy Search Performance/DoS Risk
**File:** `backend/apps/api/views.py:144-164`

```python
products = Product.objects.select_related(...).filter(
    status__in=["published", "verified"]
)[:1000]

for product in products:
    # CPU-intensive fuzzy matching
```

**Risk:** Iterating up to 1000 products with fuzzy matching on every search could be abused for DoS.

**Recommendation:** 
- Add caching for search results
- Implement search-specific rate limiting
- Consider database-level fuzzy search (PostgreSQL trigram)

---

### 12. API Key Shown Once But Not Hashed
**File:** `backend/apps/users/views.py:37`

```python
token = Token.objects.create(user=request.user)
return Response({
    "key": token.key,  # Plain text
    ...
})
```

**Risk:** DRF's Token model stores tokens in plain text in the database.

**Recommendation:** For higher security, implement hashed token storage:
- Store hash of token in database
- Only show plain token once on creation
- Validate by hashing incoming token and comparing

---

### 13. No Password Complexity Requirements Beyond Length
**File:** `backend/codex/settings/base.py:93-106`

Uses Django's built-in validators but no custom complexity requirements.

**Recommendation:** Consider adding:
```python
{
    "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    "OPTIONS": {"min_length": 10},
},
```

---

## ℹ️ Informational Findings

### 14. CSRF Trusted Origins Pattern
**File:** `backend/codex/settings/production.py:24-28`

Uses wildcard `https://*.railway.app` which is acceptable for the deployment platform but should be monitored.

---

### 15. Session Authentication Alongside JWT
**File:** `backend/codex/settings/base.py:128-131`

```python
"DEFAULT_AUTHENTICATION_CLASSES": [
    "rest_framework_simplejwt.authentication.JWTAuthentication",
    "rest_framework.authentication.SessionAuthentication",
],
```

Having both is fine for admin access but ensure session settings are secure in production.

---

### 16. AllowAny Endpoints
**File:** `backend/apps/api/views.py`

Several endpoints use `permission_classes = [AllowAny]`:
- `IdentifyView` (line 60)
- `ProductSeriesViewSet` (line 513)
- `SearchView` (line 752)
- `HealthView` (line 819)

These are intentionally public but should be rate-limited appropriately.

---

## Database Security

### Positive Findings ✅
- UUIDs used for primary keys (prevents enumeration)
- Foreign keys use `SET_NULL` appropriately (no cascading deletes of user data)
- Indexes on frequently queried fields
- Password hashing handled by Django's auth system

### Recommendations
1. Enable PostgreSQL connection SSL in production
2. Implement database connection pooling timeout
3. Consider adding audit logging for sensitive operations

---

## Summary of Recommended Actions

### Immediate (Critical/High)
1. **Remove default SECRET_KEY** - Force explicit configuration
2. **Enable HTTP-only JWT cookies** - Protect tokens from XSS
3. **Remove default database credentials** - Force explicit configuration

### Short-term (Medium)
4. Add auth-specific rate limiting
5. Implement JSON schema validation for contributions
6. Add missing security headers
7. Validate foreign key assignments

### Long-term (Low/Informational)
8. Consider hashed API token storage
9. Implement database-level search for performance
10. Add audit logging
11. Implement Content-Security-Policy headers

---

## Compliance Notes

For future consideration if handling sensitive data:
- **GDPR:** Add data export/deletion capabilities
- **SOC 2:** Implement comprehensive audit logging
- **PCI DSS:** N/A (no payment processing detected)

---

*Report generated by security review. Findings should be validated in the context of your threat model and business requirements.*
