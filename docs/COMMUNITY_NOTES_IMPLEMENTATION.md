# Community Notes Implementation Plan

> **Goal**: Allow users to record adventure runs and share GM notes from product detail pages in Codex.

## Overview

This document outlines the implementation of Phase 5 from `CAMPAIGNS_ROADMAP.md` - the Codex side of the Community Notes feature. Users will be able to:

1. Record that they've run an adventure (status, rating, difficulty)
2. Share GM notes (prep tips, modifications, warnings, reviews)
3. Vote on helpful notes
4. Flag inappropriate content
5. Filter notes by spoiler level

---

## Security Considerations

### Authentication & Authorization

| Action | Auth Required | Authorization |
|--------|---------------|---------------|
| View community notes | No | Public read access |
| Create adventure run | Yes | Own runs only |
| Update adventure run | Yes | Own runs only |
| Create note | Yes | Must have run for product |
| Edit note | Yes | Own notes only |
| Delete note | Yes | Own notes OR moderator |
| Vote on note | Yes | Cannot vote on own notes |
| Flag note | Yes | Cannot flag own notes |
| Review flags | Yes | Moderator/admin only |

### Rate Limiting (per roadmap)

| Action | Limit | Rationale |
|--------|-------|-----------|
| Note creation | 10/hour per user | Prevent spam |
| Voting | 100/hour per user | Allow active engagement |
| Flagging | 20/hour per user | Prevent flag abuse |

### Input Validation

| Field | Max Length | Validation |
|-------|------------|------------|
| `note.title` | 255 chars | Required, stripped of HTML |
| `note.content` | 20,000 chars | Required, Markdown allowed, HTML stripped |
| `run.rating` | - | Integer 1-5 only |
| `run.session_count` | - | Positive integer, max 1000 |
| `run.player_count` | - | Positive integer 1-20 |
| `flag.reason` | 500 chars | Required, stripped of HTML |

### Content Security

- **XSS Prevention**: All user input sanitized server-side before storage
- **Markdown Rendering**: Client-side rendering with DOMPurify
- **SQL Injection**: Django ORM with parameterized queries (standard)
- **CSRF**: Django's built-in CSRF protection via cookies

### Privacy Controls

| Visibility | Author Display | Behavior |
|------------|----------------|----------|
| `public` | Username shown | Full attribution |
| `anonymous` | "Anonymous GM" | User ID stored but hidden |

---

## Data Models

### TextChoices Enums

```python
class RunStatus(models.TextChoices):
    WANT_TO_RUN = "want_to_run", "Want to Run"
    RUNNING = "running", "Currently Running"
    COMPLETED = "completed", "Completed"

class RunDifficulty(models.TextChoices):
    EASIER = "easier", "Easier than Expected"
    AS_WRITTEN = "as_written", "As Written"
    HARDER = "harder", "Harder than Expected"

class NoteType(models.TextChoices):
    PREP_TIP = "prep_tip", "Prep Tip"
    MODIFICATION = "modification", "Modification"
    WARNING = "warning", "Warning"
    REVIEW = "review", "Review"

class SpoilerLevel(models.TextChoices):
    NONE = "none", "No Spoilers"
    MINOR = "minor", "Minor Spoilers"
    MAJOR = "major", "Major Spoilers"
    ENDGAME = "endgame", "Endgame Spoilers"

class NoteVisibility(models.TextChoices):
    ANONYMOUS = "anonymous", "Anonymous"
    PUBLIC = "public", "Public"
```

### AdventureRun Model

```python
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
        indexes = [
            models.Index(fields=["product", "status"]),
            models.Index(fields=["user"]),
        ]
```

### CommunityNote Model

```python
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
        indexes = [
            models.Index(fields=["adventure_run"]),
            models.Index(fields=["note_type"]),
            models.Index(fields=["spoiler_level"]),
            models.Index(fields=["is_flagged"]),
        ]
```

### NoteVote Model

```python
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
```

### NoteFlag Model

