# JWT HTTP-Only Cookies Implementation Plan

## Status: ✅ IMPLEMENTED (December 14, 2025)

## Overview

Migrate from localStorage-based JWT storage to HTTP-only cookies to protect tokens from XSS attacks.

## Previous State (Before Implementation)

- **Backend:** `JWT_AUTH_HTTPONLY = False` in `base.py:173`
- **Frontend:** Tokens stored in `localStorage`, attached via axios interceptor
- **Risk:** Any XSS vulnerability allows token theft

## Implementation Plan

### Phase 1: Backend Changes

#### 1.1 Update Django Settings

```python
# backend/codex/settings/base.py

REST_AUTH = {
    "USE_JWT": True,
    "JWT_AUTH_HTTPONLY": True,  # Change from False
    "JWT_AUTH_COOKIE": "access_token",
    "JWT_AUTH_REFRESH_COOKIE": "refresh_token",
    "JWT_AUTH_COOKIE_USE_CSRF": True,
    "JWT_AUTH_COOKIE_ENFORCE_CSRF_ON_UNAUTHENTICATED": False,
    "JWT_AUTH_SAMESITE": "Lax",
    "JWT_AUTH_SECURE": not DEBUG,  # True in production
    "USER_DETAILS_SERIALIZER": "apps.users.serializers.UserSerializer",
    "REGISTER_SERIALIZER": "apps.users.serializers.CustomRegisterSerializer",
}
```

#### 1.2 Update CORS Settings

```python
# Ensure credentials are allowed
CORS_ALLOW_CREDENTIALS = True  # Already set
```

#### 1.3 Add CSRF Token Endpoint (if needed)

```python
# backend/apps/users/views.py
from django.middleware.csrf import get_token

class CSRFTokenView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({"csrfToken": get_token(request)})
```

### Phase 2: Frontend Changes

#### 2.1 Update API Client

```typescript
// frontend/src/api/client.ts

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,  // ADD: Send cookies with requests
});

// REMOVE: localStorage token interceptor
// Cookies are sent automatically with withCredentials: true

// Keep response interceptor for 401 handling, but simplify:
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Try to refresh via cookie-based endpoint
      try {
        await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {}, {
          withCredentials: true,
        });
        // Retry original request
        return apiClient(error.config!);
      } catch {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
```

#### 2.2 Update Auth Functions

```typescript
// frontend/src/api/auth.ts

export async function login(credentials: LoginCredentials): Promise<User> {
  const response = await apiClient.post("/auth/login/", credentials);
  // No localStorage - cookies set automatically by response
  return response.data.user;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout/");
  // Cookies cleared by backend response
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    await apiClient.get("/auth/user/");
    return true;
  } catch {
    return false;
  }
}

// REMOVE: localStorage.getItem/setItem/removeItem calls
```

#### 2.3 Update Auth State Management

The frontend will need to check auth status via API call rather than localStorage:

```typescript
// Check auth on app load
const checkAuth = async () => {
  try {
    const user = await getCurrentUser();
    setUser(user);
    setIsAuthenticated(true);
  } catch {
    setUser(null);
    setIsAuthenticated(false);
  }
};
```

### Phase 3: Testing Checklist

- [ ] Login sets HTTP-only cookies
- [ ] Authenticated requests include cookies automatically
- [ ] Token refresh works via cookies
- [ ] Logout clears cookies
- [ ] CSRF protection works for state-changing requests
- [ ] Cross-origin requests work (CORS + credentials)
- [ ] Production secure flag is set

### Migration Strategy

1. **Feature flag approach:** Add env variable `USE_HTTPONLY_COOKIES`
2. **Parallel support:** Temporarily accept both localStorage and cookie auth
3. **Gradual rollout:** Enable for new sessions first
4. **Full migration:** Remove localStorage support after validation

### Estimated Effort

| Task | Time |
|------|------|
| Backend settings | 30 min |
| Frontend client refactor | 2-3 hours |
| Auth state management | 1-2 hours |
| Testing | 2-3 hours |
| **Total** | **6-8 hours** |

### Risks

- **Breaking change:** All active sessions invalidated on deploy
- **CSRF complexity:** Need to handle CSRF tokens for mutations
- **Mobile apps:** If future mobile app planned, cookies may not work well

### Decision

**Recommendation:** Implement when:
1. Planning a security-focused release
2. Have time for thorough testing
3. Can coordinate frontend/backend deploy together
