# Codex Contribution System - Project Plan

> **Version:** 1.0  
> **Date:** December 14, 2025  
> **Status:** Ready for Implementation

## Table of Contents

1. [Overview](#overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Data Model Changes](#data-model-changes)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [API Endpoints](#api-endpoints)
7. [UI/UX Specifications](#uiux-specifications)
8. [Implementation Phases](#implementation-phases)
9. [Testing Requirements](#testing-requirements)

---

## Overview

### Purpose

Implement a Wikipedia-style contribution system for Codex that allows community members to add and edit TTRPG product metadata while maintaining quality through a moderation workflow.

### Core Principles

1. **Open Contribution** - Any registered user can submit new products or edits
2. **Quality Control** - Submissions go through moderation before going live
3. **Federated Moderation** - Publishers moderate content for their own game systems
4. **Attribution** - All contributions are tracked and credited to users
5. **Reversibility** - Edit history allows reverting bad changes

### Inspiration

Based on Wikipedia's contribution model:
- Anyone can edit (logged-in users)
- All changes tracked with attribution
- Moderation by trusted community members
- Graduated trust levels

---

## User Roles & Permissions

### Role Definitions

| Role | Assignment Method | Description |
|------|-------------------|-------------|
| **Anonymous** | Not logged in | Can browse the catalog but cannot contribute |
| **Registered** | Email verified account | Can submit contributions that go to moderation queue |
| **Publisher Representative** | Admin assigns user to Publisher via `Publisher.representatives` M2M | Can directly edit products from their publisher and moderate contributions for their game systems |
| **Moderator** | `User.is_moderator = True` | Can approve/reject all contributions and directly edit any content |
| **Admin** | `User.is_superuser = True` | Full access including user management and role assignment |

### Permission Matrix

| Action | Anonymous | Registered | Publisher Rep | Moderator | Admin |
|--------|-----------|------------|---------------|-----------|-------|
| Browse products | ✅ | ✅ | ✅ | ✅ | ✅ |
| View edit history | ❌ | ✅ | ✅ | ✅ | ✅ |
| Submit new product | ❌ | ✅ (queued) | ✅ (direct for own) | ✅ (direct) | ✅ (direct) |
| Edit existing product | ❌ | ✅ (queued) | ✅ (direct for own) | ✅ (direct) | ✅ (direct) |
| Approve contributions | ❌ | ❌ | ✅ (own systems) | ✅ (all) | ✅ (all) |
| Reject contributions | ❌ | ❌ | ✅ (own systems) | ✅ (all) | ✅ (all) |
| Assign publisher reps | ❌ | ❌ | ❌ | ❌ | ✅ |

### Permission Logic (Pseudocode)

```python
def can_edit_directly(user, product):
    """Determine if user can edit a product without going through moderation."""
    if user.is_superuser or user.is_moderator:
        return True
    if product.publisher and user in product.publisher.representatives.all():
        return True
    return False

def can_moderate_contribution(user, contribution):
    """Determine if user can approve/reject a contribution."""
    if user.is_superuser or user.is_moderator:
        return True
    
    product = contribution.product
    if product:
        # Can moderate if user is rep for the product's publisher
        if product.publisher and user in product.publisher.representatives.all():
            return True
        # Can moderate if user is rep for the publisher that owns the game system
        if product.game_system and product.game_system.publisher:
            if user in product.game_system.publisher.representatives.all():
                return True
    
    return False

def get_moderation_queue(user):
    """Get contributions this user can moderate."""
    if user.is_superuser or user.is_moderator:
        return Contribution.objects.filter(status='pending')
    
    # Get all publishers where user is a representative
    user_publishers = user.represented_publishers.all()
    
    # Get game systems owned by those publishers
    owned_systems = GameSystem.objects.filter(publisher__in=user_publishers)
    
    return Contribution.objects.filter(
        status='pending'
    ).filter(
        Q(product__publisher__in=user_publishers) |
        Q(product__game_system__in=owned_systems)
    )
```

---

## Data Model Changes

### Existing Models (Reference)

These models already exist in `backend/apps/catalog/models.py`:

```python
# Product - main content entity
class Product(models.Model):
    id = UUIDField(primary_key=True)
    title = CharField(max_length=500)
    slug = SlugField(unique=True)
    description = TextField(blank=True)
    publisher = ForeignKey('Publisher', null=True, blank=True)
    game_system = ForeignKey('GameSystem', null=True, blank=True)
    product_type = CharField(choices=ProductType.choices)
    status = CharField(choices=ProductStatus.choices)  # draft, published, verified
    created_by = ForeignKey(User, null=True, blank=True)
    # ... other fields

# Publisher - companies that publish products
class Publisher(models.Model):
    id = UUIDField(primary_key=True)
    name = CharField(max_length=255)
    slug = SlugField(unique=True)
    is_verified = BooleanField(default=False)
    # ... other fields

# GameSystem - game systems like D&D 5e, DCC, Shadowdark
class GameSystem(models.Model):
    id = UUIDField(primary_key=True)
    name = CharField(max_length=255)
    slug = SlugField(unique=True)
    publisher = ForeignKey('Publisher', null=True, blank=True)  # Who owns this system
    # ... other fields

# Contribution - user submissions for moderation
class Contribution(models.Model):
    id = UUIDField(primary_key=True)
    product = ForeignKey(Product, null=True, blank=True)  # Null if new product
    user = ForeignKey(User, null=True, blank=True)
    data = JSONField(default=dict)  # The proposed changes
    file_hash = CharField(max_length=64, blank=True)
    source = CharField(choices=ContributionSource.choices)  # web, grimoire, api
    status = CharField(choices=ContributionStatus.choices)  # pending, approved, rejected
    reviewed_by = ForeignKey(User, null=True, blank=True)
    review_notes = TextField(blank=True)
    reviewed_at = DateTimeField(null=True, blank=True)
    created_at = DateTimeField(auto_now_add=True)

# Revision - edit history for products
class Revision(models.Model):
    id = UUIDField(primary_key=True)
    product = ForeignKey(Product)
    user = ForeignKey(User, null=True, blank=True)
    changes = JSONField(default=dict)  # Dict of field: {old, new}
    comment = CharField(max_length=500, blank=True)
    created_at = DateTimeField(auto_now_add=True)
```

### New Model Changes Required

#### 1. Add `representatives` M2M to Publisher

**File:** `backend/apps/catalog/models.py`

```python
class Publisher(models.Model):
    # ... existing fields ...
    
    # NEW: Users who can manage this publisher's content
    representatives = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='represented_publishers',
        help_text="Users who can directly edit this publisher's products and moderate contributions"
    )
```

#### 2. Add `contribution_type` to Contribution

**File:** `backend/apps/catalog/models.py`

```python
class Contribution(models.Model):
    class ContributionType(models.TextChoices):
        NEW_PRODUCT = 'new_product', 'New Product'
        EDIT_PRODUCT = 'edit_product', 'Edit Product'
        NEW_PUBLISHER = 'new_publisher', 'New Publisher'
        NEW_SYSTEM = 'new_system', 'New Game System'
    
    # ... existing fields ...
    
    # NEW: Type of contribution
    contribution_type = models.CharField(
        max_length=20,
        choices=ContributionType.choices,
        default=ContributionType.EDIT_PRODUCT,
    )
```

#### 3. Migration Required

Generate migration after model changes:
```bash
python manage.py makemigrations catalog
python manage.py migrate
```

---

## Backend Implementation

### New/Modified Files

```
backend/
├── apps/
│   ├── catalog/
│   │   ├── models.py          # Add representatives M2M, contribution_type
│   │   ├── permissions.py     # NEW: Custom permission classes
│   │   └── serializers.py     # Update for contribution workflow
│   └── api/
│       ├── views.py           # Update ContributionViewSet
│       └── urls.py            # Ensure contribution endpoints exist
```

### Permission Classes

**File:** `backend/apps/catalog/permissions.py` (NEW)

```python
from rest_framework import permissions

class CanEditProduct(permissions.BasePermission):
    """
    Permission check for direct product editing.
    Returns True if user can edit without moderation.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if not user.is_authenticated:
            return False
        
        # Admins and moderators can edit anything
        if user.is_superuser or user.is_moderator:
            return True
        
        # Publisher reps can edit their publisher's products
        if obj.publisher and user in obj.publisher.representatives.all():
            return True
        
        return False


class CanModerateContribution(permissions.BasePermission):
    """
    Permission check for approving/rejecting contributions.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        
        if not user.is_authenticated:
            return False
        
        # Admins and moderators can moderate anything
        if user.is_superuser or user.is_moderator:
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
    """Check if user is a representative for any publisher."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.represented_publishers.exists()
```

### Contribution Serializers

**File:** `backend/apps/catalog/serializers.py` (additions)

```python
class ContributionCreateSerializer(serializers.Serializer):
    """Serializer for submitting a new contribution."""
    contribution_type = serializers.ChoiceField(
        choices=Contribution.ContributionType.choices
    )
    product_id = serializers.UUIDField(required=False, allow_null=True)
    data = serializers.JSONField()
    comment = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate(self, attrs):
        contribution_type = attrs.get('contribution_type')
        product_id = attrs.get('product_id')
        
        if contribution_type == 'edit_product' and not product_id:
            raise serializers.ValidationError({
                'product_id': 'Required for edit_product contributions'
            })
        
        if contribution_type == 'new_product' and product_id:
            raise serializers.ValidationError({
                'product_id': 'Should not be provided for new_product contributions'
            })
        
        return attrs


class ContributionReviewSerializer(serializers.Serializer):
    """Serializer for approving/rejecting contributions."""
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    review_notes = serializers.CharField(max_length=1000, required=False, allow_blank=True)
```

### Contribution ViewSet Updates

**File:** `backend/apps/api/views.py` (modifications to existing ContributionViewSet)

```python
from apps.catalog.permissions import CanModerateContribution

class ContributionViewSet(viewsets.ModelViewSet):
    queryset = Contribution.objects.all()
    serializer_class = ContributionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Contribution.objects.all()
        
        # Filter by status if provided
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # For moderation queue, filter to what user can moderate
        if self.action == 'list' and self.request.query_params.get('moderation') == 'true':
            if not (user.is_superuser or user.is_moderator):
                # Get publishers user represents
                user_publishers = user.represented_publishers.all()
                owned_systems = GameSystem.objects.filter(publisher__in=user_publishers)
                
                queryset = queryset.filter(
                    models.Q(product__publisher__in=user_publishers) |
                    models.Q(product__game_system__in=owned_systems)
                )
        
        return queryset.order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """Submit a new contribution."""
        serializer = ContributionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        contribution_type = data['contribution_type']
        product_id = data.get('product_id')
        
        # Check if user can edit directly (bypass moderation)
        can_edit_directly = False
        product = None
        
        if product_id:
            product = get_object_or_404(Product, id=product_id)
            if request.user.is_superuser or request.user.is_moderator:
                can_edit_directly = True
            elif product.publisher and request.user in product.publisher.representatives.all():
                can_edit_directly = True
        
        if can_edit_directly and product:
            # Apply changes directly
            self._apply_changes_to_product(product, data['data'], request.user, data.get('comment', ''))
            return Response({
                'status': 'applied',
                'message': 'Changes applied directly',
                'product_id': str(product.id)
            }, status=status.HTTP_200_OK)
        else:
            # Create pending contribution
            contribution = Contribution.objects.create(
                contribution_type=contribution_type,
                product=product,
                user=request.user,
                data=data['data'],
                source=Contribution.ContributionSource.WEB,
                status=Contribution.ContributionStatus.PENDING,
            )
            return Response({
                'status': 'pending',
                'message': 'Contribution submitted for review',
                'contribution_id': str(contribution.id)
            }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[CanModerateContribution])
    def review(self, request, pk=None):
        """Approve or reject a contribution."""
        contribution = self.get_object()
        serializer = ContributionReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        action = serializer.validated_data['action']
        review_notes = serializer.validated_data.get('review_notes', '')
        
        if action == 'approve':
            # Apply the changes
            if contribution.contribution_type == 'new_product':
                product = self._create_product_from_contribution(contribution)
            else:
                product = contribution.product
                self._apply_changes_to_product(
                    product, 
                    contribution.data, 
                    contribution.user,
                    f"Approved contribution #{contribution.id}"
                )
            
            contribution.status = Contribution.ContributionStatus.APPROVED
        else:
            contribution.status = Contribution.ContributionStatus.REJECTED
        
        contribution.reviewed_by = request.user
        contribution.review_notes = review_notes
        contribution.reviewed_at = timezone.now()
        contribution.save()
        
        # Update contributor's reputation
        if action == 'approve' and contribution.user:
            contribution.user.contribution_count += 1
            contribution.user.reputation += 10  # Points for approved contribution
            contribution.user.save()
        
        return Response({
            'status': contribution.status,
            'message': f'Contribution {action}d successfully'
        })
    
    def _apply_changes_to_product(self, product, changes, user, comment=''):
        """Apply changes to a product and create revision record."""
        old_values = {}
        new_values = {}
        
        for field, value in changes.items():
            if hasattr(product, field):
                old_values[field] = getattr(product, field)
                setattr(product, field, value)
                new_values[field] = value
        
        product.save()
        
        # Create revision for history
        Revision.objects.create(
            product=product,
            user=user,
            changes={
                field: {'old': str(old_values.get(field, '')), 'new': str(new_values.get(field, ''))}
                for field in new_values.keys()
            },
            comment=comment
        )
    
    def _create_product_from_contribution(self, contribution):
        """Create a new product from contribution data."""
        data = contribution.data
        
        product = Product.objects.create(
            title=data.get('title', 'Untitled'),
            description=data.get('description', ''),
            product_type=data.get('product_type', 'other'),
            status=Product.ProductStatus.PUBLISHED,
            created_by=contribution.user,
            # ... map other fields
        )
        
        # Link to contribution
        contribution.product = product
        contribution.save()
        
        return product
```

---

## Frontend Implementation

### New Pages Required

```
frontend/src/pages/
├── ProductCreatePage.tsx      # NEW: Form to submit new product
├── ProductEditPage.tsx        # EXISTS: Update to use contribution flow
├── ContributionSuccessPage.tsx # NEW: "Thanks, pending review" page
├── ModerationPage.tsx         # EXISTS: Update with approve/reject UI
├── EditHistoryPage.tsx        # NEW: View revision history for a product
```

### Modified Components

```
frontend/src/components/
├── layout/
│   └── Header.tsx             # Add "Contribute" button for logged-in users
├── products/
│   ├── ProductForm.tsx        # NEW: Reusable form for create/edit
│   └── EditHistoryList.tsx    # NEW: Display revision history
└── moderation/
    └── ContributionCard.tsx   # NEW: Card for reviewing contributions
```

### New API Functions

**File:** `frontend/src/api/contributions.ts` (NEW)

```typescript
import apiClient from "./client";

export interface ContributionData {
  contribution_type: 'new_product' | 'edit_product' | 'new_publisher' | 'new_system';
  product_id?: string;
  data: Record<string, unknown>;
  comment?: string;
}

export interface Contribution {
  id: string;
  contribution_type: string;
  product?: {
    id: string;
    title: string;
    slug: string;
  };
  user?: {
    id: string;
    public_name: string;
  };
  data: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  review_notes: string;
  reviewed_by?: {
    id: string;
    public_name: string;
  };
  reviewed_at?: string;
  created_at: string;
}

export async function submitContribution(data: ContributionData): Promise<{
  status: 'applied' | 'pending';
  message: string;
  product_id?: string;
  contribution_id?: string;
}> {
  const response = await apiClient.post('/contributions/', data);
  return response.data;
}

export async function getModerationQueue(): Promise<Contribution[]> {
  const response = await apiClient.get('/contributions/', {
    params: { status: 'pending', moderation: 'true' }
  });
  return response.data.results;
}

export async function reviewContribution(
  id: string, 
  action: 'approve' | 'reject',
  reviewNotes?: string
): Promise<void> {
  await apiClient.post(`/contributions/${id}/review/`, {
    action,
    review_notes: reviewNotes || ''
  });
}

export async function getProductRevisions(productId: string): Promise<{
  id: string;
  user?: { public_name: string };
  changes: Record<string, { old: string; new: string }>;
  comment: string;
  created_at: string;
}[]> {
  const response = await apiClient.get(`/products/${productId}/revisions/`);
  return response.data;
}
```

---

## UI/UX Specifications

### 1. Product Create Page (`/products/new`)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  📖 Add a New Product                           │
│  Help grow the archives                         │
├─────────────────────────────────────────────────┤
│  Title *                                        │
│  ┌─────────────────────────────────────────┐   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Description                                    │
│  ┌─────────────────────────────────────────┐   │
│  │                                         │   │
│  │                                         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Publisher          │  Game System             │
│  ┌────────────────┐ │  ┌────────────────┐     │
│  │ Select...    ▼ │ │  │ Select...    ▼ │     │
│  └────────────────┘ │  └────────────────┘     │
│                                                 │
│  Product Type *                                 │
│  ○ Adventure  ○ Sourcebook  ○ Supplement       │
│  ○ Bestiary   ○ Core Rules  ○ Other            │
│                                                 │
│  [More fields expandable: ISBN, page count...] │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  💡 Your submission will be reviewed    │   │
│  │  by a moderator before going live.      │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│              [ Cancel ]  [ Submit for Review ] │
└─────────────────────────────────────────────────┘
```

**Behavior:**
- Form validates required fields (title, product_type)
- On submit, calls `submitContribution()` API
- If response `status === 'applied'`: redirect to product page
- If response `status === 'pending'`: redirect to `/contribution/success`

### 2. Contribution Success Page (`/contribution/success`)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│                                                 │
│              ✅                                 │
│                                                 │
│      Thank You for Contributing!                │
│                                                 │
│  Your submission is now pending review.         │
│  You'll be notified when it's approved.         │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  What happens next?                      │   │
│  │  • A moderator will review your entry    │   │
│  │  • You may be asked for clarifications   │   │
│  │  • Once approved, it goes live           │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│       [ Add Another ]    [ Return Home ]        │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 3. Edit Button on Product Detail Page

**Current state:** Edit button may not be visible or functional

**New behavior:**
- Always show "Edit" button for logged-in users
- Button text varies:
  - Moderator/Publisher Rep: "Edit"
  - Regular user: "Suggest Edit"
- Clicking navigates to `/products/:slug/edit`

### 4. Moderation Queue Page (`/moderation`)

**Layout:**
```
┌─────────────────────────────────────────────────┐
│  🛡️ Moderation Queue                    [12]   │
│  Review pending contributions                   │
├─────────────────────────────────────────────────┤
│  Filter: [All ▼]  [New Products]  [Edits]      │
├─────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐   │
│  │ NEW PRODUCT                              │   │
│  │ "The Tomb of the Serpent Kings"          │   │
│  │ Submitted by @john_doe • 2 hours ago     │   │
│  │                                          │   │
│  │ Publisher: Skerples                      │   │
│  │ System: OSE                              │   │
│  │ Type: Adventure                          │   │
│  │                                          │   │
│  │ [ View Details ]  [ Approve ] [ Reject ] │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ EDIT                                     │   │
│  │ "Shadowdark RPG Core Rules"              │   │
│  │ Submitted by @jane_smith • 5 hours ago   │   │
│  │                                          │   │
│  │ Changes:                                 │   │
│  │ • page_count: 324 → 328                  │   │
│  │ • isbn: (empty) → "978-1234567890"       │   │
│  │                                          │   │
│  │ [ View Details ]  [ Approve ] [ Reject ] │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

**Access Control:**
- Only visible to users who can moderate at least one contribution
- Filter contributions based on user's permissions

### 5. Edit History on Product Detail Page

**Add a tab or section:**
```
┌─────────────────────────────────────────────────┐
│  [Overview]  [Edit History]                     │
├─────────────────────────────────────────────────┤
│  📜 Edit History                                │
│                                                 │
│  Dec 14, 2025 • @moderator                      │
│  Updated page_count: 324 → 328                  │
│  "Fixed incorrect page count"                   │
│                                                 │
│  Dec 10, 2025 • @john_doe                       │
│  Created product                                │
│                                                 │
│  Dec 8, 2025 • @jane_smith                      │
│  Updated description                            │
│  [View diff]                                    │
└─────────────────────────────────────────────────┘
```

### 6. Header Navigation Updates

**For logged-in users, add:**
```
┌───────────────────────────────────────────────────────────────┐
│ 📖 CODEX    Products  Publishers  Systems  Series            │
│                                                               │
│                          [Search...]  [+ Contribute]  [Account]
└───────────────────────────────────────────────────────────────┘
```

**"+ Contribute" dropdown:**
```
┌──────────────────┐
│ + Add Product    │
│ + Add Publisher  │ (future)
│ + Add System     │ (future)
└──────────────────┘
```

---

## API Endpoints

### Existing Endpoints (verify/update)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/products/` | List products |
| GET | `/api/v1/products/:slug/` | Get product detail |
| GET | `/api/v1/contributions/` | List contributions |
| POST | `/api/v1/contributions/` | Create contribution |

### New/Updated Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/contributions/` | Submit contribution | Required |
| GET | `/api/v1/contributions/?moderation=true` | Get moderation queue | Required (filtered by permission) |
| POST | `/api/v1/contributions/:id/review/` | Approve/reject | Required (CanModerateContribution) |
| GET | `/api/v1/products/:id/revisions/` | Get edit history | Required |
| PUT | `/api/v1/products/:id/` | Direct edit | Required (CanEditProduct) |

---

## Implementation Phases

### Phase 1: Foundation (Priority: High)

**Backend:**
1. Add `representatives` M2M field to Publisher model
2. Add `contribution_type` field to Contribution model
3. Create migration and apply
4. Create permission classes (`permissions.py`)
5. Update ContributionViewSet with review action
6. Add `/products/:id/revisions/` endpoint

**Frontend:**
1. Add "Series" to header navigation
2. Create `ContributionSuccessPage`
3. Update Header with "Contribute" button (links to `/products/new`)

**Estimated effort:** 4-6 hours

### Phase 2: Contribution Workflow (Priority: High)

**Backend:**
1. Implement contribution create logic with permission check
2. Implement contribution review (approve/reject) logic
3. Implement revision creation on product changes

**Frontend:**
1. Create `ProductCreatePage` with form
2. Create `ProductForm` reusable component
3. Update `ProductEditPage` to use contribution flow
4. Add edit button to `ProductDetailPage`

**Estimated effort:** 6-8 hours

### Phase 3: Moderation UI (Priority: Medium)

**Frontend:**
1. Update `ModerationPage` with approve/reject UI
2. Create `ContributionCard` component
3. Add filtering by contribution type
4. Show queue count in navigation

**Estimated effort:** 3-4 hours

### Phase 4: Edit History (Priority: Medium)

**Frontend:**
1. Create `EditHistoryPage` or tab on product detail
2. Create `EditHistoryList` component
3. Add diff view for changes

**Estimated effort:** 2-3 hours

### Phase 5: Polish & Missing Auth Flows (Priority: Medium)

**Backend:**
1. Password reset endpoint setup
2. Email verification confirmation endpoint

**Frontend:**
1. Password reset pages (request + confirm)
2. Email verification confirmation page
3. Logout button in profile/account area
4. Better error messages throughout

**Estimated effort:** 4-6 hours

---

## Testing Requirements

### Backend Tests

```python
# tests/test_contributions.py

class ContributionPermissionTests(TestCase):
    def test_anonymous_cannot_submit(self):
        """Anonymous users cannot submit contributions."""
        
    def test_registered_user_creates_pending_contribution(self):
        """Regular users' submissions go to pending status."""
        
    def test_moderator_contribution_applied_directly(self):
        """Moderator changes are applied immediately."""
        
    def test_publisher_rep_can_edit_own_products(self):
        """Publisher rep can directly edit their publisher's products."""
        
    def test_publisher_rep_can_moderate_own_system(self):
        """Publisher rep can approve contributions for their game systems."""
        
    def test_publisher_rep_cannot_moderate_other_systems(self):
        """Publisher rep cannot approve contributions for other systems."""


class ContributionWorkflowTests(TestCase):
    def test_approve_creates_revision(self):
        """Approving a contribution creates a revision record."""
        
    def test_approve_increments_reputation(self):
        """Approving a contribution increases user's reputation."""
        
    def test_reject_does_not_apply_changes(self):
        """Rejecting a contribution leaves product unchanged."""
```

### Frontend Tests

```typescript
// ProductCreatePage.test.tsx
describe('ProductCreatePage', () => {
  it('shows validation errors for required fields');
  it('submits contribution and redirects on success');
  it('shows pending message for regular users');
});

// ModerationPage.test.tsx
describe('ModerationPage', () => {
  it('shows only contributions user can moderate');
  it('approve button applies changes');
  it('reject button marks as rejected');
});
```

### Manual Testing Checklist

- [ ] Register new user, verify email, login
- [ ] Submit new product as regular user → goes to pending
- [ ] Login as moderator → see contribution in queue
- [ ] Approve contribution → product appears in catalog
- [ ] Edit product as regular user → creates pending contribution
- [ ] Assign user as publisher rep via admin
- [ ] Publisher rep edits own product → applied directly
- [ ] Publisher rep sees relevant contributions in queue
- [ ] View edit history on product detail page
- [ ] Password reset flow works end-to-end

---

## Appendix: Product Form Fields

### Required Fields
- `title` (string, max 500)
- `product_type` (choice: adventure, sourcebook, supplement, bestiary, tools, magazine, core_rules, screen, other)

### Optional Fields
- `description` (text)
- `publisher` (FK, searchable dropdown)
- `game_system` (FK, searchable dropdown)
- `publication_date` (date)
- `page_count` (integer)
- `format` (choice: pdf, print, both)
- `isbn` (string)
- `msrp` (decimal)
- `dtrpg_url` (URL)
- `itch_url` (URL)
- `level_range_min` / `level_range_max` (integers, for adventures)
- `party_size_min` / `party_size_max` (integers, for adventures)
- `series` (FK, searchable dropdown)
- `series_order` (integer)
- `tags` (array of strings)
- `cover_url` (URL)

---

## Notes for Implementation

1. **Start with backend changes** - Model migrations should be done first
2. **Use existing UI patterns** - Match the Codex design system (cards, buttons, forms)
3. **Progressive enhancement** - MVP first, then add features like diff view
4. **Test permissions thoroughly** - Edge cases around publisher rep permissions are critical
5. **Mobile-first** - All new pages must work on mobile devices