```python
class NoteFlag(models.Model):
    """Content flags for moderation."""
    
    class FlagReason(models.TextChoices):
        SPAM = "spam", "Spam"
        INAPPROPRIATE = "inappropriate", "Inappropriate Content"
        SPOILER = "spoiler", "Unmarked Spoilers"
        OFFENSIVE = "offensive", "Offensive Language"
        OTHER = "other", "Other"
    
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
```

---

## API Endpoints

### Adventure Runs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/products/{slug}/adventure-run/` | Yes | Get current user's run |
| POST | `/products/{slug}/adventure-run/` | Yes | Create/update run |
| GET | `/users/me/adventure-runs/` | Yes | List user's runs |

### Community Notes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/products/{slug}/community-notes/` | No | List notes for product |
| POST | `/products/{slug}/community-notes/` | Yes | Create note (requires run) |
| GET | `/community-notes/{id}/` | No | Get single note |
| PATCH | `/community-notes/{id}/` | Yes | Update own note |
| DELETE | `/community-notes/{id}/` | Yes | Delete own note |

### Query Parameters for Community Notes List

```
?sort=most_votes|least_votes|newest|oldest  (default: most_votes)
?spoiler_max=none|minor|major|endgame       (default: endgame - show all)
?note_type=prep_tip|modification|warning|review
?page=1
?per_page=20                                 (max: 50)
```

### Voting

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/community-notes/{id}/vote/` | Yes | Add upvote |
| DELETE | `/community-notes/{id}/vote/` | Yes | Remove upvote |

### Flagging

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/community-notes/{id}/flag/` | Yes | Flag note |

### Moderation (Admin)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/moderation/flagged-notes/` | Mod | List flagged notes |
| POST | `/moderation/flagged-notes/{id}/review/` | Mod | Approve/hide note |

---

## Rate Limiting Classes

Add to `apps/core/throttling.py`:

```python
class NoteCreateRateThrottle(UserRateThrottle):
    """Limit note creation to prevent spam."""
    rate = "10/hour"
    scope = "note_create"

class NoteVoteRateThrottle(UserRateThrottle):
    """Limit voting to prevent abuse."""
    rate = "100/hour"
    scope = "note_vote"

class NoteFlagRateThrottle(UserRateThrottle):
    """Limit flagging to prevent abuse."""
    rate = "20/hour"
    scope = "note_flag"
```

---

## Frontend Components

### New Files to Create

```
frontend/src/
├── api/
│   └── communityNotes.ts          # API client functions
├── components/
│   ├── AdventureRunStatus.tsx     # Run status badge + editor
│   ├── CommunityNotes.tsx         # Notes list for product page
│   ├── CommunityNoteCard.tsx      # Single note display
│   ├── CommunityNoteForm.tsx      # Create/edit note form
│   ├── SpoilerFilter.tsx          # Spoiler level filter
│   └── NoteVoteButton.tsx         # Upvote button
└── pages/
    └── MyRunsPage.tsx             # User's adventure runs
```

### Component Specifications

#### AdventureRunStatus

**Location**: Product detail page, below title
**Purpose**: Show/edit user's run status for this product

```tsx
interface AdventureRunStatusProps {
  productSlug: string;
}

// Features:
// - Show current status (Want to Run / Running / Completed)
// - Status dropdown to change
// - Rating stars (1-5) when completed
// - Difficulty selector when completed
// - Session/player count inputs
// - Login prompt if not authenticated
```

**UI States**:
- Not logged in: "Log in to track your run"
- No run: "Add to your list" button
- Has run: Status badge with edit dropdown

#### CommunityNotes

**Location**: Product detail page, new tab/section
**Purpose**: Display community notes with filtering

```tsx
interface CommunityNotesProps {
  productSlug: string;
}

// Features:
// - Spoiler filter dropdown (default: show all)
// - Sort dropdown (Most Helpful, Newest, etc.)
// - Note type filter pills
// - Paginated note list
// - "Add Note" button (requires run)
// - Empty state when no notes
```

#### CommunityNoteCard

**Purpose**: Display single note with voting

```tsx
interface CommunityNoteCardProps {
  note: CommunityNote;
  onVote: (noteId: string) => void;
  onFlag: (noteId: string) => void;
  currentUserVoted: boolean;
  isOwnNote: boolean;
}

// Features:
// - Note type badge (Prep Tip, Warning, etc.)
// - Spoiler level badge with color coding
// - Title and content (with spoiler blur if needed)
// - Author (or "Anonymous GM")
// - Upvote button with count
// - Flag button (not on own notes)
// - Edit/delete for own notes
// - Expand/collapse for long content
```

**Spoiler Badge Colors**:
- None: Green
- Minor: Yellow
- Major: Orange
- Endgame: Red

#### CommunityNoteForm

**Purpose**: Create/edit notes

```tsx
interface CommunityNoteFormProps {
  productSlug: string;
  existingNote?: CommunityNote;
  onSuccess: () => void;
  onCancel: () => void;
}

// Fields:
// - Note type (required, radio buttons)
// - Title (required, text input)
// - Content (required, markdown textarea with preview)
// - Spoiler level (required, radio buttons)
// - Visibility (optional, default public)
```

**Validation**:
- Title: 1-255 characters
- Content: 1-20,000 characters
- All enum fields validated against allowed values

#### SpoilerFilter

**Purpose**: Filter notes by max spoiler level

```tsx
interface SpoilerFilterProps {
  value: SpoilerLevel;
  onChange: (level: SpoilerLevel) => void;
}

// Dropdown with options:
// - Show All (endgame)
// - Up to Major Spoilers
// - Up to Minor Spoilers
// - No Spoilers Only
```

#### MyRunsPage

**Purpose**: User's adventure run history

**Route**: `/my-runs`

**Features**:
- List of all user's runs
- Filter by status (Want to Run, Running, Completed)
- Quick access to products
- Run statistics (total runs, completed count)
- Link to add notes for completed runs

---

## Frontend API Client

`frontend/src/api/communityNotes.ts`:

```typescript
// Types
export interface AdventureRun {
  id: string;
  product: ProductListItem;
  status: "want_to_run" | "running" | "completed";
  rating: number | null;
  difficulty: "easier" | "as_written" | "harder" | null;
  session_count: number | null;
  player_count: number | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommunityNote {
  id: string;
  adventure_run_id: string;
  author: { public_name: string } | null; // null if anonymous
  note_type: "prep_tip" | "modification" | "warning" | "review";
  title: string;
  content: string;
  spoiler_level: "none" | "minor" | "major" | "endgame";
  visibility: "anonymous" | "public";
  upvote_count: number;
  user_has_voted: boolean;
  is_own_note: boolean;
  created_at: string;
  updated_at: string;
}

// API Functions
export async function getProductAdventureRun(slug: string): Promise<AdventureRun | null>;
export async function createOrUpdateAdventureRun(slug: string, data: Partial<AdventureRun>): Promise<AdventureRun>;
export async function getProductCommunityNotes(slug: string, params?: NoteQueryParams): Promise<PaginatedResponse<CommunityNote>>;
export async function createCommunityNote(slug: string, data: CreateNoteData): Promise<CommunityNote>;
export async function updateCommunityNote(id: string, data: Partial<CreateNoteData>): Promise<CommunityNote>;
export async function deleteCommunityNote(id: string): Promise<void>;
export async function voteOnNote(id: string): Promise<void>;
export async function removeVoteFromNote(id: string): Promise<void>;
export async function flagNote(id: string, reason: string, details?: string): Promise<void>;
export async function getUserAdventureRuns(): Promise<AdventureRun[]>;
```

---

## UI/UX Requirements

### Mobile-First Design

- All components must work at 320px width
- Touch targets minimum 44px
- Collapsible filters on mobile
- Bottom sheet for note creation on mobile

### Accessibility

- All interactive elements keyboard navigable
- ARIA labels on buttons and controls
- Focus management on modals
- Screen reader announcements for vote changes

### Loading States

- Skeleton loaders for note cards
- Disabled buttons with spinner during mutations
- Optimistic updates for votes

### Error Handling

- Toast notifications for errors
- Inline validation on forms
- Retry buttons on network failures

---

## Implementation Order

### Phase 1: Backend Foundation
1. Add models to `apps/catalog/models.py`
2. Create and run migrations
3. Add serializers to `apps/api/serializers.py`
4. Add throttle classes to `apps/core/throttling.py`

### Phase 2: Backend API
5. Add views to `apps/api/views.py`
6. Register URLs in `apps/api/urls.py`
7. Add admin interfaces to `apps/catalog/admin.py`

### Phase 3: Frontend API Layer
8. Create `frontend/src/api/communityNotes.ts`
9. Add types to `frontend/src/types/index.ts`

### Phase 4: Frontend Components
10. Create `AdventureRunStatus.tsx`
11. Create `CommunityNoteCard.tsx`
12. Create `CommunityNoteForm.tsx`
13. Create `SpoilerFilter.tsx`
14. Create `NoteVoteButton.tsx`
15. Create `CommunityNotes.tsx`

### Phase 5: Frontend Integration
16. Add components to `ProductDetailPage.tsx`
17. Create `MyRunsPage.tsx`
18. Add route to `App.tsx`

### Phase 6: Testing & Polish
19. Manual testing of all flows
20. Security review
21. Performance optimization

---

## Files to Modify

### Backend

| File | Changes |
|------|---------|
| `apps/catalog/models.py` | Add 4 models + 5 TextChoices enums |
| `apps/api/serializers.py` | Add 6 serializers |
| `apps/api/views.py` | Add ProductViewSet actions + CommunityNoteViewSet |
| `apps/api/urls.py` | Register new routes |
| `apps/core/throttling.py` | Add 3 throttle classes |
| `apps/catalog/admin.py` | Add 4 admin classes |

### Frontend

| File | Changes |
|------|---------|
| `src/api/communityNotes.ts` | New file - API client |
| `src/types/index.ts` | Add new types |
| `src/components/AdventureRunStatus.tsx` | New component |
| `src/components/CommunityNotes.tsx` | New component |
| `src/components/CommunityNoteCard.tsx` | New component |
| `src/components/CommunityNoteForm.tsx` | New component |
| `src/components/SpoilerFilter.tsx` | New component |
| `src/components/NoteVoteButton.tsx` | New component |
| `src/pages/ProductDetailPage.tsx` | Add run status + notes section |
| `src/pages/MyRunsPage.tsx` | New page |
| `src/App.tsx` | Add route for MyRunsPage |

---

## Database Migration

```sql
-- Expected tables created by Django migration

CREATE TABLE adventure_runs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
    difficulty VARCHAR(20),
    session_count INTEGER,
    player_count SMALLINT CHECK (player_count >= 1 AND player_count <= 20),
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    UNIQUE(user_id, product_id)
);

CREATE TABLE community_notes (
    id UUID PRIMARY KEY,
    adventure_run_id UUID NOT NULL REFERENCES adventure_runs(id) ON DELETE CASCADE,
    grimoire_note_id VARCHAR(50),
    note_type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    spoiler_level VARCHAR(20) NOT NULL,
    visibility VARCHAR(20) NOT NULL,
    upvote_count INTEGER DEFAULT 0,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_count INTEGER DEFAULT 0,
    is_hidden BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE note_votes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_id UUID NOT NULL REFERENCES community_notes(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL,
    UNIQUE(user_id, note_id)
);

CREATE TABLE note_flags (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_id UUID NOT NULL REFERENCES community_notes(id) ON DELETE CASCADE,
    reason VARCHAR(20) NOT NULL,
    details TEXT,
    created_at TIMESTAMP NOT NULL,
    reviewed BOOLEAN DEFAULT FALSE,
    reviewed_by_id UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    UNIQUE(user_id, note_id)
);

-- Indexes
CREATE INDEX idx_adventure_runs_product_status ON adventure_runs(product_id, status);
CREATE INDEX idx_adventure_runs_user ON adventure_runs(user_id);
CREATE INDEX idx_community_notes_run ON community_notes(adventure_run_id);
CREATE INDEX idx_community_notes_type ON community_notes(note_type);
CREATE INDEX idx_community_notes_spoiler ON community_notes(spoiler_level);
CREATE INDEX idx_community_notes_flagged ON community_notes(is_flagged);
```

---

## Changelog

| Date | Change |
|------|--------|
| 2024-12-15 | Initial implementation plan created |
